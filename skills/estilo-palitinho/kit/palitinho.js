/* Kit do estilo Palitinho (HyperFrames + GSAP + SVG). Lê window.DADOS (escrito pelo montar.py) e monta uma timeline só.
   Bonecos de palito articulados (ombro, cotovelo, quadril, joelho, cabeça), com poses e caras; cenários e objetos desenhados
   em SVG; câmera; legenda de 1 a 2 palavras; "comenta" em teclas. Tudo é desenhado uma vez por quadro, no onUpdate da timeline.
   Determinístico: nada de Math.random/Date (o que parece aleatório usa um gerador com semente fixa). */
function PALITO(tl, D) {
  const W = 1080, H = 1920, CHAO = 1170, NS = "http://www.w3.org/2000/svg";
  const COR = Object.assign({ papel: "#F3EADB", tinta: "#1D1C22", destaque: "#E4572E", pele: "#FFFFFF" }, D.cores || {});
  const svg = document.querySelector("#palco");
  const mk = (tag, at = {}, pai) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (pai) pai.appendChild(e); return e; };
  let semente = 11; const rnd = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);
  const SONS = []; const som = (t, tipo) => SONS.push({ t: +Math.max(0, t).toFixed(3), tipo });
  const INI = D.inicios, DUR = D.dur;
  const fimDe = (i) => (i + 1 < INI.length ? INI[i + 1] : DUR);
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const quando = (i, palavra, padrao) => { if (palavra == null) return padrao; if (typeof palavra === "number") return INI[i] + palavra;
    const n = norm(palavra); const p = D.palavras.find((x) => x.bloco === i && norm(x.w).startsWith(n)); return p ? p.s : padrao; };
  const TUDO = []; // funções de desenho chamadas a cada quadro

  // ---------- câmera: um <g> com todas as cenas; zoom em volta de um ponto ----------
  const defs = mk("defs", {}, svg);
  const f = mk("filter", { id: "papel", x: 0, y: 0, width: 1, height: 1 }, defs);
  mk("feTurbulence", { type: "fractalNoise", baseFrequency: 0.9, numOctaves: 2, seed: 4, result: "r" }, f);
  mk("feColorMatrix", { in: "r", type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0" }, f);
  const camG = mk("g", {}, svg);
  const grao = mk("rect", { x: 0, y: 0, width: W, height: H, filter: "url(#papel)", "pointer-events": "none" }, svg);
  const cam = { x: W / 2, y: 820, z: 1 };
  TUDO.push(() => camG.setAttribute("transform", `translate(${W / 2} ${820}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`));
  const camera = (t, dur, alvo, ease = "power2.inOut") => { if (dur >= 0.8 && (alvo.z || 1) > 1.15) som(t, "whoosh"); return tl.to(cam, Object.assign({ duration: dur, ease }, alvo), t); };

  // ---------- cenários ----------
  const CENARIO = {
    papel: (g) => { mk("rect", { x: -600, y: -600, width: W + 1200, height: H + 1200, fill: COR.papel }, g); },
    campo: (g) => {
      const c = mk("linearGradient", { id: "ceuC", x1: 0, y1: 0, x2: 0, y2: 1 }, defs); mk("stop", { offset: 0, "stop-color": "#A9D8EA" }, c); mk("stop", { offset: 1, "stop-color": "#EAF4E7" }, c);
      mk("rect", { x: -600, y: -600, width: W + 1200, height: CHAO + 600, fill: "url(#ceuC)" }, g);
      mk("circle", { cx: 860, cy: 330, r: 80, fill: "#FFD46A" }, g);
      for (let k = 0; k < 3; k++) nuvem(g, 150 + k * 330, 260 + (k % 2) * 90, 0.9 + (k % 2) * 0.3);
      mk("path", { d: `M-600 ${CHAO - 70} Q 200 ${CHAO - 150} 540 ${CHAO - 90} T ${W + 600} ${CHAO - 80} V ${H + 600} H -600 Z`, fill: "#BFD98A" }, g);
      mk("rect", { x: -600, y: CHAO, width: W + 1200, height: H + 600, fill: "#A6C46D" }, g);
      mk("line", { x1: -600, y1: CHAO, x2: W + 600, y2: CHAO, stroke: COR.tinta, "stroke-width": 6 }, g);
    },
    noite: (g) => {
      mk("rect", { x: -600, y: -600, width: W + 1200, height: CHAO + 600, fill: "#1F2745" }, g);
      for (let k = 0; k < 40; k++) mk("circle", { cx: -100 + rnd() * (W + 200), cy: rnd() * (CHAO - 300), r: 1.5 + rnd() * 3, fill: "#F3EADB", opacity: 0.5 + rnd() * 0.5 }, g);
      mk("circle", { cx: 820, cy: 300, r: 70, fill: "#F3EADB" }, g); mk("circle", { cx: 850, cy: 280, r: 62, fill: "#1F2745" }, g);
      mk("rect", { x: -600, y: CHAO, width: W + 1200, height: H + 600, fill: "#28341F" }, g);
      mk("line", { x1: -600, y1: CHAO, x2: W + 600, y2: CHAO, stroke: "#0E1210", "stroke-width": 6 }, g);
    },
    cidade: (g) => {
      mk("rect", { x: -600, y: -600, width: W + 1200, height: CHAO + 600, fill: "#CFE6EE" }, g);
      [[-200, 380, 300], [80, 260, 220], [280, 470, 260], [520, 320, 200], [700, 540, 240], [920, 300, 260], [1150, 420, 220]].forEach(([x, h, w]) => {
        mk("rect", { x, y: CHAO - h, width: w, height: h, fill: "#9DB3C4", stroke: COR.tinta, "stroke-width": 5 }, g);
        for (let yy = CHAO - h + 40; yy < CHAO - 60; yy += 70) for (let xx = x + 30; xx < x + w - 40; xx += 60) mk("rect", { x: xx, y: yy, width: 28, height: 36, fill: "#F3EADB", opacity: 0.85 }, g);
      });
      mk("rect", { x: -600, y: CHAO, width: W + 1200, height: H + 600, fill: "#8C8C8C" }, g);
      mk("line", { x1: -600, y1: CHAO, x2: W + 600, y2: CHAO, stroke: COR.tinta, "stroke-width": 6 }, g);
    },
    sala: (g) => {
      mk("rect", { x: -600, y: -600, width: W + 1200, height: CHAO + 600, fill: "#E9DCC4" }, g);
      mk("rect", { x: 650, y: 380, width: 280, height: 250, fill: "#BFE0EC", stroke: COR.tinta, "stroke-width": 7 }, g);
      mk("line", { x1: 790, y1: 380, x2: 790, y2: 630, stroke: COR.tinta, "stroke-width": 6 }, g);
      mk("rect", { x: 140, y: 420, width: 200, height: 150, fill: "#E4572E", opacity: 0.85, stroke: COR.tinta, "stroke-width": 7 }, g);
      mk("rect", { x: -600, y: CHAO, width: W + 1200, height: H + 600, fill: "#B88A5C" }, g);
      mk("line", { x1: -600, y1: CHAO, x2: W + 600, y2: CHAO, stroke: COR.tinta, "stroke-width": 6 }, g);
    },
    escritorio: (g) => {
      CENARIO.sala(g);
      mk("rect", { x: 560, y: CHAO - 250, width: 420, height: 26, fill: "#8A5A35", stroke: COR.tinta, "stroke-width": 6 }, g);
      mk("line", { x1: 590, y1: CHAO - 224, x2: 590, y2: CHAO, stroke: COR.tinta, "stroke-width": 8 }, g);
      mk("line", { x1: 950, y1: CHAO - 224, x2: 950, y2: CHAO, stroke: COR.tinta, "stroke-width": 8 }, g);
      objeto(g, { nome: "computador", x: 770, y: CHAO - 250, s: 1 });
    },
    floresta: (g) => {
      CENARIO.campo(g);
      [[-60, 1.1], [120, 0.8], [880, 1.2], [1040, 0.9]].forEach(([x, s]) => objeto(g, { nome: "arvore", x, y: CHAO, s }));
    },
  };
  function nuvem(g, x, y, s) { const n = mk("g", { transform: `translate(${x} ${y}) scale(${s})` }, g);
    [[0, 0, 50], [45, -20, 60], [95, 0, 48]].forEach(([cx, cy, r]) => mk("circle", { cx, cy, r, fill: "#fff" }, n)); return n; }

  // ---------- objetos (desenhados em volta de (0,0) = base do objeto) ----------
  const T = (g, txt, at, maxW = 940) => { const a2 = Object.assign({ "text-anchor": "middle", "font-family": "M", "font-weight": 900, fill: COR.tinta }, at);
    const fs = Number(a2["font-size"] || 60), est = String(txt).length * fs * 0.66; if (est > maxW) a2["font-size"] = Math.floor(fs * maxW / est);
    const e = mk("text", a2, g); e.textContent = txt; return e; };
  function objeto(pai, o) {
    const g = mk("g", { transform: `translate(${o.x} ${o.y}) scale(${o.s || 1})` }, pai);
    const L = { stroke: COR.tinta, "stroke-width": 7, "stroke-linejoin": "round", "stroke-linecap": "round" };
    const d = {
      fogueira: () => { [[-70, 10], [70, 10]].forEach(([x]) => mk("line", Object.assign({ x1: x, y1: 0, x2: -x * 0.2, y2: -40 }, L, { "stroke-width": 16, stroke: "#6B4026" }), g));
        const ch = mk("g", {}, g); mk("path", { d: "M-55 -20 Q -60 -110 0 -170 Q 60 -110 55 -20 Z", fill: "#F28C28", stroke: COR.tinta, "stroke-width": 6 }, ch);
        mk("path", { d: "M-28 -25 Q -30 -80 0 -115 Q 30 -80 28 -25 Z", fill: "#FFD46A" }, ch); return ch; },
      arvore: () => { mk("rect", { x: -22, y: -170, width: 44, height: 170, fill: "#7A4E2D", stroke: COR.tinta, "stroke-width": 6 }, g);
        [[0, -260, 120], [-80, -200, 80], [80, -200, 80]].forEach(([cx, cy, r]) => mk("circle", { cx, cy, r, fill: "#6FA05A", stroke: COR.tinta, "stroke-width": 6 }, g)); },
      casa: () => { mk("rect", { x: -150, y: -220, width: 300, height: 220, fill: "#F6F1E7", stroke: COR.tinta, "stroke-width": 7 }, g);
        mk("path", { d: "M-185 -215 L0 -360 L185 -215 Z", fill: "#E4572E", stroke: COR.tinta, "stroke-width": 7, "stroke-linejoin": "round" }, g);
        mk("rect", { x: -40, y: -120, width: 80, height: 120, fill: "#8A5A35", stroke: COR.tinta, "stroke-width": 6 }, g); },
      celular: () => { mk("rect", { x: -70, y: -260, width: 140, height: 260, rx: 22, fill: "#2A2A33", stroke: COR.tinta, "stroke-width": 6 }, g);
        mk("rect", { x: -56, y: -240, width: 112, height: 210, rx: 10, fill: o.cor || "#9FD3E6" }, g); if (o.texto) T(g, o.texto, { y: -125, "font-size": 34, fill: "#fff" }); },
      computador: () => { mk("rect", { x: -150, y: -190, width: 300, height: 180, rx: 12, fill: "#2A2A33", stroke: COR.tinta, "stroke-width": 6 }, g);
        mk("rect", { x: -134, y: -176, width: 268, height: 150, rx: 6, fill: o.cor || "#9FD3E6" }, g); mk("rect", { x: -20, y: -12, width: 40, height: 14, fill: COR.tinta }, g);
        if (o.texto) T(g, o.texto, { y: -90, "font-size": 34, fill: "#fff" }); },
      dinheiro: () => { mk("rect", { x: -110, y: -120, width: 220, height: 120, rx: 10, fill: "#8CCB7A", stroke: COR.tinta, "stroke-width": 6 }, g); T(g, "$", { y: -38, "font-size": 80, fill: "#2E6B2A" }); },
      relogio: () => { mk("circle", { cx: 0, cy: -90, r: 90, fill: "#fff", stroke: COR.tinta, "stroke-width": 8 }, g);
        mk("line", Object.assign({ x1: 0, y1: -90, x2: 0, y2: -150 }, L), g); mk("line", Object.assign({ x1: 0, y1: -90, x2: 45, y2: -90 }, L), g); },
      placa: () => { mk("line", Object.assign({ x1: 0, y1: 0, x2: 0, y2: -160 }, L, { "stroke-width": 12, stroke: "#7A4E2D" }), g);
        mk("rect", { x: -180, y: -300, width: 360, height: 150, rx: 12, fill: "#F6F1E7", stroke: COR.tinta, "stroke-width": 7 }, g); T(g, o.texto || "", { y: -205, "font-size": 56 }); },
      interrogacao: () => T(g, "?", { y: 0, "font-size": 200, fill: o.cor || COR.destaque, stroke: COR.tinta, "stroke-width": 6, "paint-order": "stroke" }),
      exclamacao: () => T(g, "!", { y: 0, "font-size": 200, fill: o.cor || COR.destaque, stroke: COR.tinta, "stroke-width": 6, "paint-order": "stroke" }),
      coracao: () => mk("path", { d: "M0 -20 C -90 -80 -70 -170 0 -130 C 70 -170 90 -80 0 -20 Z", fill: "#E4572E", stroke: COR.tinta, "stroke-width": 6 }, g),
      lampada: () => { mk("circle", { cx: 0, cy: -130, r: 70, fill: "#FFD46A", stroke: COR.tinta, "stroke-width": 7 }, g); mk("rect", { x: -30, y: -70, width: 60, height: 50, fill: "#9A9A9A", stroke: COR.tinta, "stroke-width": 6 }, g); },
      pensamento: () => { [[-60, -20, 12], [-30, -60, 18]].forEach(([cx, cy, r]) => mk("circle", { cx, cy, r, fill: "#fff", stroke: COR.tinta, "stroke-width": 5 }, g));
        mk("ellipse", { cx: 60, cy: -170, rx: 200, ry: 95, fill: "#fff", stroke: COR.tinta, "stroke-width": 6 }, g); T(g, o.texto || "", { x: 60, y: -150, "font-size": 50 }); },
      fala: () => { mk("path", { d: "M-210 -230 H210 V-80 H-20 L-60 -20 L-60 -80 H-210 Z", fill: "#fff", stroke: COR.tinta, "stroke-width": 6, "stroke-linejoin": "round" }, g);
        T(g, o.texto || "", { y: -140, "font-size": 50 }); },
      seta: () => mk("path", { d: "M-120 -40 H40 V-90 L130 0 L40 90 V40 H-120 Z", fill: o.cor || COR.destaque, stroke: COR.tinta, "stroke-width": 6, "stroke-linejoin": "round", transform: "translate(0 -90)" }, g),
      trofeu: () => { mk("path", { d: "M-80 -260 H80 Q 80 -140 0 -120 Q -80 -140 -80 -260 Z", fill: "#F2C200", stroke: COR.tinta, "stroke-width": 7 }, g);
        mk("rect", { x: -16, y: -120, width: 32, height: 70, fill: "#F2C200", stroke: COR.tinta, "stroke-width": 6 }, g); mk("rect", { x: -70, y: -50, width: 140, height: 50, fill: "#8A5A35", stroke: COR.tinta, "stroke-width": 6 }, g); },
      caixa: () => { mk("rect", { x: -110, y: -170, width: 220, height: 170, fill: "#D7A86E", stroke: COR.tinta, "stroke-width": 7 }, g); if (o.texto) T(g, o.texto, { y: -70, "font-size": 46 }); },
      texto: () => T(g, o.texto || "", { y: 0, "font-size": o.tam || 90, fill: o.cor || COR.tinta }),
    };
    const vivo = (d[o.nome] || d.texto)();
    g.__vivo = vivo; return g;
  }

  // ---------- boneco de palito ----------
  const POSE = {
    parado: { oE: 14, cE: 8, oD: 14, cD: 8, qE: 9, jE: 0, qD: 9, jD: 0, tr: 0, cab: 0 },
    acena: { oE: 14, cE: 8, oD: 150, cD: 25, qE: 9, qD: 9 },
    aponta: { oE: 14, cE: 8, oD: 92, cD: 0, qE: 9, qD: 9, tr: 4 },
    apontaE: { oE: 92, cE: 0, oD: 14, cD: 8, qE: 9, qD: 9, tr: -4 },
    pensa: { oE: 14, cE: 8, oD: 35, cD: 135, qE: 9, qD: 9, cab: 10 },
    assusta: { oE: 145, cE: 25, oD: 145, cD: 25, qE: 18, qD: 18, tr: 0 },
    comemora: { oE: 160, cE: 10, oD: 160, cD: 10, qE: 14, qD: 14 },
    triste: { oE: 6, cE: 2, oD: 6, cD: 2, qE: 6, qD: 6, tr: 0, cab: 14 },
    bravo: { oE: 40, cE: 105, oD: 40, cD: 105, qE: 16, qD: 16 },
    duvida: { oE: 60, cE: 95, oD: 60, cD: 95, qE: 9, qD: 9, cab: -8 },
    mostra: { oE: 14, cE: 8, oD: 70, cD: 60, qE: 9, qD: 9 },
    corre: { oE: 60, cE: 80, oD: -30, cD: 80, qE: 35, jE: 30, qD: -30, jD: -40, tr: 10 },
  };
  const CARA = { normal: { sorri: 0.25, sobr: 0, boca: 0 }, feliz: { sorri: 1, sobr: 0.3, boca: 0.2 }, triste: { sorri: -0.8, sobr: -0.6, boca: 0 },
    bravo: { sorri: -0.5, sobr: -1, boca: 0 }, assustado: { sorri: 0, sobr: 1, boca: 0.8 }, surpreso: { sorri: 0, sobr: 1, boca: 0.6 }, pensando: { sorri: 0, sobr: 0.4, boca: 0 } };
  function boneco(pai, o) {
    const s = o.s || 1, g = mk("g", {}, pai), TINTA = o.tinta || COR.tinta;
    const st = Object.assign({ x: o.x, y: o.y != null ? o.y : CHAO, op: 1, dy: 0, olhar: 0, pisca: 1, fala: 0 }, POSE.parado, CARA.normal, POSE[o.pose] || {}, CARA[o.cara] || {});
    const corpo = o.camisa || TINTA, L = (cor, w) => ({ stroke: cor, "stroke-width": w, "stroke-linecap": "round", fill: "none" });
    const pernaE = [mk("line", L(TINTA, 11), g), mk("line", L(TINTA, 11), g)], pernaD = [mk("line", L(TINTA, 11), g), mk("line", L(TINTA, 11), g)];
    const tronco = mk("line", L(corpo, o.camisa ? 34 : 11), g);
    const bracoE = [mk("line", L(o.camisa || TINTA, o.camisa ? 18 : 11), g), mk("line", L(TINTA, 11), g)], bracoD = [mk("line", L(o.camisa || TINTA, o.camisa ? 18 : 11), g), mk("line", L(TINTA, 11), g)];
    const cab = mk("g", {}, g);
    mk("circle", { cx: 0, cy: 0, r: 62, fill: COR.pele, stroke: TINTA, "stroke-width": 8 }, cab);
    const cabelo = { espetado: "M-50 -38 L-40 -78 L-22 -52 L-8 -88 L8 -56 L26 -86 L36 -52 L54 -70 L50 -36", baguncado: "M-56 -28 Q -66 -80 -18 -78 Q 0 -100 24 -80 Q 66 -78 56 -26",
      careca: "", rabo: "M44 -30 Q 96 -10 80 50" }[o.cabelo || "espetado"];
    if (cabelo) mk("path", { d: cabelo, fill: "none", stroke: TINTA, "stroke-width": 8, "stroke-linejoin": "round", "stroke-linecap": "round" }, cab);
    const olhoE = mk("ellipse", { rx: 7, ry: 9, fill: TINTA }, cab), olhoD = mk("ellipse", { rx: 7, ry: 9, fill: TINTA }, cab);
    const sobE = mk("line", L(TINTA, 6), cab), sobD = mk("line", L(TINTA, 6), cab);
    const boca = mk("path", { fill: "none", stroke: TINTA, "stroke-width": 6, "stroke-linecap": "round", "stroke-linejoin": "round" }, cab);
    if (o.nome) { const n = mk("text", { "text-anchor": "middle", "font-family": "M", "font-weight": 900, "font-size": 40, fill: TINTA, y: 0 }, g); n.textContent = o.nome; g.__nome = n; }
    const R = Math.PI / 180, dir = (a) => [Math.sin(a * R), Math.cos(a * R)], LEN = { coxa: 98, canela: 96, tronco: 150, braco: 84, ante: 80 };
    const seg = (ln, a, b) => { ln.setAttribute("x1", a[0]); ln.setAttribute("y1", a[1]); ln.setAttribute("x2", b[0]); ln.setAttribute("y2", b[1]); };
    const mais = (p, a, l) => { const d = dir(a); return [p[0] + d[0] * l, p[1] + d[1] * l]; };
    function desenha() {
      const balanco = st.fala > 0 ? Math.sin(st.fala * 30) : 0;
      g.setAttribute("transform", `translate(${st.x} ${st.y - st.dy}) scale(${s})`); g.setAttribute("opacity", st.op);
      const quadril = [0, -(LEN.coxa + LEN.canela)];
      const pesc = mais(quadril, 180 + st.tr, LEN.tronco), ombro = mais(quadril, 180 + st.tr, LEN.tronco - 16);
      const jE = mais(quadril, -st.qE, LEN.coxa), jD = mais(quadril, st.qD, LEN.coxa);
      seg(pernaE[0], quadril, jE); seg(pernaE[1], jE, mais(jE, -st.qE - st.jE, LEN.canela));
      seg(pernaD[0], quadril, jD); seg(pernaD[1], jD, mais(jD, st.qD + st.jD, LEN.canela));
      seg(tronco, quadril, pesc);
      const cE = mais(ombro, -st.oE + st.tr, LEN.braco), cD = mais(ombro, st.oD + st.tr, LEN.braco);
      seg(bracoE[0], ombro, cE); seg(bracoE[1], cE, mais(cE, -st.oE - st.cE + st.tr, LEN.ante));
      seg(bracoD[0], ombro, cD); seg(bracoD[1], cD, mais(cD, st.oD + st.cD + st.tr, LEN.ante));
      const centro = mais(pesc, 180 + st.tr + st.cab * 0.5, 58);
      cab.setAttribute("transform", `translate(${centro[0]} ${centro[1]}) rotate(${st.tr + st.cab})`);
      const ox = st.olhar * 14, py = Math.max(0.08, st.pisca);
      olhoE.setAttribute("cx", -20 + ox); olhoE.setAttribute("cy", -6); olhoE.setAttribute("ry", 9 * py);
      olhoD.setAttribute("cx", 20 + ox); olhoD.setAttribute("cy", -6); olhoD.setAttribute("ry", 9 * py);
      const sy = -26 - st.sobr * 8, inc = st.sobr * -7;
      seg(sobE, [-32 + ox, sy - inc], [-10 + ox, sy + inc]); seg(sobD, [10 + ox, sy + inc], [32 + ox, sy - inc]);
      const ab = Math.max(st.boca, st.fala > 0 ? 0.25 + 0.35 * Math.abs(balanco) : 0), my = 22, w = 18 + st.sorri * 4, c = st.sorri * 14;
      boca.setAttribute("d", ab > 0.05 ? `M${-w + ox} ${my} Q ${ox} ${my + c + ab * 30} ${w + ox} ${my} Q ${ox} ${my + c - ab * 6} ${-w + ox} ${my} Z` : `M${-w + ox} ${my} Q ${ox} ${my + c} ${w + ox} ${my}`);
      boca.setAttribute("fill", ab > 0.05 ? TINTA : "none");
      if (g.__nome) g.__nome.setAttribute("y", -(LEN.coxa + LEN.canela + LEN.tronco + 150));
    }
    TUDO.push(desenha);
    const b = { st, g, s };
    BONECOS.push(b); return b;
  }
  const BONECOS = [];
  const pisca = (b, t0, t1) => { for (let t = t0 + 0.8 + (b.s * 0.37 % 0.6); t < t1 - 0.3; t += 2.6) tl.to(b.st, { pisca: 0.08, duration: 0.07, yoyo: true, repeat: 1, ease: "none" }, t); };

  // ações de um boneco no tempo (pose, cara, anda, pula, fala, olha)
  function age(b, a, t, t1) {
    if (a.pose) {
      const p = POSE[a.pose] || {};
      tl.to(b.st, Object.assign({ duration: a.dur || 0.35, ease: "back.out(1.6)" }, p), t);
      if (a.pose === "acena") tl.to(b.st, { cD: 60, duration: 0.22, yoyo: true, repeat: 5, ease: "sine.inOut" }, t + 0.35);
      if (a.pose === "corre") { const ciclo = { qE: [35, -30], qD: [-30, 35], oE: [60, -30], oD: [-30, 60] };
        tl.to(b.st, { qE: -30, qD: 35, oE: -30, oD: 60, jE: -40, jD: 30, duration: 0.18, yoyo: true, repeat: Math.max(1, Math.floor(((a.ate || t1) - t) / 0.18) - 1), ease: "sine.inOut" }, t + 0.35); void ciclo; }
    }
    if (a.cara) tl.to(b.st, Object.assign({ duration: 0.25, ease: "power2.out" }, CARA[a.cara] || {}), t);
    if (a.olha != null) tl.to(b.st, { olhar: a.olha, duration: 0.25 }, t);
    if (a.anda) { const d = Math.max(0.6, a.anda.dur || Math.abs(a.anda.x - b.st.x) / 420);
      tl.to(b.st, { x: a.anda.x, duration: d, ease: "power1.inOut" }, t);
      tl.to(b.st, { qE: -22, qD: 22, oE: -18, oD: 30, duration: 0.2, yoyo: true, repeat: Math.max(1, Math.round(d / 0.2) - 1), ease: "sine.inOut" }, t);
      tl.to(b.st, { qE: 9, qD: 9, oE: 14, oD: 14, duration: 0.2 }, t + d); }
    if (a.pula) { som(t, "pop"); tl.to(b.st, { dy: 90, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 1 }, t); }
    if (a.fala) { const ate = a.ate || Math.min(t1, t + (a.dur || 1.6)); tl.fromTo(b.st, { fala: 0.001 }, { fala: (ate - t) * 1.2, duration: ate - t, ease: "none", immediateRender: false }, t); tl.set(b.st, { fala: 0 }, ate); }
    if (a.some) { tl.to(b.st, { op: 0, duration: 0.3 }, t); }
    if (a.aparece) { tl.fromTo(b.st, { op: 0 }, { op: 1, duration: 0.3, immediateRender: false }, t); }
  }

  const entra = (el, t, tipo = "pop") => { som(t, tipo); tl.fromTo(el, { opacity: 0, scale: 0.3, transformOrigin: "50% 100%" }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)", immediateRender: false }, t); return el; };
  const sai = (el, t) => tl.to(el, { opacity: 0, duration: 0.2 }, t);

  // ---------- fundo: ilustração do modo caprichado (cenas/bN.jpg) ou cenário desenhado ----------
  const fundo = (g, c, padrao = "papel") => {
    if (c.video) return true; // clipe animado por baixo (montar.py): aqui só entra o que vai por cima
    if (c.imagem) { mk("rect", { x: -600, y: -600, width: W + 1200, height: H + 1200, fill: COR.papel }, g);
      const im = mk("image", { x: 0, y: 0, width: W, height: H, preserveAspectRatio: "xMidYMid slice" }, g); im.setAttribute("href", c.imagem); return true; }
    (CENARIO[c.fundo] || CENARIO[padrao])(g); return false;
  };
  const rotulo = (g, r, i, t0) => { // etiqueta de marcador com seta opcional, presa no desenho (anda junto com a câmera)
    const e = mk("g", { opacity: 0 }, g), tam = r.tam || 52, larg = Math.max(160, String(r.texto).length * tam * 0.62 + 50);
    const bx = r.x - larg / 2, by = r.y - tam - 18;
    if (r.seta) { const [sx, sy] = r.seta; mk("path", { d: `M${r.x} ${r.y + 14} Q ${(r.x + sx) / 2 + 40} ${(r.y + sy) / 2} ${sx} ${sy}`, fill: "none", stroke: COR.tinta, "stroke-width": 7, "stroke-linecap": "round" }, e);
      mk("circle", { cx: sx, cy: sy, r: 9, fill: COR.tinta }, e); }
    mk("rect", { x: bx, y: by, width: larg, height: tam + 30, rx: 14, fill: r.cor || "#fff", stroke: COR.tinta, "stroke-width": 6 }, e);
    T(e, r.texto, { x: r.x, y: r.y, "font-size": tam, fill: r.corTexto || COR.tinta }, larg - 30);
    entra(e, quando(i, r.em, t0 + 0.4), "ping"); return e;
  };
  const circulo = (g, k, i, t0) => { // círculo vermelho "à mão" desenhando em volta de algo
    const rx = k.rx || k.r || 120, ry = k.ry || k.r || 120;
    const d = `M${k.x + rx} ${k.y} C ${k.x + rx} ${k.y - ry * 1.1} ${k.x - rx * 1.05} ${k.y - ry} ${k.x - rx} ${k.y + 4} C ${k.x - rx} ${k.y + ry * 1.05} ${k.x + rx * 1.1} ${k.y + ry} ${k.x + rx * 0.92} ${k.y - ry * 0.25}`;
    const pth = mk("path", { d, fill: "none", stroke: COR.destaque, "stroke-width": 10, "stroke-linecap": "round", "stroke-dasharray": 2000, "stroke-dashoffset": 2000 }, g);
    const t = quando(i, k.em, t0 + 0.6); som(t, "ping"); tl.to(pth, { attr: { "stroke-dashoffset": 0 }, duration: 0.6, ease: "power2.inOut" }, t); return pth;
  };

  // ---------- cenas ----------
  const camada = (i, t0, t1) => { const g = mk("g", { opacity: 0 }, camG); tl.set(g, { attr: { opacity: 1 } }, t0); if (i + 1 < D.cenas.length) tl.set(g, { attr: { opacity: 0 } }, t1); return g; };
  const CENA = {};
  // história: um cenário, bonecos, objetos e ações amarradas às palavras da fala
  CENA.historia = (c, i, t0, t1) => {
    const g = camada(i, t0, t1); (CENARIO[c.fundo] || CENARIO.papel)(g);
    const objs = (c.objetos || []).map((o) => { const el = objeto(g, o); if (o.em != null) { el.setAttribute("opacity", 0); entra(el, quando(i, o.em, t0 + 0.3)); }
      if (o.nome === "fogueira") tl.fromTo(el.__vivo, { scaleY: 0.92, transformOrigin: "50% 100%" }, { scaleY: 1.08, duration: 0.18, yoyo: true, repeat: Math.max(1, Math.floor((t1 - t0) / 0.18)), ease: "sine.inOut", immediateRender: false }, t0);
      if (o.sai != null) sai(el, quando(i, o.sai, t1 - 0.3)); return el; });
    const escuro = { noite: true }[c.fundo];
    const bs = (c.bonecos || []).map((o) => { const b = boneco(g, Object.assign({ s: 1.3, tinta: escuro ? "#F3EADB" : undefined }, o)); pisca(b, t0, t1); return b; });
    (c.acoes || []).forEach((a) => { const b = bs[a.quem || 0]; if (!b) return; age(b, a, quando(i, a.em, t0 + 0.2), t1); });
    const cm = c.camera || {};
    tl.set(cam, { x: cm.x != null ? cm.x : W / 2, y: cm.y != null ? cm.y : 820, z: cm.z || 1 }, t0);
    if (cm.para) camera(quando(i, cm.para.em, t0 + 0.4), cm.para.dur || Math.max(1, (t1 - t0) * 0.7), cm.para, cm.para.ease || "power1.inOut");
    else tl.to(cam, { z: (cm.z || 1) * 1.05, duration: t1 - t0, ease: "none" }, t0);
    void objs;
  };
  // ilustração do modo caprichado: a imagem da cena com a câmera andando, e por cima selo, rótulos, círculo e número
  CENA.ilustracao = (c, i, t0, t1) => {
    const g = camada(i, t0, t1); fundo(g, c);
    const cm = c.camera || {}, de = Object.assign({ x: W / 2, y: 820, z: 1 }, cm.de || {}), para = Object.assign({ x: de.x, y: de.y, z: de.z * 1.1 }, cm.para || {});
    if (c.video) tl.set(cam, { x: W / 2, y: 820, z: 1 }, t0); // o clipe já se mexe: o que vai por cima fica parado
    else { tl.set(cam, de, t0); tl.to(cam, Object.assign({ duration: t1 - t0, ease: cm.ease || "sine.inOut" }, para), t0); }
    (c.rotulos || []).forEach((r) => rotulo(g, r, i, t0));
    (c.circulos || []).forEach((k) => circulo(g, k, i, t0));
    (c.bonecos || []).forEach((o) => { const b = boneco(g, o); pisca(b, t0, t1); (c.acoes || []).filter((a) => (a.quem || 0) === c.bonecos.indexOf(o)).forEach((a) => age(b, a, quando(i, a.em, t0 + 0.2), t1)); });
    if (c.numero) { const n = c.numero, tv = quando(i, n.em, t0 + 0.4), alvo = Number(String(n.valor).replace(/\D/g, "")) || 0;
      const fmt = (v) => (n.prefixo || "") + Math.round(v).toLocaleString("pt-BR") + (n.sufixo || "");
      const el = T(g, n.texto || fmt(alvo), { x: n.x || W / 2, y: n.y || 330, "font-size": n.tam || 200, fill: COR.destaque, stroke: COR.tinta, "stroke-width": 9, "paint-order": "stroke" });
      el.setAttribute("opacity", 0); if (n.texto) entra(el, tv, "impacto");
      else { const cont = { v: 0 }; el.textContent = fmt(0); tl.set(el, { attr: { opacity: 1 } }, tv); som(tv, "impacto");
        tl.to(cont, { v: alvo, duration: Math.min(1.3, (t1 - tv) * 0.6), ease: "power2.out", onUpdate: () => (el.textContent = fmt(cont.v)) }, tv); } }
  };
  // selo fixo no canto (ex.: "DIA 3"), fora da câmera: vale para qualquer cena com "selo"
  const seloFixo = (c, i, t0, t1) => { if (!c.selo || c.tipo === "cta") return;
    const e = mk("g", { opacity: 0 }, svg), larg = Math.max(180, c.selo.length * 34 + 60);
    mk("rect", { x: 50, y: 150, width: larg, height: 84, rx: 16, fill: COR.tinta }, e); T(e, c.selo, { x: 50 + larg / 2, y: 208, "font-size": 50, fill: "#fff" }, larg - 30);
    tl.set(e, { attr: { opacity: 1 } }, t0); tl.set(e, { attr: { opacity: 0 } }, t1); };
  // número grande contando, com um boneco reagindo
  CENA.numero = (c, i, t0, t1) => {
    const g = camada(i, t0, t1); const temImg = fundo(g, c);
    tl.set(cam, { x: W / 2, y: 820, z: 1 }, t0); if (temImg && !c.video) tl.to(cam, { z: 1.06, duration: t1 - t0, ease: "none" }, t0);
    const tv = quando(i, c.em, t0 + 0.3);
    const rot = T(g, c.rotulo || "", { x: W / 2, y: 330, "font-size": 64 });
    const alvo = Number(String(c.valor).replace(/\D/g, "")) || 0, fmt = (v) => (c.prefixo || "") + Math.round(v).toLocaleString("pt-BR") + (c.sufixo || "");
    const num = T(g, c.texto || fmt(alvo), { x: W / 2, y: 545, "font-size": 230, fill: COR.destaque, stroke: COR.tinta, "stroke-width": 8, "paint-order": "stroke" });
    if (c.texto) { num.textContent = c.texto; num.setAttribute("opacity", 0); entra(num, tv, "impacto"); }
    else { const cont = { v: 0 }; num.textContent = fmt(0); num.setAttribute("opacity", 0); tl.set(num, { attr: { opacity: 1 } }, tv);
      tl.to(cont, { v: alvo, duration: Math.min(1.4, (t1 - tv) * 0.6), ease: "power2.out", onUpdate: () => (num.textContent = fmt(cont.v)) }, tv); som(tv, "impacto"); }
    if (c.sub) { const s2 = T(g, c.sub, { x: W / 2, y: 645, "font-size": 58, fill: COR.tinta }); s2.setAttribute("opacity", 0); entra(s2, tv + 0.5, "ping"); }
    if (c.boneco !== false && !temImg) { const b = boneco(g, { x: W / 2, y: CHAO, s: 0.95, pose: "parado", cabelo: c.cabelo, camisa: c.camisa }); pisca(b, t0, t1);
      age(b, { pose: c.reacao || "assusta", cara: c.cara || "surpreso" }, tv + 0.2, t1); }
    if (temImg) { const placa = mk("rect", { x: 60, y: 220, width: W - 120, height: 470, rx: 30, fill: COR.papel, opacity: 0.92, stroke: COR.tinta, "stroke-width": 7 }, g);
      g.insertBefore(placa, rot); placa.setAttribute("opacity", 0); tl.to(placa, { attr: { opacity: 0.92 }, duration: 0.25 }, tv - 0.15); }
    void rot;
  };
  // grade de quadradinhos (ex.: 365 dias, 1 em vermelho)
  CENA.grade = (c, i, t0, t1) => {
    const g = camada(i, t0, t1); CENARIO.papel(g); tl.set(cam, { x: W / 2, y: 820, z: 1 }, t0);
    T(g, c.rotulo || "", { x: W / 2, y: 330, "font-size": 60 });
    const n = c.total || 100, col = c.colunas || 10, tam = Math.min(70, Math.floor(860 / col)), x0 = W / 2 - (col * tam) / 2, y0 = 400;
    const quadros = []; for (let k = 0; k < n; k++) quadros.push(mk("rect", { x: x0 + (k % col) * tam + 3, y: y0 + Math.floor(k / col) * tam + 3, width: tam - 6, height: tam - 6, rx: 4, fill: "#D8CDB8", stroke: COR.tinta, "stroke-width": 3, opacity: 0 }, g));
    const te = quando(i, c.em, t0 + 0.3); tl.to(quadros, { attr: { opacity: 1 }, duration: 0.01, stagger: Math.min(0.02, 1.2 / n) }, te);
    (c.destacar || []).forEach((k) => { if (quadros[k]) { tl.to(quadros[k], { attr: { fill: COR.destaque }, duration: 0.2 }, quando(i, c.destaque_em, te + 1.4)); } });
    som(te, "whoosh");
  };
  // comparação lado a lado (ex.: ChatGPT x Claude, antes x depois)
  CENA.comparacao = (c, i, t0, t1) => {
    const g = camada(i, t0, t1); fundo(g, c); tl.set(cam, { x: W / 2, y: 820, z: 1 }, t0);
    mk("line", { x1: W / 2, y1: 300, x2: W / 2, y2: CHAO, stroke: COR.tinta, "stroke-width": 6, "stroke-dasharray": "18 14" }, g);
    [c.esquerda || {}, c.direita || {}].forEach((lado, k) => {
      const x = k ? W * 0.75 : W * 0.25, te = quando(i, lado.em, t0 + 0.3 + k * 0.8);
      const tit = T(g, lado.titulo || "", { x, y: 360, "font-size": 80, fill: lado.cor || (k ? COR.destaque : COR.tinta) }, 470); tit.setAttribute("opacity", 0); entra(tit, te, "ping");
      if (lado.objeto) { const o = objeto(g, Object.assign({ x, y: 700, s: 1 }, lado.objeto)); o.setAttribute("opacity", 0); entra(o, te + 0.2); }
      const b = boneco(g, { x, y: CHAO, s: 0.95, pose: "parado", cabelo: lado.cabelo || (k ? "baguncado" : "espetado"), camisa: lado.camisa }); pisca(b, t0, t1);
      age(b, { pose: lado.pose || "mostra", cara: lado.cara || "normal" }, te + 0.3, t1);
    });
  };
  // título no papel
  CENA.titulo = (c, i, t0, t1) => {
    const g = camada(i, t0, t1); fundo(g, c); tl.set(cam, { x: W / 2, y: 820, z: 1 }, t0);
    const t = T(g, c.texto || "", { x: W / 2, y: 420, "font-size": c.tam || 120, fill: COR.tinta }); t.setAttribute("opacity", 0); entra(t, t0 + 0.2, "impacto");
    if (c.sub) { const s2 = T(g, c.sub, { x: W / 2, y: 520, "font-size": 62, fill: COR.destaque }); s2.setAttribute("opacity", 0); entra(s2, t0 + 0.6, "ping"); }
    if (c.boneco !== false) { const b = boneco(g, { x: W / 2, y: CHAO, s: 1.2, pose: c.pose || "mostra", cabelo: c.cabelo, camisa: c.camisa }); pisca(b, t0, t1); }
  };
  // CTA: "comenta" + teclas, com o boneco apontando
  CENA.cta = (c, i, t0, t1) => {
    const g = camada(i, t0, t1); const temFundo = fundo(g, c); tl.set(cam, { x: W / 2, y: 820, z: 1 }, t0);
    const b = temFundo ? null : boneco(g, { x: W / 2, y: CHAO, s: 0.85, pose: "comemora", cara: "feliz", cabelo: c.cabelo, camisa: c.camisa }); if (b) pisca(b, t0, t1);
    const f = document.querySelector("#cta"); tl.fromTo(f, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, t0);
    const pw = c.palavra || "", tk = pw ? quando(i, pw, t0 + 1.6) : t0 + 1.6, tc = quando(i, (c.antes || "comenta").split(" ")[0], t0 + 1);
    if (document.querySelector("#cta .ia")) { som(t0 + 0.2, "ping"); tl.fromTo("#cta .ia", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2)", immediateRender: false }, t0 + 0.2); }
    tl.fromTo("#cta .linha", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.25, ease: "power2.out", immediateRender: false }, tc);
    if (pw) { [...pw].forEach((_, k) => som(tk + k * 0.09, "tecla")); tl.fromTo("#cta .tecla", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.09, ease: "back.out(2)", immediateRender: false }, tk); }
    if (b) age(b, { pula: true }, tk + 0.1, t1);
  };
  if (window.CENAS_EXTRA) window.CENAS_EXTRA({ tl, D, CENA, CENARIO, objeto, boneco, age, entra, sai, camera, cam, camada, quando, som, mk, T, COR, CHAO, W, H, pisca, fundo, rotulo, circulo });

  D.cenas.forEach((c, i) => { const t0 = INI[i], t1 = fimDe(i); (CENA[c.tipo] || CENA.historia)(c, i, t0, t1); seloFixo(c, i, t0, t1); });

  // legenda: 1 a 2 palavras por vez, destaque nas palavras-chave
  const leg = document.querySelector("#legenda");
  const CHAVE = new Set((D.destaques || []).map(norm));
  const grupos = []; let gr = [];
  D.palavras.forEach((p, k) => { gr.push(p); const fim = /[.,!?:]$/.test(p.w) || gr.length === 2 || (D.palavras[k + 1] && D.palavras[k + 1].s - p.e > 0.25); if (fim) { grupos.push(gr); gr = []; } });
  if (gr.length) grupos.push(gr);
  grupos.forEach((g2, k) => {
    const el = document.createElement("div"); el.className = "pal";
    g2.forEach((p, j) => { const s = document.createElement("span"); s.textContent = p.w.replace(/[.,!?:]$/, "") + (j < g2.length - 1 ? " " : ""); if (CHAVE.has(norm(p.w))) s.className = "chave"; el.appendChild(s); });
    leg.appendChild(el);
    const a = g2[0].s, b = k + 1 < grupos.length ? grupos[k + 1][0].s : g2[g2.length - 1].e + 0.4;
    tl.fromTo(el, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.12, ease: "power2.out", immediateRender: false }, a);
    tl.to(el, { opacity: 0, duration: 0.06 }, Math.max(a + 0.15, b - 0.04));
  });
  // corte de cena: um "whoosh" leve só quando a cena muda de cenário
  D.cenas.forEach((c, i) => { if (i > 0 && (c.fundo || c.tipo) !== (D.cenas[i - 1].fundo || D.cenas[i - 1].tipo)) som(INI[i], "whoosh"); });

  tl.set({}, {}, DUR);
  const desenha = () => TUDO.forEach((fn) => fn());
  desenha(); tl.eventCallback("onUpdate", desenha);
  window.__sons = SONS; void grao;
  const pre = document.createElement("pre"); pre.id = "sons"; pre.style.display = "none"; pre.textContent = JSON.stringify(SONS); document.body.appendChild(pre);
}
