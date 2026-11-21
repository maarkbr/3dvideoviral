"use strict";
// Central de trabalho do Edição com IA (painel 2.1): Início, Projetos, Modelos, Entregas e o chat de cada projeto.
// Nada de innerHTML com dado: tudo por textContent e nós montados à mão.
(() => {
  const $ = (s) => document.querySelector(s);
  const pouco = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let chave = "";
  const h = new URLSearchParams(location.hash.slice(1)).get("t");
  try { if (h) localStorage.setItem("painel-chave", h); chave = h || localStorage.getItem("painel-chave") || ""; } catch (_) { chave = h || ""; }
  if (h) history.replaceState(null, "", location.pathname + "#/");
  // painel religado com a aba aberta: o link novo (com #t=) recarrega a página; o resto é navegação entre telas
  window.addEventListener("hashchange", () => { if (/(^|[#&])t=/.test(location.hash)) location.reload(); else rota(); });

  const S = { projetos: [], atual: null, ultimoN: 0, msgs: [], pedidos: [], anexos: [], estado: "parado", desde: null, catalogo: null, instalados: [], gravando: null,
    modelos: [], categorias: {}, cat: "todos", modelo: null, entregas: [], filtroEntrega: "todos", tela: "", pasta: "", claude: {}, modeloPendente: null,
    atualizacao: {}, versao: "", atualizando: false, foraDoAr: 0, recemVisto: false };

  // com o ChatGPT (Codex) respondendo no lugar do Claude, os textos do painel trocam o nome do assistente
  const ehCodex = () => !!(S.claude && S.claude.motor === "codex");
  // (vale para o texto fixo do HTML, o do estilos.json e o do chat: o vigia abaixo troca tudo o que aparece na tela)
  const nomeIA = (t) => (ehCodex() && typeof t === "string" && t.includes("Claude")
    ? t.replace(/o Higgsfield conectado no seu Claude/g, "o programa do Higgsfield no computador")
       .replace(/\(a aula do módulo Capa e título mostra como(, sem instalar nada)?\)/g, "(instale e entre na sua conta uma vez; a aula do ChatGPT mostra como)")
       .replace(/,? conectado no app do Claude/g, ", pelo programa do Higgsfield no computador")
       .replace(/\bClaude\b(?!\s+Code)/g, "ChatGPT")
    : t);
  const ATRIBUTOS = ["placeholder", "title", "aria-label", "alt"];
  function trocaNomes(raiz) {
    if (!ehCodex() || !raiz) return;
    if (raiz.nodeType === 3) { if (raiz.parentElement && raiz.parentElement.closest("[data-nome-fixo]")) return; const v = nomeIA(raiz.nodeValue); if (v !== raiz.nodeValue) raiz.nodeValue = v; return; }
    if (raiz.nodeType !== 1) return;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { if (n.parentElement && n.parentElement.closest("[data-nome-fixo]")) continue; const v = nomeIA(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    for (const e of [raiz, ...raiz.querySelectorAll("[placeholder],[title],[aria-label],[alt]")])
      for (const a of ATRIBUTOS) { const x = e.getAttribute && e.getAttribute(a); if (x && x.includes("Claude")) { const v = nomeIA(x); if (v !== x) e.setAttribute(a, v); } }
  }
  new MutationObserver((ms) => { if (!ehCodex()) return; for (const m of ms) {
    if (m.type === "characterData") trocaNomes(m.target);
    else if (m.type === "attributes") trocaNomes(m.target);
    else m.addedNodes.forEach(trocaNomes);
  } }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  function el(tag, props = {}, filhos = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "texto") e.textContent = nomeIA(v); else if (k === "classe") e.className = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? "" : v);
    }
    for (const f of [].concat(filhos)) if (f !== null && f !== undefined && f !== false) e.append(f);
    return e;
  }
  async function api(c, o = {}) {
    let r;
    try { r = await fetch(c, { ...o, headers: { "X-Painel-Chave": chave, ...(o.headers || {}) } }); }
    catch (_) { const e = new Error("O painel está desligado."); e.status = 0; throw e; }
    let d = {}; try { d = await r.json(); } catch (_) {}
    if (!r.ok) { const e = new Error(d.erro || "Não deu certo. Tente de novo."); e.status = r.status; throw e; }
    return d;
  }
  function trava(titulo, texto) {
    const t = $("#sem-chave"); t.querySelector("h1").textContent = titulo; t.querySelector("p").textContent = texto; t.hidden = false;
    $("#app").hidden = true;
  }
  const post = (c, d) => api(c, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d || {}) });
  let tAv;
  function aviso(m, erro = false) { const a = $("#aviso"); a.textContent = nomeIA(m); a.classList.toggle("erro", erro); a.classList.add("mostra"); clearTimeout(tAv); tAv = setTimeout(() => a.classList.remove("mostra"), erro ? 6000 : 3500); }
  const arqDe = (pid, rel) => `/arquivos/projeto/${pid}/${rel.split("/").map(encodeURIComponent).join("/")}?t=${encodeURIComponent(chave)}`;
  const arq = (rel) => arqDe(S.atual, rel);
  const capaDe = (e) => `/arquivos/entrega-capa/${e.projeto}/${e.arquivo.split("/").map(encodeURIComponent).join("/")}?t=${encodeURIComponent(chave)}`;
  const hexOk = (v) => /^#[0-9A-Fa-f]{6}$/.test(v || "");
  const corDe = (p) => (hexOk(p && p.marca && p.marca.acento) ? p.marca.acento : "#9EA3AE");
  const plural = (n, um, varios) => `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;
  function tamanho(b) {
    if (!b) return ""; if (b >= 1024 ** 3) return (b / 1024 ** 3).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " GB";
    if (b >= 1024 ** 2) return Math.round(b / 1024 ** 2).toLocaleString("pt-BR") + " MB"; return Math.max(1, Math.round(b / 1024)).toLocaleString("pt-BR") + " KB";
  }
  const tempo = (s) => (s == null ? "" : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`);
  const quando = (iso) => { try { return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (_) { return iso; } };
  function relativo(iso) {
    if (!iso) return ""; const d = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!isFinite(d)) return ""; if (d < 60) return "agora"; if (d < 3600) return `há ${Math.floor(d / 60)} min`;
    if (d < 86400) return `há ${plural(Math.floor(d / 3600), "hora", "horas")}`; if (d < 7 * 86400) return `há ${plural(Math.floor(d / 86400), "dia", "dias")}`;
    return quando(iso).slice(0, 5);
  }

  // ---------- markdown mínimo e seguro (parágrafo, lista, **negrito**, `código`) ----------
  function inline(pai, txt) {
    const partes = String(txt).split(/(\*\*[^*]+\*\*|`[^`]+`)/);
    for (const p of partes) {
      if (!p) continue;
      if (p.startsWith("**") && p.endsWith("**")) pai.append(el("strong", { texto: p.slice(2, -2) }));
      else if (p.startsWith("`") && p.endsWith("`")) pai.append(el("code", { texto: p.slice(1, -1) }));
      else pai.append(document.createTextNode(p));
    }
  }
  function markdown(txt) {
    const frag = document.createDocumentFragment();
    let lista = null, tipo = null;
    for (const linha of String(txt).split("\n")) {
      const n = linha.match(/^\s*(\d+)[.)]\s+(.*)$/), b = linha.match(/^\s*[-•*]\s+(.*)$/);
      if (n || b) {
        const t = n ? "ol" : "ul";
        if (!lista || tipo !== t) { lista = el(t); tipo = t; frag.append(lista); }
        const li = el("li"); inline(li, n ? n[2] : b[1]); lista.append(li);
      } else if (linha.trim()) { lista = null; const p = el("p"); inline(p, linha.replace(/^#+\s*/, "")); frag.append(p); }
      else lista = null;
    }
    return frag;
  }

  // ---------- rotas ----------
  const TITULOS = { inicio: "Início", projetos: "Projetos", modelos: "Modelos", entregas: "Entregas" };
  const irPara = (hash) => { if (location.hash === hash) rota(); else location.hash = hash; };
  function mostra(tela) {
    S.tela = tela;
    for (const t of document.querySelectorAll(".c-tela")) t.hidden = t.id !== "tela-" + tela;
    for (const a of document.querySelectorAll(".c-nav a")) { const atual = a.dataset.tela === tela || (tela === "projeto" && a.dataset.tela === "projetos"); if (atual) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); }
    fechaLateral();
    const t = $("#tela-" + tela); if (t && t.classList.contains("c-pagina")) t.scrollTop = 0;
    document.title = (tela === "projeto" ? ($("#titulo-projeto").textContent || "Projeto") : TITULOS[tela]) + " · Edição com IA";
  }
  async function rota() {
    const partes = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    const [tela, arg] = partes;
    if (!tela) { mostra("inicio"); desenhaInicio(); return; }
    if (tela === "projetos") { mostra("projetos"); desenhaListaProjetos(); return; }
    if (tela === "modelos") { S.cat = arg && S.categorias[arg] ? arg : "todos"; mostra("modelos"); desenhaGaleria(); desenhaModelos(); return; }
    if (tela === "entregas") { S.filtroEntrega = arg && S.projetos.some((p) => p.id === arg) ? arg : "todos"; mostra("entregas"); desenhaEntregas(); carregaEntregas().then(desenhaEntregas).catch(() => {}); return; }
    if (tela === "projeto" && arg && S.projetos.some((p) => p.id === arg)) { mostra("projeto"); await abre(arg); return; }
    irPara("#/");
  }

  // ---------- topo ----------
  function desenhaConta(c) {
    const antes = ehCodex(); S.claude = c;
    if (!antes && ehCodex()) trocaNomes(document.body);
    const box = $("#conta"); box.replaceChildren();
    const nome = c.motor === "codex" ? "ChatGPT" : "Claude";
    // com o Claude e o ChatGPT instalados, a pessoa escolhe quem responde (vale para as próximas mensagens)
    const outro = (c.motores || []).length > 1 ? (c.motor === "codex" ? "claude" : "codex") : "";
    const troca = outro ? el("button", { type: "button", classe: "btn chip c-troca", "data-nome-fixo": true,
      title: "Troca o assistente que responde no chat. Cada um usa a assinatura dele; a conversa de cada projeto continua.", onclick: async () => {
        try { await post("/api/v2/motor", { motor: outro }); location.reload(); }
        catch (e) { aviso(e.message, true); }
      } }) : null;
    if (troca) troca.textContent = outro === "codex" ? "Usar o ChatGPT" : "Usar o Claude";  // direto: o nome do botão não passa pela troca de nome
    if (!c.tem) { box.className = "c-conta t-peq"; box.title = "Falta o Claude Code de terminal ou o app do ChatGPT"; box.append(el("i"), el("span", { texto: "Falta o Claude Code de terminal ou o app do ChatGPT" })); return; }
    // o modelo de IA: escolha salva no config do painel; vale para as próximas mensagens
    const mods = c.modelos || {};
    const seletor = (mods.opcoes || []).length > 1 ? el("select", { classe: "c-modelo t-peq", "data-nome-fixo": true, "aria-label": "Modelo de IA",
      title: "O modelo de IA que trabalha nos seus pedidos. A troca vale para as próximas mensagens.", onchange: async (ev) => {
        try { await post("/api/v2/modelo", { modelo: ev.target.value }); aviso("Pronto: as próximas mensagens usam " + ev.target.selectedOptions[0].textContent + "."); await atualizaGeral(); }
        catch (e) { aviso(e.message, true); }
      } }, mods.opcoes.map(([id, rot]) => { const o = el("option", { value: id, texto: rot }); if (id === (mods.escolhido || "")) o.selected = true; return o; })) : null;
    if (c.logado) { box.className = "c-conta t-peq ok"; box.title = nome + " conectado"; box.append(el("i"), el("span", { texto: nome + " conectado" }), seletor || "", troca || ""); return; }
    box.className = "c-conta t-peq";
    box.append(el("button", { type: "button", classe: "btn chip", texto: "Conectar minha conta", onclick: conectaConta }), troca || "");
  }
  const ROT = { trabalhando: "Trabalhando…", permissao: "Esperando a sua permissão", "na fila": "Na fila", parado: "" };
  const vivos = () => S.projetos.filter((p) => p.estado === "trabalhando" || p.estado === "permissao" || p.estado === "na fila");
  function desenhaNav() {
    const a = document.querySelector('.c-nav a[data-tela="inicio"]'); if (!a) return;
    const perm = S.projetos.some((p) => p.estado === "permissao");
    a.replaceChildren("Início", perm ? el("span", { classe: "bolinha", "aria-label": "Esperando a sua permissão" }) : "");
  }

  // ---------- projetos (cartões) ----------
  const ETAPA_NOME = { briefing: "Pedido", roteiro: "Roteiro", storyboard: "Desenho das cenas", narracao: "Narração", cenas: "Animação", render: "Gerar o vídeo", entrega: "Entrega", capa: "Capa" };
  // pedido só de capa e título (estilo capa-e-titulo): a coluna fica curta
  const ETAPA_NOME_CAPA = { briefing: "Pedido", roteiro: "Títulos", capa: "Capas", entrega: "Entrega" };
  function estadoChip(p) {
    if (p.estado === "permissao") return el("span", { classe: "c-estado perm" }, [el("span", { classe: "c-girando", "aria-hidden": "true" }), "Esperando a sua permissão"]);
    if (p.estado === "trabalhando") return el("span", { classe: "c-estado" }, [el("span", { classe: "c-girando", "aria-hidden": "true" }), "Trabalhando…"]);
    if (p.estado === "na fila") return el("span", { classe: "c-estado", texto: "Na fila" });
    if (p.etapa && p.etapa.estado === "esperando") return el("span", { classe: "c-estado perm", texto: (ETAPA_NOME[p.etapa.nome] || p.etapa.nome) + ": esperando você" });
    if (p.etapa && p.etapa.nome === "entrega" && p.etapa.estado === "feito") return el("span", { classe: "c-estado ok", texto: "Entregue" });
    if (p.etapa && p.etapa.estado) return el("span", { classe: "c-estado", texto: (ETAPA_NOME[p.etapa.nome] || p.etapa.nome) });
    return null;
  }
  function logoDe(p) {
    const box = el("span", { classe: "logo", "aria-hidden": "true" }); box.style.background = corDe(p);
    if (p.marca && p.marca.logo) box.append(el("img", { src: arqDe(p.id, p.marca.logo), alt: "", loading: "lazy" }));
    else box.textContent = ([...String(p.nome || "").trim()][0] || "?").toUpperCase();
    return box;
  }
  function cardProjeto(p) {
    const chip = estadoChip(p);
    return el("button", { type: "button", classe: "c-card-proj", "aria-current": String(p.id === S.atual), title: p.nome, onclick: () => irPara("#/projeto/" + p.id) }, [
      el("span", { classe: "cab" }, [logoDe(p), el("span", { classe: "txt" }, [el("span", { classe: "t-nome", texto: p.nome }), el("span", { classe: "t-peq", texto: (p.marca && p.marca.handle) || "Sem marca cadastrada" })])]),
      el("span", { classe: "rodape" }, [el("span", { classe: "t-peq", texto: [plural(p.videos || 0, "vídeo", "vídeos"), p.ultima ? relativo(p.ultima) : ""].filter(Boolean).join(" · ") }), chip]),
    ]);
  }
  const cardNovo = () => el("button", { type: "button", classe: "c-card-proj novo", onclick: abreNovo }, [el("span", { classe: "mais", "aria-hidden": "true", texto: "+" }), el("span", { classe: "t-nome", texto: "Novo projeto" })]);
  function desenhaListaProjetos() {
    const g = $("#lista-projetos"); g.replaceChildren();
    for (const p of S.projetos) g.append(cardProjeto(p));
    g.append(cardNovo());
  }

  // ---------- início ----------
  function desenhaInicio() {
    $("#ini-sub").textContent = S.pasta ? `Pasta de trabalho: ${S.pasta}` : "";
    const n = $("#ini-numeros"); n.replaceChildren();
    const andando = vivos().length;
    const tiles = [
      ["#/projetos", S.projetos.length, "projeto", "projetos", false],
      ["#/entregas", S.entregas.length, "vídeo entregue", "vídeos entregues", false],
      ["#/entregas", Math.round(S.entregas.reduce((s, x) => s + (x.duracao || 0), 0) / 60), "minuto de vídeo", "minutos de vídeo", false],
      ["#/", andando, "em andamento", "em andamento", andando > 0],
      ["#/modelos", S.modelos.length, "modelo", "modelos", false],
    ];
    for (const [hash, num, um, varios, vivo] of tiles) n.append(el("button", { type: "button", classe: "c-tile" + (vivo ? " vivo" : ""), onclick: () => irPara(hash) }, [
      el("strong", { texto: num.toLocaleString("pt-BR") }), el("span", { classe: "t-peq", texto: num === 1 ? um : varios })]));
    // agora
    const ag = vivos(); $("#ini-agora").hidden = !ag.length;
    const al = $("#ini-agora-lista"); al.replaceChildren();
    for (const p of ag) al.append(el("div", { classe: "c-agora-item" + (p.estado === "permissao" ? " perm" : "") }, [
      el("span", { classe: "c-girando", "aria-hidden": "true" }),
      el("span", { classe: "txt" }, [el("span", { classe: "t-nome", texto: p.nome }), el("span", { classe: "t-peq", texto: ROT[p.estado] + (p.etapa && p.etapa.nome ? " · " + (ETAPA_NOME[p.etapa.nome] || p.etapa.nome) + (p.etapa.msg ? ": " + p.etapa.msg : "") : "") })]),
      el("button", { type: "button", classe: "btn chip" + (p.estado === "permissao" ? " btn-principal" : ""), texto: p.estado === "permissao" ? "Responder" : "Abrir", onclick: () => irPara("#/projeto/" + p.id) }),
    ]));
    // projetos recentes
    const g = $("#ini-projetos"); g.replaceChildren();
    for (const p of S.projetos.slice(0, 5)) g.append(cardProjeto(p));
    g.append(cardNovo());
    // últimas entregas
    const e = $("#ini-entregas"); e.replaceChildren();
    if (!S.entregas.length) e.append(el("div", { classe: "c-vazio t-peq", texto: "Nenhum vídeo entregue ainda. O primeiro aparece aqui quando o Claude terminar." }));
    for (const x of S.entregas.slice(0, 6)) e.append(cardEntrega(x));
    // categorias
    desenhaCatsGrade($("#ini-cats"), false);
    desenhaPainel();
    desenhaPrimeiros();
  }

  // ---------- primeiros passos (Início de quem está começando): do painel instalado ao primeiro vídeo pronto ----------
  const PRIM_OCULTO = "painel-primeiros-oculto";
  const recente = () => [...S.projetos].sort((a, b) => String(b.ultima || "").localeCompare(String(a.ultima || "")))[0] || null;
  const temMarca = (p) => !!(p && p.marca && (p.marca.handle || p.marca.logo));
  async function noProjeto(id, fn) {
    irPara("#/projeto/" + id);
    for (let i = 0; i < 40 && S.atual !== id; i++) await new Promise((r) => setTimeout(r, 100));
    await new Promise((r) => setTimeout(r, 250));
    if (S.atual === id) fn();
  }
  async function conectaConta() {
    try { await post("/api/v2/conectar"); aviso(ehCodex() ? "Abri a página do ChatGPT no navegador. Entre na sua conta e volte aqui." : "Abri a página do Claude no navegador. Clique em Autorizar e volte aqui."); } catch (e) { aviso(e.message, true); }
  }
  // um caminho só até o primeiro vídeo: cria o projeto se não houver, passa pela marca e abre o assistente
  function primeiroVideo() {
    const p = recente();
    if (!p) { S.fluxoPrimeiro = true; abreNovo(); return; }
    if (!temMarca(p) && !S.projetos.some(temMarca)) { S.fluxoPrimeiro = true; noProjeto(p.id, abreMarca); return; }
    noProjeto((S.projetos.find(temMarca) || p).id, abreNovoVideo);
  }
  function passosPrimeiros() {
    const c = S.claude || {};
    const pediu = S.projetos.some((p) => (p.videos || 0) > 0 || (p.etapa && p.etapa.nome) || ["trabalhando", "permissao", "na fila"].includes(p.estado));
    const entregou = S.entregas.length > 0;
    return [
      { feito: !!c.logado, titulo: ehCodex() ? "Conectar a sua conta do ChatGPT" : "Conectar a sua conta do Claude",
        dica: c.tem === false ? "Falta o Claude Code de terminal. No chat do Claude, peça: \"instala o Claude Code de terminal\". Sem o Claude, instale o app do ChatGPT para Mac (ele traz o Codex) e abra o painel de novo."
          : ehCodex() ? "Uma vez só: o navegador abre a página do ChatGPT, você entra na sua conta e volta."
          : "Uma vez só: o navegador abre a página do Claude, você clica em Autorizar e volta.",
        acao: c.tem === false ? null : ["Conectar", conectaConta] },
      { feito: S.projetos.length > 0, titulo: "Criar o projeto do seu canal", dica: "Um projeto por canal ou cliente. Cada um guarda a marca, o chat e os vídeos.",
        acao: ["Criar projeto", () => { S.fluxoPrimeiro = true; abreNovo(); }] },
      { feito: S.projetos.some(temMarca), titulo: "Cadastrar a sua marca", dica: "O @, a cor e o logo. O Claude usa em todos os vídeos do projeto.",
        acao: ["Cadastrar a marca", () => { const p = recente(); if (p) { S.fluxoPrimeiro = true; noProjeto(p.id, abreMarca); } }] },
      { feito: pediu || entregou, titulo: "Pedir o primeiro vídeo", dica: "Passo a passo: você escolhe o tipo de vídeo, manda o material e confere antes de começar.",
        acao: ["Fazer meu primeiro vídeo", primeiroVideo] },
      { feito: entregou, titulo: "Receber o vídeo pronto", dica: "Ele aparece em Entregas. Você aprova ou pede um ajuste em uma frase.", acao: null },
    ];
  }
  function desenhaPrimeiros() {
    const sec = $("#ini-primeiros"); if (!sec) return;
    const ps = passosPrimeiros(), feitos = ps.filter((p) => p.feito).length;
    let oculto = false; try { oculto = localStorage.getItem(PRIM_OCULTO) === "1"; } catch (_) {}
    const mostrar = feitos < ps.length && !oculto;
    sec.hidden = !mostrar;
    // sem entrega ainda, os gráficos vazios só ocupam lugar: os primeiros passos ficam no lugar deles
    $("#ini-painel").hidden = mostrar && !S.entregas.length;
    if (!mostrar) return;
    $("#ini-primeiros-sub").textContent = nomeIA(`${feitos} de ${ps.length} feitos. Siga na ordem: em poucos minutos o Claude está editando o seu primeiro vídeo.`);
    const prog = $("#ini-primeiros-prog"); prog.setAttribute("aria-valuemin", "0"); prog.setAttribute("aria-valuemax", String(ps.length));
    prog.setAttribute("aria-valuenow", String(feitos)); prog.firstElementChild.style.width = Math.round((feitos / ps.length) * 100) + "%";
    const atual = ps.findIndex((p) => !p.feito);
    const l = $("#ini-primeiros-lista"); l.replaceChildren();
    ps.forEach((p, i) => {
      const estado = p.feito ? "feito" : i === atual ? "atual" : "";
      l.append(el("li", { classe: estado, "aria-current": i === atual ? "step" : null }, [
        el("span", { classe: "num", "aria-hidden": "true", texto: p.feito ? "✓" : String(i + 1) }),
        el("span", { classe: "txt" }, [el("span", { classe: "t-nome" }, [p.titulo, p.feito ? el("span", { classe: "so-leitor", texto: " (feito)" }) : null]), i === atual ? el("span", { classe: "t-peq", texto: p.dica }) : null]),
        i === atual && p.acao ? el("button", { type: "button", classe: "btn btn-principal", texto: p.acao[0], onclick: p.acao[1] }) : null,
      ]));
    });
  }

  // ---------- painel de gráficos do Início: entregas no período (dados reais, só das pastas de Prontos) ----------
  const PERIODOS = [[7, "7 dias"], [30, "30 dias"], [90, "90 dias"]];
  let periodo = 30;
  try { const p = Number(localStorage.getItem("painel-periodo")); if (PERIODOS.some(([d]) => d === p)) periodo = p; } catch (_) {}
  const DIA = 86400000;
  const inicioDoDia = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const diaCurto = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const diaSemana = (d) => d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  function duracaoTxt(s) {
    if (!s) return "0 min";
    if (s < 60) return `${Math.round(s)} s`;
    const m = Math.round(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
  }
  // topo do gráfico: um número redondo sempre ACIMA da maior barra (o número dela não encosta no rótulo da escala)
  function escalaBonita(max) {
    if (max < 4) return max + 1;
    const p = 10 ** Math.floor(Math.log10(max)); for (const f of [1, 2, 2.5, 5, 10]) if (max < f * p) return f * p; return 10 * p;
  }
  // entregas do período em baldes: um por dia (7 e 30 dias) ou por semana (90 dias); o último balde termina hoje
  function baldes(dias) {
    const hoje = inicioDoDia(Date.now()), passo = dias > 30 ? 7 : 1, n = Math.ceil(dias / passo);
    const bs = Array.from({ length: n }, (_, i) => {
      const fim = new Date(hoje.getTime() - (n - 1 - i) * passo * DIA);
      const ini = new Date(Math.max(fim.getTime() - (passo - 1) * DIA, hoje.getTime() - (dias - 1) * DIA));
      return { ini, fim, n: 0, seg: 0, ultimo: i === n - 1 };
    });
    const doPeriodo = [];
    for (const e of S.entregas) {
      const t = new Date(e.quando); if (!isFinite(t)) continue;
      const d = Math.round((hoje - inicioDoDia(t)) / DIA); if (d < 0 || d >= dias) continue;
      const b = bs[n - 1 - Math.floor(d / passo)]; if (!b) continue;
      b.n++; b.seg += e.duracao || 0; doPeriodo.push(e);
    }
    return { bs, passo, doPeriodo };
  }
  function dicaDe(card) {
    let d = card.querySelector(".c-graf-dica");
    if (!d) { d = el("div", { classe: "c-graf-dica", "aria-hidden": "true" }); card.append(d); }
    return d;
  }
  function mostraDica(card, alvo, valor, detalhe) {
    const d = dicaDe(card); d.replaceChildren(el("strong", { texto: valor }), el("span", { classe: "t-peq", texto: detalhe }));
    // a dica fica em cima da barra (não da coluna inteira), para não cobrir o título do cartão
    const c = card.getBoundingClientRect(), a = (alvo.querySelector("i") || alvo).getBoundingClientRect(), w = d.offsetWidth, h = d.offsetHeight;
    const cab = card.querySelector("figcaption"), limite = cab ? cab.getBoundingClientRect().bottom - c.top + 4 : 8;
    let x = Math.min(Math.max(a.left - c.left + a.width / 2 - w / 2, 8), c.width - w - 8), y = a.top - c.top - h - 8;
    if (y < limite) {  // barra alta: sem espaço em cima, a dica vai para o lado da barra
      y = Math.max(a.top - c.top, limite);
      x = a.right - c.left + 8 + w <= c.width - 8 ? a.right - c.left + 8 : Math.max(a.left - c.left - w - 8, 8);
    }
    d.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`; d.classList.add("mostra");
  }
  const escondeDica = (card) => { const d = card.querySelector(".c-graf-dica"); if (d) d.classList.remove("mostra"); };
  function comDica(card, alvo, valor, detalhe) {
    const mostra = () => mostraDica(card, alvo, valor, detalhe), some = () => escondeDica(card);
    alvo.addEventListener("pointerenter", mostra); alvo.addEventListener("pointerleave", some);
    alvo.addEventListener("focus", mostra); alvo.addEventListener("blur", some);
  }
  function desenhaPeriodo() {
    const box = $("#ini-periodo"); box.replaceChildren();
    for (const [d, nome] of PERIODOS) box.append(el("button", { type: "button", classe: "btn chip", "aria-pressed": String(periodo === d), texto: nome, onclick: () => {
      periodo = d; try { localStorage.setItem("painel-periodo", String(d)); } catch (_) {} desenhaPainel();
    } }));
  }
  function graficoDias(info, dias) {
    const { bs, passo, doPeriodo } = info, tot = doPeriodo.length, seg = doPeriodo.reduce((s, e) => s + (e.duracao || 0), 0);
    const max = Math.max(0, ...bs.map((b) => b.n)), esc = escalaBonita(max), semanal = passo > 1;
    const card = el("figure", { classe: "c-graf" });
    const legenda = semanal ? "por semana" : "por dia";
    card.append(el("figcaption", { classe: "c-graf-cab" }, [
      el("span", { classe: "c-graf-num", texto: `${plural(tot, "vídeo", "vídeos")} · ${duracaoTxt(seg)}` }),
      el("span", { classe: "t-peq", texto: `Vídeos entregues ${legenda}, nos últimos ${dias} dias` })]));
    const area = el("div", { classe: "c-graf-area" });
    area.append(el("div", { classe: "c-graf-y", "aria-hidden": "true" }, [el("span", { classe: "t-peq", texto: plural(esc, "vídeo", "vídeos") })]));
    const ol = el("ol", { classe: "c-colunas", "aria-label": `Vídeos entregues ${legenda}` });
    const rotulo = (b) => semanal ? (b.ultimo ? "esta semana" : `semana de ${diaCurto(b.ini)}`) : (b.ultimo ? "hoje" : `${diaSemana(b.fim)}, ${diaCurto(b.fim)}`);
    bs.forEach((b) => {
      const destaque = b.ultimo, rotular = b.n > 0 && (b.n === max || destaque);
      const li = el("li", { classe: "c-col" + (destaque ? " hoje" : ""), tabindex: "0", "aria-label": `${rotulo(b)}: ${plural(b.n, "vídeo", "vídeos")}${b.n ? ", " + duracaoTxt(b.seg) : ""}` }, [
        rotular ? el("b", { "aria-hidden": "true", texto: b.n.toLocaleString("pt-BR") }) : null,
        el("i", { "aria-hidden": "true" })]);
      li.querySelector("i").style.setProperty("--h", `${(b.n / esc) * 100}%`);
      comDica(card, li, plural(b.n, "vídeo", "vídeos"), `${rotulo(b)}${b.n ? " · " + duracaoTxt(b.seg) : ""}`);
      ol.append(li);
    });
    area.append(ol);
    if (!tot) area.append(el("div", { classe: "c-graf-vazio t-peq", texto: `Nenhum vídeo entregue nos últimos ${dias} dias.` }));
    card.append(area);
    // eixo x: todos os dias quando são 7; senão começo, meio e fim
    const xs = bs.length <= 7 ? bs.map((b) => b.ultimo ? "hoje" : diaSemana(b.fim)) : [diaCurto(bs[0].ini), diaCurto(bs[Math.floor(bs.length / 2)].fim), semanal ? "esta semana" : "hoje"];
    card.append(el("div", { classe: "c-graf-x" + (bs.length <= 7 ? "" : " tres"), "aria-hidden": "true" }, xs.map((t) => el("span", { classe: "t-peq", texto: t }))));
    return card;
  }
  function graficoProjetos(info, dias) {
    const por = new Map();
    for (const e of info.doPeriodo) { const p = por.get(e.projeto) || { id: e.projeto, nome: e.nome_projeto || e.projeto, n: 0, seg: 0 }; p.n++; p.seg += e.duracao || 0; por.set(e.projeto, p); }
    let lista = [...por.values()].sort((a, b) => b.n - a.n || b.seg - a.seg || a.nome.localeCompare(b.nome, "pt-BR"));
    if (lista.length > 5) {  // do 6º em diante vira "Outros", para nunca passar de 5 linhas
      const resto = lista.slice(4);
      lista = [...lista.slice(0, 4), { id: null, nome: `Outros ${resto.length} projetos`, n: resto.reduce((s, p) => s + p.n, 0), seg: resto.reduce((s, p) => s + p.seg, 0) }];
    }
    const max = Math.max(1, ...lista.map((p) => p.n));
    const card = el("figure", { classe: "c-graf" });
    card.append(el("figcaption", { classe: "c-graf-cab" }, [
      el("span", { classe: "c-graf-num", texto: plural(por.size, "projeto", "projetos") }),
      el("span", { classe: "t-peq", texto: `Com vídeo entregue nos últimos ${dias} dias` })]));
    if (!lista.length) { card.append(el("div", { classe: "c-vazio t-peq", texto: "Nenhum projeto entregou vídeo neste período." })); return card; }
    const ol = el("ol", { classe: "c-barras", "aria-label": "Vídeos entregues por projeto" });
    for (const p of lista) {
      const rot = `${p.nome}: ${plural(p.n, "vídeo", "vídeos")}, ${duracaoTxt(p.seg)}`;
      const filhos = [el("span", { classe: "nome", texto: p.nome, title: p.nome }), el("span", { classe: "trilho", "aria-hidden": "true" }, [el("i")]), el("span", { classe: "v", "aria-hidden": "true", texto: p.n.toLocaleString("pt-BR") })];
      const linha = p.id ? el("button", { type: "button", classe: "c-barra", "aria-label": rot + ". Abrir as entregas do projeto", onclick: () => irPara("#/entregas/" + p.id) }, filhos)
                         : el("div", { classe: "c-barra", tabindex: "0", "aria-label": rot }, filhos);
      linha.querySelector(".trilho i").style.setProperty("--w", `${(p.n / max) * 100}%`);
      comDica(card, linha, plural(p.n, "vídeo", "vídeos"), `${p.nome} · ${duracaoTxt(p.seg)}`);
      ol.append(el("li", {}, [linha]));
    }
    card.append(ol);
    return card;
  }
  function desenhaPainel() {
    const g = $("#ini-graficos"); if (!g) return;
    desenhaPeriodo(); g.replaceChildren();
    if (!S.entregas.length) { $("#ini-periodo").hidden = true; g.append(el("div", { classe: "c-vazio t-peq", texto: "Os gráficos aparecem aqui quando o primeiro vídeo ficar pronto." })); return; }
    $("#ini-periodo").hidden = false;
    const info = baldes(periodo);
    g.append(graficoDias(info, periodo), graficoProjetos(info, periodo));
  }

  // ---------- modelos ----------
  function desenhaEstilos() {
    const ul = $("#estilos"); ul.replaceChildren();
    for (const e of S.catalogo.estilos) {
      const ok = !e.em_breve;
      const thumb = e.previa ? el("img", { src: e.previa + ".jpg", alt: "", loading: "lazy" }) : el("span", { classe: "ph", "aria-hidden": "true" });
      const sub = e.em_breve ? "Em breve" : S.instalados.includes(e.id) ? e.precisa : "Instala no 1º uso";
      ul.append(el("li", {}, el("button", { type: "button", classe: "c-est", "aria-disabled": ok ? null : "true", onclick: () => { if (!ok) return;
        const t = $("#texto"); t.value = (t.value ? t.value.trim() + "\n" : "") + `Quero um vídeo no estilo ${e.nome}. `; t.focus(); autoAltura(); fechaLateral(); } },
      [thumb, el("span", { classe: "txt" }, [el("span", { classe: "t-nome", texto: e.nome }), el("span", { classe: "t-peq", texto: sub })])])));
    }
  }
  // "tunel-debaixo-do-mar.mp4" → "Tunel debaixo do mar" (o arquivo continua com o nome dele no "Baixar")
  const nomeBonito = (n) => { const s = String(n || "").replace(/\.[a-z0-9]{2,4}$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim(); return s ? s[0].toUpperCase() + s.slice(1) : String(n || ""); };
  const nomeEstilo = (id) => { const e = S.catalogo && S.catalogo.estilos.find((x) => x.id === id); return e ? e.nome : id; };
  const modUrl = (m, f) => `/arquivos/modelo/${m.origem}/${m.id}/${f}?t=${encodeURIComponent(chave)}`;
  function miniModelo(m, classe) {
    const box = el("span", { classe });
    box.append(el("img", { src: modUrl(m, "capa.jpg"), alt: "", loading: "lazy" }));
    if (m.tem_previa && !pouco) {
      const v = el("video", { muted: true, loop: true, playsinline: true, preload: "none", "aria-hidden": "true" }); v.muted = true;
      box.append(v);
      box._liga = () => { if (!v.src) v.src = modUrl(m, "previa.mp4"); v.play().then(() => v.classList.add("vai")).catch(() => {}); };
      box._desliga = () => { v.pause(); v.classList.remove("vai"); };
    }
    return box;
  }
  // o vídeo já está no computador da pessoa: "Mostrar na pasta" abre o Finder/Explorer com ele selecionado
  async function mostraNaPasta(pid, rel) {
    try { await post(`/api/v2/projeto/${pid}/mostrar`, { arquivo: rel }); aviso("Abri a pasta com o vídeo selecionado."); } catch (e) { aviso(e.message, true); }
  }
  function tocaVideo(titulo, src, local) {
    const v = $("#player-video"), dlg = $("#modal-player"); dlg.classList.remove("horiz");
    v.onloadedmetadata = () => dlg.classList.toggle("horiz", v.videoWidth > v.videoHeight);  // vídeo deitado (YouTube) abre largo
    v.src = src; $("#player-titulo").textContent = titulo;
    const b = $("#player-pasta"); b.hidden = !local; b.onclick = local ? () => mostraNaPasta(local.pid, local.rel) : null;
    $("#modal-player").showModal(); v.play().catch(() => {});
  }
  // o modelo entra no pedido do projeto aberto; fora de um projeto, pergunta em qual
  function usarModelo(m) {
    if (S.tela === "projeto" && S.atual) { anexaModelo(m); return; }
    if (S.projetos.length === 0) { S.modeloPendente = m; abreNovo(); return; }
    if (S.projetos.length === 1) { S.modeloPendente = m; irPara("#/projeto/" + S.projetos[0].id); return; }
    S.modeloPendente = m;
    $("#escolhe-sub").textContent = `O modelo "${m.nome}" vai junto com a sua próxima mensagem nesse projeto.`;
    const l = $("#escolhe-lista"); l.replaceChildren();
    const ordem = [...S.projetos].sort((a, b) => (a.id === S.atual ? -1 : b.id === S.atual ? 1 : 0));
    for (const p of ordem) {
      const cor = el("span", { classe: "cor", "aria-hidden": "true" }); cor.style.background = corDe(p);
      l.append(el("button", { type: "button", classe: "c-proj", onclick: () => { $("#modal-escolhe").close(); irPara("#/projeto/" + p.id); } }, [
        cor, el("span", { classe: "txt" }, [el("span", { classe: "t-nome", texto: p.nome }), el("span", { classe: "t-peq", texto: p.id === S.atual ? "Último aberto" : (p.marca && p.marca.handle) || " " })])]));
    }
    $("#modal-escolhe").showModal();
  }
  function anexaModelo(m) {
    S.modelo = m; desenhaModelos(); desenhaAnexados();
    const t = $("#texto"); if (!t.value.trim()) t.value = `Quero um vídeo como o modelo "${m.nome}". `;
    autoAltura(); t.focus(); fechaLateral();
  }
  function desenhaCats(container) {
    container.replaceChildren();
    const cats = [["todos", "Todos"], ...Object.entries(S.categorias)];
    for (const [id, nome] of cats) container.append(el("button", { type: "button", classe: "btn chip", "aria-pressed": String(S.cat === id), texto: nome,
      onclick: () => { S.cat = id; desenhaModelos(); } }));
  }
  function desenhaCatsGrade(container, comTodos) {
    container.replaceChildren();
    const cats = [...(comTodos ? [["todos", "Todos os modelos"]] : []), ...Object.entries(S.categorias)];
    for (const [id, nome] of cats) {
      const lista = S.modelos.filter((m) => id === "todos" || m.categoria === id);
      const mos = el("span", { classe: "mosaico", "aria-hidden": "true" });
      for (let i = 0; i < 3; i++) { const m = lista[i]; mos.append(el("span", {}, m ? el("img", { src: modUrl(m, "capa.jpg"), alt: "", loading: "lazy" }) : null)); }
      // a categoria já é o estilo: só o cartão "Todos" lista as categorias que tem dentro
      const estilos = id === "todos" ? [...new Set(lista.map((m) => S.categorias[m.categoria] || nomeEstilo(m.estilo)))] : [];
      container.append(el("button", { type: "button", classe: "c-cat", "aria-pressed": comTodos ? String(S.cat === id) : null, onclick: () => irPara(id === "todos" ? "#/modelos" : "#/modelos/" + id) }, [
        mos, el("span", { classe: "txt" }, [el("span", { classe: "t-nome", texto: nome }), el("span", { classe: "t-peq", texto: lista.length ? plural(lista.length, "modelo", "modelos") + (estilos.length ? " · " + estilos.join(", ") : "") : "Nenhum modelo ainda" })])]));
    }
  }
  function modelosFiltrados() { return S.modelos.filter((m) => S.cat === "todos" || m.categoria === S.cat); }
  function desenhaModelos() {
    desenhaCats($("#cats"));
    const ul = $("#modelos"); ul.replaceChildren();
    const lista = modelosFiltrados();
    if (!lista.length) { ul.append(el("li", { classe: "t-peq c-dica", texto: "Nenhum modelo nesta categoria ainda." })); return; }
    for (const m of lista) {
      const mini = miniModelo(m, "mini");
      const b = el("button", { type: "button", classe: "c-mod", draggable: "true", "aria-pressed": String(!!(S.modelo && S.modelo.id === m.id)),
        "aria-label": `Usar o modelo ${m.nome}`, onclick: () => anexaModelo(m) }, [mini,
        el("span", { classe: "txt" }, [el("span", { classe: "t-nome", texto: m.nome }), el("span", { classe: "t-peq", texto: nomeEstilo(m.estilo) + (m.tem_codigo ? " · com a montagem" : "") })])]);
      b.addEventListener("mouseenter", () => mini._liga && mini._liga()); b.addEventListener("mouseleave", () => mini._desliga && mini._desliga());
      b.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", "modelo:" + m.id); e.dataTransfer.effectAllowed = "copy"; });
      ul.append(el("li", {}, b));
    }
  }
  function cardModelo(m) {
    const mid = miniModelo(m, "midia" + (m.formato === "horizontal" ? " horiz" : ""));
    const verCompleto = m.tem_exemplo ? () => tocaVideo(m.nome, modUrl(m, "exemplo.mp4"))
      : m.exemplo_url ? () => tocaVideo(m.nome, m.exemplo_url) : null;  // o vídeo inteiro dos modelos do painel fica no R2
    if (m.duracao) mid.append(el("span", { classe: "dur", texto: Math.round(m.duracao) + " s" }));
    let capa = mid;
    if (verCompleto) { capa = el("button", { type: "button", classe: "midia c-capa-btn" + (m.formato === "horizontal" ? " horiz" : ""), "aria-label": "Assistir " + m.nome, onclick: verCompleto }); capa.append(...mid.childNodes); capa._liga = mid._liga; capa._desliga = mid._desliga; }
    const card = el("div", { classe: "c-gal" }, [capa, el("div", { classe: "txt" }, [
      el("span", { classe: "selo", texto: S.categorias[m.categoria] || m.categoria }), el("div", { classe: "t-nome", texto: m.nome }),
      el("span", { texto: m.descricao || "" }), el("span", { classe: "t-peq", texto: [nomeEstilo(m.estilo), m.nicho, m.tem_codigo ? "com a montagem" : ""].filter(Boolean).join(" · ") }),
    ]), el("div", { classe: "acoes-linha" }, [el("button", { type: "button", classe: "btn btn-forte", texto: "Usar este modelo", onclick: () => usarModelo(m) }),
      verCompleto ? el("button", { type: "button", classe: "btn", texto: "Assistir", onclick: verCompleto })
      : m.url ? el("a", { classe: "btn", href: m.url, target: "_blank", rel: "noopener", texto: "Assistir" }) : null])]);
    card.addEventListener("mouseenter", () => capa._liga && capa._liga()); card.addEventListener("mouseleave", () => capa._desliga && capa._desliga());
    return card;
  }
  function desenhaGaleria() {
    desenhaCatsGrade($("#mod-cats"), true);
    const lista = modelosFiltrados();
    $("#mod-titulo").textContent = S.cat === "todos" ? "Todos os modelos" : S.categorias[S.cat] || S.cat;
    $("#mod-conta").textContent = plural(lista.length, "modelo", "modelos");
    const g = $("#galeria"); g.replaceChildren();
    if (!lista.length) { g.append(el("div", { classe: "c-vazio t-peq", texto: "Nenhum modelo nesta categoria ainda. Peça ao Claude para importar os seus vídeos como modelos." })); return; }
    for (const m of lista) g.append(cardModelo(m));
  }

  // ---------- entregas ----------
  async function carregaEntregas() {
    const d = await api("/api/v2/entregas"); S.entregas = d.entregas; S.numeros = d.numeros; return d;
  }
  function cardEntrega(e) {
    const src = arqDe(e.projeto, e.arquivo), local = { pid: e.projeto, rel: e.arquivo };
    const img = el("img", { src: capaDe(e), alt: "", loading: "lazy" });
    const capa = el("button", { type: "button", classe: "midia c-capa-btn", "aria-label": "Assistir " + nomeBonito(e.nome), onclick: () => tocaVideo(nomeBonito(e.nome), src, local) },
      [img, e.duracao ? el("span", { classe: "dur", texto: tempo(e.duracao) }) : null]);
    img.addEventListener("load", () => { if (img.naturalWidth > img.naturalHeight) capa.classList.add("horiz"); });  // vídeo deitado (YouTube)
    return el("div", { classe: "c-gal" }, [capa, el("div", { classe: "txt" }, [
      el("button", { type: "button", classe: "selo c-selo-btn", texto: e.nome_projeto, onclick: () => irPara("#/projeto/" + e.projeto) }), el("div", { classe: "t-nome c-quebra", texto: nomeBonito(e.nome), title: e.nome }),
      el("span", { classe: "t-peq", texto: [quando(e.quando), tamanho(e.tamanho)].filter(Boolean).join(" · ") }),
    ]), el("div", { classe: "acoes-linha" }, [
      el("button", { type: "button", classe: "btn btn-forte", texto: "Assistir", onclick: () => tocaVideo(nomeBonito(e.nome), src, local) }),
      el("button", { type: "button", classe: "btn", texto: "Mostrar na pasta", onclick: () => mostraNaPasta(e.projeto, e.arquivo) }),
      el("a", { classe: "btn", href: src, download: e.nome, texto: "Baixar" }),
    ])]);
  }
  function desenhaEntregas() {
    const n = S.numeros || { projetos: S.projetos.length, andando: vivos().length };
    $("#numeros").textContent = `${plural(n.projetos, "projeto", "projetos")} · ${plural(S.entregas.length, "vídeo entregue", "vídeos entregues")} · ${n.andando} em andamento`;
    const f = $("#filtro-entregas"); f.replaceChildren();
    const projs = S.projetos.map((p) => [p.id, p.nome]);
    for (const [id, nome] of [["todos", "Todos"], ...projs]) f.append(el("button", { type: "button", classe: "btn chip", "aria-pressed": String(S.filtroEntrega === id), texto: nome, onclick: () => irPara(id === "todos" ? "#/entregas" : "#/entregas/" + id) }));
    const g = $("#entregas"); g.replaceChildren();
    const lista = S.entregas.filter((e) => S.filtroEntrega === "todos" || e.projeto === S.filtroEntrega);
    if (!lista.length) { g.append(el("div", { classe: "c-vazio t-peq", texto: "Nenhum vídeo entregue ainda. O primeiro aparece aqui quando o Claude terminar." })); return; }
    for (const e of lista) g.append(cardEntrega(e));
  }
  function desenhaVideosProjeto() {
    const ul = $("#proj-videos"); ul.replaceChildren();
    const lista = S.entregas.filter((e) => e.projeto === S.atual);
    const todos = $("#proj-videos-todos"); todos.hidden = lista.length <= 6; todos.href = "#/entregas/" + S.atual;
    if (!lista.length) { ul.append(el("li", { classe: "t-peq c-dica", texto: "Nenhum vídeo pronto ainda. Quando o Claude entregar, ele aparece aqui." })); return; }
    for (const e of lista.slice(0, 6)) {
      ul.append(el("li", {}, el("button", { type: "button", classe: "c-mod c-vid", "aria-label": "Assistir " + nomeBonito(e.nome), onclick: () => tocaVideo(nomeBonito(e.nome), arqDe(e.projeto, e.arquivo), { pid: e.projeto, rel: e.arquivo }) }, [
        el("span", { classe: "mini" }, el("img", { src: capaDe(e), alt: "", loading: "lazy" })),
        el("span", { classe: "txt" }, [el("span", { classe: "t-nome", texto: nomeBonito(e.nome) }), el("span", { classe: "t-peq", texto: [quando(e.quando), tempo(e.duracao)].filter(Boolean).join(" · ") })])])));
    }
  }
  const fechaLateral = () => { const l = $("#lateral"), b = $("#abre-lateral"); if (l) l.classList.remove("aberta"); if (b) b.setAttribute("aria-expanded", "false"); };

  // ---------- chat ----------
  // ---------- linguagem simples: o técnico fica escondido, inglês não aparece solto ----------
  const RX_EN = /\b(the|and|with|from|for|to|of|in|on|check|checking|run|running|render|rendering|create|build|update|install|fix|read|write|make|get|set|move|list|find|generate|extract|convert|verify|test|start|stop|wait|open|save|let|now|frames?|loudness|audio|video|file|files|final|output|scene|scenes)\b/gi;
  const RX_PT = /[ãõçáéíóúâêôà]|\b(o|a|os|as|de|do|da|dos|das|e|em|no|na|nos|nas|para|pra|com|um|uma|que|cena|cenas|voz|legenda|conferindo|gerando|montando|baixando|criando|ajustando|testando|instalando|lendo|olhando)\b/gi;
  const emPortugues = (s) => { s = String(s || "").trim(); return !!s && (s.match(RX_PT) || []).length >= (s.match(RX_EN) || []).length; };
  // passos antigos do histórico vinham como "Rodando: <comando ou frase em inglês>"
  const passoSimples = (t) => { const s = String(t || "").replace(/^Rodando:\s*/, "").trim(); return emPortugues(s) ? s : "Trabalhando no vídeo"; };
  function msgClaude(texto) {
    // o Claude põe o técnico depois de uma linha "Detalhes:" (volume, voz, créditos): fica num "Ver detalhes"
    const t = String(texto || ""), i = t.search(/^[ \t]*\**detalhes\**[ \t]*:/im);
    const principal = (i >= 0 ? t.slice(0, i) : t).trim();
    const tecnico = i >= 0 ? t.slice(i).replace(/^[ \t]*\**detalhes\**[ \t]*:\**[ \t]*/i, "").trim() : "";
    const corpo = [];
    if (principal) corpo.push(emPortugues(principal) ? markdown(principal)
      : el("details", { classe: "c-copy" }, [el("summary", { texto: "Ver nota técnica" }), markdown(principal)]));
    if (tecnico) corpo.push(el("details", { classe: "c-copy" }, [el("summary", { texto: "Ver detalhes" }), markdown(tecnico)]));
    return el("div", { classe: "c-msg claude" }, [el("div", { classe: "quem", texto: ehCodex() ? "CHATGPT" : "CLAUDE" }), ...corpo]);
  }

  function desenhaMsgs() {
    const box = $("#msgs"); const noFim = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    box.replaceChildren();
    const pedidosAbertos = new Set(S.pedidos.map((p) => p.n));
    let grupo = null;
    const fechaGrupo = () => { grupo = null; };
    S.msgs.forEach((m, i) => {
      if (m.quem === "ferramenta") {
        if (!m.texto) return;
        if (!grupo) {
          const vivo = S.estado === "trabalhando" && !S.msgs.slice(i + 1).some((x) => x.quem === "claude" || x.quem === "eu");
          grupo = { n: 0, ul: el("ul"), sum: el("summary"), ultimo: el("div", { classe: "ultimo" }), vivo };
          const d = el("details", { classe: "c-passos" }, [grupo.sum, grupo.ul, grupo.ultimo]); box.append(d);
        }
        const passo = passoSimples(m.texto);
        grupo.n++; grupo.ul.append(el("li", { texto: passo })); grupo.ultimo.textContent = passo;
        grupo.sum.replaceChildren(grupo.vivo ? el("span", { classe: "c-girando", "aria-hidden": "true" }) : "", el("span", { texto: grupo.vivo ? "Trabalhando" : "Passos" }), el("span", { classe: "t-peq", texto: `· ${grupo.n} passo${grupo.n > 1 ? "s" : ""}` }));
        return;
      }
      fechaGrupo();
      if (m.quem === "eu") {
        const b = el("div", { classe: "c-msg eu" }, [el("div", { classe: "quem", texto: "VOCÊ" })]);
        if (m.pronto) {
          const pr = m.pronto, chips = ["Novo vídeo", pr.estilo || "Estilo: o Claude sugere", pr.copy ? "Texto seu" : "", pr.storyboard ? `Desenho das cenas seu · ${pr.animar === "imagem" ? "animar a imagem" : "recriar animado"}` : ""].filter(Boolean);
          b.append(el("div", { classe: "c-pronto" }, chips.map((x) => el("span", { texto: x }))));
        }
        if (m.texto) b.append(markdown(m.texto));
        if (m.pronto && m.pronto.copy_txt) b.append(el("details", { classe: "c-copy" }, [el("summary", { texto: "Ver o texto" }), el("p", { texto: m.pronto.copy_txt })]));
        if (m.pronto && ((m.pronto.respostas || []).length || m.pronto.voz)) b.append(el("details", { classe: "c-copy" }, [el("summary", { texto: "Ver o pedido" }),
          el("dl", { classe: "c-pedido-dl" }, [...(m.pronto.respostas || []), ...(m.pronto.voz ? [["Voz", m.pronto.voz]] : [])].flatMap(([k, v]) => [el("dt", { texto: k }), el("dd", { texto: v })]))]));
        (m.anexos || []).forEach((a) => b.append(el("span", { classe: "c-anexo-chip", texto: a.split("/").pop() })));
        if (m.modelo) b.append(el("span", { classe: "c-anexo-chip", texto: "Modelo: " + m.modelo.nome }));
        box.append(b);
      } else if (m.quem === "claude") {
        box.append(msgClaude(m.texto));
      } else if (m.quem === "permissao") {
        const aberto = pedidosAbertos.has(m.pedido);
        const card = el("div", { classe: "c-perm" + (aberto ? "" : " feito") }, [
          el("div", { classe: "t-nome", texto: "O Claude quer: " + (emPortugues(m.texto) ? String(m.texto).replace("Rodar FORA da área isolada (acesso total ao computador)", "Mexer fora da pasta de trabalho (no computador todo)") : "rodar um comando") }),
          // o comando fica a um toque (quem quiser confere); o que mexe fora da pasta de trabalho já abre mostrando
          m.detalhe ? el("details", { classe: "c-copy", open: /fora da pasta|FORA da área/.test(m.texto || "") ? true : null }, [el("summary", { texto: "Ver o comando" }), el("pre", { texto: m.detalhe })]) : null,
        ]);
        if (aberto) {
          const decide = async (d) => { try { await post(`/api/v2/permissao/${m.pedido}`, { decisao: d }); atualiza(); } catch (e) { aviso(e.message, true); } };
          card.append(el("div", { classe: "acoes-linha" }, [
            el("button", { type: "button", classe: "btn btn-principal", texto: "Permitir", onclick: () => decide("permitir") }),
            m.sempre ? el("button", { type: "button", classe: "btn", texto: "Permitir sempre neste projeto", onclick: () => decide("sempre") }) : null,
            el("button", { type: "button", classe: "btn", texto: "Negar", onclick: () => decide("negar") }),
            S.autonomoPode && !S.autonomo ? el("button", { type: "button", classe: "btn", texto: "Permitir e trabalhar sozinho daqui pra frente", onclick: async () => { await decide("permitir"); ligaAutonomo(true); } }) : null,
          ]));
        } else card.append(el("span", { classe: "t-peq", texto: "Respondido." }));
        box.append(card);
      } else if (m.quem === "pergunta") {
        const respondida = S.msgs.slice(i + 1).some((x) => x.quem === "eu");
        const card = el("div", { classe: "c-perg" + (respondida ? " feito" : "") }, [el("div", { classe: "t-nome", texto: m.texto })]);
        if (!respondida) {
          card.append(el("div", { classe: "acoes-linha" }, (m.opcoes || []).map((op, k) =>
            el("button", { type: "button", classe: "btn" + (k === 0 ? " btn-principal" : ""), texto: op, onclick: async () => {
              try { await post(`/api/v2/projeto/${S.atual}/mensagem`, { texto: op, anexos: [] }); S.forcarFim = true; await atualiza(); } catch (e) { aviso(e.message, true); }
            } }))));
          card.append(el("p", { classe: "t-peq", texto: "Ou escreva a sua resposta embaixo." }));
        }
        box.append(card);
      } else box.append(el("div", { classe: "c-sist", texto: m.texto }));
    });
    if (noFim || S.forcarFim) { box.scrollTop = box.scrollHeight; S.forcarFim = false; }
  }
  const EST = { andando: "Fazendo", esperando: "Esperando você", feito: "Pronto" };
  function desenhaEtapas(et) {
    const ol = $("#etapas"); ol.replaceChildren();
    let previa = null;
    const nomes = et.tipo === "capa" ? ETAPA_NOME_CAPA : ETAPA_NOME;
    for (const k of Object.keys(nomes)) {
      if (k === "capa" && et.tipo !== "capa" && !et.capa) continue;  // a capa só aparece depois que o Claude oferece
      const it = et[k] || {};
      const li = el("li", { classe: "c-etapa " + (it.estado || "") }, [el("span", { classe: "ponto", "aria-hidden": "true" }), el("div", {}, [
        el("div", { classe: "t-nome", texto: nomes[k] + (it.estado ? " · " + EST[it.estado] : "") }),
        it.msg ? el("div", { classe: "t-peq", texto: it.msg }) : null,
        it.arquivo ? el("a", { href: arq(it.arquivo), target: "_blank", rel: "noopener", classe: "t-peq", title: it.arquivo.split("/").pop(),
          texto: /\.(png|jpe?g|webp|gif)$/i.test(it.arquivo) ? "Ver a imagem" : /\.(mp4|mov|webm)$/i.test(it.arquivo) ? "Ver o vídeo"
            : /\.(wav|mp3|m4a)$/i.test(it.arquivo) ? "Ouvir" : /\.(md|txt|pdf)$/i.test(it.arquivo) ? "Ler" : "Abrir o arquivo" }) : null,
      ])]);
      ol.append(li);
      if (it.arquivo && /\.(png|jpe?g|webp|gif|mp4|mov|webm)$/i.test(it.arquivo)) previa = it.arquivo;
    }
    const box = $("#previa");
    if (previa && box.dataset.atual !== previa + (et[et.atual] || {}).quando) {
      box.dataset.atual = previa + (et[et.atual] || {}).quando;
      box.replaceChildren(/\.(mp4|mov|webm)$/i.test(previa) ? el("video", { src: arq(previa), controls: true, playsinline: true, preload: "metadata" }) : el("img", { src: arq(previa) + "&v=" + Date.now(), alt: "Prévia do vídeo" }));
    } else if (!previa && !box.dataset.vazio) { box.dataset.vazio = "1"; box.replaceChildren(el("p", { classe: "t-peq", texto: "A prévia aparece aqui quando o Claude tiver o primeiro quadro." })); }
  }
  function desenhaStatus() {
    const st = $("#status"), ativo = S.estado === "trabalhando" || S.estado === "permissao" || S.estado === "na fila";
    st.hidden = !ativo;
    if (!ativo) return;
    $("#status-txt").textContent = S.estado === "permissao" ? "Esperando a sua permissão" : S.estado === "na fila" ? "Na fila" : (ehCodex() ? "ChatGPT trabalhando" : "Claude trabalhando") + (S.modelo ? " · " + S.modelo : "");
    const ult = [...S.msgs].reverse().find((m) => m.quem === "ferramenta" && m.texto);
    const seg = S.desde ? Math.floor(Date.now() / 1000 - S.desde) : 0;
    $("#status-tempo").textContent = (ult ? passoSimples(ult.texto) + " · " : "") + (S.desde ? `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, "0")}` : "");
  }

  async function abre(pid) {
    if (S.atual !== pid) {
      S.atual = pid; S.ultimoN = 0; S.msgs = []; S.pedidos = []; S.forcarFim = true; S.modelo = null; S.anexos = []; desenhaAnexados();
      $("#previa").dataset.atual = ""; delete $("#previa").dataset.vazio; $("#texto").value = ""; autoAltura();
      try { localStorage.setItem("painel-projeto", pid); } catch (_) {}
    }
    const p = S.projetos.find((x) => x.id === pid);
    if (p) { $("#titulo-projeto").textContent = p.nome; $("#sub-projeto").textContent = (p.marca && p.marca.handle) || ""; document.documentElement.style.setProperty("--marca", corDe(p)); }
    desenhaModelos(); desenhaVideosProjeto();
    if (S.modeloPendente) { const m = S.modeloPendente; S.modeloPendente = null; anexaModelo(m); }
    fechaLateral();
    try { await atualiza(); } catch (e) { aviso(e.message, true); }
    document.title = ($("#titulo-projeto").textContent || "Projeto") + " · Edição com IA";
    if (matchMedia("(min-width: 761px)").matches) $("#texto").focus();
  }
  async function atualiza() {
    if (!S.atual) return;
    const d = await api(`/api/v2/projeto/${S.atual}?desde=${S.ultimoN}`);
    if (d.chat.length) { S.msgs.push(...d.chat); S.ultimoN = d.chat[d.chat.length - 1].n; }
    S.pedidos = d.pedidos; S.estado = d.estado; S.desde = d.desde; S.modelo = d.modelo || "";
    $("#titulo-projeto").textContent = d.projeto.nome; $("#sub-projeto").textContent = d.marca.handle || "";
    document.documentElement.style.setProperty("--marca", hexOk(d.marca.acento) ? d.marca.acento : "#F2C200");
    S.marca = d.marca;
    desenhaMsgs(); desenhaEtapas(d.etapas || {}); desenhaStatus();
  }
  async function atualizaGeral() {
    const d = await api("/api/v2/estado");
    S.projetos = d.projetos; S.catalogo = d.catalogo; S.instalados = d.instalados; S.pasta = d.pasta || "";
    S.autonomo = !!d.autonomo; S.autonomoPode = !!d.autonomo_pode; desenhaAutonomo();
    desenhaConta(d.claude); desenhaNav();
    if (!$("#tela-inicio").hidden) desenhaPrimeiros();
    recebeAtualizacao(d.atualizacao || {});
    return d;
  }

  // ---------- atualização do painel (faixa no Início) ----------
  const vCurta = (v) => { const p = String(v || "").split("."); return p.length === 3 && p[2] === "0" ? p.slice(0, 2).join(".") : p.join("."); };
  const TRAVA_RELIGOU = ["O painel foi religado", "A chave desta aba venceu. Dê dois cliques em \"Abrir Painel\" na sua pasta de trabalho para abrir de novo."];
  function recebeAtualizacao(a) {
    // o painel voltou numa versão diferente: recarrega para pegar a página nova
    if (S.versao && a.atual && a.atual !== S.versao) { location.reload(); return; }
    S.versao = a.atual || S.versao; S.atualizacao = a; S.foraDoAr = 0;
    if (a.andamento && a.andamento.estado === "erro") S.atualizando = false;
    if (a.recem && !S.recemVisto) { S.recemVisto = true; aviso(`Painel atualizado para a versão ${vCurta(a.recem)}.`); }
    desenhaFaixa(); desenhaTopoAtualizar();
  }
  // o aviso de versão nova também na barra de cima: a faixa só existe no Início, e quem estava num projeto não via nada
  function desenhaTopoAtualizar() {
    const b = $("#topo-atualizar"); if (!b) return;
    const a = S.atualizacao || {};
    const mostra = !!a.nova && !S.atualizando && !a.andamento && !S.foraDoAr;
    b.hidden = !mostra;
    if (!mostra) return;
    b.replaceChildren("Atualizar", el("span", { classe: "v", texto: `para ${vCurta(a.nova)}` }));  // o botão já põe o espaço (gap); no celular fica só "Atualizar"
    b.title = a.notas || "Versão nova do painel";
    b.onclick = () => { irPara("#/"); atualizarPainel(); };
  }
  const linhaFaixa = (titulo, sub) => el("span", { classe: "txt" }, [el("span", { classe: "t-nome", texto: titulo }), sub ? el("span", { classe: "t-peq", texto: sub }) : null]);
  const girando = () => el("span", { classe: "c-girando", "aria-hidden": "true" });
  function desenhaFaixa() {
    const f = $("#ini-atualizacao"); if (!f) return;
    const a = S.atualizacao || {}, an = a.andamento;
    // só redesenha quando muda alguma coisa (senão o botão some debaixo do clique a cada ciclo)
    const chaveF = JSON.stringify([S.foraDoAr > 40, S.foraDoAr > 0, an, S.atualizando, a.nova, a.notas]);
    if (chaveF === S.faixaDesenhada) return; S.faixaDesenhada = chaveF;
    f.replaceChildren(); f.classList.remove("erro"); f.hidden = false;
    if (S.foraDoAr) {
      if (S.foraDoAr > 40) { f.classList.add("erro"); f.append(linhaFaixa("O painel não voltou sozinho", "Dê dois cliques em \"Abrir Painel\" dentro da sua pasta de trabalho.")); }
      else f.append(girando(), linhaFaixa("Religando o painel…", "A página recarrega sozinha quando ele voltar."));
      return;
    }
    if (an && an.estado === "erro") {
      f.classList.add("erro");
      f.append(linhaFaixa("A atualização não terminou", an.msg || ""),
               a.nova ? el("button", { type: "button", classe: "btn chip", texto: "Tentar de novo", onclick: atualizarPainel }) : null);
      return;
    }
    if (S.atualizando || an) {
      f.append(girando(), linhaFaixa(an ? an.msg : "Começando a atualização…", "Seus projetos, modelos e marca ficam como estão."));
      return;
    }
    if (!a.nova) { f.hidden = true; return; }
    f.append(linhaFaixa(`Versão ${vCurta(a.nova)} disponível`, a.notas || "Melhorias no painel e nos estilos."),
             el("button", { type: "button", classe: "btn chip", texto: "Atualizar agora", onclick: atualizarPainel }));
  }
  async function atualizarPainel() {
    if (S.atualizando) return;
    S.atualizando = true; S.atualizacao.andamento = null; desenhaFaixa(); desenhaTopoAtualizar();
    try { await post("/api/v2/atualizar"); }
    catch (e) { S.atualizando = false; S.atualizacao.andamento = { estado: "erro", msg: e.message }; desenhaFaixa(); desenhaTopoAtualizar(); return; }
    vigiaAtualizacao();
  }
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  async function vigiaAtualizacao() {
    // acompanha de perto: o andamento na faixa, "religando" enquanto o servidor troca, e recarrega quando ele volta na versão nova
    while (S.atualizando) {
      await espera(1500);
      try { const d = await api("/api/v2/estado"); recebeAtualizacao(d.atualizacao || {}); }
      catch (e) {
        if (e.status === 401) return trava(...TRAVA_RELIGOU);
        if (e.status === 0) { S.foraDoAr++; if (S.foraDoAr > 40) S.atualizando = false; desenhaFaixa(); }
      }
    }
  }
  // redesenha a tela aberta com os dados novos (chamado pelo ciclo geral)
  const assinatura = () => JSON.stringify([S.projetos.map((p) => [p.id, p.nome, p.estado, p.ultima, p.videos, p.etapa, p.marca]), S.entregas.map((e) => e.projeto + e.arquivo + e.quando + e.duracao)]);
  function redesenhaTela() {
    const a = assinatura(); if (a === S.assin) return; S.assin = a;
    if (S.tela === "inicio") desenhaInicio();
    else if (S.tela === "projetos") desenhaListaProjetos();
    else if (S.tela === "entregas") desenhaEntregas();
    else if (S.tela === "projeto") desenhaVideosProjeto();
  }

  // ---------- escrever, anexar, gravar ----------
  function autoAltura() { const t = $("#texto"); t.style.height = "auto"; t.style.height = Math.min(220, t.scrollHeight) + "px"; }
  function desenhaAnexados() {
    const box = $("#anexados"); box.replaceChildren();
    if (S.modelo) box.append(el("button", { type: "button", classe: "c-modelo-chip", "aria-label": "Tirar o modelo " + S.modelo.nome, texto: "Modelo: " + S.modelo.nome + " ✕", onclick: () => { S.modelo = null; desenhaModelos(); desenhaAnexados(); } }));
    S.anexos.forEach((a, i) => box.append(el("button", { type: "button", classe: "c-anexo-chip", "aria-label": "Tirar " + a, texto: a.split("/").pop() + " ✕", onclick: () => { S.anexos.splice(i, 1); desenhaAnexados(); } })));
  }
  async function sobe(url, corpo, tipo) {
    const r = await fetch(url, { method: "POST", headers: { "X-Painel-Chave": chave, "Content-Type": tipo || "application/octet-stream" }, body: corpo });
    let d = {}; try { d = await r.json(); } catch (_) {}
    if (!r.ok) throw new Error(d.erro || "O envio falhou.");
    return d;
  }
  async function anexa(files) {
    for (const f of files) {
      try { aviso("Enviando " + f.name + "…"); const d = await sobe(`/api/v2/projeto/${S.atual}/anexo?nome=${encodeURIComponent(f.name)}`, f); S.anexos.push(d.arquivo); desenhaAnexados(); aviso(f.name + " anexado."); }
      catch (e) { aviso(e.message, true); }
    }
  }
  async function enviar(ev) {
    ev && ev.preventDefault();
    const t = $("#texto"), texto = t.value.trim();
    if (!texto && !S.anexos.length && !S.modelo) return;
    $("#enviar").disabled = true;
    try { await post(`/api/v2/projeto/${S.atual}/mensagem`, { texto, anexos: S.anexos, modelo: S.modelo ? S.modelo.id : null }); t.value = ""; S.anexos = []; S.modelo = null; desenhaAnexados(); desenhaModelos(); autoAltura(); S.forcarFim = true; await atualiza(); }
    catch (e) { aviso(e.message, true); }
    finally { $("#enviar").disabled = false; }
  }
  async function audio() {
    const b = $("#btn-audio");
    if (S.gravando) { S.gravando.stop(); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (_) { return aviso("Não consegui usar o microfone. Permita o acesso no navegador.", true); }
    const partes = [], rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => e.data.size && partes.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop()); S.gravando = null; b.setAttribute("aria-pressed", "false"); b.setAttribute("aria-label", "Gravar áudio");
      aviso("Transcrevendo o áudio…");
      try {
        const d = await sobe(`/api/v2/projeto/${S.atual}/audio`, new Blob(partes, { type: rec.mimeType || "audio/webm" }), "audio/webm");
        const t = $("#texto"); t.value = (t.value ? t.value.trim() + " " : "") + d.texto; autoAltura(); t.focus();
        aviso("Pronto. Confira o texto e envie.");
      } catch (e) { aviso(e.message, true); }
    };
    rec.start(); S.gravando = rec; b.setAttribute("aria-pressed", "true"); b.setAttribute("aria-label", "Parar de gravar");
    aviso("Gravando… toque de novo para parar.");
  }

  // ---------- novo projeto e marca ----------
  function abreNovo() { try { $("#modal-escolhe").close(); } catch (_) {} $("#modal-novo").returnValue = ""; $("#novo-nome").value = ""; $("#modal-novo").showModal(); $("#novo-nome").focus(); }
  async function criaProjeto(e) {
    e.preventDefault(); const nome = $("#novo-nome").value.trim(); if (!nome) return;
    try { const r = await post("/api/v2/projetos", { nome }); $("#modal-novo").close("criado"); await atualizaGeral(); irPara("#/projeto/" + r.id); setTimeout(abreMarca, 400); }
    catch (er) { aviso(er.message, true); }
  }
  function abreMarca() {
    const m = S.marca || {};
    $("#mm-nome").value = m.nome || ""; $("#mm-handle").value = (m.handle || "").replace(/^@/, "");
    $("#mm-cor").value = hexOk(m.acento) ? m.acento : "#F2C200"; $("#mm-cor-hex").value = $("#mm-cor").value.toUpperCase();
    const mini = $("#mm-logo-mini"); mini.replaceChildren(); if (m.logo) mini.append(el("img", { src: arq(m.logo) + "&v=" + Date.now(), alt: "Logo" }));
    desenhaCapasRef();
    $("#mm-status").textContent = ""; $("#modal-marca").showModal();
  }
  // "Capas que deram certo": até 3; o Claude usa como modelo das capas (skill capas-com-ia)
  function desenhaCapasRef() {
    const box = $("#mm-capas"); if (!box) return;
    box.replaceChildren();
    const capas = ((S.marca && S.marca.capas) || []).filter((c) => typeof c === "string");
    for (const c of capas) {
      box.append(el("figure", { classe: "capa-ref" }, [
        el("img", { src: arq(c) + "&v=" + Date.now(), alt: "Capa de referência", loading: "lazy" }),
        el("button", { type: "button", classe: "btn", texto: "Tirar", "aria-label": "Tirar esta capa", onclick: async () => {
          try { await post(`/api/v2/projeto/${S.atual}/capa-ref-tirar`, { arquivo: c }); await atualiza(); desenhaCapasRef(); $("#mm-status").textContent = "Capa tirada."; }
          catch (er) { $("#mm-status").textContent = er.message; }
        } }),
      ]));
    }
    if (!capas.length) box.append(el("p", { classe: "t-peq vazio", texto: "Nenhuma ainda. Sem elas, o Claude usa o modelo do painel." }));
    $("#mm-btn-capa").hidden = capas.length >= 3;
  }
  async function salvaMarca() {
    try {
      await post(`/api/v2/projeto/${S.atual}/marca`, { nome: $("#mm-nome").value, handle: $("#mm-handle").value.replace(/^@+/, ""), acento: $("#mm-cor-hex").value.toUpperCase(), legenda: (S.marca && S.marca.legenda) || "anton" });
      $("#mm-status").textContent = "Marca salva."; await atualiza(); await atualizaGeral();
      if (S.fluxoPrimeiro) $("#modal-marca").close();  // primeiro vídeo: da marca segue direto para o assistente
    } catch (e) { $("#mm-status").textContent = e.message; }
  }

  // ---------- trabalhar sozinho (só o perigoso pede permissão) ----------
  function desenhaAutonomo() {
    const b = $("#btn-autonomo"); if (!b) return;
    b.hidden = !S.autonomoPode; b.setAttribute("aria-pressed", String(!!S.autonomo));
    b.querySelector("span").textContent = S.autonomo ? "Trabalhando sozinho" : "Trabalhar sozinho";
    b.title = S.autonomo ? "Ligado: o Claude trabalha sem parar para pedir licença. Ele só pergunta antes do que é arriscado, como apagar vídeos ou projetos. Toque para desligar."
      : "Desligado: o Claude pede a sua licença antes de comandos fora do comum. Toque para ele trabalhar sozinho e só perguntar o que é arriscado.";
    $("#ajuda-env").textContent = S.autonomo ? "Enter manda · Shift+Enter pula linha · Trabalhando sozinho: ele só pede licença para o que é arriscado."
      : "Enter manda · Shift+Enter pula linha · Antes de algo arriscado, o Claude pede licença aqui no chat.";
  }
  async function ligaAutonomo(ligar) {
    try { const r = await post("/api/v2/autonomo", { ligar }); S.autonomo = !!r.autonomo; desenhaAutonomo(); desenhaMsgs();
      aviso(S.autonomo ? "Trabalhando sozinho: o Claude só vai pedir permissão para o que é perigoso." : "Pronto: comandos fora do comum voltam a pedir a sua permissão."); await atualiza(); }
    catch (e) { aviso(e.message, true); }
  }

  // ---------- novo vídeo: assistente em 3 passos (tipo de vídeo → o que o Claude vai usar → conferir e começar) ----------
  // Os campos de cada estilo vêm do estilos.json (os mesmos do pedido do painel). O que a pessoa já tem pronto (texto, storyboard)
  // continua opcional no passo 2.
  const NV = { passo: 1, estilo: null, campos: {}, envios: {}, voz: "", sb: [], animar: "recriar" };  // estilo: null = nada escolhido, "" = "Não sei ainda"
  const estiloNV = () => (NV.estilo && S.catalogo.estilos.find((e) => e.id === NV.estilo)) || null;
  const temVoz = (e) => !e || !!e.voz;  // "o Claude sugere" pode acabar num estilo com narração
  const nomeCurto = (rel) => String(rel || "").split("/").pop().replace(/^\d{8}-\d{6}-/, "");

  function midiaEstilo(e) {
    // 1) a prévia do estilo; 2) a prévia do primeiro modelo daquele estilo; 3) a "prévia viva" com a frase de amostra
    const caixa = el("span", { classe: "c-assist-midia", "aria-hidden": "true" });
    const mod = S.modelos.find((m) => m.estilo === e.id && m.tem_previa);
    const src = e.previa ? e.previa + ".mp4" : mod ? modUrl(mod, "previa.mp4") : "";
    const poster = e.previa ? e.previa + ".jpg" : mod ? modUrl(mod, "capa.jpg") : "";
    if (src) {
      const v = el("video", { src, poster, muted: true, loop: true, playsinline: true, preload: "none" });
      v.muted = true; caixa.append(v);
      caixa._liga = () => { if (!pouco) v.play().catch(() => {}); };
      caixa._desliga = () => { v.pause(); };
    } else {
      const palavras = e.amostra || ["Seu", "vídeo"];
      caixa.append(el("span", { classe: "amostra" }, [el("span", { classe: "silhueta" }),
        el("span", { classe: "leg leg-anton" }, palavras.map((p, i) => el("span", { classe: /claude/i.test(p) ? "chave" : "", texto: (i ? " " : "") + p })))]));
    }
    return caixa;
  }

  function cartaoEstilo(e) {
    const sel = NV.estilo === (e ? e.id : "");
    const inst = !e || S.instalados.includes(e.id);
    const b = el("button", { type: "button", role: "radio", "aria-checked": String(sel), classe: "c-assist-est" + (e ? "" : " sugere"),
      onclick: () => { NV.estilo = e ? e.id : ""; NV.campos = {}; NV.envios = {}; $("#nv-status").textContent = ""; desenhaNV(); } }, e ? [
      midiaEstilo(e),
      el("span", { classe: "txt" }, [el("span", { classe: "t-nome", texto: e.nome }), el("span", { classe: "t-peq", texto: e.resumo || "" }),
        el("span", { classe: "c-assist-precisa", texto: "Você manda: " + (e.precisa || "o material") }),
        inst ? null : el("span", { classe: "c-assist-inst", texto: "Instala no 1º uso" })]),
    ] : [el("span", { classe: "txt" }, [el("span", { classe: "t-nome", texto: "Não sei ainda" }),
      el("span", { classe: "t-peq", texto: "Conte o que você quer e mande o material. O Claude sugere o estilo e pergunta antes de começar." })])]);
    const m = b.querySelector(".c-assist-midia");
    if (m) {
      b.addEventListener("mouseenter", () => m._liga && m._liga()); b.addEventListener("mouseleave", () => !sel && m._desliga && m._desliga());
      b.addEventListener("focus", () => m._liga && m._liga()); b.addEventListener("blur", () => !sel && m._desliga && m._desliga());
      if (sel) requestAnimationFrame(() => m._liga && m._liga());
    }
    return b;
  }

  function desenhaPasso1() {
    // um bloco só (cabe na tela sem rolar): os estilos na ordem do catálogo e, no fim, "Não sei ainda"
    const box = $("#nv-estilos"); box.replaceChildren();
    const grade = el("div", { classe: "c-assist-grade", role: "radiogroup", "aria-labelledby": "nv-p1-t" });
    for (const e of S.catalogo.estilos.filter((x) => !x.em_breve)) grade.append(cartaoEstilo(e));
    grade.append(cartaoEstilo(null));
    box.append(grade);
  }

  function campoNV(c) {
    const id = "nv-c-" + c.id, opc = c.obrigatorio ? null : el("span", { classe: "t-peq", texto: " (opcional)" });
    // c.link: um link junto da ajuda (ex.: criar conta no Higgsfield); só https, vindo do estilos.json
    const lk = c.link && /^https:\/\//.test(c.link.url || "") ? el("a", { href: c.link.url, target: "_blank", rel: "noopener", texto: c.link.texto || c.link.url }) : null;
    const dica = c.ajuda || lk ? el("p", { classe: "t-peq", id: id + "-dica" }, [c.ajuda || "", lk && c.ajuda ? " " : "", lk]) : null;
    const desc = dica ? id + "-dica" : null;
    if (c.tipo === "escolha") {
      if (NV.campos[c.id] === undefined && c.obrigatorio && c.opcoes.length) NV.campos[c.id] = c.opcoes[0].valor;
      const grupo = el("div", { classe: "filtros", role: "radiogroup", "aria-labelledby": id + "-t", "aria-describedby": desc });
      for (const o of c.opcoes) grupo.append(el("button", { type: "button", role: "radio", classe: "btn chip", "aria-checked": String(NV.campos[c.id] === o.valor),
        "aria-pressed": String(NV.campos[c.id] === o.valor), texto: o.nome, onclick: () => { NV.campos[c.id] = NV.campos[c.id] === o.valor && !c.obrigatorio ? "" : o.valor; desenhaNV(); } }));
      return el("div", { classe: "campo", "data-campo": c.id }, [el("span", { classe: "rotulo", id: id + "-t" }, [c.rotulo, opc]), grupo, dica]);
    }
    if (c.tipo === "arquivo") {
      const env = NV.envios[c.id] || {};
      const inp = el("input", { type: "file", id, hidden: true, accept: c.aceita === "imagem" ? "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" : "video/*,audio/*,.mp4,.mov,.mkv,.webm,.m4a,.mp3,.wav" });
      inp.addEventListener("change", () => { if (inp.files[0]) sobeCampo(c, inp.files[0]); inp.value = ""; });
      const zona = el("button", { type: "button", classe: "c-solta" + (env.arquivo ? " ok" : ""), "aria-describedby": desc, onclick: () => inp.click() }, [
        el("strong", { texto: env.arquivo ? nomeCurto(env.arquivo) : env.pct !== undefined ? `Enviando… ${env.pct}%` : "Escolher o arquivo" }),
        el("span", { classe: "t-peq", texto: env.arquivo ? "Pronto. Toque para trocar." : env.pct !== undefined ? env.nome : "Ou arraste o arquivo para cá. Arquivos grandes podem levar alguns minutos." }),
      ]);
      if (env.pct !== undefined && !env.arquivo) zona.append(el("span", { classe: "c-prog fina" }, el("i", { style: `width:${env.pct}%` })));
      zona.addEventListener("dragover", (ev) => { ev.preventDefault(); zona.classList.add("sobre"); });
      zona.addEventListener("dragleave", () => zona.classList.remove("sobre"));
      zona.addEventListener("drop", (ev) => { ev.preventDefault(); zona.classList.remove("sobre"); const f = ev.dataTransfer.files[0]; if (f) sobeCampo(c, f); });
      return el("div", { classe: "campo", "data-campo": c.id }, [el("span", { classe: "rotulo" }, [c.rotulo, opc]), zona, inp, dica]);
    }
    const longo = c.tipo === "texto" && (c.linhas > 1 || (c.max || 0) > 400);
    const ent = el(longo ? "textarea" : "input", { classe: "entrada", id, maxlength: c.max || (c.tipo === "link" ? 500 : 1000), "aria-describedby": desc,
      type: longo ? null : c.tipo === "link" ? "url" : "text", rows: longo ? String(c.linhas || 3) : null,
      placeholder: c.tipo === "link" ? "https://…" : null, required: c.obrigatorio ? true : null });
    ent.value = NV.campos[c.id] || "";
    ent.addEventListener("input", () => { NV.campos[c.id] = ent.value; ent.removeAttribute("aria-invalid"); });
    return el("div", { classe: "campo", "data-campo": c.id }, [el("label", { for: id }, [c.rotulo, opc]), ent, dica]);
  }

  function desenhaPasso2() {
    const e = estiloNV(), box = $("#nv-campos"); box.replaceChildren();
    $("#nv-p2-t").textContent = e ? `${e.nome}: preencha o que o Claude precisa. Os campos com "(opcional)" podem ficar em branco.`
      : "Conte o que você quer e, se tiver, mande o material. O Claude sugere o estilo antes de começar.";
    if (e) for (const c of e.campos || []) if (c.id !== "observacao") box.append(campoNV(c));
    if (!e) {
      const ent = el("textarea", { classe: "entrada", id: "nv-c-pedido", rows: "4", maxlength: "2000", placeholder: "Ex.: um vídeo curto explicando o meu produto, com a minha marca." });
      ent.value = NV.campos.pedido || ""; ent.addEventListener("input", () => { NV.campos.pedido = ent.value; ent.removeAttribute("aria-invalid"); });
      box.append(el("div", { classe: "campo", "data-campo": "pedido" }, [el("label", { for: "nv-c-pedido", texto: "O que você quer?" }), ent]));
    }
    // texto e storyboard prontos só fazem sentido em vídeo narrado (os estilos de edição usam a gravação da pessoa)
    $("#nv-ja-tenho").hidden = !temVoz(e);
    const tc = $("#nv-tem-copy").getAttribute("aria-pressed") === "true", ts = $("#nv-tem-sb").getAttribute("aria-pressed") === "true";
    $("#nv-copy-box").hidden = !tc; $("#nv-sb-box").hidden = !ts;
    const l = $("#nv-sb-lista"); l.replaceChildren();
    NV.sb.forEach((a, i) => l.append(el("button", { type: "button", classe: "c-anexo-chip", "aria-label": "Tirar " + nomeCurto(a), texto: nomeCurto(a) + " ✕", onclick: () => { NV.sb.splice(i, 1); desenhaNV(); } })));
    for (const b of document.querySelectorAll("#nv-animar .btn")) b.setAttribute("aria-pressed", String(b.dataset.v === NV.animar));
    $("#nv-animar-dica").textContent = NV.animar === "recriar"
      ? "Cada quadro vira uma cena animada de verdade: o texto entra com a palavra em destaque, números contam, o botão é clicado, e os desenhos do seu quadro entram junto."
      : "Cada quadro entra inteiro, como imagem, com movimento (entrada, aproximação lenta e brilho), no tempo da narração.";
  }

  const DICA_VOZ = { propria: "Grátis. Você grava as falas quando o roteiro estiver pronto.", voicestudio: "Grátis, roda no seu computador (pode deixá-lo mais quente).",
    elevenlabs: "Paga: gasta créditos da sua conta ElevenLabs.",
    higgsfield: "Gasta créditos do Higgsfield (uns 0,5 por fala), conectado no app do Claude. O Claude mostra o custo antes." };
  function desenhaPasso3() {
    const e = estiloNV(), mostraVoz = temVoz(e) && !!(S.catalogo.vozes || []).length;
    $("#nv-voz-box").hidden = !mostraVoz;
    if (mostraVoz) {
      const g = $("#nv-voz"); g.replaceChildren();
      const ops = [{ valor: "", nome: "O Claude pergunta depois" }, ...S.catalogo.vozes];
      for (const v of ops) g.append(el("button", { type: "button", role: "radio", classe: "btn chip", "aria-checked": String(NV.voz === v.valor), "aria-pressed": String(NV.voz === v.valor),
        texto: v.nome, onclick: () => { NV.voz = v.valor; desenhaNV(); } }));
      $("#nv-voz-dica").textContent = NV.voz ? DICA_VOZ[NV.voz] || "" : "Se o projeto já tem uma voz escolhida, ele usa a mesma.";
    }
    // resumo: só o que é certo (nada de prazo inventado)
    const r = $("#nv-resumo"); r.replaceChildren();
    const linhas = [["Tipo de vídeo", e ? e.nome : "O Claude sugere"]];
    if (e) for (const c of e.campos || []) {
      if (c.id === "observacao") continue;
      let v = c.tipo === "arquivo" ? nomeCurto((NV.envios[c.id] || {}).arquivo) : String(NV.campos[c.id] || "").trim();
      if (c.tipo === "escolha") v = ((c.opcoes || []).find((o) => o.valor === v) || {}).nome || "";
      if (v) linhas.push([c.rotulo, v.length > 140 ? v.slice(0, 140) + "…" : v]);
    } else if ((NV.campos.pedido || "").trim()) linhas.push(["Pedido", NV.campos.pedido.trim().slice(0, 140)]);
    if ($("#nv-tem-copy").getAttribute("aria-pressed") === "true") linhas.push(["Texto do vídeo", "o seu, usado como está"]);
    if (NV.sb.length) linhas.push(["Cenas", `o seu storyboard (${NV.sb.length} arquivo${NV.sb.length > 1 ? "s" : ""})`]);
    if (S.modelo) linhas.push(["Modelo de referência", S.modelo.nome]);
    const dl = el("dl", {}, linhas.flatMap(([k, v]) => [el("dt", { texto: k }), el("dd", { texto: v })]));
    // o que gasta fora da assinatura: a voz paga e qualquer opção do estilo marcada com "pago" no estilos.json (ex.: o modo caprichado)
    const pagos = [];
    if (NV.voz === "elevenlabs") pagos.push("créditos da ElevenLabs para a voz");
    if (NV.voz === "higgsfield") pagos.push("créditos do Higgsfield para a voz");
    if (e) for (const c of e.campos || []) { const o = c.tipo === "escolha" && (c.opcoes || []).find((x) => x.valor === NV.campos[c.id]); if (o && o.pago) pagos.push(o.pago); }
    const custo = "Usa a sua assinatura do Claude" + (pagos.length ? " e " + pagos.join(" e ") + "." : ". Sem custo extra" + (temVoz(e) && !NV.voz ? ", a não ser que você escolha uma voz paga." : "."));
    const inst = e && !S.instalados.includes(e.id) ? "Este estilo ainda não está instalado: o Claude instala antes de começar (leva alguns minutos, uma vez só)." : "";
    // "Trabalhar sozinho" só muda as permissões: o roteiro sempre para para a pessoa aprovar
    const fluxo = "O Claude mostra o roteiro para você aprovar antes de continuar e pergunta no fim se ficou bom. Você acompanha as etapas na coluna da direita."
      + (S.autonomo ? "" : " Antes de algo arriscado, ele pede licença aqui no chat.");
    r.append(el("h3", { texto: "Confira o pedido" }), dl, el("ul", { classe: "c-resumo-notas" }, [custo, inst, fluxo].filter(Boolean).map((x) => el("li", { texto: x }))));
  }

  function desenhaNV() {
    for (const n of [1, 2, 3]) $("#nv-p" + n).hidden = NV.passo !== n;
    for (const li of document.querySelectorAll("#nv-passos li")) {
      const p = Number(li.dataset.p);
      li.className = p < NV.passo ? "feito" : p === NV.passo ? "atual" : "";
      if (p === NV.passo) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    }
    $("#nv-voltar").hidden = NV.passo === 1;
    $("#nv-enviar").textContent = NV.passo === 3 ? "Começar o vídeo" : "Continuar";
    if (NV.passo === 1) desenhaPasso1(); else if (NV.passo === 2) desenhaPasso2(); else desenhaPasso3();
  }

  function validaPasso2() {
    const e = estiloNV(), tc = $("#nv-tem-copy").getAttribute("aria-pressed") === "true", ts = $("#nv-tem-sb").getAttribute("aria-pressed") === "true";
    const copy = tc ? $("#nv-copy").value.trim() : "";
    if (tc && !copy) { $("#nv-copy").focus(); return "Cole o texto do vídeo, ou desmarque \"Já tenho o texto do vídeo\"."; }
    if (ts && !NV.sb.length) return "Escolha a imagem das cenas, ou desmarque \"Já tenho o desenho das cenas\".";
    if (Object.values(NV.envios).some((x) => x.pct !== undefined && !x.arquivo)) return "Espere o arquivo terminar de enviar.";
    if (!e) {
      if (!(NV.campos.pedido || "").trim() && !copy && !NV.sb.length && !S.anexos.length) { const t = $("#nv-c-pedido"); if (t) { t.setAttribute("aria-invalid", "true"); t.focus(); } return "Conte o que você quer."; }
      return "";
    }
    for (const c of e.campos || []) {
      if (!c.obrigatorio) continue;
      const tem = c.tipo === "arquivo" ? !!(NV.envios[c.id] || {}).arquivo : !!String(NV.campos[c.id] || "").trim();
      // quem já trouxe o texto ou as cenas não precisa dizer o tema; o arquivo de um estilo de edição é sempre obrigatório
      if (!tem && (c.tipo === "arquivo" || (!copy && !NV.sb.length))) {
        const alvo = document.querySelector(`[data-campo="${c.id}"] .entrada, [data-campo="${c.id}"] .c-solta, [data-campo="${c.id}"] .btn`);
        if (alvo) { alvo.setAttribute("aria-invalid", "true"); alvo.focus(); }
        return "Falta: " + c.rotulo;
      }
    }
    for (const c of e.campos || []) if (c.tipo === "link" && String(NV.campos[c.id] || "").trim() && !/^https?:\/\/\S+$/.test(NV.campos[c.id].trim())) {
      const alvo = $("#nv-c-" + c.id); if (alvo) { alvo.setAttribute("aria-invalid", "true"); alvo.focus(); }
      return "Esse link não parece certo. Ele começa com https://";
    }
    return "";
  }

  function vaiPasso(n) {
    $("#nv-status").textContent = ""; $("#nv-status").classList.remove("erro");
    NV.passo = n; desenhaNV();
    const alvo = n === 1 ? (document.querySelector('#nv-estilos [aria-checked="true"]') || document.querySelector("#nv-estilos .c-assist-est")) : n === 2 ? document.querySelector("#nv-campos .entrada, #nv-campos .c-solta, #nv-campos .btn") : $("#nv-obs");
    if (alvo) alvo.focus({ preventScroll: true });
    $("#form-video").scrollTop = 0; $("#modal-video").scrollTop = 0;
  }

  function abreNovoVideo() {
    S.fluxoPrimeiro = false; NV.passo = 1; NV.estilo = (S.modelo && S.modelo.estilo) || null; NV.campos = {}; NV.envios = {}; NV.voz = ""; NV.sb = []; NV.animar = "recriar";
    $("#nv-tem-copy").setAttribute("aria-pressed", "false"); $("#nv-tem-sb").setAttribute("aria-pressed", "false");
    $("#nv-copy").value = ""; $("#nv-obs").value = $("#texto").value.trim(); $("#nv-status").textContent = "";
    desenhaNV(); $("#modal-video").showModal();
    const sel = document.querySelector('#nv-estilos [aria-checked="true"]') || document.querySelector("#nv-estilos .c-assist-est");
    if (sel) sel.focus({ preventScroll: true }); $("#modal-video").scrollTop = 0;
  }

  function sobeComProgresso(url, arquivo, aoAndar) {
    return new Promise((ok, falha) => {
      const x = new XMLHttpRequest(); x.open("POST", url); x.setRequestHeader("X-Painel-Chave", chave); x.setRequestHeader("Content-Type", "application/octet-stream");
      x.upload.onprogress = (ev) => { if (ev.lengthComputable) aoAndar(Math.round((ev.loaded / ev.total) * 100)); };
      x.onload = () => { let d = {}; try { d = JSON.parse(x.responseText); } catch (_) {} x.status >= 200 && x.status < 300 ? ok(d) : falha(new Error(d.erro || "O envio falhou.")); };
      x.onerror = () => falha(new Error("O envio falhou. Confira se o painel continua aberto."));
      x.send(arquivo);
    });
  }
  async function sobeCampo(c, f) {
    NV.envios[c.id] = { pct: 0, nome: f.name }; desenhaNV();
    let ultimo = 0;
    try {
      const d = await sobeComProgresso(`/api/v2/projeto/${S.atual}/anexo?nome=${encodeURIComponent(f.name)}`, f, (p) => {
        if (p - ultimo >= 2 || p === 100) { ultimo = p; NV.envios[c.id] = { pct: p, nome: f.name }; if (NV.passo === 2) desenhaNV(); }
      });
      NV.envios[c.id] = { arquivo: d.arquivo, nome: f.name };
    } catch (e) { delete NV.envios[c.id]; $("#nv-status").textContent = e.message; $("#nv-status").classList.add("erro"); }
    if (NV.passo === 2) desenhaNV();
  }
  async function sobeStoryboard(files) {
    for (const f of files) {
      try { $("#nv-status").textContent = "Enviando " + f.name + "…"; const d = await sobe(`/api/v2/projeto/${S.atual}/anexo?nome=${encodeURIComponent(f.name)}`, f); NV.sb.push(d.arquivo); $("#nv-status").textContent = ""; desenhaNV(); }
      catch (e) { $("#nv-status").textContent = e.message; }
    }
  }
  async function enviaNovoVideo(ev) {
    ev.preventDefault();
    const st = $("#nv-status"); st.classList.remove("erro");
    if (NV.passo === 1) { if (NV.estilo === null) { st.textContent = "Escolha o tipo de vídeo (ou \"Não sei ainda\")."; st.classList.add("erro"); return; } return vaiPasso(2); }
    if (NV.passo === 2) { const erro = validaPasso2(); if (erro) { st.textContent = erro; st.classList.add("erro"); return; } return vaiPasso(3); }
    const e = estiloNV(), tc = $("#nv-tem-copy").getAttribute("aria-pressed") === "true";
    const copy = tc ? $("#nv-copy").value.trim() : "";
    const campos = {}, arquivos = [];
    if (e) for (const c of e.campos || []) {
      if (c.tipo === "arquivo") { const a = (NV.envios[c.id] || {}).arquivo; if (a) { campos[c.id] = a; arquivos.push(a); } }
      else if (c.id !== "observacao" && String(NV.campos[c.id] || "").trim()) campos[c.id] = String(NV.campos[c.id]).trim();
    }
    const obs = [e ? "" : (NV.campos.pedido || "").trim(), $("#nv-obs").value.trim()].filter(Boolean).join("\n\n");
    $("#nv-enviar").disabled = true;
    try {
      await post(`/api/v2/projeto/${S.atual}/mensagem`, { texto: obs, anexos: [...arquivos, ...NV.sb, ...S.anexos], modelo: S.modelo ? S.modelo.id : null,
        pronto: { estilo: NV.estilo || "", copy, storyboard: NV.sb, animar: NV.animar, campos, voz: NV.voz } });
      $("#modal-video").close(); $("#texto").value = ""; S.anexos = []; S.modelo = null; desenhaAnexados(); desenhaModelos(); autoAltura();
      $("#previa").dataset.atual = ""; delete $("#previa").dataset.vazio; S.forcarFim = true; await atualiza();
    } catch (er) { st.textContent = er.message; st.classList.add("erro"); }
    finally { $("#nv-enviar").disabled = false; }
  }

  // ---------- excluir projeto (vai para _lixeira, nada é apagado de verdade) ----------
  function abreExcluir() {
    const p = S.projetos.find((x) => x.id === S.atual); if (!p) return;
    $("#excluir-sub").textContent = `"${p.nome}" sai da lista e vai para a pasta _lixeira dentro da sua pasta de trabalho, com o chat e os vídeos. Nada é apagado de verdade: para recuperar, mova a pasta de volta para projetos/ (ou peça ao Claude).`;
    S.excluirAberto = Date.now(); $("#modal-excluir").showModal();
  }
  async function excluiProjeto() {
    if (Date.now() - (S.excluirAberto || 0) < 500) return; // clique duplo ou tecla repetida logo depois de abrir: ignora
    const pid = S.atual; $("#excluir-sim").disabled = true;
    try {
      await post(`/api/v2/projeto/${pid}/excluir`); $("#modal-excluir").close();
      S.atual = null; S.msgs = []; S.ultimoN = 0; try { localStorage.removeItem("painel-projeto"); } catch (_) {}
      await atualizaGeral(); try { await carregaEntregas(); } catch (_) {}
      irPara("#/projetos"); aviso("Projeto movido para a lixeira (_lixeira).");
    } catch (e) { aviso(e.message, true); }
    finally { $("#excluir-sim").disabled = false; }
  }

  // ---------- início ----------
  async function inicia() {
    if (!chave) return trava("Abra pelo atalho", "Dê dois cliques em \"Abrir Painel\" dentro da sua pasta de trabalho, ou diga ao Claude: abre o painel.");
    try { await atualizaGeral(); }
    catch (e) {
      if (e.status === 401) return trava("O painel foi religado", "A chave desta aba venceu. Dê dois cliques em \"Abrir Painel\" na sua pasta de trabalho para abrir de novo.");
      return trava("O painel está desligado", "Dê dois cliques em \"Abrir Painel\" dentro da sua pasta de trabalho, ou diga ao Claude: abre o painel.");
    }
    try { const md = await api("/api/v2/modelos"); S.modelos = md.modelos; S.categorias = md.categorias; } catch (_) {}
    try { await carregaEntregas(); } catch (_) {}
    $("#app").hidden = false; desenhaEstilos();
    try { const pid = localStorage.getItem("painel-projeto"); if (S.projetos.some((p) => p.id === pid)) S.atual = pid; } catch (_) {}
    if (S.atual) { const p = S.projetos.find((x) => x.id === S.atual); $("#titulo-projeto").textContent = p.nome; }
    await rota();

    $("#form-msg").addEventListener("submit", enviar);
    $("#texto").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviar(); } });
    $("#texto").addEventListener("input", autoAltura);
    $("#texto").addEventListener("paste", (e) => { const f = [...(e.clipboardData && e.clipboardData.files || [])]; if (f.length) { e.preventDefault(); anexa(f); } });
    $("#btn-anexo").addEventListener("click", () => $("#arquivo").click());
    $("#arquivo").addEventListener("change", (e) => { anexa([...e.target.files]); e.target.value = ""; });
    const zona = $(".c-chat");
    zona.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("solta"); });
    zona.addEventListener("dragleave", () => zona.classList.remove("solta"));
    zona.addEventListener("drop", (e) => { e.preventDefault(); zona.classList.remove("solta");
      const txt = e.dataTransfer.getData("text/plain") || "";
      if (txt.startsWith("modelo:")) { const m = S.modelos.find((x) => x.id === txt.slice(7)); if (m) anexaModelo(m); return; }
      anexa([...e.dataTransfer.files]); });
    $("#modal-player").addEventListener("close", () => { const v = $("#player-video"); v.pause(); v.removeAttribute("src"); v.load(); });
    $("#btn-audio").addEventListener("click", audio);
    $("#parar").addEventListener("click", async () => { try { await post(`/api/v2/projeto/${S.atual}/parar`); atualiza(); } catch (e) { aviso(e.message, true); } });
    for (const b of document.querySelectorAll("[data-novo]")) b.addEventListener("click", abreNovo);
    for (const b of document.querySelectorAll("[data-fecha]")) b.addEventListener("click", () => b.closest("dialog").close());
    $("#form-novo").addEventListener("submit", criaProjeto);
    $("#abre-marca").addEventListener("click", abreMarca);
    $("#abre-excluir").addEventListener("click", abreExcluir);
    $("#abre-video").addEventListener("click", abreNovoVideo);
    $("#form-video").addEventListener("submit", enviaNovoVideo);
    $("#nv-voltar").addEventListener("click", () => vaiPasso(Math.max(1, NV.passo - 1)));
    $("#ini-primeiros-esconde").addEventListener("click", () => { try { localStorage.setItem(PRIM_OCULTO, "1"); } catch (_) {} desenhaPrimeiros(); });
    $("#modal-novo").addEventListener("close", () => { if ($("#modal-novo").returnValue !== "criado") S.fluxoPrimeiro = false; });
    $("#modal-marca").addEventListener("close", () => { if (S.fluxoPrimeiro && S.atual) { S.fluxoPrimeiro = false; setTimeout(abreNovoVideo, 150); } });
    for (const id of ["#nv-tem-copy", "#nv-tem-sb"]) $(id).addEventListener("click", (e) => { const b = e.currentTarget; b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); desenhaNV(); if (id === "#nv-tem-copy" && !$("#nv-copy-box").hidden) $("#nv-copy").focus(); });
    for (const b of document.querySelectorAll("#nv-animar .btn")) b.addEventListener("click", () => { NV.animar = b.dataset.v; desenhaNV(); });
    $("#nv-sb-btn").addEventListener("click", () => $("#nv-sb").click());
    $("#nv-sb").addEventListener("change", (e) => { sobeStoryboard([...e.target.files]); e.target.value = ""; });
    $("#btn-autonomo").addEventListener("click", () => ligaAutonomo(!S.autonomo));
    $("#excluir-sim").addEventListener("click", excluiProjeto);
    $("#mm-salvar").addEventListener("click", salvaMarca);
    $("#mm-cor").addEventListener("input", (e) => { $("#mm-cor-hex").value = e.target.value.toUpperCase(); });
    $("#mm-cor-hex").addEventListener("input", (e) => { if (hexOk(e.target.value)) $("#mm-cor").value = e.target.value; });
    $("#mm-btn-logo").addEventListener("click", () => $("#mm-logo").click());
    $("#mm-btn-capa").addEventListener("click", () => $("#mm-capa").click());
    $("#mm-capa").addEventListener("change", async (e) => {
      const f = e.target.files[0]; e.target.value = ""; if (!f) return;
      $("#mm-status").textContent = "Enviando a capa…";
      try { await sobe(`/api/v2/projeto/${S.atual}/capa-ref?nome=${encodeURIComponent(f.name)}`, f); await atualiza(); desenhaCapasRef(); $("#mm-status").textContent = "Capa guardada."; }
      catch (er) { $("#mm-status").textContent = er.message; }
    });
    $("#mm-logo").addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { await sobe(`/api/v2/projeto/${S.atual}/logo?nome=${encodeURIComponent(f.name)}`, f); await atualiza(); abreMarca(); } catch (er) { $("#mm-status").textContent = er.message; }
      e.target.value = "";
    });
    $("#fecha-lateral").addEventListener("click", fechaLateral);
    $("#abre-lateral").addEventListener("click", () => { const l = $("#lateral"), a = !l.classList.contains("aberta"); l.classList.toggle("aberta", a); $("#abre-lateral").setAttribute("aria-expanded", String(a)); });
    const mede = () => document.documentElement.style.setProperty("--topo-alt", $(".c-topo").offsetHeight + "px");
    mede(); window.addEventListener("resize", mede);
    document.addEventListener("touchstart", () => {}, { passive: true });
    let falhas = 0;
    const ciclo = async () => {
      try { if (!document.hidden && S.atual) { await atualiza(); desenhaStatus(); } falhas = 0; }
      catch (e) {
        if (e.status === 401) return trava("O painel foi religado", "A chave desta aba venceu. Dê dois cliques em \"Abrir Painel\" na sua pasta de trabalho para abrir de novo.");
        if (e.status === 0 && !S.atualizando && ++falhas >= 3) return trava("O painel está desligado", "Dê dois cliques em \"Abrir Painel\" dentro da sua pasta de trabalho, ou diga ao Claude: abre o painel.");
      }
      setTimeout(ciclo, S.estado === "parado" ? 3000 : 1200);
    };
    const cicloGeral = async () => {
      try { if (!document.hidden) { await atualizaGeral(); if (S.tela !== "modelos") await carregaEntregas(); redesenhaTela(); } } catch (_) {}
      setTimeout(cicloGeral, 5000);
    };
    setTimeout(ciclo, 1200); setTimeout(cicloGeral, 5000);
  }
  inicia();
})();
