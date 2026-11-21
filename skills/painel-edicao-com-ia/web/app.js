"use strict";
// Painel Edição com IA. Nada de innerHTML com dado do aluno: tudo por textContent.
(() => {
  const $ = (s) => document.querySelector(s);
  const poucoMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- chave da sessão (vem no #t= do link do Claude e sai da barra de endereço) ----
  let chave = "";
  const h = new URLSearchParams(location.hash.slice(1)).get("t");
  try {
    if (h) sessionStorage.setItem("painel-chave", h);
    chave = h || sessionStorage.getItem("painel-chave") || "";
  } catch (_) { chave = h || ""; }
  if (h) history.replaceState(null, "", location.pathname);

  const S = { catalogo: null, marca: {}, arquivos: [], pedidos: [], estilo: null, filtro: "todos",
              campos: {}, modo: "aprovar", voz: "", vozPadrao: "", enviando: false, instalados: [], instalacao: null };

  // ---- utilidades ----
  function el(tag, props = {}, filhos = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "texto") e.textContent = v;
      else if (k === "classe") e.className = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const f of [].concat(filhos)) if (f) e.append(f);
    return e;
  }
  async function api(caminho, opts = {}) {
    const r = await fetch(caminho, { ...opts, headers: { "X-Painel-Chave": chave, ...(opts.headers || {}) } });
    let dados = {};
    try { dados = await r.json(); } catch (_) {}
    if (!r.ok) throw new Error(dados.erro || "Não deu certo. Tente de novo.");
    return dados;
  }
  const postJson = (c, d) => api(c, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
  let tAviso;
  function aviso(msg, erro = false) {
    const a = $("#aviso");
    a.textContent = msg; a.classList.toggle("erro", erro); a.classList.add("mostra");
    clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove("mostra"), erro ? 6000 : 4500);
  }
  function tamanho(b) {
    if (b >= 1024 ** 3) return (b / 1024 ** 3).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " GB";
    if (b >= 1024 ** 2) return Math.round(b / 1024 ** 2).toLocaleString("pt-BR") + " MB";
    return Math.max(1, Math.round(b / 1024)).toLocaleString("pt-BR") + " KB";
  }
  const hexOk = (v) => /^#[0-9A-Fa-f]{6}$/.test(v);
  const estiloPor = (id) => S.catalogo.estilos.find((e) => e.id === id);
  const instalado = (id) => S.instalados.includes(id);

  // ---- grupo de rádio acessível (setas mudam a escolha) ----
  function radio(container, itens, atual, aoEscolher, montar) {
    container.replaceChildren();
    itens.forEach((it, i) => {
      const sel = it.valor === atual;
      const b = el("button", { type: "button", role: "radio", "aria-checked": String(sel), tabindex: sel || (!atual && i === 0) ? "0" : "-1",
        "aria-disabled": it.desligado ? "true" : null, onclick: () => { if (!it.desligado) aoEscolher(it.valor); } });
      montar(b, it);
      b.addEventListener("keydown", (ev) => {
        const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
        if (!passo) return;
        ev.preventDefault();
        const bs = [...container.querySelectorAll('[role="radio"]')];
        const prox = bs[(bs.indexOf(b) + passo + bs.length) % bs.length];
        prox.focus();
      });
      container.append(b);
    });
  }

  // ---- 1. estilos ----
  function desenhaFiltros() {
    const f = $("#filtros"); f.replaceChildren();
    const opcoes = [{ id: "todos", nome: "Todos" }, ...S.catalogo.grupos];
    for (const g of opcoes) {
      f.append(el("button", { type: "button", classe: "btn chip", "aria-pressed": String(S.filtro === g.id), texto: g.nome,
        onclick: () => { S.filtro = g.id; desenhaFiltros(); desenhaGaleria(); } }));
    }
  }
  const observador = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    for (const e of es) {
      const v = e.target;
      if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
    }
  }, { threshold: 0.35 }) : null;

  function amostraViva(palavras) {
    const caixa = el("div", { classe: "amostra", "aria-hidden": "true" }, [el("div", { classe: "silhueta" })]);
    const leg = el("div", { classe: "leg" });
    caixa.append(leg);
    legenda(leg, palavras, true);
    return caixa;
  }

  function desenhaGaleria() {
    const g = $("#galeria");
    const lista = S.catalogo.estilos.filter((e) => S.filtro === "todos" || e.grupo === S.filtro);
    radio(g, lista.map((e) => ({ ...e, valor: e.id, desligado: e.em_breve })), S.estilo, escolheEstilo, (b, e) => {
      b.className = "estilo";
      b.setAttribute("aria-label", `${e.nome}${e.em_breve ? " (em breve)" : ""}`);
      const midia = el("div", { classe: "estilo-midia" });
      if (e.previa) {
        if (poucoMovimento || !observador) midia.append(el("img", { src: e.previa + ".jpg", alt: "", loading: "lazy" }));
        else {
          const v = el("video", { muted: true, loop: true, playsinline: true, preload: "none", poster: e.previa + ".jpg", "aria-hidden": "true" });
          v.muted = true; v.dataset.src = e.previa + ".mp4";
          midia.append(v); observador.observe(v);
        }
      } else midia.append(amostraViva(e.amostra || ["Seu", "vídeo"]));
      b.append(midia, el("div", { classe: "estilo-txt" }, [
        el("div", { classe: "t-nome", texto: e.nome }),
        el("span", { texto: e.resumo }),
        el("small", { classe: e.em_breve || !instalado(e.id) ? "breve" : "", texto: e.em_breve ? "Em breve" : instalado(e.id) ? "Precisa: " + e.precisa : "Ainda não instalado" }),
      ]));
    });
  }

  function escolheEstilo(id) {
    if (S.estilo !== id) S.campos = {};
    S.estilo = id;
    const e = estiloPor(id);
    for (const c of e.campos || []) if (c.padrao && !S.campos[c.id]) S.campos[c.id] = c.padrao;
    if (e.voz && !S.voz) S.voz = S.vozPadrao || "";
    desenhaGaleria(); desenhaCamposVideo(); atualizaEtapas(); atualizaResumo();
  }

  // ---- legenda de prévia ----
  let tLeg;
  function legenda(alvo, palavras, animar) {
    const estilo = S.marca.legenda || "anton";
    alvo.className = "leg leg-" + estilo;
    const handle = S.marca.handle;
    const desenha = (ini) => {
      alvo.replaceChildren();
      const ps = palavras.slice(0, 5), chave = ps.length - 1; // a palavra de destaque é a última
      if (estilo === "palavra") alvo.append(el("span", { texto: ps[ini % ps.length] }));
      else ps.forEach((p, i) => {
        alvo.append(el("span", { classe: i === chave ? "chave" : "", texto: p }));
        if (i < ps.length - 1) alvo.append(" ");
      });
      if (handle) alvo.append(el("span", { classe: "arroba", texto: handle }));
    };
    desenha(0);
    if (animar && estilo === "palavra" && !poucoMovimento) {
      let i = 0;
      alvo._t && clearInterval(alvo._t);
      alvo._t = setInterval(() => { if (!document.body.contains(alvo)) return clearInterval(alvo._t); desenha(++i); }, 650);
    }
  }
  function avisoCor(cor) {
    const aj = $("#cor-ajuda"); if (!hexOk(cor)) return;
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(cor.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const ruim = lum > 0.8 ? "Essa cor é quase branca: o destaque some na legenda. Tente uma mais viva." : lum < 0.04 ? "Essa cor é muito escura: o destaque some no vídeo. Tente uma mais clara." : "";
    aj.textContent = ruim || (S.dicaLogo ? "Essas são as cores do seu logo. Toque numa para usar." : "É a cor das palavras de destaque na legenda.");
    aj.classList.toggle("erro-txt", !!ruim);
  }
  function atualizaPrevia() {
    avisoCor(S.marca.acento || "");
    document.documentElement.style.setProperty("--marca", hexOk(S.marca.acento || "") ? S.marca.acento : "#F2C200");
    const nome = S.marca.nome ? S.marca.nome.split(/\s+/)[0] : "";
    legenda($("#leg-previa"), nome ? ["Bem-vindo", "ao", nome] : ["Isso", "muda", "o", "seu", "vídeo"], true);
    document.querySelectorAll(".amostra .leg").forEach((l, i) => {
      const e = S.catalogo.estilos.filter((x) => !x.previa && (S.filtro === "todos" || x.grupo === S.filtro))[i];
      legenda(l, (e && e.amostra) || ["Seu", "vídeo"], true);
    });
  }

  // ---- 2. marca ----
  let tSalva;
  function salvaMarca(parcial, imediato = false) {
    Object.assign(S.marca, parcial);
    atualizaPrevia();
    const st = $("#salvo");
    st.classList.remove("erro"); st.textContent = "Salvando…";
    clearTimeout(tSalva);
    tSalva = setTimeout(async () => {
      try {
        const d = await postJson("/api/marca", { nome: S.marca.nome || "", handle: S.marca.handle || "", acento: S.marca.acento, legenda: S.marca.legenda || "anton" });
        S.marca = d.marca; st.textContent = "Salvo na pasta do projeto.";
        $("#m-handle").removeAttribute("aria-invalid"); $("#m-cor-hex").removeAttribute("aria-invalid");
        atualizaEtapas(); atualizaResumo();
      } catch (e) { st.classList.add("erro"); st.textContent = e.message; }
    }, imediato ? 0 : 500);
  }
  function preencheMarca() {
    if (!S.marca.acento) S.marca.acento = "#F2C200";
    if (!S.marca.legenda) S.marca.legenda = "anton";
    $("#m-nome").value = S.marca.nome || "";
    $("#m-handle").value = (S.marca.handle || "").replace(/^@/, "");
    $("#m-cor").value = S.marca.acento; $("#m-cor-hex").value = S.marca.acento;
    desenhaLegendas(); desenhaLogo(); atualizaPrevia();
  }
  function desenhaLegendas() {
    radio($("#legendas"), S.catalogo.legendas, S.marca.legenda, (v) => { salvaMarca({ legenda: v }, true); desenhaLegendas(); }, (b, it) => {
      b.className = "opcao";
      const amostra = el("span", { classe: "leg leg-" + it.valor, "aria-hidden": "true" });
      amostra.append(it.valor === "palavra" ? el("span", { texto: "Edita" }) : el("span", {}, ["Edita ", el("span", { classe: "chave", texto: "já" })]));
      b.append(amostra, el("span", { classe: "t-peq", texto: it.nome }));
      b.setAttribute("aria-label", it.nome);
    });
  }
  function desenhaLogo() {
    const mini = $("#logo-mini"), tela = $("#logo-tela");
    mini.replaceChildren(); tela.replaceChildren();
    if (S.marca.logo) {
      const src = "/arquivos/logo?t=" + encodeURIComponent(chave) + "&v=" + Date.now();
      mini.append(el("img", { src, alt: "Seu logo" }));
      tela.append(el("img", { src, alt: "" })); tela.hidden = false;
    } else { mini.setAttribute("aria-label", "Sem logo ainda"); tela.hidden = true; }
  }
  function coresDoLogo(arquivo) {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); const n = 48;
      c.width = n; c.height = n;
      const g = c.getContext("2d"); g.drawImage(img, 0, 0, n, n);
      const px = g.getImageData(0, 0, n, n).data, conta = new Map();
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] < 200) continue;
        const [r, gg, b] = [px[i], px[i + 1], px[i + 2]];
        const max = Math.max(r, gg, b), min = Math.min(r, gg, b);
        if (max < 40 || (max - min < 30)) continue; // pula preto, branco e cinza
        const k = [r, gg, b].map((x) => Math.round(x / 32) * 32).map((x) => Math.min(255, x));
        const kk = k.join(","); conta.set(kk, (conta.get(kk) || 0) + 1);
      }
      const top = [...conta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
        .map(([k]) => "#" + k.split(",").map((x) => (+x).toString(16).padStart(2, "0")).join("").toUpperCase());
      const caixa = $("#amostras"); caixa.replaceChildren();
      for (const cor of top) {
        const b = el("button", { type: "button", classe: "amostra-cor", "aria-label": "Usar a cor " + cor, "aria-pressed": String(cor === S.marca.acento),
          onclick: () => { $("#m-cor").value = cor; $("#m-cor-hex").value = cor; salvaMarca({ acento: cor }, true); coresMarcadas(cor); } });
        b.style.background = cor; caixa.append(b);
      }
      S.dicaLogo = top.length > 0; avisoCor(S.marca.acento || "");
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(arquivo);
  }
  function coresMarcadas(cor) { document.querySelectorAll(".amostra-cor").forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute("aria-label").endsWith(cor)))); }

  function enviaArquivo(url, arquivo, barra) {
    return new Promise((ok, falha) => {
      const x = new XMLHttpRequest();
      x.open("POST", url + (url.includes("?") ? "&" : "?") + "nome=" + encodeURIComponent(arquivo.name));
      x.setRequestHeader("X-Painel-Chave", chave);
      x.setRequestHeader("Content-Type", "application/octet-stream");
      if (barra) x.upload.onprogress = (e) => { if (e.lengthComputable) barra.style.transform = `scaleX(${e.loaded / e.total})`; };
      x.onload = () => {
        let d = {}; try { d = JSON.parse(x.responseText); } catch (_) {}
        x.status < 300 ? ok(d) : falha(new Error(d.erro || "O envio falhou."));
      };
      x.onerror = () => falha(new Error("O envio falhou. O painel ainda está ligado?"));
      x.send(arquivo);
    });
  }

  // ---- 3. o vídeo ----
  function desenhaCamposVideo() {
    const box = $("#campos-video"); box.replaceChildren();
    const e = S.estilo && estiloPor(S.estilo);
    $("#video-ajuda").textContent = e ? `${e.nome}: ${e.resumo}` : "Escolha um estilo primeiro.";
    if (!e) return;
    if (!instalado(e.id)) { box.append(caixaInstalar(e)); return; }
    for (const c of e.campos || []) box.append(campo(c));
    if (e.voz) {
      const cx = el("div", { classe: "opcoes largas", role: "radiogroup", "aria-labelledby": "r-voz" });
      const desenhaVoz = () => radio(cx, S.catalogo.vozes, S.voz, (v) => { S.voz = v; desenhaVoz(); atualizaResumo(); }, (b, it) => {
        b.className = "opcao"; b.append(el("strong", { texto: it.nome }));
      });
      desenhaVoz();
      box.append(el("div", { classe: "campo" }, [el("span", { classe: "rotulo", id: "r-voz", texto: "A voz da narração" }), cx,
        el("span", { classe: "t-peq", texto: "Se ainda não instalou a voz escolhida, o Claude instala antes." })]));
    }
    const cm = el("div", { classe: "opcoes largas", role: "radiogroup", "aria-labelledby": "r-modo" });
    const desenhaModo = () => radio(cm, S.catalogo.modos, S.modo, (v) => { S.modo = v; desenhaModo(); atualizaResumo(); }, (b, it) => {
      b.className = "opcao"; b.append(el("strong", { texto: it.nome }), el("span", { classe: "t-peq", texto: it.ajuda }));
    });
    desenhaModo();
    box.append(el("div", { classe: "campo" }, [el("span", { classe: "rotulo", id: "r-modo", texto: "Como o Claude trabalha" }), cm]));
  }

  function caixaInstalar(e) {
    const inst = S.instalacao && S.instalacao.estilo === e.id ? S.instalacao : null;
    const outra = S.instalacao && S.instalacao.rodando && S.instalacao.estilo !== e.id;
    const btn = el("button", { type: "button", classe: "btn", texto: inst && inst.rodando ? "Instalando…" : "Instalar este estilo", disabled: !!(inst && inst.rodando) || outra });
    btn.onclick = async () => {
      btn.disabled = true; btn.textContent = "Instalando…";
      try { const d = await postJson("/api/instalar", { estilo: e.id }); S.instalacao = d.instalacao; desenhaCamposVideo(); ciclo(); }
      catch (er) { aviso(er.message, true); btn.disabled = false; btn.textContent = "Instalar este estilo"; }
    };
    const filhos = [
      el("p", { classe: "msg", texto: "Este estilo ainda não está no seu computador. Você só baixa o que vai usar." }),
      el("p", { classe: "t-peq", texto: "Instala a skill " + e.instalar.skills.join(" e ") + " e baixa: " + e.instalar.baixa + "." }),
      el("div", { classe: "acoes-linha" }, [btn]),
    ];
    if (outra) filhos.push(el("p", { classe: "t-peq", texto: "Espere a outra instalação terminar." }));
    if (inst) {
      if (inst.rodando) filhos.push(el("p", { classe: "t-peq", texto: "Pode levar alguns minutos na primeira vez. Pode continuar usando o painel." }));
      else if (!inst.ok) filhos.push(el("p", { classe: "t-peq erro-txt", texto: "A instalação não terminou. Peça ao Claude no chat: \"instala o estilo " + e.nome + " do Edição com IA\"." }));
      const log = el("ul", { classe: "log t-peq", "aria-live": "polite" });
      inst.linhas.forEach((l) => log.append(el("li", { classe: /FALHOU/.test(l) ? "erro-txt" : "", texto: l.replace(/^\s*(ok|aviso|FALHOU)\s+/, (m, t) => (t === "ok" ? "✓ " : t === "FALHOU" ? "✗ " : "! ")) })));
      filhos.push(log);
    }
    return el("div", { classe: "instalar-caixa" }, filhos);
  }

  function campo(c) {
    const id = "c-" + c.id;
    const ajuda = c.ajuda ? el("span", { classe: "t-peq", id: id + "-a", texto: c.ajuda }) : null;
    const rotulo = c.rotulo + (c.obrigatorio ? "" : " (opcional)");
    if (c.tipo === "texto" || c.tipo === "link") {
      const longo = c.tipo === "texto" && (c.linhas || (c.max || 0) > 300);
      const inp = el(longo ? "textarea" : "input", { classe: "entrada", id, maxlength: String(c.max || 1000), "aria-describedby": ajuda ? id + "-a" : null,
        type: c.tipo === "link" ? "url" : (longo ? null : "text"), rows: longo ? String(c.linhas || 3) : null, inputmode: c.tipo === "link" ? "url" : null,
        placeholder: c.tipo === "link" ? "https://" : null, autocomplete: "off" });
      inp.value = S.campos[c.id] || "";
      inp.addEventListener("input", () => { S.campos[c.id] = inp.value; inp.removeAttribute("aria-invalid"); atualizaResumo(); });
      return el("div", { classe: "campo" }, [el("label", { for: id, texto: rotulo }), inp, ajuda]);
    }
    if (c.tipo === "escolha") {
      const cx = el("div", { classe: "opcoes", role: "radiogroup", "aria-labelledby": id });
      const desenha = () => radio(cx, c.opcoes, S.campos[c.id], (v) => { S.campos[c.id] = v; desenha(); atualizaResumo(); }, (b, it) => {
        b.className = "opcao"; b.append(el("strong", { texto: it.nome }));
      });
      desenha();
      return el("div", { classe: "campo" }, [el("span", { classe: "rotulo", id, texto: rotulo }), cx, ajuda]);
    }
    if (c.tipo === "arquivo") {
      const lista = el("div", { classe: "arquivos", role: "radiogroup", "aria-labelledby": id });
      let todos = false;
      const mais = el("button", { type: "button", classe: "btn chip", onclick: () => { todos = !todos; desenha(); } });
      const desenha = () => {
        if (!S.arquivos.length) { lista.replaceChildren(el("div", { classe: "vazio", texto: "Nenhum vídeo na pasta Bruto ainda." })); mais.hidden = true; return; }
        const ordem = [...S.arquivos].sort((a, b) => b.data - a.data || a.nome.localeCompare(b.nome));
        let vis = todos ? ordem : ordem.slice(0, 6);
        const sel = ordem.find((a) => a.nome === S.campos[c.id]);
        if (sel && !vis.includes(sel)) vis = [sel, ...vis.slice(0, 5)];
        radio(lista, vis.map((a) => ({ ...a, valor: a.nome, desligado: a.tamanho === 0 })), S.campos[c.id], (v) => { S.campos[c.id] = v; desenha(); atualizaResumo(); }, (b, a) => {
          b.className = "arquivo";
          b.append(el("span", { classe: "n", texto: a.nome }), el("span", { classe: a.tamanho ? "t-peq" : "t-peq erro-txt", texto: a.tamanho ? tamanho(a.tamanho) : "vazio" }));
        });
        mais.hidden = ordem.length <= 6;
        mais.textContent = todos ? "Mostrar só os mais novos" : `Ver todos os ${ordem.length.toLocaleString("pt-BR")} arquivos`;
      };
      desenha(); lista._desenha = desenha;
      const inp = el("input", { type: "file", accept: "video/*,audio/*", hidden: true });
      const barra = el("i"); const prog = el("div", { classe: "barra-env", hidden: true }, [barra]);
      const btn = el("button", { type: "button", classe: "btn", texto: "Mandar um vídeo", onclick: () => inp.click() });
      const zona = el("div", { classe: "soltar" }, [el("span", { classe: "t-peq", texto: "Arraste o vídeo para cá, ou coloque o arquivo na pasta Bruto do projeto: ele aparece na lista." }), btn, inp]);
      const envia = async (arq) => {
        if (!arq) return;
        btn.disabled = true; prog.hidden = false; barra.style.transform = "scaleX(0)";
        try {
          const d = await enviaArquivo("/api/arquivo", arq, barra);
          S.arquivos = d.arquivos; S.campos[c.id] = d.nome; desenha(); atualizaResumo(); aviso("Vídeo na pasta Bruto: " + d.nome);
        } catch (e) { aviso(e.message, true); }
        finally { btn.disabled = false; prog.hidden = true; inp.value = ""; }
      };
      inp.addEventListener("change", () => envia(inp.files[0]));
      zona.addEventListener("dragover", (ev) => { ev.preventDefault(); zona.classList.add("em-cima"); });
      zona.addEventListener("dragleave", () => zona.classList.remove("em-cima"));
      zona.addEventListener("drop", (ev) => { ev.preventDefault(); zona.classList.remove("em-cima"); envia(ev.dataTransfer.files[0]); });
      return el("div", { classe: "campo arquivo-campo" }, [el("span", { classe: "rotulo", id, texto: rotulo }), lista, el("div", {}, [mais]), zona, prog, ajuda]);
    }
    return el("div");
  }

  // ---- barra de baixo ----
  const assinaturaPedido = () => JSON.stringify([S.estilo, S.campos, S.modo, S.voz || null]);
  function falta() {
    const e = S.estilo && estiloPor(S.estilo);
    if (!e) return "Escolha o estilo";
    if (S.ultimoMandado && S.ultimoMandado === assinaturaPedido()) return "Pedido mandado. Mude algo para mandar outro";
    if (!instalado(e.id)) return "Instale o estilo primeiro";
    if (!hexOk(S.marca.acento || "")) return "Escolha a cor da marca";
    for (const c of e.campos || []) if (c.obrigatorio && !String(S.campos[c.id] || "").trim()) return "Falta: " + c.rotulo.toLowerCase();
    if (e.voz && !S.voz) return "Escolha a voz da narração";
    return "";
  }
  function atualizaResumo() {
    const e = S.estilo && estiloPor(S.estilo);
    const f = falta();
    $("#resumo-1").textContent = e ? e.nome : "Escolha o estilo";
    const partes = [];
    if (e) {
      if (S.marca.handle) partes.push(S.marca.handle);
      const m = S.catalogo.modos.find((x) => x.valor === S.modo); if (m) partes.push(m.nome);
    }
    $("#resumo-2").textContent = f ? f : partes.join(" · ");
    $("#resumo-2").classList.toggle("erro-txt", false);
    $("#mandar").disabled = !!f || S.enviando;
  }
  function atualizaEtapas() {
    const ordem = ["#etapa-estilo", "#etapa-marca", "#etapa-video"];
    const atual = !S.estilo ? 0 : !hexOk(S.marca.acento || "") ? 1 : 2;
    ordem.forEach((s, i) => $(s).classList.toggle("atual", i === atual));
  }

  async function mandar() {
    const f = falta(); if (f) return aviso(f, true);
    S.enviando = true; atualizaResumo();
    const btn = $("#mandar"); btn.textContent = "Mandando…";
    try {
      const d = await postJson("/api/pedido", { estilo: S.estilo, campos: S.campos, modo: S.modo, voz: S.voz || null });
      aviso(S.ouvindo ? `Pedido ${d.pedido.id} mandado. O Claude já recebeu.`
                      : `Pedido ${d.pedido.id} mandado. Agora diga no chat do Claude: "mandei pelo painel".`);
      const e = estiloPor(S.estilo);
      S.campos = {};
      for (const c of e.campos || []) if (c.padrao) S.campos[c.id] = c.padrao;
      S.ultimoMandado = assinaturaPedido();
      desenhaCamposVideo();
      await atualiza();
      const alvo = $("#etapa-pedidos");
      alvo.scrollIntoView({ behavior: poucoMovimento ? "auto" : "smooth", block: "start" });
    } catch (e) { aviso(e.message, true); }
    finally { S.enviando = false; btn.textContent = "Mandar para o Claude"; atualizaResumo(); }
  }

  // ---- 4. pedidos ----
  const ROTULO = { novo: "Esperando o Claude", recebido: "O Claude recebeu", trabalhando: "Editando", pronto: "Pronto para você ver",
                   ajuste: "Ajuste pedido", aprovado: "Aprovado" };
  const cartoes = new Map();
  function desenhaPedidos() {
    const box = $("#pedidos");
    $("#etapa-pedidos").hidden = !S.pedidos.length;
    const todosPedidos = [...S.pedidos].sort((a, b) => b.id.localeCompare(a.id));
    const ordem = S.verAntigos ? todosPedidos : todosPedidos.slice(0, 5);
    for (const [id, c] of cartoes) if (!ordem.some((p) => p.id === id)) { c.no.remove(); cartoes.delete(id); }
    for (const p of ordem) {
      let c = cartoes.get(p.id);
      // muda a estrutura só quando o estado, o vídeo ou os ajustes mudam; andamento atualiza no lugar (a barra desliza)
      const assinatura = `${p.estado}|${p.resultado}|${p.atualizado && p.estado === "pronto" ? p.atualizado : ""}|${(p.ajustes || []).length}`;
      if (c && c.assinatura === assinatura) {
        const b = c.no.querySelector(".barra-env i"), m = c.no.querySelector(".msg");
        if (b) b.style.transform = `scaleX(${Math.max(0, Math.min(100, p.progresso || 0)) / 100})`;
        if (m) m.textContent = p.mensagem || "";
        continue;
      }
      const novo = cartaoPedido(p, !c);
      if (c) c.no.replaceWith(novo); else box.append(novo);
      cartoes.set(p.id, { no: novo, assinatura });
    }
    // ordem visual: mais novo primeiro
    for (const p of ordem) box.append(cartoes.get(p.id).no);
    const antigos = todosPedidos.length - 5;
    let btn = $("#ver-antigos");
    if (!btn) { btn = el("button", { type: "button", classe: "btn", id: "ver-antigos", onclick: () => { S.verAntigos = !S.verAntigos; desenhaPedidos(); } }); }
    btn.hidden = antigos <= 0;
    btn.textContent = S.verAntigos ? "Mostrar só os 5 mais novos" : `Ver pedidos antigos (${antigos.toLocaleString("pt-BR")})`;
    box.append(btn);
  }
  function cartaoPedido(p, primeiraVez) {
    const e = estiloPor(p.estilo) || { nome: p.estilo };
    const quando = p.criado ? new Date(p.criado).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
    const barra = el("i"); barra.style.transform = `scaleX(${Math.max(0, Math.min(100, p.progresso || 0)) / 100})`;
    const corpo = [el("div", { classe: "pedido-cab" }, [
      el("div", { classe: "t-nome", texto: `#${p.id} · ${e.nome}` }),
      el("span", { classe: "estado " + p.estado, texto: `${ROTULO[p.estado] || p.estado} · ${quando}` }),
    ])];
    if (p.estado !== "aprovado" && p.estado !== "pronto") corpo.push(el("div", { classe: "barra-env", "aria-hidden": "true" }, [barra]));
    corpo.push(el("p", { classe: "msg t-peq", texto: p.mensagem || "" }));
    const resumo = el("ul", { classe: "resumo-campos t-peq" });
    for (const [k, v] of Object.entries(p.campos || {})) {
      const def = (e.campos || []).find((x) => x.id === k);
      const op = def && def.opcoes && def.opcoes.find((o) => o.valor === v);
      const rot = def ? def.rotulo : k;
      resumo.append(el("li", { texto: `${rot}${rot.endsWith("?") ? "" : ":"} ${op ? op.nome : String(v).replace(/^Bruto\//, "")}` }));
    }
    if (p.resultado) {
      const src = `/arquivos/resultado/${p.id}?t=${encodeURIComponent(chave)}&v=${encodeURIComponent(p.atualizado || "")}`;
      const video = el("video", { controls: true, playsinline: true, preload: S.pedidos.filter((x) => x.resultado && x.id > p.id).length < 3 ? "metadata" : "none", src });
      const acoes = el("div", { classe: "acoes" }, [resumo]);
      const baixar = el("a", { classe: "btn", href: src, download: (p.resultado.split("/").pop() || "video.mp4"), texto: "Baixar o vídeo" });
      if (p.estado === "pronto") {
        const txt = el("textarea", { classe: "entrada", rows: "3", maxlength: "2000", "aria-label": "O que mudar", placeholder: "Ex.: a legenda está cobrindo o rosto no começo." });
        const mandaAjuste = el("button", { type: "button", classe: "btn", texto: "Mandar ajuste" });
        const aprovar = el("button", { type: "button", classe: "btn", texto: "Aprovar este vídeo" });
        mandaAjuste.onclick = async () => {
          if (!txt.value.trim()) { txt.setAttribute("aria-invalid", "true"); return aviso("Escreva o que mudar.", true); }
          mandaAjuste.disabled = true;
          try { await postJson(`/api/pedido/${p.id}/ajuste`, { texto: txt.value }); aviso("Ajuste mandado para o Claude."); await atualiza(); }
          catch (er) { aviso(er.message, true); mandaAjuste.disabled = false; }
        };
        aprovar.onclick = async () => {
          aprovar.disabled = true;
          try { await postJson(`/api/pedido/${p.id}/aprovar`, {}); aviso("Aprovado. O vídeo está na pasta Prontos."); await atualiza(); }
          catch (er) { aviso(er.message, true); aprovar.disabled = false; }
        };
        acoes.append(el("div", { classe: "acoes-linha" }, [aprovar, baixar]),
          el("div", { classe: "campo" }, [el("span", { classe: "rotulo", texto: "Quer mudar algo?" }), txt]), el("div", { classe: "acoes-linha" }, [mandaAjuste]));
      } else acoes.append(el("div", { classe: "acoes-linha" }, [baixar]));
      if ((p.ajustes || []).length) {
        const ul = el("ul", { classe: "ajustes t-peq" });
        p.ajustes.forEach((a) => ul.append(el("li", { texto: a.texto })));
        acoes.append(el("div", { classe: "campo" }, [el("span", { classe: "rotulo", texto: "Ajustes pedidos" }), ul]));
      }
      corpo.push(el("div", { classe: "pedido-corpo" }, [video, acoes]));
    } else corpo.push(resumo);
    return el("article", { classe: primeiraVez ? "pedido entra" : "pedido", "aria-label": `Pedido ${p.id}` }, corpo);
  }

  // ---- ciclo ----
  function mostraOuvindo(sim) {
    S.ouvindo = !!sim;
    const o = $("#ouvindo");
    o.classList.toggle("sim", S.ouvindo);
    o.querySelector("span").textContent = S.ouvindo ? "O Claude está ouvindo" : "O Claude não está ouvindo agora";
    o.title = S.ouvindo ? "Mandou, ele recebe na hora." : "Depois de mandar, diga no chat do Claude: mandei pelo painel.";
  }
  async function atualiza() {
    const d = await api("/api/estado");
    mostraOuvindo(d.claude_ouvindo);
    const antes = JSON.stringify([S.instalados, S.instalacao]);
    S.pedidos = d.pedidos; S.arquivos = d.arquivos; S.instalados = d.instalados || []; S.instalacao = d.instalacao;
    if (JSON.stringify([S.instalados, S.instalacao]) !== antes) {
      const acabou = S.instalacao && !S.instalacao.rodando && S.instalacao.ok;
      desenhaGaleria(); desenhaCamposVideo(); atualizaResumo();
      if (acabou && S.estilo === S.instalacao.estilo && instalado(S.estilo)) aviso("Estilo instalado. Já pode mandar o vídeo.");
    }
    document.querySelectorAll(".arquivos").forEach((l) => l._desenha && l._desenha());
    desenhaPedidos();
    return d;
  }
  let tCiclo;
  function ciclo() {
    clearTimeout(tCiclo);
    const ativo = S.pedidos.some((p) => !["aprovado", "pronto"].includes(p.estado));
    tCiclo = setTimeout(async () => { try { if (!document.hidden) await atualiza(); } catch (_) {} ciclo(); }, ativo || S.ouvindo || (S.instalacao && S.instalacao.rodando) ? 2000 : 5000);
  }

  document.addEventListener("touchstart", () => {}, { passive: true }); // faz o :active (apertar) responder no toque do iPhone

  async function inicia() {
    if (!chave) { $("#sem-chave").hidden = false; return; }
    let d;
    try { d = await api("/api/estado"); }
    catch (e) { $("#sem-chave").hidden = false; return; }
    S.catalogo = d.catalogo; S.marca = d.marca || {}; S.arquivos = d.arquivos; S.pedidos = d.pedidos; S.vozPadrao = d.voz_padrao;
    S.instalados = d.instalados || []; S.instalacao = d.instalacao;
    $("#pasta").textContent = "Projeto: " + d.pasta;
    mostraOuvindo(d.claude_ouvindo);
    $("#app").hidden = false; $("#barra").hidden = false;
    desenhaFiltros(); desenhaGaleria(); preencheMarca(); desenhaCamposVideo(); desenhaPedidos(); atualizaEtapas(); atualizaResumo();
    if (!S.marca.acento || !S.marca.legenda) salvaMarca({}, true);

    $("#m-nome").addEventListener("input", (ev) => salvaMarca({ nome: ev.target.value }));
    $("#m-handle").addEventListener("input", (ev) => {
      const v = ev.target.value.replace(/^@+/, "").trim();
      if (v && !/^[A-Za-z0-9._]{1,30}$/.test(v)) { ev.target.setAttribute("aria-invalid", "true"); $("#salvo").classList.add("erro"); $("#salvo").textContent = "O @ só pode ter letras, números, ponto e sublinhado."; return; }
      ev.target.removeAttribute("aria-invalid"); salvaMarca({ handle: v });
    });
    $("#m-cor").addEventListener("input", (ev) => { $("#m-cor-hex").value = ev.target.value.toUpperCase(); salvaMarca({ acento: ev.target.value.toUpperCase() }); coresMarcadas(ev.target.value.toUpperCase()); });
    $("#m-cor-hex").addEventListener("input", (ev) => {
      let v = ev.target.value.trim(); if (v && v[0] !== "#") v = "#" + v;
      if (!hexOk(v)) { ev.target.setAttribute("aria-invalid", "true"); return; }
      ev.target.removeAttribute("aria-invalid"); $("#m-cor").value = v.toUpperCase(); salvaMarca({ acento: v.toUpperCase() });
    });
    $("#btn-logo").addEventListener("click", () => $("#m-logo").click());
    $("#m-logo").addEventListener("change", async (ev) => {
      const arq = ev.target.files[0]; if (!arq) return;
      if (arq.size > 5 * 1024 * 1024) { ev.target.value = ""; return aviso("O logo pode ter até 5 MB.", true); }
      coresDoLogo(arq);
      try { const r = await enviaArquivo("/api/logo", arq); S.marca = r.marca; desenhaLogo(); $("#salvo").textContent = "Logo salvo."; }
      catch (e) { aviso(e.message, true); }
      ev.target.value = "";
    });
    $("#mandar").addEventListener("click", mandar);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) atualiza().catch(() => {}); });
    ciclo();
  }
  inicia();
})();
