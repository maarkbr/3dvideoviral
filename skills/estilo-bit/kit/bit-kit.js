/* Kit do estilo Bit (HyperFrames + GSAP).
   Uso no index.html:  const tl = gsap.timeline({ paused: true }); const K = BIT(tl, DUR);
   Tudo entra na mesma timeline. Tempos em segundos do vídeo. Ver references/componentes.md. */
function BIT(tl, DUR) {
  const $ = (s) => document.querySelector(s);
  const palco = $("#palco");
  const K = { tl, DUR, $ };

  /* ---------- básicos ---------- */
  K.el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); const n = t.content.firstChild; palco.appendChild(n); return n; };
  K.janela = (id, titulo, x, y, w, h, corpo) => K.el(
    `<div id="${id}" class="abs janela" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
      <div class="barra"><i style="background:#FF5F57"></i><i style="background:#FEBC2E"></i><i style="background:#28C840"></i><span class="tit">${titulo}</span></div>
      <div class="corpo">${corpo}</div></div>`);
  K.PASTA = (w = 120, cor = "#F2C200") => `<svg width="${w}" height="${w * 0.8}" viewBox="0 0 120 96"><path d="M6 18 Q6 8 16 8 H46 L56 18 H104 Q114 18 114 28 V82 Q114 90 104 90 H16 Q6 90 6 82 Z" fill="${cor}" opacity=".92"/><path d="M6 32 H114 V82 Q114 90 104 90 H16 Q6 90 6 82 Z" fill="${cor}"/></svg>`;
  K.ICON = {
    cortar: `<svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#F2C200" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/></svg>`,
    legendar: `<svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#F2C200" stroke-width="2" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M7 15h4M13 15h4M7 11h10"/></svg>`,
    animar: `<svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#F2C200" stroke-width="2" stroke-linejoin="round"><path d="M12 2l2.4 6.2L21 9l-5 4.4L17.5 21 12 17.3 6.5 21 8 13.4 3 9l6.6-.8z"/></svg>`,
    play: `<svg width="36" height="36" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff"/></svg>`,
    enviar: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.6" stroke-linecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`,
    aviao: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.4" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/></svg>`,
    pacote: `<svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="#F2C200" stroke-width="1.6" stroke-linejoin="round"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/></svg>`,
    pdf: `<svg width="120" height="150" viewBox="0 0 120 150"><path d="M12 6 H82 L110 34 V144 H12 Z" fill="#EDEFF3"/><path d="M82 6 V34 H110" fill="#C9CDD4"/><rect x="28" y="56" width="64" height="8" rx="4" fill="#B5BAC2"/><rect x="28" y="76" width="54" height="8" rx="4" fill="#B5BAC2"/><rect x="28" y="96" width="64" height="8" rx="4" fill="#B5BAC2"/><rect x="12" y="120" width="98" height="24" fill="#F2C200"/></svg>`,
  };

  /* ---------- movimento padrão ---------- */
  K.entra = (n, t, d = 0.45, from = {}) => tl.fromTo(n, { opacity: 0, y: 40, scale: 0.94, filter: "blur(14px)", ...from },
    { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)", duration: d, ease: "expo.out" }, t);
  K.sai = (n, t, d = 0.3, to = {}) => tl.to(n, { opacity: 0, y: -60, scale: 0.97, filter: "blur(12px)", duration: d, ease: "power2.in", ...to }, t);
  K.pop = (n, t, d = 0.35) => tl.fromTo(n, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: d, ease: "back.out(2.2)" }, t);
  K.digita = (alvo, texto, t0, passo = 0.033) => [...texto].forEach((c, i) => {
    const s = document.createElement("span"); s.className = "ch"; s.textContent = c; alvo.appendChild(s); tl.set(s, { opacity: 1 }, t0 + i * passo); });
  K.linhas = (ids, tempos) => ids.forEach((id, i) => tl.fromTo(id, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.28, ease: "power3.out" }, tempos[i]));

  /* ---------- fundo vivo + câmera lenta (trechos = [[ini, fim], ...]) ---------- */
  K.fundo = (trechos = [[0, DUR]]) => {
    tl.to("#grade", { y: 44 * Math.max(1, Math.round(DUR / 14)), duration: DUR, ease: "none" }, 0);
    tl.fromTo("#luz", { x: 0, y: 0 }, { x: 520, y: 380, duration: DUR / 2, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0);
    tl.fromTo("#luz2", { x: 0, y: 0 }, { x: -420, y: -300, duration: DUR / 2, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0);
    tl.to("#grao", { x: 100, y: -100, duration: DUR, ease: "steps(" + Math.round(DUR * 12) + ")" }, 0);
    trechos.forEach(([a, b]) => tl.fromTo(palco, { scale: 1 }, { scale: 1.03, duration: b - a, ease: "none", immediateRender: false }, a));
  };

  /* ---------- janela de terminal com comando digitado e linhas de ✓ ---------- */
  K.terminal = (id, titulo, comando, itens, t0, tDig, tItens, tSai, pos = [90, 380, 760, 470]) => {
    const w = K.janela(id, titulo, ...pos, `<div><span class="prompt">&gt; </span><span id="${id}-dig"></span><span class="cursor" id="${id}-cur"></span></div>` +
      itens.map((t, i) => `<div class="ok" id="${id}-ok${i}"><b>✓</b>${t}</div>`).join(""));
    t0 <= 0.01 ? (tl.set(w, { opacity: 1 }, 0), tl.fromTo(w, { scale: 0.95 }, { scale: 1, duration: 0.6, ease: "expo.out" }, 0)) : K.entra(w, t0, 0.5);
    K.digita($(`#${id}-dig`), comando, tDig);
    const fimDig = tDig + comando.length * 0.033;
    for (let k = 0; k < 7; k++) tl.set(`#${id}-cur`, { opacity: k % 2 ? 1 : 0 }, fimDig + k * 0.17);
    K.linhas(itens.map((_, i) => `#${id}-ok${i}`), tItens);
    if (tSai) K.sai(w, tSai);
    return w;
  };

  /* ---------- ondas de áudio (voz) ---------- */
  K.ondas = (id, titulo, t0, tSai, pos = [170, 520, 740, 300]) => {
    const w = K.janela(id, titulo, ...pos, `<div id="${id}-o" style="height:180px;display:flex;align-items:center;justify-content:center;gap:9px"></div>`);
    for (let i = 0; i < 30; i++) {
      const b = document.createElement("div"); b.className = "onda"; $(`#${id}-o`).appendChild(b);
      gsap.set(b, { height: 18 + 70 * Math.abs(Math.sin(i * 0.7)) });
      const n = Math.max(2, Math.round((tSai - t0) / 0.12));
      for (let k = 0; k < n; k++) tl.to(b, { height: 16 + ((i * 37 + k * 53) % 150), duration: 0.12, ease: "sine.inOut" }, t0 + 0.08 + k * 0.12);
    }
    K.entra(w, t0, 0.4); K.sai(w, tSai, 0.26); return w;
  };

  /* ---------- checkout com preço riscado ---------- */
  K.checkout = (rotulo, preco, t0, tRisco, tSai) => {
    const w = K.janela("checkout", "checkout", 170, 470, 740, 450,
      `<div style="font:600 28px var(--sans);letter-spacing:.14em;color:var(--mudo)">${rotulo}</div>
       <div class="valor">${preco}<div class="risco"></div></div><div style="font:500 28px var(--sans);color:var(--mudo)">ou 12x no cartão</div><div class="btn">COMPRAR</div>`);
    K.entra(w, t0, 0.5, { y: 70 });
    const r = w.querySelector(".risco"); gsap.set(r, { rotation: -7, scaleX: 0 });
    tl.to(r, { scaleX: 1, duration: 0.28, ease: "power3.out" }, tRisco);
    tl.to(w, { y: 1100, rotation: 10, opacity: 0, duration: 0.5, ease: "power2.in" }, tSai);
    return w;
  };

  /* ---------- fichas numeradas (lista) ---------- */
  K.fichas = (pref, itens, t0, tSai, comCheck = false) => itens.map((p, i) => {
    const f = K.el(`<div id="${pref}${i}" class="abs ficha" style="top:${400 + i * 126}px"><b>${String(i + 1).padStart(2, "0")}</b><span>${p}</span><div class="v">✓</div></div>`);
    tl.fromTo(f, { opacity: 0, x: 90, filter: "blur(10px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.38, ease: "expo.out" }, t0 + i * 0.11);
    if (comCheck) tl.fromTo(f.querySelector(".v"), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)" }, t0 + 0.3 + i * 0.11);
    K.sai(f, tSai + i * 0.03, 0.25); return f;
  });

  /* ---------- marcador de salvar ---------- */
  K.salvar = (t0, tCheio, tSai, rotulo = "pra consultar depois") => {
    const s = K.el(`<svg class="abs salvar" style="left:400px;top:470px;width:280px;height:360px;opacity:0" viewBox="0 0 280 360"><path d="M40 30 Q40 14 56 14 H224 Q240 14 240 30 V336 L140 262 L40 336 Z" fill="rgba(242,194,0,0)" stroke="#F2C200" stroke-width="14" stroke-linejoin="round"/></svg>`);
    const m = s.querySelector("path"); gsap.set(m, { strokeDasharray: 1000, strokeDashoffset: 1000 });
    tl.set(s, { opacity: 1 }, t0);
    tl.to(m, { strokeDashoffset: 0, duration: 0.4, ease: "power2.inOut" }, t0);
    tl.to(m, { fill: "rgba(242,194,0,1)", duration: 0.12 }, tCheio);
    tl.fromTo(s, { scale: 1 }, { scale: 1.14, duration: 0.12, ease: "power2.out", yoyo: true, repeat: 1, transformOrigin: "50% 50%" }, tCheio);
    const r = K.el(`<div class="abs" style="left:0;width:1080px;top:880px;text-align:center;font:600 34px var(--mono);color:var(--mudo);opacity:0">${rotulo}</div>`);
    tl.fromTo(r, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3 }, tCheio + 0.5);
    K.sai([s, r], tSai, 0.24); return s;
  };

  /* ---------- trilho de passos no topo ---------- */
  K.trilho = (tempos, t0, tSai) => {
    const n = tempos.length, larg = 700, passo = (larg - 70) / (n - 1);
    const tr = K.el(`<div class="abs trilho"><div class="fio"></div><div class="enche"></div></div>`);
    const enche = tr.querySelector(".enche"); gsap.set(enche, { scaleX: 0 });
    const nos = tempos.map((_, i) => { const d = document.createElement("div"); d.className = "no"; d.style.left = i * passo + "px"; d.textContent = i + 1; tr.appendChild(d); return d; });
    const rot = K.el(`<div class="abs passo-rot">PASSO 1 DE ${n}</div>`);
    tl.fromTo(tr, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.4, ease: "expo.out" }, t0);
    tempos.forEach((t, i) => {
      tl.to(nos[i], { background: "#F2C200", borderColor: "#F2C200", color: "#111", scale: 1.15, duration: 0.25, ease: "back.out(3)" }, t);
      if (i > 0) tl.to(nos[i - 1], { scale: 1, background: "rgba(242,194,0,.18)", color: "#F2C200", duration: 0.2 }, t);
      tl.to(enche, { scaleX: i / (n - 1), duration: 0.4, ease: "power3.inOut" }, t - 0.1);
      tl.set(rot, { textContent: `PASSO ${i + 1} DE ${n}` }, t);
      tl.fromTo(rot, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25 }, t);
    });
    K.sai([tr, rot], tSai, 0.3); return tr;
  };

  /* ---------- carimbo (ex.: "NÃO É O SITE") ---------- */
  K.carimbo = (texto, t, tSai, x = 380, y = 640) => {
    const c = K.el(`<div class="abs carimbo" style="left:${x}px;top:${y}px">${texto}</div>`);
    tl.fromTo(c, { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.22, ease: "power4.in" }, t);
    if (tSai) K.sai(c, tSai, 0.28); return c;
  };

  /* ---------- cartões de entrega (pdf, skill...) ---------- */
  K.cartao = (icone, titulo, sub, x, t, efeito = "pop") => {
    const c = K.el(`<div class="abs cartao" style="left:${x}px">${K.ICON[icone] || icone}<b>${titulo}</b><small>${sub}</small></div>`);
    efeito === "pop" ? K.pop(c, t, 0.45) : tl.fromTo(c, { opacity: 0, x: 120, scale: 0.8 }, { opacity: 1, x: 0, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, t);
    return c;
  };
  K.selo = (texto, x, y, t) => { const s = K.el(`<div class="abs selo" style="left:${x}px;top:${y}px">${texto}</div>`);
    tl.fromTo(s, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3)" }, t); return s; };

  /* ---------- CTA-assinatura: "comenta" + teclas + "no direct" ---------- */
  K.teclas = (palavra, chamada, t0, tAperta, tDirect) => {
    const L = palavra.toUpperCase().split(""), lado = L.length <= 5 ? 150 : Math.floor(860 / L.length) - 22, gap = 22;
    const total = L.length * lado + (L.length - 1) * gap, x0 = (1080 - total) / 2;
    const cm = K.el(`<div class="abs comenta">${chamada}</div>`);
    tl.fromTo(cm, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, t0);
    L.forEach((c, i) => {
      const k = K.el(`<div class="abs tecla" style="left:${x0 + i * (lado + gap)}px;width:${lado}px;height:${lado}px;font-size:${Math.round(lado * 0.55)}px">${c}</div>`);
      tl.fromTo(k, { opacity: 0, y: -90, rotation: -6 + i * 3 }, { opacity: 1, y: 0, rotation: 0, duration: 0.42, ease: "back.out(1.6)" }, t0 + 0.05 + i * 0.05);
      const t = tAperta + i * 0.055;
      tl.to(k, { y: 11, boxShadow: "0 3px 0 #0C0E11, 0 10px 18px rgba(0,0,0,.5)", background: "linear-gradient(#2A2F38,#20242B)", duration: 0.06 }, t);
      tl.to(k, { y: 0, boxShadow: "0 14px 0 #0C0E11, 0 28px 40px rgba(0,0,0,.5)", background: "linear-gradient(#20242B,#181B21)", duration: 0.16 }, t + 0.07);
    });
    const d = K.el(`<div class="abs direct">${K.ICON.aviao}no direct</div>`);
    tl.fromTo(d, { opacity: 0, scale: 0.7, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(2)" }, tDirect);
  };

  /* ---------- o personagem Bit ---------- */
  K.bit = () => {
    const b = K.el(`<div id="bit" class="abs"><div id="excl" class="abs">!</div>
      <svg style="overflow:visible" width="260" height="360" viewBox="0 0 260 360" fill="none" stroke="#EDEFF3" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
        <line x1="130" y1="22" x2="130" y2="2"/><circle id="ant" cx="130" cy="2" r="9" fill="#F2C200" stroke="none"/>
        <g id="cabeca"><rect x="40" y="22" width="180" height="128" rx="36" fill="#14161B"/><rect x="60" y="42" width="140" height="88" rx="24" fill="rgba(242,194,0,.07)" stroke="none"/>
          <rect id="olhoE" x="96" y="70" width="16" height="32" rx="8" fill="#EDEFF3" stroke="none"/><rect id="olhoD" x="148" y="70" width="16" height="32" rx="8" fill="#EDEFF3" stroke="none"/><rect id="boca" x="112" y="111" width="36" height="8" rx="4" fill="#EDEFF3" stroke="none"/></g>
        <line x1="130" y1="150" x2="130" y2="170"/><rect x="84" y="170" width="92" height="110" rx="30" fill="#14161B"/>
        <path d="M122 210 L146 225 L122 240 Z" fill="#F2C200" stroke="none"/>
        <line id="bracoE" x1="88" y1="192" x2="42" y2="250"/><line id="bracoD" x1="172" y1="192" x2="218" y2="250"/>
        <line x1="112" y1="280" x2="106" y2="344"/><line x1="148" y1="280" x2="154" y2="344"/></svg></div>`);
    gsap.set("#bracoE", { svgOrigin: "88 192" }); gsap.set("#bracoD", { svgOrigin: "172 192" }); gsap.set("#cabeca", { svgOrigin: "130 150" }); gsap.set("#boca", { svgOrigin: "130 115" });
    const olhos = ["#olhoE", "#olhoD"];
    return {
      el: b,
      chega: (t) => K.entra(b, t, 0.55, { y: 120, scale: 0.9 }),
      // braço "E" (esquerdo da tela) aponta para cima/esquerda com ângulo positivo; "D" com ângulo negativo
      aponta: (lado, ang, t, ate) => { const br = lado === "D" ? "#bracoD" : "#bracoE"; tl.to(br, { rotation: ang, duration: 0.3, ease: "back.out(2)" }, t); tl.to(br, { rotation: 0, duration: 0.3, ease: "power2.inOut" }, ate); },
      acena: (t) => tl.to("#cabeca", { rotation: 8, duration: 0.14, yoyo: true, repeat: 3, ease: "sine.inOut" }, t),
      pula: (t) => tl.to(b, { y: "-=26", duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out" }, t),
      balanca: (t, vezes = 4) => { for (let k = 0; k < vezes; k++) tl.to(b, { y: k % 2 ? 0 : -12, duration: 0.18, ease: "sine.inOut" }, t + k * 0.18);
        tl.to("#ant", { scale: 1.5, transformOrigin: "50% 50%", duration: 0.12, yoyo: true, repeat: vezes - 1 }, t); },
      susto: (t, ate) => { tl.to(olhos, { scale: 1.6, transformOrigin: "50% 50%", duration: 0.14, ease: "back.out(3)" }, t);
        tl.fromTo("#excl", { opacity: 0, y: 20, scale: 0.5 }, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: "back.out(3)" }, t + 0.02);
        tl.to(b, { x: "+=14", duration: 0.05, yoyo: true, repeat: 5, ease: "none" }, t + 0.04);
        tl.to("#excl", { opacity: 0, duration: 0.2 }, ate); tl.to(olhos, { scale: 1, duration: 0.2 }, ate + 0.1); },
      pisca: (tempos) => tempos.forEach((t) => { tl.to(olhos, { scaleY: 0.1, transformOrigin: "50% 50%", duration: 0.05 }, t); tl.to(olhos, { scaleY: 1, duration: 0.08 }, t + 0.07); }),
      some: (t) => tl.to(b, { opacity: 0, y: 80, duration: 0.25, ease: "power2.in" }, t),
      volta: (t) => tl.to(b, { opacity: 1, y: 0, duration: 0.4, ease: "expo.out" }, t),
      vaiPara: (x, y, escala, t, d = 0.5) => tl.to(b, { x, y, scale: escala, duration: d, ease: "power3.inOut" }, t),
      poe: (x, y, escala, t) => tl.set(b, { x, y, scale: escala }, t),
      // boca acompanhando a voz: pts = [[tempo, abertura 0..1], ...] (scripts/boca_bit.py)
      fala: (pts) => pts.forEach(([t, v]) => tl.set("#boca", { scaleY: 1 + v * 2.6, scaleX: 1 - v * 0.15 }, t)),
      comemora: (t) => { tl.to("#bracoE", { rotation: 150, duration: 0.3, ease: "back.out(2)" }, t); tl.to("#bracoD", { rotation: -150, duration: 0.3, ease: "back.out(2)" }, t);
        tl.to(b, { y: "-=30", duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" }, t + 0.02); },
    };
  };

  /* ---------- legenda (1–3 palavras, *chave* em destaque) ---------- */
  K.legendas = (LEG) => {
    const box = $("#legendas");
    LEG.forEach(([txt, a, b]) => {
      const d = document.createElement("div"); d.className = "abs leg"; d.innerHTML = txt.replace(/\*(.+?)\*/g, "<em>$1</em>"); box.appendChild(d);
      tl.fromTo(d, { opacity: 0, y: 14, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.14, ease: "power3.out" }, a);
      const em = d.querySelector("em"); if (em) tl.fromTo(em, { "--s": 0 }, { "--s": 1, duration: 0.22, ease: "power2.out" }, a + 0.06);
      tl.set(d, { opacity: 0 }, b);
    });
  };

  K.fim = () => { tl.set({}, {}, DUR); window.__timelines = window.__timelines || {}; window.__timelines["main"] = tl; };
  return K;
}
