/* Estilo Documentário · motor 2.0
   Um plano-sequência sobre um mapa antigo: tudo é desenhado num canvas a cada quadro, a partir do tempo da timeline do GSAP.
   A história inteira vem do window.CENA (cena.js): lugares, objetos, anos, escuro e luz, cada um no tempo da palavra falada.
   A câmera, as quedas, o foco ("o resto apaga"), a luz e o fio vermelho são gerados daqui, com as regras do documentário
   original: destaque grande e no centro, um por vez, câmera que nunca para seca, voo que recua e mergulha.
   Determinístico: nada de Math.random, Date ou requestAnimationFrame. */
(function () {
  'use strict';
  const C = window.CENA, DUR = C.dur;
  const cv = document.getElementById('cv'), out = cv.getContext('2d');
  const W = cv.width, H = cv.height, VERT = H > W;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const BUF = mk(W, H), bx = BUF.getContext('2d'), ACC = mk(W, H), ax = ACC.getContext('2d');
  const LMW = Math.round(W / 4), LMH = Math.round(H / 4), LM = mk(LMW, LMH), lx = LM.getContext('2d');
  const IM = id => document.getElementById(id);
  const ok = img => img && img.complete && img.naturalWidth > 0;
  const RAD = Math.PI / 180, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const sst = (a, b, t) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hsh = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const EZ = n => gsap.parseEase(n), eIO2 = EZ('power2.inOut');

  // ---------- geografia: 1 unidade = 0,01 grau de longitude (Mercator) ----------
  const MERC = 100 * 180 / Math.PI;
  const P = (lon, lat) => [100 * lon, -MERC * Math.log(Math.tan(Math.PI / 4 + lat * RAD / 2))];
  const LUG = {}; for (const k in (C.lugares || {})) LUG[k] = P(C.lugares[k][0], C.lugares[k][1]);
  const MX0 = -20000, MY0 = -14000, MX1 = 20000, MY1 = 4000;

  // ---------- fontes e texto (fonte a 100 px escalada: nítida em qualquer zoom) ----------
  const TINTA = 'rgba(46,31,18,', VERM = '#a3211a';
  const F = {
    ano: '700 100px "Playfair Display", "Bodoni 72", Didot, Georgia, serif',
    maq: '100px "American Typewriter", "Courier New", monospace', maqB: '700 100px "American Typewriter", "Courier New", monospace',
    jornal: '900 100px "Playfair Display", Georgia, serif', manchete: '800 100px "Playfair Display", Georgia, serif',
    texto: '600 100px Baskerville, "Times New Roman", Georgia, serif', mar: 'italic 600 100px "Playfair Display", Georgia, serif', carimbo: '700 100px "DIN Condensed", "Arial Narrow", Impact, sans-serif'
  };
  function txt(c, s, x, y, size, font, cor, align, sx) {
    c.save(); c.translate(x, y); c.scale(size / 100 * (sx || 1), size / 100);
    c.font = font; c.fillStyle = cor; c.textAlign = align || 'left'; c.textBaseline = 'alphabetic'; c.fillText(s, 0, 0); c.restore();
  }
  const LARG = {};
  function larg(s, size, font, sx) { const k = font + '|' + s; let w = LARG[k]; if (w === undefined) { out.save(); out.font = font; w = LARG[k] = out.measureText(s).width; out.restore(); } return w * size / 100 * (sx || 1); }

  // ---------- mapa (d3-geo + topojson, contornos suavizados) ----------
  const proj = d3.geoMercator().scale(MERC).translate([0, 0]).clipExtent([[MX0, MY0], [MX1, MY1]]);
  function aneis(geo) { const rs = []; let cur = null; d3.geoPath(proj, { moveTo(x, y) { cur = [[x, y]]; rs.push(cur); }, lineTo(x, y) { cur.push([x, y]); }, closePath() { if (cur) cur.fechado = true; }, arc() {}, beginPath() {} })(geo); return rs; }
  function chaikin(pts, fechado) {
    if (pts.length < 3) return pts; const o = [], n = pts.length;
    for (let i = 0; i < (fechado ? n : n - 1); i++) { const a = pts[i], b = pts[(i + 1) % n]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
    if (!fechado) { o.unshift(pts[0]); o.push(pts[n - 1]); } return o;
  }
  function caminho(geo, suave) { const p = new Path2D(); for (const r of aneis(geo)) { let pts = suave ? chaikin(chaikin(r, r.fechado), r.fechado) : r; p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); if (r.fechado) p.closePath(); } return p; }
  const topo = window.TOPO, paises = topo.objects.countries;
  const PTERRA = caminho(topojson.merge(topo, paises.geometries), true);
  const PCOSTA = caminho(topojson.mesh(topo, paises, (a, b) => a === b), true);
  const PFRONT = caminho(topojson.mesh(topo, paises, (a, b) => a !== b), true);
  const PGRADE = caminho(d3.geoGraticule().step([10, 10]).extent([[-180, -60], [180, 80]])(), false);
  const PGRADE1 = caminho(d3.geoGraticule().step([1, 1]).extent([[-180, -60], [180, 80]])(), false);   // grade fina: aparece perto do chão
  const OCEANO = (() => { const p = new Path2D(); p.rect(MX0, MY0, MX1 - MX0, MY1 - MY0); p.addPath(PTERRA); return p; })();
  function visivel(M) {
    const det = M.a * M.d - M.b * M.c; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [sx, sy] of [[0, 0], [W, 0], [0, H], [W, H]]) { const x = sx - M.e, y = sy - M.f, wx = (M.d * x - M.c * y) / det, wy = (-M.b * x + M.a * y) / det; x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); y0 = Math.min(y0, wy); y1 = Math.max(y1, wy); }
    return [x0, y0, x1, y1];
  }
  function hachura(c, z, M) {
    const [x0, y0, x1, y1] = visivel(M); c.save(); c.clip(OCEANO, 'evenodd'); c.strokeStyle = TINTA + '0.085)'; c.lineWidth = 1 / z;
    const w = clamp((z - 0.28) / 0.4, 0, 1);
    for (const [passo, al, so] of [[30, 1, false], [15, w, true]]) {
      if (al < 0.02) continue; c.globalAlpha = al; c.beginPath();
      for (let y = Math.floor(y0 / passo) * passo; y < y1; y += passo) { if (so && Math.round(y / passo) % 2 === 0) continue; c.moveTo(x0, y); c.lineTo(x1, y); }
      c.stroke();
    }
    c.restore();
  }
  let FIBRA = null;
  function mapa(c, z, M) {
    const lw = px => px / z, MAN = IM('i-manchas');
    if (ok(MAN)) c.drawImage(MAN, MX0, MY0, MX1 - MX0, MY1 - MY0); else { c.fillStyle = '#e8dcc0'; c.fillRect(MX0, MY0, MX1 - MX0, MY1 - MY0); }
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgb(214,178,132)'; c.fillRect(MX0, MY0, MX1 - MX0, MY1 - MY0); c.restore();
    c.fillStyle = 'rgba(40,50,46,0.16)'; c.fillRect(MX0, MY0, MX1 - MX0, MY1 - MY0);
    hachura(c, z, M);
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = 'rgba(70,50,28,0.075)';
    for (const w of [46, 30, 18, 9]) { c.lineWidth = w; c.stroke(PCOSTA); }
    c.fillStyle = 'rgba(246,228,190,0.30)'; c.fill(PTERRA);
    c.strokeStyle = TINTA + '0.82)'; c.lineWidth = lw(1.1 + 0.55 * Math.log2(1 + z)); c.stroke(PCOSTA);
    c.setLineDash([lw(5), lw(4)]); c.strokeStyle = TINTA + '0.32)'; c.lineWidth = lw(1); c.stroke(PFRONT); c.setLineDash([]);
    c.strokeStyle = TINTA + '0.12)'; c.lineWidth = lw(1); c.stroke(PGRADE);
    const g1 = clamp((z - 1.2) / 3, 0, 1); if (g1 > 0.01) { c.strokeStyle = TINTA + (0.11 * g1).toFixed(3) + ')'; c.setLineDash([lw(9), lw(5)]); c.stroke(PGRADE1); c.setLineDash([]); }
    if (!FIBRA && ok(IM('i-fibra'))) FIBRA = c.createPattern(IM('i-fibra'), 'repeat');
    if (FIBRA) {
      const wa = clamp((Math.log2(z) + 0.5) / 2.5, 0, 1); c.save(); c.globalCompositeOperation = 'soft-light';
      for (const [tile, al] of [[70, 0.6 * wa], [900, 0.6 * (1 - wa)]]) { if (al < 0.01) continue; FIBRA.setTransform(new DOMMatrix().scale(tile / 512)); c.globalAlpha = al; c.fillStyle = FIBRA; c.fillRect(MX0, MY0, MX1 - MX0, MY1 - MY0); }
      c.restore();
    }
  }

  // ---------- os objetos da cena ----------
  const FOT = window.FOTOS || {};             // proporção (largura/altura) de cada foto, escrita pelo preparar.py
  const OBJ = [], ANOS = [], O = {};
  const porLugar = {};
  for (const [i, d] of (C.objetos || []).entries()) {
    const base = LUG[d.lugar] || [0, 0];
    if (d.tipo === 'ano') {
      const a = { id: d.id || 'ano' + i, tipo: 'ano', s: String(d.texto), size: d.tamanho || 90, x: base[0] + (d.dx || 0), y: base[1] + (d.dy || 0), t: d.tempos, f: 1, ordem: i, cfg: d };
      a.t0 = a.t[0]; ANOS.push(a); O[a.id] = a; continue;
    }
    let w, h;
    if (d.tipo === 'foto') { const ar = FOT[d.img] || d.proporcao || 0.75, alt = d.tamanho || 72; if (ar >= 1) { w = alt * 1.25; h = w / ar; } else { h = alt; w = h * ar; } w += 6.4; h += 6.4; }
    else if (d.tipo === 'folha') { w = d.largura || 104; h = d.altura || 70; }
    else if (d.tipo === 'doc') { w = d.largura || 96; h = d.altura || 120; }
    else if (d.tipo === 'recorte') { w = d.largura || 132; h = d.altura || 170; }
    else if (d.tipo === 'ficha') { w = d.largura || 98; h = d.altura || 60; }
    // posição: ao lado do objeto anterior do mesmo lugar (da esquerda para a direita), ou dx/dy explícitos
    let x = base[0] + (d.dx || 0), y = base[1] + (d.dy || 0);
    if (d.dx === undefined) { const q = porLugar[d.lugar] || []; if (q.length) { const ult = q[q.length - 1]; x = ult.x + ult.w / 2 + w / 2 + 10; y = ult.y + (i % 2 ? 6 : -6); } }
    const o = { id: d.id || 'o' + i, tipo: d.tipo, x, y, w, h, rot: d.giro !== undefined ? d.giro : (i % 2 ? 2.5 : -3), papel: d.tipo === 'foto' ? '#eee6d3' : d.tipo === 'recorte' ? '#dcd1b4' : d.tipo === 'ficha' ? '#f0e8d5' : '#ebe2cc', borda: 3.2,
      img: d.img ? 'i-' + d.img : null, t: d.t, cfg: d, ordem: i, s: { a: 0, h: 1, dx: 0, dy: 0, r: (i % 2 ? -6 : 6), f: 1, n: 0, n2: 0, circ: 0, risco: 0, hd: 1, stA: 0, stS: 1.7 } };
    if (d.entra === 'desliza') { o.s.h = 0.12; o.s.dx = -(w * 0.45); o.s.dy = -8; o.s.r = 0; }
    const p = new Path2D(); p.rect(-o.w / 2, -o.h / 2, o.w, o.h); o.forma = p;
    if (o.tipo === 'recorte') {
      const r = rng(91 + i), pr = new Path2D(), hw = o.w / 2, hh = o.h / 2, pts = [];
      const lado = (x0, y0, x1, y1, nx, ny) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2.2); for (let k = 0; k < n; k++) { const t = k / n, j = r() * 1.6; pts.push([lerp(x0, x1, t) + nx * j, lerp(y0, y1, t) + ny * j]); } };
      lado(-hw, -hh, hw, -hh, 0, 1); lado(hw, -hh, hw, hh, -1, 0); lado(hw, hh, -hw, hh, 0, -1); lado(-hw, hh, -hw, -hh, 1, 0);
      pr.moveTo(pts[0][0], pts[0][1]); for (const q of pts) pr.lineTo(q[0], q[1]); pr.closePath(); o.forma = pr;
    }
    (porLugar[d.lugar] = porLugar[d.lugar] || []).push(o); OBJ.push(o); O[o.id] = o;
  }
  // ---------- o nome de cada lugar escrito a tinta no mapa, acima dos objetos dele (perto do chão o mapa nunca fica vazio) ----------
  const ROT = [];
  for (const k in (C.lugares || {})) {
    const v = C.lugares[k], nome = v[2]; if (!nome || C.rotulos === false) continue;
    const q = (porLugar[k] || []), op = v[3] || {};
    const topo = q.length ? q[0].y - q[0].h / 2 : LUG[k][1];
    const cx = q.length ? q[0].x : LUG[k][0];   // centrado no primeiro objeto do lugar: é ali que a câmera chega
    ROT.push({ nome: String(nome).toUpperCase().split('').join('\u2009'), px: LUG[k][0], py: LUG[k][1], x: cx + (op.dx || 0), y: topo - 14 + (op.dy || 0), tam: op.tamanho || (H > W ? 7 : 9.5), wmax: q.length ? q[0].w * 0.8 : 0 });   // no vertical o quadro é estreito: nome menor para não cortar na borda
  }
  // fração visível de um texto na tela: 0 quando encosta numa borda (nunca corta), 1 com folga
  function folga(M, x, y, larg2, alto, base) {
    const sx = M.a * x + M.c * y + M.e, sy = M.b * x + M.d * y + M.f, m = 0.035 * W, f = 0.05 * W;
    const d = Math.min(sx - larg2 - m, W - m - (sx + larg2), sy - alto - m, H - m - (sy + base));
    return clamp(d / f, 0, 1);
  }
  function rotulos(c, z, M) {
    for (const r of ROT) {
      c.fillStyle = TINTA + '0.85)'; c.beginPath(); c.arc(r.px, r.py, Math.max(1.1, 2.2 / z), 0, 7); c.fill();
      c.strokeStyle = TINTA + '0.7)'; c.lineWidth = Math.max(0.35, 0.9 / z); c.beginPath(); c.arc(r.px, r.py, Math.max(2.4, 4.8 / z), 0, 7); c.stroke();
      let tam = Math.max(r.tam, (H > W ? 11 : 15) / z);
      if (r.wmax) { const lg = larg(r.nome, tam, F.ano); if (lg > r.wmax) tam *= r.wmax / lg; }   // nunca mais largo que o objeto: no mergulho não corta na borda
      const lgz = larg(r.nome, tam, F.ano) * z, vis = Math.min(clamp((0.86 * W - lgz) / (0.14 * W), 0, 1), folga(M, r.x, r.y, lgz / 2, tam * 0.8 * z, tam * 0.45 * z));   // não cabe ou vai encostar na borda? some suave em vez de cortar
      if (vis < 0.01) continue; c.save(); c.globalAlpha *= vis;
      txt(c, r.nome, r.x, r.y, tam, F.ano, TINTA + '0.78)', 'center');
      c.fillStyle = TINTA + '0.5)'; const lw2 = larg(r.nome, tam, F.ano) * 0.36; c.fillRect(r.x - lw2, r.y + tam * 0.32, lw2 * 2, Math.max(0.3, 0.8 / z)); c.restore();
    }
  }
  // ---------- a rota: linha tracejada a tinta que avança na viagem entre dois lugares (a travessia nunca fica só papel) ----------
  const MARES = [['Oceano Atlântico', -38, 40], ['Oceano Atlântico', -25, 5], ['Oceano Atlântico', -20, -25], ['Oceano Pacífico', -150, 25], ['Oceano Pacífico', 165, 20], ['Oceano Pacífico', -120, -25],
    ['Oceano Índico', 75, -15], ['Mar Mediterrâneo', 17, 35.5], ['Mar do Norte', 3, 56], ['Mar do Caribe', -75, 15], ['Golfo do México', -90, 25], ['Mar Báltico', 19, 57], ['Canal da Mancha', -2.5, 50.2], ['Mar Negro', 34, 43.2], ['Mar Vermelho', 38, 20], ['Mar do Japão', 135, 40]];
  const ROTAS = [];
  if (C.rotas !== false) {
    const seq = OBJ.filter(o => o.cfg.lugar);
    for (let i = 1; i < seq.length; i++) {
      const a = seq[i - 1], b = seq[i], la = a.cfg.lugar, lb = b.cfg.lugar; if (la === lb || !LUG[la] || !LUG[lb]) continue;
      const cfg = (Array.isArray(C.rotas) ? C.rotas.find(r => r.de === la && r.para === lb) : null) || {};
      const A = LUG[la], B = LUG[lb], L = Math.hypot(B[0] - A[0], B[1] - A[1]); if (L < 300) continue;   // lugares vizinhos: sem rota
      const meio = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - L * 0.08];
      let mar = cfg.mar; if (mar === undefined) { let best = 1e18; for (const [n, lo, la2] of MARES) { const q = P(lo, la2), d = Math.hypot(q[0] - meio[0], q[1] - meio[1]); if (d < best && d < Math.max(1500, L * 0.6)) { best = d; mar = n; } } }
      ROTAS.push({ A, B, ctl: [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - L * 0.12], t0: a.t + 0.45, t1: b.t - 0.3, mar: mar ? mar.toUpperCase().split('').join('\u2009') : null, veiculo: cfg.veiculo || C.veiculo || null });
    }
  }
  const bez = (r, u) => [(1 - u) * (1 - u) * r.A[0] + 2 * (1 - u) * u * r.ctl[0] + u * u * r.B[0], (1 - u) * (1 - u) * r.A[1] + 2 * (1 - u) * u * r.ctl[1] + u * u * r.B[1]];
  function veiculo(c, tipo, x, y, ang, z) {
    const vira = Math.cos(ang) < 0, s = 3.2 * Math.max(W, H) / 1920 / z; c.save(); c.translate(x, y); c.rotate(vira ? ang + Math.PI : ang); c.scale(vira ? -s : s, s);   // indo para a esquerda: espelha, nunca de cabeça para baixo c.fillStyle = TINTA + '0.88)'; c.strokeStyle = TINTA + '0.88)'; c.lineWidth = 1.6;
    if (tipo === 'navio') {   // casco, convés e quatro chaminés, de lado, a uns 34 px
      c.beginPath(); c.moveTo(-17, -2); c.lineTo(17, -2); c.lineTo(13, 5); c.lineTo(-14, 5); c.closePath(); c.fill();
      c.fillRect(-12, -5, 22, 3); for (const fx of [-8, -3, 2, 7]) c.fillRect(fx, -11, 3, 6);
    } else if (tipo === 'aviao') { c.beginPath(); c.moveTo(14, 0); c.lineTo(-10, -3); c.lineTo(-12, 0); c.lineTo(-10, 3); c.closePath(); c.fill(); c.fillRect(-2, -11, 4, 22); c.fillRect(-12, -5, 3, 10); }
    else { c.beginPath(); c.arc(0, 0, 3.4, 0, 7); c.fill(); }
    c.restore();
  }
  function rotas(c, t, z, M) {
    for (const r of ROTAS) {
      if (t < r.t0) continue;
      // a ponta da rota anda com a câmera: é o ponto da rota mais perto do centro da tela (o navio e o nome do mar ficam no quadro a viagem toda)
      let p = 1;
      if (t < r.t1) {
        const det = M.a * M.d - M.b * M.c, cx = W / 2 - M.e, cy = H / 2 - M.f, wx = (M.d * cx - M.c * cy) / det, wy = (-M.b * cx + M.a * cy) / det;
        let best = 1e18, bu = 0; for (let i = 0; i <= 80; i++) { const q = bez(r, i / 80), d = (q[0] - wx) ** 2 + (q[1] - wy) ** 2; if (d < best) { best = d; bu = i / 80; } }
        p = Math.max(bu, eIO2(clamp((t - r.t0) / Math.max(0.3, r.t1 - r.t0), 0, 1)) * 0.25);
      }
      if (p <= 0.002) continue;
      const n = 90, m = Math.ceil(n * p); c.save(); const px = H / 1080; c.strokeStyle = TINTA + '0.72)'; c.lineWidth = 3.6 * px / z; c.setLineDash([15 * px / z, 10 * px / z]); c.lineCap = 'round'; c.beginPath();
      for (let i = 0; i <= m; i++) { const q = bez(r, Math.min(i / n, p)); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }
      c.stroke(); c.setLineDash([]); c.restore();
      if (p < 0.995) { const q = bez(r, p), q2 = bez(r, Math.min(1, p + 0.01)); veiculo(c, r.veiculo, q[0], q[1], Math.atan2(q2[1] - q[1], q2[0] - q[0]), z); }
      if (r.mar && p < 0.995) {   // o nome do mar vai junto da ponta da rota, logo atrás dela: entra no quadro em toda a travessia
        const u = p, q = bez(r, u), q2 = bez(r, Math.min(1, u + 0.01)); let ang = Math.atan2(q2[1] - q[1], q2[0] - q[0]); if (Math.cos(ang) < 0) ang += Math.PI;
        const tam = (H > W ? 0.026 : 0.032) * H / z, lgz = larg(r.mar, tam, F.mar) * z, desce = 58 * H / 1080 / z;
        const al = clamp((p - 0.08) / 0.1, 0, 1) * clamp((r.t1 - t) / 0.35, 0, 1) * folga(M, q[0], q[1] + desce, lgz / 2, tam * 0.8 * z, tam * 0.4 * z);
        if (al > 0.01) { c.save(); c.globalAlpha *= al; c.translate(q[0], q[1]); c.rotate(ang); txt(c, r.mar, 0, desce, tam, F.mar, TINTA + '0.66)', 'center'); c.restore(); }
      }
    }
  }
  const mundo = (o, lx0, ly0) => { const a = o.rot * RAD; return [o.x + lx0 * Math.cos(a) - ly0 * Math.sin(a), o.y + lx0 * Math.sin(a) + ly0 * Math.cos(a)]; };
  const TIPOS = C.tipos || {};
  const textoDe = k => (TIPOS[k] || []).map(x => x[2]).join('');

  function anos(c, t, M) {
    for (const a of ANOS) {
      if (t < a.t[0]) continue; let x = a.x - larg(a.s, a.size, F.ano) / 2;
      const borda = folga(M, a.x, a.y, larg(a.s, a.size, F.ano) / 2 * M.z, a.size * 0.75 * M.z, a.size * 0.25 * M.z); if (borda < 0.01) continue;
      for (let i = 0; i < a.s.length; i++) {
        const ch = a.s[i], w = larg(ch, a.size, F.ano), td = a.t[Math.min(i, a.t.length - 1)], p = clamp((t - td) / 0.3, 0, 1);
        if (p > 0) { c.save(); c.beginPath(); c.rect(x - 4, a.y - a.size, w * EZ('power2.out')(p) + 8, a.size * 1.3); c.clip(); c.globalAlpha = (0.12 + 0.88 * a.f) * clamp(p * 2, 0, 1) * borda; txt(c, ch, x, a.y, a.size, F.ano, TINTA + '0.9)'); c.restore(); }
        x += w;
      }
    }
  }
  function linhas(c, x0, y0, w, n, gap, seed, th, alpha) { const r = rng(seed); c.fillStyle = `rgba(62,52,40,${alpha || 0.3})`; for (let i = 0; i < n; i++) { const fim = i === n - 1 ? 0.35 + r() * 0.3 : 0.86 + r() * 0.14; c.fillRect(x0, y0 + i * gap, w * fim, th); } }
  function datilo(c, s, n, x, y, size, font, cor, lh, align) {
    let k = 0, yy = y;
    for (const ln of s.split('\n')) {
      const total = larg(ln, size, font); let xx = align === 'center' ? x - total / 2 : x;
      for (let i = 0; i < ln.length; i++) {
        const ch = ln[i], w = larg(ch, size, font), vis = clamp(n - k, 0, 1);
        if (vis > 0 && ch !== ' ') { const j = hsh(k * 7.3 + size); c.save(); c.globalAlpha *= (0.78 + 0.22 * j) * vis; txt(c, ch, xx + (j - 0.5) * size * 0.03, yy + (hsh(k * 3.1) - 0.5) * size * 0.05, size, font, cor); c.restore(); }
        xx += w; k++;
      }
      yy += lh;
    }
  }
  function circulo(c, cx, cy, rx, ry, p, lw, seed) {
    if (p <= 0) return; const r = rng(seed), n = 90, a0 = -2.6 + r() * 0.3;
    c.save(); c.strokeStyle = VERM; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = lw; c.globalAlpha *= 0.9; c.beginPath();
    const m = Math.max(2, Math.floor(n * p));
    for (let i = 0; i <= m; i++) { const t = i / n, a = a0 + t * 1.14 * TAU, wob = 1 + 0.05 * Math.sin(t * 9 + seed) + 0.04 * t; const x = cx + Math.cos(a) * rx * wob, y = cy + Math.sin(a) * ry * wob; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke(); c.globalAlpha *= 0.35; c.lineWidth = lw * 0.5; c.translate(0.25, 0.2); c.stroke(); c.restore();
  }
  const DESENHO = {
    foto(c, o) {
      const img = IM(o.img); if (!ok(img)) return;
      const b = o.borda, iw = o.w - 2 * b, ih = o.h - 2 * b, ar = img.naturalWidth / img.naturalHeight, tr = iw / ih;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (ar > tr) { sw = sh * tr; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / tr; sy = (img.naturalHeight - sh) / 2; }
      c.drawImage(img, sx, sy, sw, sh, -o.w / 2 + b, -o.h / 2 + b, iw, ih);
      const g = c.createLinearGradient(-o.w / 2, -o.h / 2, o.w / 2, o.h / 2); g.addColorStop(0, 'rgba(255,248,230,0.12)'); g.addColorStop(0.45, 'rgba(255,248,230,0)'); g.addColorStop(1, 'rgba(0,0,0,0.10)');
      c.fillStyle = g; c.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      const ci = o.cfg.circulo; if (ci) circulo(c, -o.w / 2 + b + ci.x * iw, -o.h / 2 + b + ci.y * ih, ci.r * iw, ci.r * iw * (ci.achatado || 0.8), o.s.circ, Math.max(0.6, o.h / 90), 4);
    },
    folha(c, o) { datilo(c, textoDe(o.cfg.texto), o.s.n, -o.w / 2 + 9, -o.h / 2 + o.h * 0.42, o.cfg.letra || 10.2, F.maq, 'rgba(24,18,12,0.94)', (o.cfg.letra || 10.2) * 1.42); },
    doc(c, o) {
      linhas(c, -o.w * 0.27, -o.h * 0.4, o.w * 0.54, 2, 3.6, 5, 1.3, 0.34);
      datilo(c, textoDe(o.cfg.titulo), o.s.n, 0, -o.h * 0.21, o.cfg.letra || 9.4, F.maqB, 'rgba(20,15,10,0.95)', (o.cfg.letra || 9.4) * 1.36, 'center');
      linhas(c, -o.w * 0.4, o.h * 0.03, o.w * 0.8, 7, 3.8, 17, 1.1, 0.26); linhas(c, -o.w * 0.4, o.h * 0.28, o.w * 0.8, 3, 3.8, 29, 1.1, 0.26);
      c.strokeStyle = 'rgba(30,24,40,0.55)'; c.lineWidth = 0.55; c.lineCap = 'round';
      for (let i = 0; i < (o.cfg.assinaturas || 0); i++) { const r = rng(200 + i), x0 = -o.w * 0.4 + (i % 2) * o.w * 0.44, y0 = o.h * 0.42; c.beginPath(); c.moveTo(x0, y0); for (let k = 1; k <= 6; k++) c.quadraticCurveTo(x0 + k * 4.2 - 2, y0 - 3 + r() * 6 - 3, x0 + k * 4.2, y0 + r() * 2 - 1); c.stroke(); }
    },
    recorte(c, o) {
      const g = c.createRadialGradient(0, 0, 20, 0, 0, 110); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,60,20,0.22)'); c.fillStyle = g; c.fill(o.forma);
      const d = o.cfg, top = -o.h / 2; c.save(); c.globalAlpha *= 0.3 + 0.7 * o.s.hd;
      let y = top + 19;
      if (d.jornal) { txt(c, d.jornal, 0, y, 11.6, F.jornal, 'rgba(18,14,10,0.95)', 'center'); c.fillStyle = 'rgba(18,14,10,0.8)'; c.fillRect(-o.w / 2 + 8, y + 5, o.w - 16, 0.5); y += 22; }
      for (const ln of (d.manchete || [])) { txt(c, ln, 0, y, 13.5, F.manchete, 'rgba(14,10,8,0.95)', 'center', 0.8); y += 13; }
      c.restore(); y += 8;
      (d.frase || []).forEach((ln, i) => txt(c, ln, -o.w / 2 + 10, y + i * 10, 7.2, F.texto, 'rgba(16,12,9,0.93)'));
      const ci = d.circulo;
      if (ci) { const ln = d.frase[ci.linha], k = ln.indexOf(ci.palavra), pre = larg(ln.slice(0, k), 7.2, F.texto), wd = larg(ci.palavra, 7.2, F.texto); circulo(c, -o.w / 2 + 10 + pre + wd / 2, y + ci.linha * 10 - 2.4, wd / 2 + 2.3, 5.0, o.s.circ, 0.9, 4); }
      const yb = y + (d.frase || []).length * 10 + 6; linhas(c, -o.w / 2 + 10, yb, o.w / 2 - 14, Math.max(2, Math.floor((o.h / 2 - yb - 6) / 3.4)), 3.4, 61, 1.0, 0.27); linhas(c, 4, yb, o.w / 2 - 14, Math.max(2, Math.floor((o.h / 2 - yb - 6) / 3.4)), 3.4, 67, 1.0, 0.27);
    },
    ficha(c, o) {
      c.fillStyle = 'rgba(190,60,50,0.45)'; c.fillRect(-o.w / 2, -o.h / 2 + 9, o.w, 0.45);
      c.fillStyle = 'rgba(90,120,160,0.28)'; for (let y = -o.h / 2 + 17; y < o.h / 2 - 2; y += 6.5) c.fillRect(-o.w / 2, y, o.w, 0.3);
      const t1 = textoDe(o.cfg.texto), t2 = textoDe(o.cfg.novo), L = o.cfg.letra || 11.5;
      datilo(c, t1, o.s.n, 0, t2 ? -5 : 4, L, F.maqB, 'rgba(20,15,10,0.95)', 0, 'center');
      if (o.s.risco > 0) { const w = larg(t1, L, F.maqB), rp = o.s.risco; c.save(); c.strokeStyle = VERM; c.lineWidth = 1.5; c.lineCap = 'round'; c.globalAlpha *= 0.92; c.beginPath(); c.moveTo(-w / 2 - 3, -9.0); c.lineTo(-w / 2 - 3 + (w + 6) * rp, -8.3 + 0.9 * rp); c.stroke(); c.restore(); }
      if (t2) datilo(c, t2, o.s.n2, 0, 16, L, F.maqB, 'rgba(160,30,22,0.95)', 0, 'center');
    }
  };
  function objeto(c, o, z) {
    const st = o.s; if (st.a <= 0.001) return;
    c.save(); c.translate(o.x + st.dx, o.y + st.dy); c.rotate((o.rot + st.r) * RAD);
    const sc = 1 + 0.55 * st.h; c.scale(sc, sc); c.globalAlpha = st.a;
    const off = (1.0 + 24 * st.h) * z * sc, blur = Math.min(90, (2.0 + 22 * st.h) * z * sc * 0.75);
    c.shadowColor = `rgba(8,4,0,${0.6 - 0.3 * st.h})`; c.shadowBlur = blur; c.shadowOffsetX = off * 0.55; c.shadowOffsetY = off;
    c.fillStyle = o.papel; c.fill(o.forma); c.shadowColor = 'rgba(0,0,0,0)'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0;
    c.imageSmoothingQuality = 'high'; DESENHO[o.tipo](c, o, z);
    c.lineWidth = 0.25; c.strokeStyle = 'rgba(60,40,20,0.25)'; c.stroke(o.forma);
    if (o.cfg.carimbo && S.car[o.id] && S.car[o.id].a > 0.001) carimbo(c, o);
    const dim = (1 - st.f) * 0.7; if (dim > 0.001) { c.fillStyle = `rgba(14,9,5,${dim})`; c.fill(o.forma); }
    c.restore();
  }
  // carimbo (textura feita uma vez por palavra)
  const CARS = {};
  function texturaCarimbo(palavra) {
    if (CARS[palavra]) return CARS[palavra];
    const cv2 = mk(1000, 330), c = cv2.getContext('2d'), r = rng(77);
    c.strokeStyle = '#a81e16'; c.fillStyle = '#a81e16'; c.lineWidth = 16; c.strokeRect(14, 14, 972, 302); c.lineWidth = 6; c.strokeRect(40, 40, 920, 250);
    c.font = F.carimbo.replace('100px', '250px'); c.textAlign = 'center'; c.textBaseline = 'middle';
    const wd = c.measureText(palavra).width, k = Math.min(1, 860 / wd); c.save(); c.translate(500, 182); c.scale(k, 1); c.fillText(palavra, 0, 0); c.restore();
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 2600; i++) { c.globalAlpha = 0.25 + r() * 0.6; c.beginPath(); c.arc(r() * 1000, r() * 330, 0.6 + r() * 3.2, 0, TAU); c.fill(); }
    return (CARS[palavra] = cv2);
  }
  function carimbo(c, o) {
    const st = S.car[o.id], w = Math.min(o.w * 0.95, 128), h = w * 0.33;
    c.save(); c.translate(0, o.h * 0.22); c.rotate(-9 * RAD); c.scale(st.s, st.s); c.globalAlpha *= st.a * 0.9; c.globalCompositeOperation = 'multiply';
    c.drawImage(texturaCarimbo(o.cfg.carimbo.texto), -w / 2, -h / 2, w, h); c.restore();
  }

  // ---------- fio vermelho entre as fotos, puxado durante a viagem ----------
  const FOTOS_O = OBJ.filter(o => o.tipo === 'foto' || o.tipo === 'recorte');
  const pinoDe = o => mundo(o, 0, -o.h / 2 + 4);
  function pino(c, x, y) {
    c.save(); c.translate(x, y); c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(0.9, 1.4, 2.3, 0, TAU); c.fill();
    const g = c.createRadialGradient(-0.7, -0.8, 0.2, 0, 0, 2.4); g.addColorStop(0, '#f08070'); g.addColorStop(0.5, '#b0261c'); g.addColorStop(1, '#5a0d08');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 2.3, 0, TAU); c.fill(); c.restore();
  }
  let FIOS = [];
  function fios(c, t, z) {
    if (C.fio === false) return; const lw = 1.4 / z + 0.35;
    for (const [a, b, t0, t1] of FIOS) {
      const p = eIO2(clamp((t - t0) / (t1 - t0), 0, 1)); if (p <= 0) continue;
      const A = pinoDe(a), B = pinoDe(b), L = Math.hypot(B[0] - A[0], B[1] - A[1]), cx = (A[0] + B[0]) / 2, cy = (A[1] + B[1]) / 2 + L * 0.07;
      c.save(); c.strokeStyle = 'rgba(140,24,18,0.9)'; c.lineWidth = lw; c.lineCap = 'round'; c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 2; c.shadowOffsetX = 1.2; c.shadowOffsetY = 2; c.beginPath();
      const n = 60, m = Math.ceil(n * p);
      for (let i = 0; i <= m; i++) { const u = Math.min(i / n, p), x = (1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * cx + u * u * B[0], y = (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * cy + u * u * B[1]; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke(); c.restore();
    }
  }
  function pinos(c) { if (C.fio === false) return; for (const o of FOTOS_O) if (o.s.a > 0.5 && o.s.h < 0.05) { c.save(); c.globalAlpha = o.s.f * 0.6 + 0.4; const q = pinoDe(o); pino(c, q[0], q[1]); c.restore(); } }

  // ---------- estado animado pelo GSAP, gerado a partir da cena ----------
  const S = { fade: C.abre === false ? 0 : 1, amb: 0.085, cam: 1.0, car: {}, luz: {} };   // abre/fecha: false nos capítulos do meio de um vídeo longo
  const tl = gsap.timeline({ paused: true });
  const cai = (o, t, dur) => { dur = dur || 0.48; tl.to(o.s, { a: 1, duration: 0.14, ease: 'none' }, t); tl.to(o.s, { h: 0, duration: dur, ease: 'power2.in' }, t); tl.to(o.s, { r: 0, duration: dur + 0.15, ease: 'power2.out' }, t); tl.to(o.s, { h: 0.022, duration: 0.07, ease: 'power1.out' }, t + dur); tl.to(o.s, { h: 0, duration: 0.12, ease: 'power1.in' }, t + dur + 0.07); };
  const desliza = (o, t, dur) => { tl.to(o.s, { a: 1, duration: 0.08, ease: 'none' }, t); tl.to(o.s, { dx: 0, dy: 0, duration: dur, ease: 'power3.out' }, t); tl.to(o.s, { h: 0, duration: dur * 0.9, ease: 'power2.inOut' }, t); };
  const digita = (o, prop, k) => { let n = 0; for (const [t0, t1, s] of (TIPOS[k] || [])) { n += s.replace(/\n/g, '').length; tl.to(o.s, { [prop]: n, duration: Math.max(0.05, t1 - t0), ease: 'none' }, t0); } };
  if (C.abre !== false) tl.to(S, { fade: 0, duration: 0.7, ease: 'power1.out' }, 0);
  const DESTAQUES = [...OBJ, ...ANOS].map(o => ({ o, t: o.tipo === 'ano' ? o.t0 : o.t })).sort((a, b) => a.t - b.t);
  DESTAQUES.forEach(({ o, t }, i) => {
    const prox = DESTAQUES[i + 1];
    if (o.tipo !== 'ano') {
      if (o.cfg.entra === 'desliza') desliza(o, t - 0.12, 0.5); else cai(o, t - 0.48);
      if (o.cfg.texto) digita(o, 'n', o.cfg.texto); if (o.cfg.titulo) digita(o, 'n', o.cfg.titulo); if (o.cfg.novo) digita(o, 'n2', o.cfg.novo);
      if (o.cfg.circulo) tl.to(o.s, { circ: 1, duration: 0.52, ease: 'power1.inOut' }, o.cfg.circulo.t);
      if (o.cfg.riscar) tl.to(o.s, { risco: 1, duration: 0.28, ease: 'power2.inOut' }, o.cfg.riscar);
      if (o.cfg.manchete_apaga) tl.to(o.s, { hd: 0.35, duration: 0.5, ease: 'sine.inOut' }, o.cfg.manchete_apaga);
      if (o.cfg.carimbo) { const st = S.car[o.id] = { a: 0, s: 1.7 }; tl.to(st, { a: 1, s: 1, duration: 0.12, ease: 'power3.in' }, o.cfg.carimbo.t - 0.12); }
    }
    // um destaque por vez: quando o próximo entra, este apaga (ou sai de vez com "sai": true)
    if (prox) { const tp = prox.t; if (o.tipo !== 'ano' && !o.cfg.fica || o.cfg.sai) tl.to(o.tipo === 'ano' ? o : o.s, o.tipo === 'ano' ? { f: 0, duration: 0.45 } : { a: 0, duration: 0.45, ease: 'sine.inOut' }, tp - 0.05); else tl.to(o.tipo === 'ano' ? o : o.s, { f: o.tipo === 'ano' ? 0.12 : 0.28, duration: 0.45, ease: 'sine.inOut' }, tp - 0.05); }
  });
  // escuro e luz
  const LUZES = [];
  for (const e of (C.escuro || [])) {
    tl.to(S, { cam: 0.42, amb: 0.05, duration: Math.min(2.5, Math.max(0.6, e.de - 0.2 - (e.desde || e.de - 2.5))), ease: 'sine.inOut' }, e.desde || e.de - 2.5);
    tl.to(S, { cam: 0.0, amb: 0.022, duration: 0.07, ease: 'none' }, e.de);
    if (e.ate) tl.to(S, { cam: 1.0, amb: 0.085, duration: 1.1, ease: 'power2.inOut' }, e.ate);
  }
  for (const [i, l] of (C.luzes || []).entries()) {
    const o = O[l.objeto], k = 'l' + i, base = o ? [o.x, o.y] : (LUG[l.lugar] || [0, 0]);
    LUZES.push({ k, x: base[0], y: base[1], r: l.raio || (o ? Math.max(o.w, o.h) * 0.85 : 60) }); S.luz[k] = 0;
    tl.to(S.luz, { [k]: 1.15, duration: 0.05, ease: 'none' }, l.t); tl.to(S.luz, { [k]: 0.55, duration: 0.05 }, l.t + 0.06); tl.to(S.luz, { [k]: 1.0, duration: 0.14 }, l.t + 0.12);
    if (l.ate) tl.to(S.luz, { [k]: 0, duration: 0.8 }, l.ate);
  }
  if (C.fecha !== false) tl.to(S, { fade: 1, duration: 0.33, ease: 'power1.in' }, DUR - 0.34);
  tl.set({}, {}, (C.cta && VERT) ? C.cta.fim : DUR);

  // ---------- câmera automática: chega ao destaque antes da palavra, segura derivando, viaja ----------
  const centro = o => o.tipo === 'ano' ? [o.x, o.y - o.size * 0.36] : [o.x, o.y];
  const zoomDe = o => {
    if (o.tipo === 'ano') return (H * (VERT ? 0.13 : 0.26)) / (o.size * 0.72) * (o.cfg.zoom || 1);
    const ocup = o.cfg.ocupa || (VERT ? 0.42 : 0.56);
    return Math.min(ocup * H / o.h, (VERT ? 0.8 : 0.8) * W / o.w)   /* no vertical, 0,86 encostava na borda com o giro e a deriva */ * (o.cfg.zoom || 1);
  };
  const K = [];
  DESTAQUES.forEach(({ o, t }, i) => {
    const [x, y] = centro(o), z = zoomDe(o), chega = Math.max(0.02, t - (o.tipo === 'ano' ? 0.2 : 0.32)), rot = (i % 2 ? 0.25 : -0.25);   // chega antes da palavra e assenta; giro fixo na pausa (sem balançar)
    const prox = DESTAQUES[i + 1];
    let sai = prox ? null : DUR, chegaProx = null;
    if (prox) {
      const [x2, y2] = centro(prox.o), d = Math.hypot(x2 - x, y2 - y) * Math.sqrt(z * zoomDe(prox.o));
      const viagem = clamp(0.6 + 0.34 * Math.log2(1 + d / 700), 0.6, 2.6); chegaProx = prox.t - (prox.o.tipo === 'ano' ? 0.2 : 0.32);
      sai = Math.max(chega + 0.3, chegaProx - Math.min(viagem, (chegaProx - chega) * 0.8));
    }
    if (i === 0 && chega > 0.4) K.push([0, x, y, z * (C.abre === false ? 0.94 : 0.55), -1.4]);
    const dir = prox ? (() => { const [x2, y2] = centro(prox.o), L = Math.hypot(x2 - x, y2 - y) || 1; return [(x2 - x) / L, (y2 - y) / L]; })() : [0.3, 0.2];
    K.push([chega, x, y, z, rot]);
    const ci = o.cfg && o.cfg.circulo;
    if (ci && ci.zoom && o.tipo === 'foto') {   // mergulho no detalhe circulado, na palavra falada
      const b = o.borda, iw = o.w - 2 * b, ih = o.h - 2 * b, q = mundo(o, -o.w / 2 + b + ci.x * iw, -o.h / 2 + b + ci.y * ih);
      if (ci.t - 1.1 > chega + 0.3) K.push([ci.t - 1.1, x, y, z * 1.03, rot]);   // segura a foto inteira antes do mergulho
      K.push([ci.t - 0.35, q[0], q[1], z * ci.zoom, rot]);
      if (sai > ci.t + 0.2) K.push([sai, q[0], q[1], z * ci.zoom * 1.04, rot]);
    } else if (sai > chega + 0.25) K.push([sai, x + dir[0] * 14 / z, y + dir[1] * 14 / z, z * 1.045, rot]);   // na pausa: aproxima devagar no destaque (só um leve aceno para o próximo lugar), sem vaguear
    // viagem longa entre lugares: abre até caber os dois lugares e a rota, segura um instante (o olho entende para onde vai) e mergulha
    if (prox && prox.o.cfg.lugar && o.cfg.lugar && prox.o.cfg.lugar !== o.cfg.lugar && LUG[o.cfg.lugar] && LUG[prox.o.cfg.lugar]) {
      const A = LUG[o.cfg.lugar], B = LUG[prox.o.cfg.lugar], Lw = Math.hypot(B[0] - A[0], B[1] - A[1]);
      const tv = chegaProx - sai;
      if (Lw > 900 && tv > 1.3) {
        const zMapa = Math.min(0.62 * W / (Math.abs(B[0] - A[0]) + 1), 0.5 * H / (Math.abs(B[1] - A[1]) + 1));
        const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2 - Lw * 0.06;
        K.push([sai + tv * 0.38, mx, my, zMapa, 0], [sai + tv * 0.58, mx + (B[0] - A[0]) * 0.04, my, zMapa * 1.04, 0]);
      }
    }
    if (prox && (o.tipo === 'foto' || o.tipo === 'recorte') && (prox.o.tipo === 'foto' || prox.o.tipo === 'recorte') && prox.o.cfg.lugar !== o.cfg.lugar) FIOS.push([o, prox.o, sai, prox.t - 0.15]);
  });
  // final opcional: as fotinhos viram uma cabeça (veja references/motor.md)
  const FIN = C.final && C.final.tipo === 'cabeca' ? C.final : null;
  if (FIN) {
    while (K.length && K[K.length - 1][0] > FIN.t - 0.1) K.pop();
  } else {
    const ult = K[K.length - 1]; if (ult && ult[0] < DUR - 0.3) K.push([DUR, ult[1], ult[2], ult[3] * (C.fecha === false ? 1.03 : 0.82), ult[4] - 0.4]);
  }
  if (C.camera) for (const k of C.camera) K.push(k);   // pontos extras, se a cena pedir
  K.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < K.length; i++) if (K[i][0] - K[i - 1][0] < 0.08) K[i][0] = K[i - 1][0] + 0.08;

  // ---------- o final da cabeça (opcional) ----------
  let EX = null, CER = null, PCAB = null, cabW = null;
  if (FIN) {
    const CAB = [[30, 120], [32, 101], [28, 91], [18, 76], [12, 58], [12, 42], [17, 27], [27, 15], [40, 7], [54, 4], [67, 6], [78, 13], [86, 24], [89, 35], [90, 42], [89, 46], [91, 51], [95, 58], [99, 64], [96, 67.5], [91, 68.5], [92, 72], [91, 75], [89, 76.5], [91.5, 79], [89, 82.5], [88.5, 86], [86, 90], [81, 93], [72, 94], [66, 96], [64, 104], [63, 120]];
    const CC = P(FIN.centro[0], FIN.centro[1]), CS = FIN.escala || 34;
    cabW = CAB.map(([x, y]) => [CC[0] + (x - 52) * CS, CC[1] + (y - 62) * CS]);
    const dentro = (x, y, poly) => { let d = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) d = !d; } return d; };
    PCAB = (() => { const pts = chaikin(chaikin(cabW, true), true), p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (const q of pts) p.lineTo(q[0], q[1]); p.closePath(); return p; })();
    CER = { x: CC[0] + (46 - 52) * CS, y: CC[1] + (35 - 62) * CS, rx: 31 * CS, ry: 23 * CS };
    const T0 = FIN.t, r = rng(2024), alvo = [], g = FIN.espaco || 40, xs = cabW.map(p => p[0]), ys = cabW.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), idxAlvo = {};
    for (let j = 0; j <= Math.ceil((y1 - y0) / g); j++) for (let i = 0; i <= Math.ceil((x1 - x0) / g); i++) { const x = x0 + i * g + (r() - 0.5) * g * 0.55, y = y0 + j * g + (r() - 0.5) * g * 0.55; if (dentro(x, y, cabW)) { idxAlvo[i + ',' + j] = alvo.length; alvo.push([x, y]); } }
    const n = alvo.length, ori = LUG[FIN.origem] || [CC[0] - 2400, CC[1]];
    const tx0 = ori[0] - 3000, tx1 = ori[0] + 2900, ty0 = ori[1] - 1700, ty1 = ori[1] + 1600, tg = Math.sqrt((tx1 - tx0) * (ty1 - ty0) / n), tc = Math.ceil((tx1 - tx0) / tg), tap = [], idxTap = {};
    let k = 0; for (let j = 0; k < n; j++) for (let i = 0; i < tc && k < n; i++, k++) { idxTap[i + ',' + j] = tap.length; tap.push([tx0 + (i + 0.5) * tg + (r() - 0.5) * tg * 0.7, ty0 + (j + 0.5) * tg + (r() - 0.5) * tg * 0.7]); }
    const oT = tap.map((p, i) => i).sort((a, b) => tap[a][1] - tap[b][1] || tap[a][0] - tap[b][0]), oA = alvo.map((p, i) => i).sort((a, b) => alvo[a][1] - alvo[b][1] || alvo[a][0] - alvo[b][0]);
    const parDe = new Array(n); oT.forEach((ti, q) => { parDe[ti] = oA[q]; }); const deAlvo = new Array(n); parDe.forEach((ai, ti) => { deAlvo[ai] = ti; });
    const ps = tap.map(([cx, cy], i) => { const [hx, hy] = alvo[parDe[i]], d = Math.hypot(cx - ori[0], cy - ori[1]); return { cx, cy, hx, hy, tile: Math.floor(r() * 64), r0: (r() - 0.5) * 50, r1: (r() - 0.5) * 10, td: T0 + 0.02 + 1.35 * Math.pow(clamp(d / 6000, 0, 1), 0.75) + r() * 0.12, tm: T0 + 3.8 + 0.62 * (1 - clamp((cx - tx0) / (tx1 - tx0), 0, 1)) + r() * 0.08, ph: r() * TAU, dist: d }; });
    const e1 = [], e2 = [];
    for (const key in idxTap) { const [i, j] = key.split(',').map(Number), a = idxTap[key]; for (const nb of [(i + 1) + ',' + j, i + ',' + (j + 1)]) if (idxTap[nb] !== undefined && r() < 0.8) e1.push([a, idxTap[nb], T0 + 1.58 + 1.5 * clamp(ps[a].dist / 6000, 0, 1) + r() * 0.1, r() * TAU]); }
    for (const key in idxAlvo) { const [i, j] = key.split(',').map(Number), a = idxAlvo[key]; for (const nb of [(i + 1) + ',' + j, i + ',' + (j + 1), (i + 1) + ',' + (j + 1)]) if (idxAlvo[nb] !== undefined) { const b = idxAlvo[nb], A = alvo[a], B = alvo[b], mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dn = Math.sqrt(((mx - CER.x) / CER.rx) ** 2 + ((my - CER.y) / CER.ry) ** 2), pw = Math.pow(clamp(1.2 - dn, 0, 1), 1.4); if (pw > 0.04 || r() < 0.35) e2.push([deAlvo[a], deAlvo[b], pw, r()]); } }
    EX = { ps, e1, e2, n, cerE: e2.filter(e => e[2] > 0.35), T0 };
    Object.assign(S, { mapDim: 0, cerebro: 0, contorno: 0 });
    tl.to(S, { cam: 0.95, amb: 0.1, duration: 1.2, ease: 'power2.inOut' }, T0);
    tl.to(S, { mapDim: 0.55, duration: 1.7, ease: 'sine.inOut' }, T0 + 3.88);
    tl.to(S, { contorno: 1, duration: 1.4, ease: 'sine.inOut' }, T0 + 6.23); tl.to(S, { cerebro: 0.55, duration: 1.4, ease: 'sine.inOut' }, T0 + 6.28); tl.to(S, { cerebro: 1.0, duration: 0.5, ease: 'power2.out' }, FIN.pensamento || T0 + 7.9);
    const hh = (y1 - y0), zh = 0.77 * H / hh * (VERT ? 1.4 : 1), zc = VERT ? 0.75 : 0.6;
    K.push([T0 + 1.35, ori[0] + 600, ori[1] - 200, zc, 1.0], [T0 + 3.5, ori[0] + 1150, ori[1] - 350, zc * 1.65, 0.4], [T0 + 5.45, (ori[0] + CC[0]) / 2 + 700, CC[1] + 70, zh * 1.55, -0.3], [DUR, CC[0] - 70, CC[1], zh, -0.6]);
    K.sort((a, b) => a[0] - b[0]);
  }
  function posEx(p, t) { const v = eIO2(clamp((t - p.tm) / 1.05, 0, 1)), aj = sst(EX.T0 + 1.48, EX.T0 + 1.88, t) * (1 - sst(EX.T0 + 2.78, EX.T0 + 3.78, t)); return [lerp(p.cx, p.hx, v), lerp(p.cy, p.hy, v), lerp(p.r0, p.r1, v) + aj * 7 * Math.sin(t * 5.3 + p.ph), v]; }
  function exemplos(c, t, M, z) {
    if (!EX || t < EX.T0) return; const atlas = IM('i-ex'); if (!ok(atlas)) return;
    const pw = 34, ph = 27, b = 2.4, mg = 60, T0 = EX.T0;
    if (t > T0 + 1.53 && t < T0 + 4.5) {
      const al = 1 - sst(T0 + 3.83, T0 + 4.43, t), ajx = 1 - sst(T0 + 2.18, T0 + 3.58, t);
      c.save(); c.strokeStyle = `rgba(160,28,18,${0.9 * al})`; c.lineWidth = 1.9 / z; c.beginPath();
      for (const [a, bb, tr, ph] of EX.e1) { if (t < tr) continue; const A = posEx(EX.ps[a], t), B = posEx(EX.ps[bb], t), u = clamp((t - tr) / 0.35, 0, 1), ex = lerp(A[0], B[0], u), ey = lerp(A[1], B[1], u), mx = (A[0] + ex) / 2, my = (A[1] + ey) / 2, dx = ey - A[1], dy = -(ex - A[0]), w = 0.18 * ajx * Math.sin(t * 6 + ph); c.moveTo(A[0], A[1]); c.quadraticCurveTo(mx + dx * w, my + dy * w, ex, ey); }
      c.stroke(); c.restore();
    }
    for (let i = 0; i < EX.n; i++) {
      const p = EX.ps[i]; if (t < p.td) continue; const u = clamp((t - p.td) / 0.34, 0, 1), hgt = 1 - u * u, [x, y, rot] = posEx(p, t);
      const sx = M.a * x + M.c * y + M.e, sy = M.b * x + M.d * y + M.f; if (sx < -mg || sx > W + mg || sy < -mg || sy > H + mg) continue;
      const s = 1 + 1.3 * hgt, cr = Math.cos(rot * RAD), sr = Math.sin(rot * RAD);
      c.setTransform(s * (M.a * cr + M.c * sr), s * (M.b * cr + M.d * sr), s * (-M.a * sr + M.c * cr), s * (-M.b * sr + M.d * cr), sx, sy); c.globalAlpha = clamp(u * 3, 0, 1);
      c.fillStyle = 'rgba(10,5,0,0.4)'; c.fillRect(-pw / 2 + 1.2 + 6 * hgt, -ph / 2 + 2 + 9 * hgt, pw, ph); c.fillStyle = '#ebe3d0'; c.fillRect(-pw / 2, -ph / 2, pw, ph);
      const k = p.tile; c.drawImage(atlas, (k % 8) * 64, Math.floor(k / 8) * 48, 64, 48, -pw / 2 + b, -ph / 2 + b, pw - 2 * b, ph - 2 * b);
    }
    c.globalAlpha = 1; c.setTransform(M.a, M.b, M.c, M.d, M.e, M.f);
  }
  function rede(c, t, M, z) {
    if (!EX || t < EX.T0 + 4.58) return; const T0 = EX.T0, ap = sst(T0 + 4.68, T0 + 5.88, t), cer = S.cerebro;
    c.save(); c.setTransform(M.a, M.b, M.c, M.d, M.e, M.f); c.globalCompositeOperation = 'lighter';
    const NB = 6, fx = Array.from({ length: NB }, () => new Path2D());
    for (const [a, b, pw] of EX.e2) { const A = posEx(EX.ps[a], t), B = posEx(EX.ps[b], t); if (A[3] < 0.9 || B[3] < 0.9) continue; const k = Math.min(NB - 1, Math.floor(pw * NB)); fx[k].moveTo(A[0], A[1]); fx[k].lineTo(B[0], B[1]); }
    for (let k = 0; k < NB; k++) { const w = (k + 0.5) / NB; c.lineWidth = (1.0 + 0.5 * w) / z; c.strokeStyle = `rgba(${Math.round(170 + 85 * w)},${Math.round(40 + (110 + 80 * cer) * w)},${Math.round(24 + 20 * w)},${(0.36 + w * (0.25 + 0.4 * cer)) * ap})`; c.stroke(fx[k]); }
    const np = Math.floor(lerp(60, 420, sst(T0 + 5.08, T0 + 7.98, t))); c.fillStyle = `rgba(255,${200 + 40 * cer},140,${0.9 * sst(T0 + 5.03, T0 + 5.48, t)})`;
    for (let i = 0; i < np && EX.cerE.length; i++) { const e = EX.cerE[Math.floor(hsh(i * 1.7) * EX.cerE.length)], A = posEx(EX.ps[e[0]], t), B = posEx(EX.ps[e[1]], t), u = (t * (0.9 + hsh(i) * 1.4) + hsh(i * 3.3)) % 1; c.beginPath(); c.arc(lerp(A[0], B[0], u), lerp(A[1], B[1], u), 3.2 / z + 6, 0, TAU); c.fill(); }
    if (cer > 0.001) { const g = c.createRadialGradient(CER.x, CER.y, 0, CER.x, CER.y, CER.rx * 1.25); g.addColorStop(0, `rgba(255,170,90,${0.32 * cer})`); g.addColorStop(0.6, `rgba(200,80,30,${0.16 * cer})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(CER.x - CER.rx * 1.4, CER.y - CER.ry * 1.6, CER.rx * 2.8, CER.ry * 3.2); }
    if (S.contorno > 0.001) { c.strokeStyle = `rgba(255,200,140,${0.16 * S.contorno})`; c.lineWidth = 9 / z; c.stroke(PCAB); c.strokeStyle = `rgba(255,225,180,${0.55 * S.contorno})`; c.lineWidth = 1.8 / z; c.stroke(PCAB); }
    c.restore();
  }

  // ---------- câmera: voos de van Wijk + suavização gaussiana no tempo ----------
  function vwn(p0, p1) {
    const rho = Math.SQRT2, [ux0, uy0, w0] = p0, [ux1, uy1, w1] = p1, dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy;
    if (d2 < 1e-6) { const L = Math.log(w1 / w0) / rho, Sl = Math.abs(L); return { S: Sl, f: s => { const u = Sl > 0 ? s / Sl : 0; return [ux0 + u * dx, uy0 + u * dy, w0 * Math.exp(Math.sign(L) * rho * s)]; } }; }
    const d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + 4 * d2) / (2 * w0 * 2 * d1), b1 = (w1 * w1 - w0 * w0 - 4 * d2) / (2 * w1 * 2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), Sl = (r1 - r0) / rho, ch = Math.cosh(r0), sh = Math.sinh(r0);
    return { S: Sl, f: s => { const u = w0 / (2 * d1) * (ch * Math.tanh(rho * s + r0) - sh); return [ux0 + u * dx, uy0 + u * dy, w0 * ch / Math.cosh(rho * s + r0)]; } };
  }
  if (K.length < 2) K.push([DUR, (K[0] || [0, 0, 0, 1])[1], (K[0] || [0, 0, 0, 1])[2], (K[0] || [0, 0, 0, 1])[3] * 0.9, 0]);
  const SEG = []; for (let i = 0; i < K.length - 1; i++) { const a = K[i], b = K[i + 1]; SEG.push(Object.assign(vwn([a[1], a[2], W / a[3]], [b[1], b[2], W / b[3]]), { t0: a[0], t1: b[0] })); }
  const dir = (sg, s0, s1) => { const A = sg.f(s0), B = sg.f(s1), w = (A[2] + B[2]) / 2, v = [(B[0] - A[0]) / w, (B[1] - A[1]) / w, Math.log(B[2] / A[2])], n = Math.hypot(...v) || 1; return v.map(x => x / n); };
  SEG.forEach(sg => { sg.v = sg.S / Math.max(1e-3, sg.t1 - sg.t0); });
  const VEL = new Array(K.length); VEL[0] = SEG[0].v; VEL[K.length - 1] = SEG[SEG.length - 1].v;
  for (let k = 1; k < K.length - 1; k++) {
    const a = SEG[k - 1], b = SEG[k], h0 = a.t1 - a.t0, h1 = b.t1 - b.t0; if (a.v <= 1e-6 || b.v <= 1e-6) { VEL[k] = 0; continue; }
    const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0; let v = (w1 + w2) / (w1 / a.v + w2 / b.v);
    const da = dir(a, a.S * 0.98, a.S), db = dir(b, 0, b.S * 0.02); v *= 0.2 + 0.8 * clamp(da[0] * db[0] + da[1] * db[1] + da[2] * db[2], 0, 1); VEL[k] = v;
  }
  SEG.forEach((sg, i) => { sg.m0 = VEL[i] * (sg.t1 - sg.t0); sg.m1 = VEL[i + 1] * (sg.t1 - sg.t0); });
  const rotF = (() => { const ts = K.map(k => k[0]), vs = K.map(k => k[4] || 0), n = ts.length, h = [], d = [], m = new Array(n); for (let i = 0; i < n - 1; i++) { h[i] = ts[i + 1] - ts[i]; d[i] = (vs[i + 1] - vs[i]) / h[i]; } m[0] = d[0]; m[n - 1] = d[n - 2]; for (let i = 1; i < n - 1; i++) { if (d[i - 1] * d[i] <= 0) m[i] = 0; else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); } } return t => { let i = 0; while (i < n - 2 && t > ts[i + 1]) i++; const s = clamp((t - ts[i]) / h[i], 0, 1), s2 = s * s, s3 = s2 * s; return (2 * s3 - 3 * s2 + 1) * vs[i] + (s3 - 2 * s2 + s) * h[i] * m[i] + (-2 * s3 + 3 * s2) * vs[i + 1] + (s3 - s2) * h[i] * m[i + 1]; }; })();
  const FIMT = (C.cta && VERT) ? C.cta.fim : DUR;
  function cameraBruta(t) {
    t = clamp(t, K[0][0], K[K.length - 1][0]); let i = 0; while (i < SEG.length - 1 && t > SEG[i].t1) i++;
    const sg = SEG[i], u = clamp((t - sg.t0) / Math.max(1e-3, sg.t1 - sg.t0), 0, 1), u2 = u * u, u3 = u2 * u;
    const s = clamp((u3 - 2 * u2 + u) * sg.m0 + (-2 * u3 + 3 * u2) * sg.S + (u3 - u2) * sg.m1, 0, sg.S), [x, y, w] = sg.f(s); return { x, y, z: W / w, r: rotF(t) };
  }
  const HZ = 240, SIG = 0.19, T0C = -1, NC = Math.ceil((FIMT + 2) * HZ) + 1;
  const CAM = (() => {
    const ch = [0, 1, 2, 3].map(() => new Float64Array(NC)), p = t => { const c = cameraBruta(t); return [c.x, c.y, Math.log(W / c.z), c.r]; };
    const a0 = p(0), a1 = p(0.01), b0 = p(DUR), b1 = p(DUR - 0.01);
    for (let i = 0; i < NC; i++) { const t = T0C + i / HZ; const v = t < 0 ? a0.map((x, k) => x + t * (a1[k] - x) / 0.01) : t > DUR ? b0.map((x, k) => x + (t - DUR) * (x - b1[k]) / 0.01 * 0.3) : p(t); for (let k = 0; k < 4; k++) ch[k][i] = v[k]; }
    const R = Math.ceil(3 * SIG * HZ), ker = []; let soma = 0; for (let j = -R; j <= R; j++) { const w = Math.exp(-0.5 * (j / (SIG * HZ)) ** 2); ker.push(w); soma += w; }
    return ch.map(c => { const o = new Float64Array(NC); for (let i = 0; i < NC; i++) { let acc = 0; for (let j = -R; j <= R; j++) acc += c[clamp(i + j, 0, NC - 1)] * ker[j + R]; o[i] = acc / soma; } return o; });
  })();
  function camera(t) { const f = clamp((t - T0C) * HZ, 0, NC - 1.001), i = Math.floor(f), u = f - i, v = CAM.map(c => c[i] + (c[i + 1] - c[i]) * u); return { x: v[0], y: v[1], z: W / Math.exp(v[2]), r: v[3] }; }
  const IMPACTOS = OBJ.filter(o => o.cfg.carimbo).map(o => o.cfg.carimbo.t);
  function tremor(t) {
    let hx = 1.7 * (0.55 * Math.sin(TAU * 0.23 * t + 1.1) + 0.30 * Math.sin(TAU * 0.51 * t + 2.3) + 0.15 * Math.sin(TAU * 1.17 * t + 0.4));
    let hy = 1.4 * (0.50 * Math.sin(TAU * 0.19 * t + 0.7) + 0.35 * Math.sin(TAU * 0.43 * t + 1.9) + 0.15 * Math.sin(TAU * 1.31 * t + 2.8));
    const hr = 0.10 * (0.6 * Math.sin(TAU * 0.17 * t + 0.3) + 0.4 * Math.sin(TAU * 0.37 * t + 1.2));
    for (const ti of IMPACTOS) if (t >= ti) { const e = Math.exp(-(t - ti) * 7); hx += 11 * e * Math.sin(TAU * 13 * (t - ti)); hy += 9 * e * Math.sin(TAU * 11 * (t - ti) + 1); }
    return [hx, hy, hr];
  }
  function matriz(t) { const c = camera(t), [hx, hy, hr] = tremor(t), r = (c.r + hr) * RAD, z = c.z, a = z * Math.cos(r), b = z * Math.sin(r), cc = -z * Math.sin(r), d = z * Math.cos(r); return { a, b, c: cc, d, e: W / 2 + hx - (a * c.x + cc * c.y), f: H / 2 + hy - (b * c.x + d * c.y), z }; }
  // névoa nas viagens longas (mais perto da câmera: anda mais rápido)
  const NUV = (() => { const r = rng(5150), a = []; for (let i = 1; i < K.length; i++) { const A = K[i - 1], B = K[i], d = Math.hypot(B[1] - A[1], B[2] - A[2]); if (d < 2500) continue; for (let k = 0; k < 6; k++) { const u = r(); a.push([lerp(A[1], B[1], u) + (r() - 0.5) * 900, lerp(A[2], B[2], u) + (r() - 0.5) * 700, 300 + r() * 520, 0.18 + r() * 0.2]); } } return a; })();
  function nuvens(c, t, M) {
    const al = clamp((1.3 - M.z) / 0.8, 0, 1) * (FIN ? 1 - sst(FIN.t - 0.5, FIN.t, t) : 1); if (al <= 0.01 || !NUV.length) return;
    const k = 1.9; c.save(); c.setTransform(M.a * k, M.b * k, M.c * k, M.d * k, (M.e - W / 2) * k + W / 2, (M.f - H / 2) * k + H / 2);
    for (const [x, y, r, a] of NUV) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(236,226,206,${a * al})`); g.addColorStop(0.55, `rgba(230,218,196,${a * al * 0.5})`); g.addColorStop(1, 'rgba(230,218,196,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
    c.restore();
  }

  // ---------- luz: ambiente + a luz que acompanha a câmera + luminárias no mundo ----------
  const quente = (v, a) => `rgba(${Math.round(255 * v)},${Math.round(238 * v)},${Math.round(208 * v)},${a === undefined ? 1 : a})`;
  function luz(c, M) {
    const k = LMW / W; lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalCompositeOperation = 'source-over'; lx.fillStyle = quente(S.amb); lx.fillRect(0, 0, LMW, LMH); lx.globalCompositeOperation = 'lighter';
    if (S.cam > 0.001) { const rf = 1 + 0.45 * clamp((0.9 - M.z) / 0.7, 0, 1), g = lx.createRadialGradient(LMW * 0.5, LMH * 0.46, 8, LMW * 0.5, LMH * 0.5, Math.max(LMW, LMH) * 0.56 * rf); g.addColorStop(0, quente(S.cam * 1.08)); g.addColorStop(0.3, quente(S.cam * 0.95)); g.addColorStop(0.6, quente(S.cam * 0.42)); g.addColorStop(0.85, quente(S.cam * 0.12)); g.addColorStop(1, quente(0)); lx.fillStyle = g; lx.fillRect(0, 0, LMW, LMH); }
    for (const L of LUZES) { const v = S.luz[L.k]; if (v <= 0.001) continue; const sx = (M.a * L.x + M.c * L.y + M.e) * k, sy = (M.b * L.x + M.d * L.y + M.f) * k, rr = L.r * M.z * k, g = lx.createRadialGradient(sx, sy, 0, sx, sy, rr); g.addColorStop(0, quente(v)); g.addColorStop(0.45, quente(v * 0.75)); g.addColorStop(1, quente(0)); lx.fillStyle = g; lx.fillRect(sx - rr, sy - rr, rr * 2, rr * 2); }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'multiply'; c.imageSmoothingQuality = 'high'; c.drawImage(LM, 0, 0, W, H); c.restore();
  }
  function brilhos(c, M) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter';
    for (const L of LUZES) { const v = S.luz[L.k]; if (v <= 0.001) continue; const sx = M.a * L.x + M.c * L.y + M.e, sy = M.b * L.x + M.d * L.y + M.f, rr = L.r * M.z * 0.5, g = c.createRadialGradient(sx, sy, 0, sx, sy, rr); g.addColorStop(0, `rgba(255,190,120,${0.22 * v})`); g.addColorStop(1, 'rgba(255,190,120,0)'); c.fillStyle = g; c.fillRect(sx - rr, sy - rr, rr * 2, rr * 2); }
    c.restore();
  }

  // ---------- um quadro (com desfoque de movimento real nos movimentos rápidos) ----------
  function cena(c, t, M) {
    const z = M.z; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#100a05'; c.fillRect(0, 0, W, H);
    c.setTransform(M.a, M.b, M.c, M.d, M.e, M.f); mapa(c, z, M); rotas(c, t, z, M); rotulos(c, z, M); anos(c, t, M); fios(c, t, z);
    for (const o of OBJ) objeto(c, o, z); pinos(c); nuvens(c, t, M);
    if (S.mapDim > 0.001) { c.fillStyle = `rgba(10,6,3,${S.mapDim})`; c.fillRect(MX0, MY0, MX1 - MX0, MY1 - MY0); }
    exemplos(c, t, M, z); luz(c, M); brilhos(c, M); rede(c, t, M, z);
    if (S.fade > 0.001) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.fillStyle = `rgba(0,0,0,${S.fade})`; c.fillRect(0, 0, W, H); }
  }
  const OBT = 0.5 / 30;
  function deslocamento(t) {
    const A = matriz(t - OBT / 2), B = matriz(t + OBT / 2); let m = 0;
    for (const [sx, sy] of [[0, 0], [W, 0], [0, H], [W, H], [W / 2, H / 2]]) { const det = A.a * A.d - A.b * A.c, x = sx - A.e, y = sy - A.f, wx = (A.d * x - A.c * y) / det, wy = (-A.b * x + A.a * y) / det; m = Math.max(m, Math.hypot(B.a * wx + B.c * wy + B.e - sx, B.b * wx + B.d * wy + B.f - sy)); }
    return m;
  }
  function desenha() {
    const t = tl.time(), N = clamp(Math.ceil(deslocamento(t) / 2.2), 1, 24);
    if (N <= 1) { cena(out, t, matriz(t)); return; }
    ax.setTransform(1, 0, 0, 1, 0, 0); ax.globalAlpha = 1; ax.clearRect(0, 0, W, H);
    for (let k = 0; k < N; k++) { cena(bx, t, matriz(t + (k / (N - 1) - 0.5) * OBT)); ax.globalAlpha = 1 / (k + 1); ax.drawImage(BUF, 0, 0); }
    out.setTransform(1, 0, 0, 1, 0, 0); out.globalAlpha = 1; out.globalCompositeOperation = 'copy'; out.drawImage(ACC, 0, 0); out.globalCompositeOperation = 'source-over';
  }
  tl.eventCallback('onUpdate', desenha);
  window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
  window.__doc = { camera, deslocamento, K, S, O, desenha, tl, FIOS };
  desenha();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { for (const k in LARG) delete LARG[k]; desenha(); });
})();
