/* Kit do estilo Mapas (HyperFrames + GSAP + d3-geo). Lê window.DADOS (escrito pelo montar.py) e monta uma timeline só.
   O mapa é um globo ortográfico desenhado em canvas a cada quadro, a partir do estado da câmera (lon, lat, raio) que o GSAP anima.
   Tudo determinístico: nada de Math.random/Date; o "ruído" do papel usa um gerador com semente fixa. */
function MAPA(tl, D) {
  const W = 1080, H = 1920;
  const cv = document.querySelector("#mapa"), ctx = cv.getContext("2d");
  const topo = D.topo, obj = topo.objects.countries;
  const PAISES = topojson.feature(topo, obj).features;
  const porNome = {}; PAISES.forEach((f) => (porNome[f.properties.name] = f));
  const COR = Object.assign({ terra: "#E9DDBF", borda: "#9C8B6A", oceano1: "#1F5B6B", oceano2: "#2C7F8E", fora: "#0E1A22" }, D.cores || {});
  const PINTA = {}; // nome -> {cor, a} (a = opacidade animada)
  const cam = { lon: 0, lat: 10, r: 560, gira: 0 };
  const proj = d3.geoOrthographic().clipAngle(90).precision(0.3);
  const path = d3.geoPath(proj, ctx);
  const grade = d3.geoGraticule10();
  const fronteiras = {}; // camadas extras: {id: {geo, cor, largura, prog, montanhas}}
  const extras = { deslocar: null }; // país copiado e deslocado: {nome, dlon, dlat, p, cor}
  const faixas = []; // [{latN, latS, lonW, lonE, cor, a, recorte: nome}] pintam um pedaço de um país

  // ruído do papel (semente fixa)
  let semente = 7; const rnd = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);
  const papel = document.createElement("canvas"); papel.width = 540; papel.height = 960;
  const pc = papel.getContext("2d"); const img = pc.createImageData(540, 960);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rnd() - 0.5) * 60; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 26; }
  pc.putImageData(img, 0, 0);

  // girar a esfera levando o ponto a até o ponto b pelo caminho mais curto (o país muda de lugar sem mudar de tamanho)
  const RAD = Math.PI / 180;
  const vec = ([lon, lat]) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];
  const ll = ([x, y, z]) => [Math.atan2(y, x) / RAD, Math.asin(Math.max(-1, Math.min(1, z))) / RAD];
  function rotacao(a, b) {
    const A = vec(a), B = vec(b); let k = [A[1] * B[2] - A[2] * B[1], A[2] * B[0] - A[0] * B[2], A[0] * B[1] - A[1] * B[0]];
    const sn0 = Math.hypot(k[0], k[1], k[2]), cs0 = A[0] * B[0] + A[1] * B[1] + A[2] * B[2];
    if (sn0 < 1e-9) return (p) => p;
    k = k.map((v) => v / sn0); const th = Math.atan2(sn0, cs0), cs = Math.cos(th), sn = Math.sin(th);
    return (p) => { const v = vec(p), kv = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
      const cr = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
      return ll([0, 1, 2].map((j) => v[j] * cs + cr[j] * sn + k[j] * kv * (1 - cs))); };
  }
  // o contorno da faixa vai no sentido horário (norte → leste → sul → oeste): no sentido contrário o d3 pinta o lado de fora
  // levar o país de a até b sem ele tombar: gira em volta do eixo da Terra (longitude) e depois pelo meridiano (latitude).
  // As duas são giros da esfera, então o país mantém o tamanho real e o norte para cima no centro.
  function translada(a, b, p) {
    let dl = b[0] - a[0]; while (dl > 180) dl -= 360; while (dl < -180) dl += 360;
    const dlon = dl * p, dlat = (b[1] - a[1]) * p, c = (a[0] + dlon) * RAD, th = -dlat * RAD;
    const k = [-Math.sin(c), Math.cos(c), 0], cs = Math.cos(th), sn = Math.sin(th);
    return ([lon, lat]) => { const v = vec([lon + dlon, lat]), kv = k[0] * v[0] + k[1] * v[1];
      const cr = [k[1] * v[2], -k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
      return ll([0, 1, 2].map((j) => v[j] * cs + cr[j] * sn + k[j] * kv * (1 - cs))); };
  }
  function anel(fx) { // retângulo de latitude/longitude com as bordas nos paralelos
    const r = [], n = Math.max(2, Math.ceil(Math.abs(fx.lonE - fx.lonW)));
    for (let k = 0; k <= 4; k++) r.push([fx.lonW, fx.latN + (fx.latS - fx.latN) * k / 4]);
    for (let k = 1; k <= n; k++) r.push([fx.lonW + (fx.lonE - fx.lonW) * k / n, fx.latS]);
    for (let k = 1; k <= 4; k++) r.push([fx.lonE, fx.latS + (fx.latN - fx.latS) * k / 4]);
    for (let k = 1; k <= n; k++) r.push([fx.lonE + (fx.lonW - fx.lonE) * k / n, fx.latN]);
    return r.reverse();
  }

  function desenha() {
    proj.rotate([-cam.lon + cam.gira, -cam.lat, 0]).scale(cam.r).translate([W / 2, H * 0.47]);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COR.fora; ctx.fillRect(0, 0, W, H);
    // oceano (esfera) com degradê
    const c = proj.translate(), g = ctx.createRadialGradient(c[0] - cam.r * 0.3, c[1] - cam.r * 0.3, cam.r * 0.1, c[0], c[1], cam.r * 1.05);
    g.addColorStop(0, COR.oceano2); g.addColorStop(1, COR.oceano1);
    ctx.beginPath(); path({ type: "Sphere" }); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); path(grade); ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 1.5; ctx.stroke();
    // terra
    ctx.beginPath(); PAISES.forEach((f) => path(f)); ctx.fillStyle = COR.terra; ctx.fill();
    // países pintados
    for (const [nome, p] of Object.entries(PINTA)) {
      if (!p.a || !porNome[nome]) continue;
      ctx.save(); ctx.globalAlpha = p.a; ctx.beginPath(); path(porNome[nome]);
      if (p.brilho) { ctx.shadowColor = p.cor; ctx.shadowBlur = 40 * p.a; }
      ctx.fillStyle = p.cor; ctx.fill(); ctx.restore();
    }
    // faixas (um pedaço do país com outra cor: limites históricos aproximados)
    for (const fx of faixas) {
      if (!fx.a) continue;
      ctx.save(); ctx.beginPath();
      path({ type: "Polygon", coordinates: [fx.paralelos ? anel(fx) : [[fx.lonW, fx.latN], [fx.lonE, fx.latN], [fx.lonE, fx.latS], [fx.lonW, fx.latS], [fx.lonW, fx.latN]]] });
      ctx.clip(); ctx.globalAlpha = fx.a; ctx.beginPath(); path(porNome[fx.recorte]); ctx.fillStyle = fx.cor; ctx.fill();
      ctx.globalAlpha = fx.a * 0.9; ctx.strokeStyle = "#fff"; ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    }
    // bordas
    ctx.beginPath(); PAISES.forEach((f) => path(f)); ctx.strokeStyle = COR.borda; ctx.lineWidth = 1.6; ctx.stroke();
    // camadas de linha (Andes, fronteiras)
    for (const L of Object.values(fronteiras)) {
      if (!L.prog) continue;
      const linhas = L.geo.coordinates || []; ctx.save();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      linhas.forEach((ln) => {
        const n = Math.max(2, Math.floor(ln.length * L.prog)); const parte = { type: "LineString", coordinates: ln.slice(0, n) };
        ctx.beginPath(); path(parte); ctx.strokeStyle = L.sombra || "rgba(0,0,0,.35)"; ctx.lineWidth = L.largura + 8; ctx.stroke();
        ctx.beginPath(); path(parte); ctx.strokeStyle = L.cor; ctx.lineWidth = L.largura; ctx.stroke();
        if (L.montanhas) { // triângulos low poly ao longo da linha
          for (let k = 0; k < n; k += L.montanhas) {
            const pt = proj(ln[k]); if (!pt) continue; const s = L.tamanho || 26;
            ctx.beginPath(); ctx.moveTo(pt[0] - s, pt[1] + s * 0.55); ctx.lineTo(pt[0], pt[1] - s); ctx.lineTo(pt[0] + s, pt[1] + s * 0.55); ctx.closePath();
            ctx.fillStyle = "#8A6B4E"; ctx.fill(); ctx.beginPath(); ctx.moveTo(pt[0] - s * 0.35, pt[1] - s * 0.35); ctx.lineTo(pt[0], pt[1] - s); ctx.lineTo(pt[0] + s * 0.35, pt[1] - s * 0.35); ctx.closePath();
            ctx.fillStyle = "#F6F6F2"; ctx.fill();
          }
        }
      });
      ctx.restore();
    }
    // país deslocado (comparar tamanhos)
    const X = extras.deslocar;
    if (X && X.p > 0) {
      const f = porNome[X.nome]; const mov = JSON.parse(JSON.stringify(f.geometry));
      const anda = (co) => (typeof co[0] === "number" ? [co[0] + X.dlon * X.p, co[1] + X.dlat * X.p] : co.map(anda));
      mov.coordinates = anda(mov.coordinates);
      ctx.save(); ctx.globalAlpha = Math.min(1, X.p * 3); ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 30; ctx.beginPath(); path(mov);
      ctx.fillStyle = X.cor; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = "#fff"; ctx.stroke(); ctx.restore();
    }
    // países levados para outro lugar girando a esfera (mantém o tamanho real) - cenas mover e trocar
    for (const M of (extras.moves || [])) {
      if (!M.p || !M.a) continue;
      const R = translada(M.de, M.para, M.p), g = porNome[M.nome].geometry;
      const anda = (co) => (typeof co[0] === "number" ? R(co) : co.map(anda));
      ctx.save(); ctx.globalAlpha = Math.min(1, M.p * 3) * M.a; ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 30;
      ctx.beginPath(); path({ type: g.type, coordinates: anda(g.coordinates) });
      ctx.fillStyle = M.cor; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = "#fff"; ctx.stroke(); ctx.restore();
    }
    // rotas (linha tracejada pelo caminho mais curto no globo) - cena rota
    for (const R of (extras.rotas || [])) {
      if (!R.prog || !R.a) continue;
      const it = d3.geoInterpolate(R.de, R.para), pts = [];
      for (let k = 0; k <= 80 * R.prog; k++) pts.push(it(k / 80));
      pts.push(it(R.prog));
      ctx.save(); ctx.globalAlpha = R.a; ctx.lineCap = "round";
      ctx.beginPath(); path({ type: "LineString", coordinates: pts }); ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 14; ctx.stroke();
      ctx.beginPath(); path({ type: "LineString", coordinates: pts }); ctx.strokeStyle = R.cor; ctx.lineWidth = 7; ctx.setLineDash([22, 14]); ctx.stroke();
      const h = proj(it(R.prog)); if (h) { ctx.setLineDash([]); ctx.beginPath(); ctx.arc(h[0], h[1], 12, 0, 7); ctx.fillStyle = R.cor; ctx.fill(); }
      ctx.restore();
    }
    // papel por cima
    ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.drawImage(papel, 0, 0, W, H); ctx.restore();
    // vinheta
    const v = ctx.createRadialGradient(W / 2, H * 0.47, H * 0.3, W / 2, H * 0.47, H * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.55)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    posiciona();
  }

  // ---------- elementos HTML presos ao mapa ----------
  const camada = document.querySelector("#rotulos");
  const presos = []; // {el, lon, lat, dx, dy}
  function prende(el, lon, lat, dx = 0, dy = 0) { presos.push({ el, lon, lat, dx, dy }); camada.appendChild(el); return el; }
  function posiciona() {
    presos.forEach((p) => {
      const pt = proj([p.lon, p.lat]); const vis = pt && d3.geoDistance([p.lon, p.lat], [cam.lon - cam.gira, cam.lat]) < 1.45;
      if (!pt || !vis) { p.el.style.visibility = "hidden"; return; }
      p.el.style.visibility = ""; p.el.style.left = pt[0] + p.dx + "px"; p.el.style.top = pt[1] + p.dy + "px";
    });
  }
  const div = (cls, txt) => { const e = document.createElement("div"); e.className = cls; if (txt) e.textContent = txt; return e; };
  const emoji = (nome, tam = 190) => { const e = div("emoji"); const i = document.createElement("img"); i.src = "emoji/" + nome + ".png"; i.style.width = i.style.height = tam + "px"; e.appendChild(i); return e; };
  const SONS = []; const som = (t, tipo) => SONS.push({ t: +t.toFixed(3), tipo });
  const entra = (el, t, opts = {}) => { som(t, el.classList.contains("emoji") ? "pop" : (el.classList.contains("grande") ? "impacto" : "ping")); tl.fromTo(el, { opacity: 0, scale: 0.4, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(2.2)", immediateRender: false }, t); return el; };
  const sai = (el, t) => tl.to(el, { opacity: 0, scale: 0.6, duration: 0.25, ease: "power2.in" }, t);
  const flutua = (el, t0, t1) => tl.fromTo(el, { rotation: -6 }, { rotation: 6, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: Math.max(0, Math.floor((t1 - t0) / 0.9) - 1), immediateRender: false }, t0 + 0.45);

  // ---------- câmera e pintura animadas ----------
  const upd = {}; // o desenho acontece uma vez por quadro, no onUpdate da timeline inteira
  const ultima = { lon: cam.lon, lat: cam.lat, r: cam.r }; // onde a câmera vai estar, na ordem em que as cenas são montadas
  const camera = (t, dur, alvo, ease = "power2.inOut") => {
    if (alvo.lon != null) { let l = alvo.lon; while (l - ultima.lon > 180) l -= 360; while (l - ultima.lon < -180) l += 360; alvo = Object.assign({}, alvo, { lon: l }); }
    Object.assign(ultima, alvo); if (dur >= 0.9) som(t, "whoosh");
    return tl.to(cam, Object.assign({ duration: dur, ease }, alvo, upd), t);
  };
  const pinta = (nome, cor, t, dur = 0.5, brilho = false) => { PINTA[nome] = PINTA[nome] || { cor, a: 0, brilho }; const o = PINTA[nome]; tl.to(o, { a: 1, duration: dur, ...upd, onStart: () => { o.cor = cor; o.brilho = brilho; } }, t); };
  const apaga = (nome, t, dur = 0.4) => { if (PINTA[nome]) tl.to(PINTA[nome], { a: 0, duration: dur, ...upd }, t); };

  const INI = D.inicios, DUR = D.dur;
  const fimDe = (i) => (i + 1 < INI.length ? INI[i + 1] : DUR);
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const quando = (i, palavra, padrao) => { const n = norm(palavra); const p = D.palavras.find((x) => x.bloco === i && norm(x.w).startsWith(n)); return p ? p.s : padrao; };

  // estado inicial
  desenha();
  const borda = (a, b) => topojson.mesh(topo, obj, (x, y) => (x.properties.name === a && y.properties.name === b) || (x.properties.name === b && y.properties.name === a));
  fronteiras.andes = { geo: borda("Chile", "Argentina"), cor: "#6E5440", largura: 6, prog: 0, montanhas: 3, tamanho: 26 };
  fronteiras.patagonia = { geo: borda("Chile", "Argentina"), cor: "#FFD54A", largura: 9, prog: 0, sombra: "rgba(255,213,74,.35)" };

  const CENA = {};
  CENA.globo = (c, i, t0, t1) => {
    cam.lon = -10; cam.lat = 5; cam.r = 520; desenha();
    camera(t0, 1.6, { lon: -62, lat: -18, r: 780 }, "power2.inOut");
    pinta("Chile", "#D8433B", t0 + 0.6, 0.6, true);
    camera(t0 + 1.7, 1.6, { lon: -71, lat: -37, r: 2350 }, "power3.inOut");
    const s = entra(prende(div("selo", c.selo), -66, -30, 40, 0), quando(i, "quatro", t0 + 2.4));
    const e = entra(prende(emoji(c.emoji, 150), -64, -40, 40, 0), quando(i, "quatro", t0 + 2.4) + 0.1); flutua(e, t0 + 2.6, t1);
    sai(s, t1 - 0.3); sai(e, t1 - 0.3);
  };
  CENA.comparar = (c, i, t0, t1) => {
    camera(t0, 1.0, { lon: -60, lat: -22, r: 1500 });
    pinta("Brazil", "#3E9B5A", t0 + 0.3, 0.5);
    extras.deslocar = { nome: "Chile", dlon: 18.6, dlat: 21.9, p: 0, cor: "#D8433B" };
    tl.to(extras.deslocar, { p: 1, duration: 1.4, ease: "power3.inOut", ...upd }, quando(i, "cima", t0 + 1.2));
    const r = entra(prende(div("rotulo grande", c.rotulo), -51, -14, 0, 0), quando(i, "oiapoque", t0 + 3));
    const e = entra(prende(emoji(c.emoji, 170), -38, -8, 0, 0), quando(i, "oiapoque", t0 + 3) + 0.15);
    tl.to(extras.deslocar, { p: 0, duration: 0.8, ease: "power2.inOut", ...upd }, t1 - 0.8);
    apaga("Brazil", t1 - 0.6); sai(r, t1 - 0.5); sai(e, t1 - 0.5);
  };
  CENA.andes = (c, i, t0, t1) => {
    camera(t0, 1.0, { lon: -68, lat: -36, r: 2350 });
    tl.to(fronteiras.andes, { prog: 1, duration: 1.8, ease: "power1.inOut", ...upd }, quando(i, "parede", t0 + 1));
    const r = entra(prende(div("rotulo", c.rotulo), -64, -30, 0, 0), quando(i, "cordilheira", t0 + 2));
    const e = entra(prende(emoji(c.emoji, 160), -63, -40, 0, 0), quando(i, "cordilheira", t0 + 2) + 0.1); flutua(e, t0 + 2.2, t1);
    sai(r, t1 - 0.3); sai(e, t1 - 0.3);
  };
  CENA.pacifico = (c, i, t0, t1) => {
    camera(t0, 1.2, { lon: -76, lat: -35, r: 2200 });
    const r = entra(prende(div("rotulo agua", c.rotulo), -84, -32, 0, 0), quando(i, "oceano", t0 + 0.5));
    const s = entra(prende(div("selo", "ESPREMIDO"), -71, -38, 0, 0), quando(i, "espremido", t0 + 2));
    sai(r, t1 - 0.3); sai(s, t1 - 0.3);
  };
  CENA.colonia = (c, i, t0, t1) => {
    camera(t0, 1.0, { lon: -71, lat: -34, r: 2600 });
    const n = div("navio"); n.appendChild(emoji(c.emoji, 150));
    const nav = prende(n, -74.5, -18, 0, 0);
    tl.fromTo(nav, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, t0 + 0.3);
    const p = { lat: -18 }; tl.to(p, { lat: -40, duration: t1 - t0 - 0.8, ease: "none", onUpdate: () => { presos.find((x) => x.el === nav).lat = p.lat; } }, t0 + 0.3);
    pinta("Chile", "#E8A23A", quando(i, "faixa", t0 + 1.5), 0.6, true);
    tl.to(fronteiras.andes, { prog: 1, duration: 0.01, ...upd }, t0);
    sai(nav, t1 - 0.3);
  };
  CENA.independencia = (c, i, t0, t1) => {
    camera(t0, 1.0, { lon: -70, lat: -37, r: 2350 });
    if (PINTA.Chile) tl.to(PINTA.Chile, { a: 0.22, duration: 0.5, ...upd, onStart: () => (PINTA.Chile.brilho = false) }, t0 + 0.2);
    const fx = { latN: c.latN, latS: c.latS, lonW: -80, lonE: -60, cor: "#F2B33D", a: 0, recorte: "Chile" }; faixas.push(fx);
    tl.to(fx, { a: 1, duration: 0.5, ...upd }, quando(i, "pedaco", t0 + 2.5) - 0.3);
    const a = entra(prende(div("selo grande", c.ano), -63.5, -32, 0, 0), quando(i, "mil", t0 + 1.2));
    const r = entra(prende(div("rotulo", "SÓ O MEIO"), -63.5, -36.5, 0, 0), quando(i, "pedaco", t0 + 2.5));
    sai(a, t1 - 0.3); sai(r, t1 - 0.3); tl.to(fx, { a: 0, duration: 0.4, ...upd }, t1 - 0.2);
  };
  CENA.atacama = (c, i, t0, t1) => {
    if (!CENA._atacamaJa) {
      CENA._atacamaJa = true;
      pinta("Chile", "#D8433B", t0, 0.4); tl.set(PINTA.Chile, { brilho: true }, t0);
      camera(t0, 1.2, { lon: -68, lat: -21, r: 5200 });
      pinta("Bolivia", "#E9B949", t0 + 0.6, 0.5); pinta("Peru", "#4FA3A5", t0 + 0.8, 0.5);
      const f1 = { latN: -21.5, latS: -25.4, lonW: -72, lonE: -66, cor: "#E9B949", a: 0, recorte: "Chile" };
      const f2 = { latN: -17.5, latS: -21.5, lonW: -72, lonE: -66, cor: "#4FA3A5", a: 0, recorte: "Chile" };
      faixas.push(f1, f2); CENA._faixas = [f1, f2];
      tl.to([f1, f2], { a: 1, duration: 0.6, ...upd }, quando(i, "atacama", t0 + 1.5));
      entra(CENA._rb = prende(div("rotulo", "BOLÍVIA"), -65, -18, 0, 0), quando(i, "bolivia", t0 + 2));
      entra(CENA._rp = prende(div("rotulo", "PERU"), -73, -15.5, 0, 0), quando(i, "peru", t0 + 2.3));
      const e = entra(prende(emoji(c.emoji, 170), -69.5, -23.5, 0, 0), quando(i, "salitre", t1 - 1)); flutua(e, t1 - 0.8, t1 + 3);
      CENA._ea = e;
    } else {
      sai(CENA._ea, t0 + 0.1);
      const e = entra(prende(emoji(c.emoji, 180), -69.5, -23.5, 0, 0), t0 + 0.2); flutua(e, t0 + 0.4, t1);
      const s1 = entra(prende(div("selo", "ADUBO"), -63.5, -22, 0, 0), quando(i, "adubo", t0 + 1.4));
      const s2 = entra(prende(div("selo", "PÓLVORA"), -63.5, -24.6, 0, 0), quando(i, "polvora", t0 + 2));
      sai(e, t1 - 0.3); sai(s1, t1 - 0.3); sai(s2, t1 - 0.3);
    }
  };
  CENA.guerra = (c, i, t0, t1) => {
    const a = entra(prende(div("selo grande", c.ano), -64, -20, 0, 0), t0 + 0.3);
    const e = entra(prende(emoji(c.emoji, 200), -69.5, -21.5, 0, 0), quando(i, "guerra", t0 + 1.2)); flutua(e, t0 + 1.6, t1);
    const [f1, f2] = CENA._faixas;
    tl.to([f1, f2], { a: 0, duration: 0.8, ...upd }, quando(i, "venceu", t0 + 3));
    tl.to(PINTA.Chile, { a: 1, duration: 0.3, ...upd, onStart: () => (PINTA.Chile.brilho = true) }, quando(i, "venceu", t0 + 3));
    const sm = entra(prende(div("selo vermelho", "SEM MAR"), -64, -17, 0, 0), quando(i, "saida", t1 - 1.5));
    sai(a, t1 - 0.3); sai(e, t1 - 0.3); sai(sm, t1 - 0.3); sai(CENA._rb, t1 - 0.3); sai(CENA._rp, t1 - 0.3);
    apaga("Bolivia", t1 - 0.4); apaga("Peru", t1 - 0.4);
  };
  CENA.patagonia = (c, i, t0, t1) => {
    camera(t0, 1.4, { lon: -69, lat: -48, r: 3300 });
    pinta("Argentina", "#7DB7DA", t0 + 0.6, 0.5);
    const a = entra(prende(div("selo grande", c.ano), -64, -42, 0, 0), quando(i, "mil", t0 + 1));
    tl.to(fronteiras.patagonia, { prog: 1, duration: 1.8, ease: "power1.inOut", ...upd }, quando(i, "dividiu", t0 + 3));
    const e = entra(prende(emoji(c.emoji, 170), -64, -50, 0, 0), quando(i, "acordo", t0 + 2)); flutua(e, t0 + 2.4, t1);
    entra(CENA._ra = prende(div("rotulo", "ARGENTINA"), -66, -45.5, 0, 0), quando(i, "argentina", t0 + 2.5));
    sai(a, t1 - 0.3); sai(e, t1 - 0.3); sai(CENA._ra, t1 - 0.3);
    apaga("Argentina", t1 - 0.4); tl.to(fronteiras.patagonia, { prog: 0, duration: 0.3, ...upd }, t1 - 0.3);
  };
  CENA.final = (c, i, t0, t1) => {
    camera(t0, 1.2, { lon: -70, lat: -37, r: 2350 });
    const e1 = entra(prende(emoji(c.emojis[0], 160), -66, -24, 0, 0), quando(i, "deserto", t0 + 1));
    const e2 = entra(prende(emoji(c.emojis[1], 160), -68, -52, 0, 0), quando(i, "geleira", t0 + 2)); flutua(e1, t0 + 1.4, t1); flutua(e2, t0 + 2.4, t1);
    sai(e1, t1 - 0.3); sai(e2, t1 - 0.3);
  };
  CENA.cta = (c, i, t0, t1) => {
    const f = document.querySelector("#cta"), pw = c.palavra || "";
    tl.fromTo(f, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, t0);
    const tk = pw ? quando(i, pw, t0 + 2) : t0 + 2;
    const tc = quando(i, (c.antes || "comenta").split(" ")[0], t0 + 1.2);
    if (document.querySelector("#cta .ia")) { som(t0 + 0.2, "ping");
      tl.fromTo("#cta .ia", { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(2)", immediateRender: false }, t0 + 0.2); }
    if (document.querySelector("#cta .linha"))
      tl.fromTo("#cta .linha", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.25, ease: "power2.out", immediateRender: false }, tc);
    if (pw) { [...pw].forEach((_, k) => som(tk + k * 0.09, "tecla"));
      tl.fromTo("#cta .tecla", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.09, ease: "back.out(2)", immediateRender: false }, tk); }
    tl.to(cam, { gira: 25, duration: t1 - t0, ease: "none", ...upd }, t0);
  };

  // ---------- cenas gerais: servem para qualquer tema, tudo vem do roteiro (veja references/cenas.md) ----------
  const PALETA = ["#D8433B", "#3E9B5A", "#E9B949", "#4FA3A5", "#7DB7DA", "#E8A23A", "#9B6BD8"];
  const moves = (extras.moves = []), rotas = (extras.rotas = []);
  const lugar = (x) => (typeof x === "string" ? (porNome[x] ? d3.geoCentroid(porNome[x]) : (console.warn("país não achado:", x), null)) : x);
  const fimEfeito = (c, t1) => (c.ate_bloco ? fimDe(c.ate_bloco - 1) : t1); // "ate_bloco": o efeito fica na tela até o fim daquele bloco
  const vez = (i, c, padrao) => (c.palavra ? quando(i, c.palavra, padrao) : padrao);
  function enquadra(nomes, folga = 1) { // câmera que mostra esses países inteiros
    const fs = nomes.map((n) => porNome[n]).filter(Boolean); if (!fs.length) return null;
    const [lon, lat] = d3.geoCentroid({ type: "FeatureCollection", features: fs }); let maxd = 0;
    const mede = (co) => (typeof co[0] === "number" ? (maxd = Math.max(maxd, d3.geoDistance([lon, lat], co))) : co.forEach(mede));
    fs.forEach((f) => mede(f.geometry.coordinates));
    return { lon, lat, r: Math.round(Math.max(520, Math.min(9000, (420 * folga) / Math.sin(Math.min(maxd, 1.4))))) };
  }
  const camDe = (c, nomes) => (c.camera ? { lon: c.camera.lon, lat: c.camera.lat, r: c.camera.zoom || 2000 } : enquadra(nomes, c.folga || 1));
  function itens(c, i, t0, t1, base) { // rótulos, selos e emojis da cena: [{texto|emoji, tipo, pais|lon,lat|tela, dx, dy, palavra, em, tam, ate_bloco}]
    (c.itens || []).forEach((it, k) => {
      const el = it.emoji ? emoji(it.emoji, it.tam || 170) : div(it.tipo || "rotulo", it.texto);
      const t = it.palavra ? quando(i, it.palavra, t0 + 0.8 + k * 0.6) : t0 + (it.em != null ? it.em : 0.8 + k * 0.6);
      if (it.tela) { el.style.left = it.tela[0] + "px"; el.style.top = it.tela[1] + "px"; camada.appendChild(el); }
      else { const p = it.lon != null ? [it.lon, it.lat] : lugar(it.pais || base) || [ultima.lon, ultima.lat]; prende(el, p[0], p[1], it.dx || 0, it.dy != null ? it.dy : it.emoji ? -170 : 0); }
      entra(el, t); if (it.emoji) flutua(el, t + 0.2, fimEfeito(it, t1));
      sai(el, fimEfeito(it, t1) - 0.3);
    });
  }
  CENA.abertura = (c, i, t0, t1) => { // sempre o bloco 1: globo inteiro girando até o país, que acende
    const p = lugar(c.pais) || [0, 10];
    cam.lon = p[0] + 55; cam.lat = 8; cam.r = 520; Object.assign(ultima, { lon: cam.lon, lat: cam.lat, r: cam.r }); desenha();
    camera(t0, 1.6, { lon: p[0], lat: p[1] * 0.6, r: 780 });
    pinta(c.pais, c.cor || PALETA[0], t0 + 0.6, 0.6, true);
    camera(t0 + 1.7, 1.6, camDe(c, [c.pais]), "power3.inOut");
    itens(c, i, t0, t1, c.pais);
    if (c.apagar) apaga(c.pais, fimEfeito(c, t1) - 0.4);
  };
  CENA.pais = (c, i, t0, t1) => { // um ou mais países acendem: {pais | paises, cor | cores, palavras, camera, itens}
    const nomes = c.paises || (c.pais ? [c.pais] : []), cores = c.cores || [];
    const alvo = camDe(c, nomes); if (alvo) camera(t0, 1.2, alvo);
    nomes.forEach((n, k) => pinta(n, cores[k] || (k ? PALETA[k % PALETA.length] : c.cor || PALETA[0]),
      c.palavras && c.palavras[k] ? quando(i, c.palavras[k], t0 + 0.5 + k * 0.4) : t0 + 0.5 + k * 0.4, 0.5, c.brilho !== false && k === 0));
    itens(c, i, t0, t1, nomes[0]);
    if (!c.manter) nomes.forEach((n) => apaga(n, fimEfeito(c, t1) - 0.4));
  };
  CENA.mover = (c, i, t0, t1) => { // o país vai para outro lugar no tamanho real: {pais, para (país ou [lon, lat]), palavra, voltar}
    const de = lugar(c.de || c.pais), para = lugar(c.para), ehPais = typeof c.para === "string";
    const alvo = camDe(c, [c.pais].concat(ehPais ? [c.para] : [])); if (alvo) camera(t0, 1.0, alvo);
    if (ehPais) pinta(c.para, c.cor_para || PALETA[1], t0 + 0.3, 0.5);
    const M = { nome: c.pais, de, para, p: 0, a: 1, cor: c.cor || PALETA[0] }; moves.push(M);
    tl.to(M, { p: 1, duration: c.duracao_movimento || 1.6, ease: "power3.inOut", ...upd }, vez(i, c, t0 + 1.2));
    itens(c, i, t0, t1, ehPais ? c.para : c.pais);
    const T1 = fimEfeito(c, t1);
    if (c.voltar) tl.to(M, { p: 0, duration: 0.8, ease: "power2.inOut", ...upd }, T1 - 0.8); else tl.to(M, { a: 0, duration: 0.4, ...upd }, T1 - 0.4);
    if (ehPais) apaga(c.para, T1 - 0.6);
  };
  CENA.trocar = (c, i, t0, t1) => { // "e se X e Y trocassem de lugar": {paises: [X, Y], cores, palavra}
    const [a, b] = c.paises, pa = lugar(a), pb = lugar(b), cores = c.cores || [PALETA[0], PALETA[1]];
    const alvo = camDe(c, [a, b]); if (alvo) camera(t0, 1.2, alvo);
    pinta(a, cores[0], t0 + 0.3, 0.4); pinta(b, cores[1], t0 + 0.5, 0.4);
    const tm = vez(i, c, t0 + 1.4);
    const Ma = { nome: a, de: pa, para: pb, p: 0, a: 1, cor: cores[0] }, Mb = { nome: b, de: pb, para: pa, p: 0, a: 1, cor: cores[1] }; moves.push(Ma, Mb);
    tl.to([PINTA[a], PINTA[b]], { a: 0.25, duration: 0.4, ...upd }, tm);
    const dm = c.duracao_movimento || 2.2, T1 = fimEfeito(c, t1);
    tl.to([Ma, Mb], { p: 1, duration: dm, ease: "power3.inOut", ...upd }, tm);
    if (d3.geoDistance(pa, pb) > 0.9 && T1 - (tm + dm) > 2.2) { // longe um do outro: a câmera visita cada lugar novo
      const r = Math.min(enquadra([a]).r, enquadra([b]).r), tf = tm + dm - 0.2, meio = tf + (T1 - tf) / 2;
      camera(tf, 1.0, { lon: pb[0], lat: pb[1], r }); camera(meio, 1.0, { lon: pa[0], lat: pa[1], r });
    }
    itens(c, i, t0, t1, b);
    tl.to([Ma, Mb], { a: 0, duration: 0.4, ...upd }, T1 - 0.4); apaga(a, T1 - 0.4); apaga(b, T1 - 0.4);
  };
  CENA.fronteira = (c, i, t0, t1) => { // a fronteira entre dois países se desenha: {a, b, cor, montanhas, palavra}
    const L = (fronteiras["f" + i] = { geo: borda(c.a, c.b), cor: c.cor || (c.montanhas ? "#6E5440" : "#FFD54A"), largura: c.largura || (c.montanhas ? 6 : 9), prog: 0,
      montanhas: c.montanhas ? 3 : 0, tamanho: 26, sombra: c.montanhas ? null : "rgba(255,213,74,.35)" });
    const alvo = camDe(c, [c.a, c.b]); if (alvo) camera(t0, 1.0, alvo);
    if (c.pintar !== false) { pinta(c.a, c.cor_a || PALETA[0], t0 + 0.3, 0.4); pinta(c.b, c.cor_b || PALETA[4], t0 + 0.5, 0.4); }
    tl.to(L, { prog: 1, duration: 1.8, ease: "power1.inOut", ...upd }, vez(i, c, t0 + 1));
    itens(c, i, t0, t1, c.a);
    const T1 = fimEfeito(c, t1); tl.to(L, { prog: 0, duration: 0.3, ...upd }, T1 - 0.3);
    if (c.pintar !== false) { apaga(c.a, T1 - 0.4); apaga(c.b, T1 - 0.4); }
  };
  CENA.faixa = (c, i, t0, t1) => { // só um pedaço do país aceso (o território de uma época): {pais, latN, latS, lonW, lonE, cor, palavra}
    const alvo = camDe(c, [c.pais]); if (alvo) camera(t0, 1.0, alvo);
    pinta(c.pais, c.cor_pais || PALETA[0], t0, 0.3); tl.to(PINTA[c.pais], { a: 0.22, duration: 0.5, ...upd }, t0 + 0.3);
    const b = d3.geoBounds(porNome[c.pais]);
    const fx = { latN: c.latN ?? b[1][1] + 1, latS: c.latS ?? b[0][1] - 1, lonW: c.lonW ?? b[0][0] - 1, lonE: c.lonE ?? b[1][0] + 1, cor: c.cor || "#F2B33D", a: 0, recorte: c.pais, paralelos: true };
    faixas.push(fx); tl.to(fx, { a: 1, duration: 0.5, ...upd }, vez(i, c, t0 + 1.2) - 0.3);
    itens(c, i, t0, t1, c.pais);
    const T1 = fimEfeito(c, t1); tl.to(fx, { a: 0, duration: 0.4, ...upd }, T1 - 0.2); apaga(c.pais, T1 - 0.3);
  };
  CENA.rota = (c, i, t0, t1) => { // linha tracejada de um lugar a outro, com um emoji andando: {de, para (país ou [lon, lat]), cor, emoji, palavra}
    const a = lugar(c.de), b = lugar(c.para), d = d3.geoDistance(a, b), m = d3.geoInterpolate(a, b)(0.5);
    camera(t0, 1.0, c.camera ? camDe(c, []) : { lon: m[0], lat: m[1], r: Math.round(Math.max(520, Math.min(9000, 380 / Math.sin(Math.min(d / 2 + 0.05, 1.4))))) });
    const R = { de: a, para: b, prog: 0, a: 1, cor: c.cor || "#FFD54A" }; rotas.push(R);
    const tp = vez(i, c, t0 + 0.8), dur = c.duracao_movimento || Math.max(0.8, Math.min(2.5, t1 - tp - 0.5)), T1 = fimEfeito(c, t1);
    tl.to(R, { prog: 1, duration: dur, ease: "power1.inOut", ...upd }, tp);
    if (c.emoji) {
      const e = prende(emoji(c.emoji, c.tam || 140), a[0], a[1], 0, 0), pr = presos[presos.length - 1], it = d3.geoInterpolate(a, b), q = { p: 0 };
      tl.fromTo(e, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, tp); som(tp, "whoosh");
      tl.to(q, { p: 1, duration: dur, ease: "power1.inOut", onUpdate: () => { const x = it(q.p); pr.lon = x[0]; pr.lat = x[1]; } }, tp);
      sai(e, T1 - 0.3);
    }
    itens(c, i, t0, t1, null);
    tl.to(R, { a: 0, duration: 0.3, ...upd }, T1 - 0.3);
  };
  CENA.ano = (c, i, t0, t1) => { // ano (ou número) grande no alto da tela, com o mapa parado ou indo para um país: {ano, pais, camera, itens}
    const nomes = c.pais ? [c.pais] : []; const alvo = camDe(c, nomes); if (alvo) camera(t0, 1.0, alvo);
    if (c.pais) pinta(c.pais, c.cor || PALETA[0], t0 + 0.3, 0.4, true);
    const el = div("selo grande", c.ano); el.style.left = "540px"; el.style.top = (c.altura || 330) + "px"; camada.appendChild(el);
    entra(el, vez(i, c, t0 + 0.3)); sai(el, fimEfeito(c, t1) - 0.3);
    itens(c, i, t0, t1, c.pais);
    if (c.pais && !c.manter) apaga(c.pais, fimEfeito(c, t1) - 0.4);
  };
  // cenas próprias do vídeo: um cenas.js na pasta do vídeo com window.CENAS_EXTRA = (api) => { api.CENA.minha = (c, i, t0, t1) => {...} }
  if (window.CENAS_EXTRA) window.CENAS_EXTRA({ tl, D, CENA, cam, PINTA, PALETA, pinta, apaga, camera, entra, sai, flutua, prende, presos, div, emoji, quando, vez,
    itens, lugar, enquadra, camDe, fimDe, fimEfeito, faixas, fronteiras, extras, moves, rotas, borda, som, porNome, upd, desenha });

  D.cenas.forEach((c, i) => { const t0 = INI[i], t1 = fimDe(i); (CENA[c.tipo] || (() => console.warn("cena desconhecida:", c.tipo)))(c, i, t0, t1); });

  // legenda: 1 a 2 palavras por vez, destaque nas palavras-chave
  const leg = document.querySelector("#legenda");
  const CHAVE = new Set((D.destaques || []).map(norm));
  const grupos = []; let g = [];
  D.palavras.forEach((p, k) => { g.push(p); const fim = /[.,!?:]$/.test(p.w) || g.length === 2 || (D.palavras[k + 1] && D.palavras[k + 1].s - p.e > 0.25); if (fim) { grupos.push(g); g = []; } });
  if (g.length) grupos.push(g);
  grupos.forEach((gr, k) => {
    const el = div("pal"); gr.forEach((p, j) => { const s = document.createElement("span"); s.textContent = p.w.replace(/[.,!?:]$/, "") + (j < gr.length - 1 ? " " : ""); if (CHAVE.has(norm(p.w))) s.className = "chave"; el.appendChild(s); });
    leg.appendChild(el);
    const t0 = gr[0].s, t1 = k + 1 < grupos.length ? grupos[k + 1][0].s : gr[gr.length - 1].e + 0.4;
    tl.fromTo(el, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.12, ease: "power2.out", immediateRender: false }, t0);
    tl.to(el, { opacity: 0, duration: 0.06 }, Math.max(t0 + 0.15, t1 - 0.04));
  });
  tl.set({}, {}, DUR);
  tl.eventCallback("onUpdate", desenha);
  window.__dbg = { fronteiras, PINTA, cam, faixas }; window.__sons = SONS;
  const pre = document.createElement("pre"); pre.id = "sons"; pre.style.display = "none"; pre.textContent = JSON.stringify(SONS); document.body.appendChild(pre);
}
