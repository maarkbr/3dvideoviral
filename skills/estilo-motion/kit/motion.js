/* Kit do estilo Motion (HyperFrames + GSAP). Lê window.DADOS (escrito pelo montar_motion.py) e monta tudo numa timeline só.
   Cada bloco do roteiro é uma cena: ela entra quando a fala começa e sai quando a próxima começa.
   Regras (references/regras-motion.md): uma informação por tela, texto entra e fica parado, coluna central com 120 px de margem,
   entradas variadas (nunca a mesma duas vezes seguidas), movimento contínuo só em objetos (celular, cartões), nunca no texto.
   Tudo é determinístico (nada de Math.random, Date ou innerText em tempo de render): o HyperFrames renderiza fora de ordem. */
function MOTION(tl, D) {
  const palco = document.querySelector("#palco");
  const DUR = D.dur, INI = D.inicios, M = D.marca || {};
  const fimDe = (i) => (i + 1 < INI.length ? INI[i + 1] : DUR - 0.3);
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const quando = (i, palavra, padrao) => {
    if (!palavra) return padrao;
    const n = norm(String(palavra).split(/\s+/)[0]);
    const p = D.palavras.find((x) => x.bloco === i && norm(x.w) === n);
    return p ? p.s : padrao;
  };
  const novo = (tag, cls, pai) => { const e = document.createElement(tag); if (cls) e.className = cls; (pai || palco).appendChild(e); return e; };
  const texto = (e, t) => { e.textContent = t; return e; };
  const IC = {
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    calendario: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    mensagem: '<path d="M4 5h16v11H9l-5 4z"/>',
    grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    dinheiro: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.8"/>',
    raio: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    estrela: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4.5 4.5-6 8-6s6.5 1.5 8 6"/>',
    sino: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    cadeado: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    foguete: '<path d="M5 19c0-3 1-5 3-6l3 3c-1 2-3 3-6 3zM9 13l6-9c3 0 5 2 5 5l-9 6z"/>',
    carrinho: '<path d="M3 4h2.5l2.2 11h10.5l2-8H7"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
  };
  const icone = (nome) => `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${IC[nome] || IC.check}</svg>`;

  // ---------- movimento ----------
  const ENTRADAS = {
    sobe: [{ opacity: 0, y: 70, filter: "blur(12px)" }, { opacity: 1, y: 0, filter: "blur(0px)", ease: "expo.out" }],
    escala: [{ opacity: 0, scale: 0.82, filter: "blur(14px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", ease: "back.out(1.6)" }],
    lado: [{ opacity: 0, x: -140, filter: "blur(12px)" }, { opacity: 1, x: 0, filter: "blur(0px)", ease: "expo.out" }],
    desce: [{ opacity: 0, y: -70, filter: "blur(12px)" }, { opacity: 1, y: 0, filter: "blur(0px)", ease: "expo.out" }],
  };
  const ORDEM = ["sobe", "escala", "lado", "desce"];
  const entra = (n, t, tipo = "sobe", dur = 0.5) => {
    const [de, para] = ENTRADAS[tipo] || ENTRADAS.sobe;
    tl.fromTo(n, de, { ...para, duration: dur, immediateRender: false }, t);
  };
  const flutua = (n, t0, t1, amp = 14) => { // movimento contínuo e suave (objetos, nunca texto)
    tl.fromTo(n, { y: 0 }, { y: -amp, duration: Math.max(0.6, (t1 - t0) / 2), ease: "sine.inOut", yoyo: true, repeat: 1, immediateRender: false }, t0);
  };

  // ---------- peças ----------
  function frase(pai, txt, i, t, cls = "frase", tipo = "sobe") {
    const f = novo("div", cls, pai);
    const partes = String(txt || "").split(/(\*[^*]+\*)/).filter(Boolean);
    let k = 0, chaveT = null;
    for (const parte of partes) {
      if (parte.startsWith("*")) {
        const s = novo("span", "p v chave", f); texto(s, parte.slice(1, -1));
        entra(s, t + 0.05 + k++ * 0.05, tipo, 0.45);
        const tc = Math.max(t + 0.2, quando(i, parte.slice(1, -1), t + 0.35));
        tl.fromTo(s, { "--s": 0 }, { "--s": 1, duration: 0.3, ease: "power3.out", immediateRender: false }, tc);
        chaveT = tc;
      } else {
        for (const w of parte.split(/(\s+)/)) {
          if (!w) continue;
          if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(" ")); continue; }
          const s = novo("span", "p v", f); texto(s, w);
          entra(s, t + 0.05 + k++ * 0.05, tipo, 0.45);
        }
      }
    }
    return { el: f, chaveT };
  }
  function meio(gap = 64) { const m = novo("div", "meio"); m.style.gap = gap + "px"; return m; }
  function bloco(pai, cls) { const b = novo("div", "v " + (cls || ""), pai); return b; }
  function odometro(pai, valor, t, dur) {
    const o = novo("span", "odo", pai), s = String(valor);
    [...s].forEach((ch, j) => {
      if (!/\d/.test(ch)) { texto(novo("span", "sep", o), ch); return; }
      const c = novo("span", "col-d", o);
      for (let r = 0; r < 20; r++) texto(novo("span", "", c), String(r % 10));
      const alvo = -((+ch + 10) / 20) * 100;
      tl.fromTo(c, { yPercent: 0 }, { yPercent: alvo, duration: dur + j * 0.08, ease: "expo.out", immediateRender: false }, t);
    });
    return o;
  }

  const CENAS = {
    frase(c, i, t0, t1, tipo) {
      const m = meio(40);
      if (c.antes) frase(m, c.antes, i, t0, "frase pequena", tipo);
      const fr = frase(m, c.texto, i, t0 + (c.antes ? 0.15 : 0), "frase " + (c.tamanho || ""), tipo);
      // ilustra: um desenho (recortado do storyboard da pessoa, um print, um ícone) que entra com a palavra-chave e flutua devagar
      if (c.ilustra) {
        const ib = bloco(m, "ilustra"); const im = novo("img", "", ib); im.src = c.ilustra;
        const ti = Math.max(t0 + 0.25, (fr.chaveT || t0 + 0.35) - 0.05);
        tl.fromTo(ib, { opacity: 0, scale: 0.6, y: 60, rotation: -6 }, { opacity: 1, scale: 1, y: 0, rotation: 0, duration: 0.6, ease: "back.out(1.8)", immediateRender: false }, ti);
        const vida = Math.max(0.6, t1 - ti - 0.6);
        tl.to(ib, { y: -18, duration: vida / 2, ease: "sine.inOut", yoyo: true, repeat: 1 }, ti + 0.6);
      }
      return m;
    },
    // quadro: o quadro do storyboard da pessoa, inteiro, animado (entrada, aproximação lenta, brilho passando, sombra na cor da marca)
    quadro(c, i, t0, t1) {
      const box = novo("div", "cena");
      const q = novo("div", "abs quadro-caixa", box); const im = novo("img", "", q); im.src = c.imagem;
      const br = novo("div", "brilho", q);
      tl.fromTo(q, { opacity: 0, scale: 0.86, y: 70, filter: "blur(14px)" }, { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "power3.out", immediateRender: false }, t0);
      tl.fromTo(im, { scale: 1.0 }, { scale: 1.07, duration: Math.max(1, t1 - t0), ease: "none", immediateRender: false }, t0);
      tl.fromTo(br, { xPercent: -130 }, { xPercent: 130, duration: 0.9, ease: "power2.inOut", immediateRender: false }, t0 + 0.45);
      if (c.texto) { const fx = texto(novo("div", "abs faixa", box), c.texto); fx.style.top = "1560px"; entra(fx, t0 + 0.3, "sobe", 0.5); }
      return box;
    },
    logo(c, i, t0, t1) {
      const m = meio(44);
      const cx = bloco(m, "logo-caixa");
      if (M.logo) { const im = novo("img", "", cx); im.src = M.logo; } else texto(novo("b", "", cx), (c.nome || M.nome || "?").trim()[0]);
      tl.fromTo(cx, { opacity: 0, scale: 0.55, rotation: -10, filter: "blur(16px)" }, { opacity: 1, scale: 1, rotation: 0, filter: "blur(0px)", duration: 0.7, ease: "back.out(1.7)", immediateRender: false }, t0);
      const n = texto(bloco(m, "logo-nome"), c.nome || M.nome || ""); entra(n, t0 + 0.25, "sobe", 0.5);
      if (c.sub) { const s = texto(bloco(m, "logo-sub"), c.sub); entra(s, t0 + 0.45, "sobe", 0.5); }
      return m;
    },
    celular(c, i, t0, t1, tipo) {
      const m = meio(56);
      if (c.titulo) frase(m, c.titulo, i, t0, "frase media", tipo);
      const cel = bloco(m, "celular"); cel.style.position = "relative"; cel.style.left = "0";
      novo("div", "ilha", cel);
      const tela = novo("div", "tela", cel);
      tl.fromTo(cel, { opacity: 0, y: 260, rotation: 4 }, { opacity: 1, y: 0, rotation: 0, duration: 0.8, ease: "expo.out", immediateRender: false }, t0 + 0.1);
      if (c.imagem) { const im = novo("img", "", tela); im.src = c.imagem; }
      else {
        const ch = novo("div", "chat", tela), topo = novo("div", "topo", ch); novo("i", "", topo); texto(novo("b", "", topo), c.contato || M.nome || "Atendimento");
        const bs = c.baloes || [];
        const passo = Math.min(0.9, Math.max(0.35, (t1 - t0 - 1.2) / Math.max(1, bs.length)));
        bs.forEach((b, k) => {
          const e = texto(novo("div", "balao v " + (b.de === "eu" ? "eu" : "ele"), ch), b.txt);
          const tb = b.em ? quando(i, b.em, t0 + 0.8 + k * passo) : t0 + 0.8 + k * passo;
          tl.fromTo(e, { opacity: 0, y: 30, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.8)", immediateRender: false }, tb);
        });
      }
      return m;
    },
    painel(c, i, t0, t1, tipo) {
      const m = meio(56);
      if (c.titulo) frase(m, c.titulo, i, t0, "frase media", tipo);
      const p = bloco(m, "cartao painel"); p.style.position = "relative"; p.style.left = "0";
      entra(p, t0 + 0.12, "escala", 0.55);
      texto(novo("div", "rot", p), c.rotulo || "");
      const v = novo("div", "valor", p);
      if (c.prefixo) texto(novo("span", "pref", v), c.prefixo);
      odometro(v, c.valor ?? 0, t0 + 0.35, 1.3);
      if (c.sufixo) texto(novo("span", "pref", v), c.sufixo);
      const bs = novo("div", "barras", p);
      (c.barras || [38, 52, 46, 64, 58, 88]).forEach((h, k) => {
        const b = novo("i", "", bs); b.style.height = Math.max(6, Math.min(100, h)) + "%";
        tl.fromTo(b, { scaleY: 0 }, { scaleY: 1, duration: 0.6, ease: "expo.out", immediateRender: false }, t0 + 0.45 + k * 0.07);
      });
      return m;
    },
    lista(c, i, t0, t1, tipo) {
      const m = meio(56);
      if (c.titulo) frase(m, c.titulo, i, t0, "frase media", tipo);
      const l = bloco(m, "cartao lista"); l.style.position = "relative"; l.style.left = "0";
      entra(l, t0 + 0.1, "sobe", 0.5);
      const its = c.itens || [];
      const passo = Math.min(0.7, Math.max(0.3, (t1 - t0 - 1) / Math.max(1, its.length)));
      its.forEach((it, k) => {
        const tx = typeof it === "string" ? it : it.txt, em = typeof it === "string" ? null : it.em;
        const row = novo("div", "item v", l);
        const ok = novo("span", "ok", row); ok.innerHTML = icone("check");
        texto(novo("span", "", row), tx);
        const ti = em ? quando(i, em, t0 + 0.5 + k * passo) : t0 + 0.5 + k * passo;
        tl.fromTo(row, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.4, ease: "expo.out", immediateRender: false }, ti);
        tl.fromTo(ok, { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(3)", immediateRender: false }, ti + 0.12);
      });
      return m;
    },
    recursos(c, i, t0, t1) {
      const box = novo("div", "cena");
      const centro = texto(novo("div", "abs centro col", box), c.centro || M.nome || ""); centro.style.top = "900px";
      entra(centro, t0, "escala", 0.5);
      const POS = [[110, 560], [560, 660], [120, 1180], [540, 1290]];
      const its = (c.itens || []).slice(0, 4);
      its.forEach((it, k) => {
        const tx = typeof it === "string" ? it : it.txt, ic = typeof it === "string" ? "check" : it.icone, em = typeof it === "string" ? null : it.em;
        const ch = novo("div", "abs chip", box); ch.style.left = POS[k][0] + "px"; ch.style.top = POS[k][1] + "px";
        const ib = novo("span", "ic", ch); ib.innerHTML = icone(ic); texto(novo("span", "", ch), tx);
        const tc = em ? quando(i, em, t0 + 0.35 + k * 0.3) : t0 + 0.35 + k * 0.3;
        tl.fromTo(ch, { opacity: 0, scale: 0.6, filter: "blur(10px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.45, ease: "back.out(2)", immediateRender: false }, tc);
        flutua(ch, tc + 0.45, t1, 10 + k * 3);
      });
      return box;
    },
    numero(c, i, t0, t1, tipo) {
      const m = meio(48);
      if (c.titulo) frase(m, c.titulo, i, t0, "frase media", tipo);
      const a = bloco(m, "anel"); a.style.position = "relative"; a.style.left = "0";
      a.innerHTML = '<svg viewBox="0 0 500 500"><circle cx="250" cy="250" r="230" fill="none" stroke="var(--linha)" stroke-width="22"/><circle class="arco" cx="250" cy="250" r="230" fill="none" stroke="var(--marca)" stroke-width="22" stroke-linecap="round" stroke-dasharray="1445" stroke-dashoffset="1445"/></svg>';
      const n = novo("div", "num", a); odometro(n, c.valor ?? 0, t0 + 0.3, 1.1);
      entra(a, t0 + 0.08, "escala", 0.5);
      tl.fromTo(a.querySelector(".arco"), { strokeDashoffset: 1445 }, { strokeDashoffset: 1445 * (1 - (c.progresso ?? 1)), duration: 1.2, ease: "expo.out", immediateRender: false }, t0 + 0.3);
      if (c.sub) { const s = texto(bloco(m, "num-sub"), c.sub); entra(s, t0 + 0.55, "sobe", 0.45); }
      return m;
    },
    foto(c, i, t0, t1) {
      const box = novo("div", "cena");
      const f = novo("div", "abs foto", box); const im = novo("img", "", f); im.src = c.imagem;
      tl.fromTo(f, { opacity: 0 }, { opacity: 1, duration: 0.35, immediateRender: false }, t0);
      tl.fromTo(im, { scale: 1.1 }, { scale: 1.0, duration: Math.max(1, t1 - t0), ease: "none", immediateRender: false }, t0);
      if (c.texto) { const fx = texto(novo("div", "abs faixa", box), c.texto); fx.style.top = "1460px"; entra(fx, t0 + 0.3, "sobe", 0.5); }
      return box;
    },
    cta(c, i, t0, t1, tipo) {
      const box = novo("div", "cena");
      const m = meio(60); box.appendChild(m);
      if (M.logo || c.logo) {
        const lc = bloco(m, "logo-caixa"); lc.style.width = lc.style.height = "200px"; lc.style.borderRadius = "52px";
        const im = novo("img", "", lc); im.src = M.logo; entra(lc, t0, "escala", 0.55);
      }
      if (c.titulo) frase(m, c.titulo, i, t0 + 0.1, "frase media", tipo);
      const b = texto(bloco(m, "botao"), c.botao || "Saiba mais"); b.style.position = "relative"; b.style.left = "0";
      entra(b, t0 + 0.35, "escala", 0.5);
      const tc = c.em ? quando(i, c.em, t0 + 1.3) : t0 + 1.3;
      const o = novo("div", "onda", b); o.style.opacity = "0";
      const cur = novo("div", "cursor", b); cur.style.opacity = "0";
      cur.innerHTML = '<svg viewBox="0 0 24 24" width="92" height="92"><path d="M5 3l14 8-6 1.6L10 19z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
      tl.fromTo(cur, { opacity: 0, x: 260, y: 420 }, { opacity: 1, x: 0, y: 0, duration: 0.6, ease: "power3.inOut", immediateRender: false }, tc - 0.6);
      tl.to(b, { scale: 0.94, duration: 0.08 }, tc); tl.to(b, { scale: 1, duration: 0.25, ease: "back.out(3)" }, tc + 0.08);
      tl.fromTo(o, { opacity: 0.9, scale: 0.3 }, { opacity: 0, scale: 4, duration: 0.7, ease: "power2.out", immediateRender: false }, tc);
      if (c.sub) { const s = texto(bloco(m, "logo-sub"), c.sub); entra(s, t0 + 0.6, "sobe", 0.45); }
      return box;
    },
  };

  // ---------- selo da marca no topo (continuidade), fora das cenas de logo e chamada ----------
  if (M.selo !== false && (M.nome || M.logo)) {
    const s = novo("div", "abs selo-marca");
    if (M.logo) { const im = novo("img", "", s); im.src = M.logo; } else texto(s, M.nome);
    tl.fromTo(s, { opacity: 0 }, { opacity: 0.9, duration: 0.4, immediateRender: false }, 0.2);
    D.cenas.forEach((c, i) => {
      if (c.tipo === "logo" || c.tipo === "cta" || c.tipo === "foto" || c.tipo === "quadro") {
        tl.to(s, { opacity: 0, duration: 0.2 }, INI[i]);
        if (i + 1 < INI.length && !["logo", "cta", "foto", "quadro"].includes(D.cenas[i + 1].tipo)) tl.to(s, { opacity: 0.9, duration: 0.3 }, INI[i + 1] + 0.1);
      }
    });
  }

  // ---------- cenas ----------
  let ultima = -1;
  D.cenas.forEach((c, i) => {
    const t0 = INI[i], t1 = fimDe(i);
    let k = ORDEM.indexOf(c.entrada); if (k < 0) k = (i * 3 + 1) % ORDEM.length; if (k === ultima) k = (k + 1) % ORDEM.length; ultima = k;
    const fn = CENAS[c.tipo] || CENAS.frase;
    const raiz = fn(c, i, t0, t1, ORDEM[k]);
    if (i + 1 < D.cenas.length) tl.to(raiz, { opacity: 0, y: -40, filter: "blur(10px)", duration: 0.22, ease: "power2.in" }, t1 - 0.22);
    if (c.transicao === "circulo") {
      const cc = novo("div", "abs circulo");
      tl.fromTo(cc, { opacity: 1, scale: 0 }, { opacity: 1, scale: 1, duration: 0.42, ease: "power3.in", immediateRender: false }, Math.max(0, t0 - 0.42));
      tl.to(cc, { opacity: 0, duration: 0.3, ease: "power1.out" }, t0 + 0.02);
    }
  });
  tl.set({}, {}, DUR);
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
}
