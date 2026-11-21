/* Estilo Colagem · motor (GSAP, quadro a quadro no HyperFrames). Lê window.CENA (cena.js) e window.PALAVRAS (assets/palavras.js).
   Tudo o que se mexe sai de uma linha do tempo só (window.__timelines.main), então cada quadro é igual em toda geração. */
(function () {
  const C = window.CENA, PAL = window.PALAVRAS || [];
  const plano = window.COLAGEM_PLANO.planejar(C);
  const FIM = plano.fim;
  const tl = gsap.timeline({ paused: true });
  const root = document.getElementById('root');
  const CORES = { cinza: '#6b6b6b', escuro: '#151515', papel: '#d9c9a3', creme: '#ece6d8', amarelo: '#e9bb22', laranja: '#ea5a1d',
    azul: '#2341d4', vermelho: '#d1141b', verde: '#2f8f4e', preto: '#121212', branco: '#f1efe9' };
  const CLARAS = ['papel', 'creme', 'amarelo', 'branco'];
  const cor = c => CORES[c] || c || CORES.cinza;
  const M = C.marca || {};
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
  // número "aleatório" fixo (a mesma peça sai igual em toda geração)
  const sem = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---------- peças ----------
  function foto(o) {
    const w = o.w || 720, h = Math.round((w - 28) * (o.prop || 0.72));
    const e = el('div', 'foto'); e.style.width = w + 'px';
    if (o.papel !== false) {
      const p = el('div', 'papel'); p.style.background = cor(o.papel || ['laranja', 'azul', 'amarelo', 'vermelho'][Math.floor(sem(w + h) * 4)]);
      const dx = o.papel_dx !== undefined ? o.papel_dx : -24, dy = o.papel_dy !== undefined ? o.papel_dy : -20;
      p.style.transform = `translate(${dx}px, ${dy}px) rotate(${o.papel_rot !== undefined ? o.papel_rot : 2.5}deg)`; e.appendChild(p);
    }
    const m = el('div', 'moldura' + (o.pb ? ' pb' : '')); const im = el('img'); im.src = 'assets/fotos/' + o.img + '.jpg'; im.style.height = h + 'px';
    if (o.pos) im.style.objectPosition = o.pos; m.appendChild(im); e.appendChild(m);
    const fitas = o.fitas === undefined ? 2 : o.fitas;
    const cantos = [[-44, -14, -38], [w - 88, -14, 38], [-44, h + 4, 38], [w - 88, h + 4, -38]];
    for (let k = 0; k < fitas; k++) { const f = el('div', 'fita'); const [x, y, r] = cantos[k]; f.style.left = x + 'px'; f.style.top = y + 'px'; f.style.transform = `rotate(${r + (sem(k + w) - .5) * 8}deg)`; e.appendChild(f); }
    if (M.arroba && o.assinatura !== false) e.appendChild(el('div', 'assin', `<i></i>${esc(M.arroba)}`));
    if (o.fonte) e.appendChild(el('div', 'fonte', esc(o.fonte)));
    return e;
  }
  function tv(o) {
    const w = o.w || 760, sw = w - 184, sh = Math.round(sw * 0.74);
    const e = el('div', 'tv'); e.style.width = (w - 184) + 'px';
    const tela = el('div', 'tela'); tela.style.height = sh + 'px'; e.appendChild(tela);
    (o.imgs || []).forEach((it, k) => {
      const im = el('img'); im.src = 'assets/fotos/' + it.img + '.jpg'; tela.appendChild(im);
      const t1 = (o.imgs[k + 1] && o.imgs[k + 1].t) || 1e6;
      tl.set(im, { visibility: 'visible' }, k === 0 ? 0 : it.t); if (t1 < 1e6) tl.set(im, { visibility: 'hidden' }, t1);
    });
    [0.30, 0.62].forEach(y => { const b = el('div', 'botao'); b.style.top = (34 + sh * y - 25) + 'px'; e.appendChild(b); });
    e.appendChild(el('div', 'grade'));
    return e;
  }
  function cartao(o) {
    const e = el('div', 'cartao'); if (o.w) e.style.width = o.w + 'px';
    if (o.rot_txt) e.appendChild(el('div', 'rot', esc(o.rot_txt)));
    if (o.titulo) e.appendChild(el('div', 'tit', esc(o.titulo)));
    if (o.numero) {
      const n = el('div', 'num'); [...o.numero].forEach((ch, k) => { const s = el('span', '', ch === ' ' ? '&nbsp;' : esc(ch)); n.appendChild(s); tl.set(s, { visibility: 'visible' }, o.tnum + k * o.passo); });
      e.appendChild(n);
    }
    if (o.linha) e.appendChild(el('div', 'linha'));
    if (o.texto) e.appendChild(el('div', 'sub', esc(o.texto)));
    return e;
  }
  function etiqueta(o) { const e = el('div', 'etiqueta ' + (o.estilo || 'branca'), esc(o.texto)); if (o.cor) e.style.color = o.cor; return e; }
  function folha(o) { const e = el('div', 'folha'); e.style.width = (o.w || 760) + 'px'; e.style.height = (o.h || 980) + 'px'; e.style.background = cor(o.cor || 'amarelo'); return e; }
  function selo(o) { const e = el('div', 'selo', `<b>${esc(o.texto)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}`); if (o.cor) e.style.background = cor(o.cor); if (o.w) { e.style.width = e.style.height = o.w + 'px'; } return e; }
  function carimbo(o) { const e = el('div', 'carimbo', esc(o.texto)); if (o.tam) e.style.fontSize = o.tam + 'px'; return e; }
  function lista(o) {
    const e = el('div', 'cartao lista'); e.style.width = (o.w || 620) + 'px';
    if (o.titulo) e.appendChild(el('div', 'rot', esc(o.titulo)));
    (o.itens || []).forEach(it => {
      const r = el('div', 'item'); const cx = el('div', 'caixa');
      if (it.t !== undefined) {
        cx.innerHTML = '<svg viewBox="0 0 54 54"><path pathLength="1" d="M10 30 L22 42 L48 6" style="stroke:#d0161b;stroke-width:7;fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1"/></svg>';
        tl.to(cx.querySelector('path'), { strokeDashoffset: 0, duration: 0.18, ease: 'power2.out' }, it.t);
      }
      r.appendChild(cx); r.appendChild(el('span', '', esc(it.texto))); e.appendChild(r);
    });
    return e;
  }
  function pilha(o) {
    const e = el('div', ''); e.style.width = '1px'; e.style.height = '1px';
    (o.itens || []).forEach((it, k) => {
      const c = el('div', 'cartao'); c.style.position = 'absolute'; c.style.padding = '22px 30px 40px'; c.style.width = (it.w || 300) + 'px';
      c.appendChild(el('div', 'rot', esc(it.texto)));
      const dx = it.dx !== undefined ? it.dx : (k % 2 ? 1 : -1) * (60 + sem(k) * 120), dy = it.dy !== undefined ? it.dy : (k - (o.itens.length - 1) / 2) * 70;
      gsap.set(c, { x: dx, y: dy, xPercent: -50, yPercent: -50, rotation: (sem(k + 9) - .5) * 14, autoAlpha: 0 });
      tl.fromTo(c, { autoAlpha: 0, scale: 1.18, filter: 'blur(6px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.2, ease: 'power2.out', immediateRender: false }, it.t);
      e.appendChild(c);
    });
    return e;
  }
  function ano(o) {
    const e = el('div', 'ano' + (o.escuro ? ' esc' : '')); e.innerHTML = `<div class="regua"></div><b>${esc(o.de !== undefined ? o.de : o.texto)}</b><div class="regua"></div>${o.marcas === false ? '' : '<div class="marcas"></div>'}${o.sub ? `<div class="sub">${esc(o.sub)}</div>` : ''}`;
    if (o.de !== undefined && o.ate !== undefined) {
      const b = e.querySelector('b'); const p = { v: o.de };
      tl.fromTo(p, { v: o.de }, { v: o.ate, duration: o.dconta, ease: 'power2.out', immediateRender: false, onUpdate: () => { b.textContent = (o.prefixo || '') + Math.round(p.v).toLocaleString('pt-BR').replace(/\./g, o.milhar === false ? '' : '.') + (o.sufixo || ''); } }, o.tconta);
    }
    return e;
  }
  function nota(o) { return el('div', 'nota', esc(o.texto)); }
  function celular(o) {
    const e = el('div', 'celular'); const t = el('div', 'tela'); e.appendChild(t); t.appendChild(el('div', 'ilha'));
    const av = el('div', 'avatar'); if (M.foto) av.style.backgroundImage = `url(assets/${M.foto})`; else av.textContent = (M.nome || M.arroba || '?').replace('@', '').slice(0, 1).toUpperCase();
    t.appendChild(av); t.appendChild(el('div', 'nome', esc(M.nome || ''))); t.appendChild(el('div', 'arroba', esc(M.arroba || '')));
    if (M.bio) t.appendChild(el('div', 'bio', esc(M.bio)));
    const bt = el('div', 'botao', 'Seguir'); const sg = el('div', 'seguindo', 'Seguindo'); bt.appendChild(sg); t.appendChild(bt);
    const g = el('div', 'grade'); for (let k = 0; k < 9; k++) g.appendChild(el('i')); t.appendChild(g);
    const toque = el('div', 'toque'); bt.appendChild(toque); toque.style.left = '50%'; toque.style.top = '50%';
    const tc = C.cta.clique;
    tl.fromTo(toque, { opacity: 0.9, scale: 0.5 }, { opacity: 0, scale: 1.5, duration: 0.42, ease: 'power2.out', immediateRender: false }, tc);
    tl.fromTo(bt, { scale: 1 }, { scale: 0.95, duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.inOut', immediateRender: false }, tc);
    tl.set(sg, { visibility: 'visible' }, tc + 0.08);
    return e;
  }
  function comenta(o) {
    const e = el('div', 'comenta'); e.appendChild(el('div', 'c1', esc(C.cta.texto1 || 'Comenta')));
    const p = el('div', 'pal'); [...(C.cta.palavra || '')].forEach((ch, k) => {
      const s = el('span', '', esc(ch)); s.style.transform = `rotate(${(sem(k + 3) - .5) * 8}deg)`; p.appendChild(s);
      tl.fromTo(s, { autoAlpha: 0, scale: 1.8 }, { autoAlpha: 1, scale: 1, duration: 0.14, ease: 'back.out(1.6)', immediateRender: false }, C.cta.t + 0.5 + k * 0.09);
      gsap.set(s, { autoAlpha: 0 });
    });
    e.appendChild(p); e.appendChild(el('div', 'c3', esc(C.cta.texto2 || 'que eu te mando no direct')));
    return e;
  }
  // mapa recortado (scripts/mapa.py): contorno que se desenha, estados que acendem, pinos com etiqueta, rota e zoom
  function mapa(o) {
    const D = (window.MAPAS || {})[o.mapa]; if (!D) { console.warn('mapa não preparado:', o.mapa); return el('div'); }
    const W = o.w || 1000, s = W / D.w, H = Math.round(D.h * s);
    const pos = (lo, la) => [(lo - D.caixa[0]) * D.kx * D.esc * s, (D.caixa[3] - la) * D.esc * s];
    const e = el('div', 'mapa'); e.style.width = W + 'px'; e.style.height = H + 'px';
    const inner = el('div', 'mapa-in'); e.appendChild(inner);
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${D.w} ${D.h}`); svg.setAttribute('width', W); svg.setAttribute('height', H); inner.appendChild(svg);
    if (o.fora && D.fora) { const f = document.createElementNS(NS, 'path'); f.setAttribute('d', D.fora); f.setAttribute('fill', cor(o.fora)); svg.appendChild(f); }
    const base = cor(o.base || '#ece8df'), reg = new Set(o.regiao || []), P = {};
    Object.entries(D.estados).forEach(([uf, st]) => {
      const p = document.createElementNS(NS, 'path'); p.setAttribute('d', st.d); p.setAttribute('pathLength', '1');
      p.style.fill = reg.has(uf) ? cor(o.cor_regiao || '#f2b48e') : base; p.style.stroke = '#ffffff'; p.style.strokeWidth = 1.6 / s; p.style.strokeLinejoin = 'round';
      svg.appendChild(p); P[uf] = p;
    });
    if (o.desenha !== false) {   // o contorno se traça e depois o mapa enche (como nas referências)
      const ps = Object.values(P); gsap.set(ps, { fillOpacity: 0, strokeDasharray: 1, strokeDashoffset: 1, stroke: '#c9161d' });
      tl.to(ps, { strokeDashoffset: 0, duration: 0.42, ease: 'power1.inOut', immediateRender: false }, o.t);
      tl.to(ps, { fillOpacity: 1, stroke: '#ffffff', duration: 0.22, ease: 'power1.out', immediateRender: false }, o.t + 0.36);
    }
    (o.destaques || []).forEach(dq => (dq.uf || []).forEach(uf => { if (P[uf]) tl.to(P[uf], { fill: cor(dq.cor || 'laranja'), duration: 0.22, ease: 'power2.out', immediateRender: false }, dq.t); }));
    (o.rotas || []).forEach(r => {
      const [x1, y1] = pos(...r.de), [x2, y2] = pos(...r.para);
      const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('class', 'rota'); sv.setAttribute('width', W); sv.setAttribute('height', H);
      const p = document.createElementNS(NS, 'path'); p.setAttribute('d', `M${x1} ${y1} Q${(x1 + x2) / 2 + (r.curva || 40)} ${(y1 + y2) / 2} ${x2} ${y2}`); p.setAttribute('pathLength', '1');
      p.style.cssText = 'fill:none;stroke:#c9161d;stroke-width:6;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1'; sv.appendChild(p); inner.appendChild(sv);
      tl.to(p, { strokeDashoffset: 0, duration: r.dur || 0.6, ease: 'power1.inOut' }, r.t);
    });
    (o.pinos || []).forEach((pn, k) => {
      const [x, y] = pos(pn.lon, pn.lat);
      const pin = el('div', 'pino-mapa'); pin.style.left = x + 'px'; pin.style.top = y + 'px'; inner.appendChild(pin);
      const tag = el('div', 'tag-mapa' + (pn.lado === 'esquerda' ? ' esq' : ''), esc(pn.texto || '')); tag.style.left = x + 'px'; tag.style.top = y + 'px'; if (pn.texto) inner.appendChild(tag);
      gsap.set([pin, tag], { autoAlpha: 0 }); if (pn.lado === 'esquerda') gsap.set(tag, { xPercent: -100 });
      tl.fromTo(pin, { autoAlpha: 0, scale: 2.2 }, { autoAlpha: 1, scale: 1, duration: 0.14, ease: 'back.out(2)', immediateRender: false }, pn.t);
      tl.fromTo(pin, { boxShadow: '0 0 0 0px rgba(201,22,29,.55)' }, { boxShadow: '0 0 0 26px rgba(201,22,29,0)', duration: 0.6, ease: 'power2.out', immediateRender: false }, pn.t + 0.1);
      if (pn.texto) tl.fromTo(tag, { autoAlpha: 0, filter: 'blur(8px)', y: 10 }, { autoAlpha: 1, filter: 'blur(0px)', y: 0, duration: 0.18, ease: 'power3.out', immediateRender: false }, pn.t + 0.08);
    });
    (o.zoom || []).forEach(z => {
      const [px, py] = z.centro ? pos(...z.centro) : [W / 2, H / 2]; const sc = z.escala || 1.6;
      tl.to(inner, { x: W / 2 - px * sc, y: H / 2 - py * sc, scale: sc, duration: z.dur || 0.9, ease: 'power2.inOut', transformOrigin: '0 0' }, z.t);
    });
    gsap.set(inner, { transformOrigin: '0 0' });
    return e;
  }
  // gráfico de barras num papel: as barras crescem uma a uma e o número conta junto
  function barras(o) {
    const e = el('div', 'cartao barras'); e.style.width = (o.w || 640) + 'px';
    if (o.titulo) e.appendChild(el('div', 'rot', esc(o.titulo)));
    const area = el('div', 'area'); area.style.height = (o.h || 460) + 'px'; e.appendChild(area);
    const max = Math.max(...(o.itens || []).map(i => i.valor)) || 1;
    (o.itens || []).forEach((it, k) => {
      const col = el('div', 'col'); const num = el('div', 'n', '0'); const b = el('div', 'b'); b.style.background = cor(it.cor || (k === (o.destaque || 0) ? 'vermelho' : '#3b3832'));
      const lab = el('div', 'l', esc(it.texto || '')); col.appendChild(num); col.appendChild(b); col.appendChild(lab); area.appendChild(col);
      const h = (o.h || 460) * 0.78 * it.valor / max, t = it.t !== undefined ? it.t : o.t + 0.25 + k * 0.28, p = { v: 0 };
      gsap.set(b, { height: 0 });
      tl.to(b, { height: h, duration: 0.5, ease: 'power3.out' }, t);
      tl.fromTo(p, { v: 0 }, { v: it.valor, duration: 0.5, ease: 'power3.out', immediateRender: false, onUpdate: () => { num.textContent = (o.prefixo || '') + (o.decimais ? p.v.toFixed(o.decimais).replace('.', ',') : Math.round(p.v)) + (o.sufixo || ''); } }, t);
    });
    if (o.fonte) e.appendChild(el('div', 'sub', esc(o.fonte)));
    return e;
  }
  const FAZ = { foto, tv, cartao, etiqueta, folha, selo, carimbo, lista, pilha, ano, nota, celular, comenta, mapa, barras };

  // traços desenhados: seta, círculo de caneta e fio vermelho entre dois pinos
  function traco(o, mesa) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'traco'); svg.setAttribute('viewBox', '0 0 1080 1920');
    const pth = (d, w) => { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); p.setAttribute('pathLength', '1'); p.style.strokeWidth = w; p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1'; svg.appendChild(p); return p; };
    const ps = [];
    if (o.tipo === 'seta') {
      const [x1, y1] = o.de_xy, [x2, y2] = o.para_xy; const mx = (x1 + x2) / 2 + (o.curva !== undefined ? o.curva : 60), my = (y1 + y2) / 2 - 20;
      ps.push(pth(`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`, 6));
      const a = Math.atan2(y2 - my, x2 - mx), L = 30;
      ps.push(pth(`M${x2 - L * Math.cos(a - 0.45)} ${y2 - L * Math.sin(a - 0.45)} L${x2} ${y2} L${x2 - L * Math.cos(a + 0.45)} ${y2 - L * Math.sin(a + 0.45)}`, 6));
    } else if (o.tipo === 'circulo') {
      const cx = o.x, cy = o.y, rx = (o.w || 300) / 2, ry = (o.h || 120) / 2; let d = '';
      const f1 = sem(cx + cy) * 6, f2 = sem(cx - cy) * 6;   // traço de mão: ondula devagar, sem serrilhar
      for (let k = 0; k <= 90; k++) { const a = -2.2 + (k / 90) * Math.PI * 2.2; const j = 1 + 0.025 * Math.sin(a * 2 + f1) + 0.015 * Math.sin(a * 3 + f2) + k / 90 * 0.07;
        d += (k ? 'L' : 'M') + (cx + rx * j * Math.cos(a)).toFixed(1) + ' ' + (cy + ry * j * Math.sin(a)).toFixed(1); }
      ps.push(pth(d, 6));
    } else if (o.tipo === 'fio') {
      const [x1, y1] = o.de_xy, [x2, y2] = o.para_xy; ps.push(pth(`M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.max(y1, y2) + 60} ${x2} ${y2}`, 3.5));
      [[x1, y1], [x2, y2]].forEach(([x, y], k) => { const p = el('div', 'pino'); p.style.left = (x - 15) + 'px'; p.style.top = (y - 15) + 'px'; mesa.appendChild(p);
        tl.fromTo(p, { autoAlpha: 0, scale: 1.8 }, { autoAlpha: 1, scale: 1, duration: 0.12, ease: 'back.out(2)', immediateRender: false }, k ? o.t + o.d : o.t); gsap.set(p, { autoAlpha: 0 }); });
    }
    if (o.cor) ps.forEach(p => p.style.stroke = o.cor);
    mesa.appendChild(svg);
    const t0 = o.tipo === 'fio' ? o.t + 0.1 : o.t;
    ps.forEach((p, k) => tl.to(p, { strokeDashoffset: 0, duration: k ? 0.1 : o.d, ease: 'power1.inOut' }, k ? t0 + o.d : t0));
    if (o.tipo === 'seta' && o.nota) {
      const n = el('div', 'obj nota', esc(o.nota)); mesa.appendChild(n);
      const [x2, y2] = o.para_xy; const nx = o.nota_xy ? o.nota_xy[0] : o.de_xy[0], ny = o.nota_xy ? o.nota_xy[1] : o.de_xy[1] - 34;
      gsap.set(n, { x: nx, y: ny, xPercent: -50, yPercent: -50, rotation: -2, autoAlpha: 0 });
      tl.fromTo(n, { autoAlpha: 0, y: ny + 16, filter: 'blur(6px)' }, { autoAlpha: 1, y: ny, filter: 'blur(0px)', duration: 0.18, ease: 'power3.out', immediateRender: false }, o.tnota);
    }
    return svg;
  }

  // ---------- entrada de cada peça (medida nas referências: 4 a 7 quadros, rápida no começo e freando) ----------
  function entra(e, o, shakeAlvo) {
    const x = o.x !== undefined ? o.x : 540, y = o.y !== undefined ? o.y : 900, r = o.rot !== undefined ? o.rot : 0;
    gsap.set(e, { x, y, xPercent: -50, yPercent: -50, rotation: r, autoAlpha: 0, transformOrigin: '50% 50%' });
    if (o.z) e.style.zIndex = o.z;
    const t = o.t, dir = { direita: [90, 0], esquerda: [-90, 0], baixo: [0, 90], cima: [0, -90] }[o.de] || [90, 0];
    const fim = { autoAlpha: 1, x, y, rotation: r, scale: 1, filter: 'blur(0px)', immediateRender: false };
    switch (o.entra) {
      case 'corte': tl.set(e, { autoAlpha: 1 }, t); break;
      case 'sobe': tl.fromTo(e, { autoAlpha: 0, x, y: y + 54, rotation: r, filter: 'blur(10px)' }, { ...fim, duration: o.d, ease: 'power3.out' }, t); break;
      case 'lado': tl.fromTo(e, { autoAlpha: 0, x: x + dir[0], y: y + dir[1], rotation: r + 5, filter: 'blur(8px)' }, { ...fim, duration: o.d, ease: 'power3.out' }, t); break;
      case 'cai': tl.fromTo(e, { autoAlpha: 0, x, y, rotation: r - 3, scale: 1.16, filter: 'blur(6px)' }, { ...fim, duration: o.d, ease: 'power2.out' }, t); break;
      case 'bate':
        tl.fromTo(e, { autoAlpha: 0, x, y, rotation: r - 6, scale: 2.1 }, { autoAlpha: 1, x, y, rotation: r, scale: 1, duration: o.d, ease: 'back.out(1.5)', immediateRender: false }, t);
        tl.fromTo(shakeAlvo, { x: 0, y: 0 }, { keyframes: [{ x: 9, y: -5, duration: 0.03 }, { x: -7, y: 4, duration: 0.03 }, { x: 4, y: -2, duration: 0.03 }, { x: 0, y: 0, duration: 0.04 }], immediateRender: false }, t + o.d * 0.8);
        break;
      default: tl.set(e, { autoAlpha: 1 }, t);
    }
    if (o.sai !== undefined) tl.to(e, { autoAlpha: 0, filter: 'blur(6px)', duration: 0.12, ease: 'power1.in' }, o.sai - 0.12);
    // respiro: a peça não fica morta enquanto está na tela (as referências flutuam 1 a 2 px)
    if (o.flutua !== false && (o.tipo === 'foto' || o.tipo === 'cartao' || o.tipo === 'lista' || o.tipo === 'tv')) {
      tl.to(e, { rotation: r + (sem(x + y) > .5 ? 0.6 : -0.6), duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: 1 }, t + o.d);
    }
  }

  // ---------- cenas ----------
  const escuroTxt = c => CLARAS.indexOf(c.fundo || C.fundo || 'cinza') >= 0;
  (C.cenas || []).forEach((c, i) => {
    const cena = el('div', 'cena'); cena.id = 'cena' + (i + 1);
    const cam = el('div', 'cam'), push = el('div', 'push'), fundo = el('div', 'fundo'), mesa = el('div', 'mesa');
    fundo.style.setProperty('--cor', cor(c.fundo || C.fundo || 'cinza'));
    if (escuroTxt(c)) mesa.classList.add('escuro-txt');
    push.appendChild(fundo); push.appendChild(mesa); cam.appendChild(push); cena.appendChild(cam); cena.appendChild(el('div', 'vinheta'));
    root.insertBefore(cena, document.getElementById('legenda'));
    tl.set(cena, { visibility: 'visible' }, c.t0); if (c.t1 < FIM + 1) tl.set(cena, { visibility: 'hidden' }, c.t1);
    // câmera: empurra devagar a cena inteira o tempo todo (nas referências ~5% por cena), com uma leve deriva
    const emp = c.empurra !== undefined ? c.empurra : 0.055;
    const dx = c.deriva ? c.deriva[0] : (sem(i + 1) - .5) * 30, dy = c.deriva ? c.deriva[1] : -12;
    tl.fromTo(push, { scale: 1, x: 0, y: 0 }, { scale: 1 + emp, x: dx, y: dy, duration: Math.max(0.1, c.t1 - c.t0), ease: 'none', immediateRender: false }, c.t0);
    const folhaClara = (c.objetos || []).some(o => o.tipo === 'folha' && CLARAS.indexOf(o.cor || 'amarelo') >= 0);   // número sobre folha clara fica escuro
    (c.objetos || []).forEach(o => { if (o.tipo === 'ano' && o.escuro === undefined && folhaClara) o.escuro = true; });
    (c.objetos || []).forEach((o, j) => {
      if (o.tipo === 'seta' || o.tipo === 'circulo' || o.tipo === 'fio') { traco(o, mesa); return; }
      const f = FAZ[o.tipo]; if (!f) { console.warn('tipo desconhecido', o.tipo); return; }
      const w = el('div', 'obj'); w.appendChild(f(o)); mesa.appendChild(w); entra(w, o, mesa);
      // foco: a câmera chega perto da peça (como o empurrão no documento das referências)
      if (o.foco) {
        const s = o.foco === true ? 1.35 : o.foco, ox = o.x !== undefined ? o.x : 540, oy = o.y !== undefined ? o.y : 900;
        tl.to(cam, { scale: s, x: -(ox - 540) * s, y: 900 - (960 + (oy - 960) * s), duration: 0.7, ease: 'power2.inOut' }, o.t + (o.foco_atraso || 0.15));
      }
    });
  });

  // ---------- CTA ----------
  if (C.cta) {
    const cena = el('div', 'cena'); cena.id = 'cena-cta';
    const cam = el('div', 'cam'), push = el('div', 'push'), fundo = el('div', 'fundo'), mesa = el('div', 'mesa');
    fundo.style.setProperty('--cor', cor(C.cta.fundo || 'laranja'));
    push.appendChild(fundo); push.appendChild(mesa); cam.appendChild(push); cena.appendChild(cam); cena.appendChild(el('div', 'vinheta'));
    root.insertBefore(cena, document.getElementById('legenda'));
    tl.set(cena, { visibility: 'visible' }, C.cta.t);
    tl.fromTo(push, { scale: 1 }, { scale: 1.04, duration: C.cta.fim - C.cta.t, ease: 'none', immediateRender: false }, C.cta.t);
    const tipo = C.cta.tipo === 'comenta' ? 'comenta' : 'celular';
    const o = { tipo, t: C.cta.t, entra: tipo === 'celular' ? 'corte' : 'sobe', d: 0.2, x: 540, y: tipo === 'celular' ? 1010 : 960, flutua: false };
    const w = el('div', 'obj'); w.appendChild(FAZ[tipo](o)); mesa.appendChild(w); entra(w, o, mesa);
    if (tipo === 'celular') tl.fromTo(w, { y: 1010 + 700 }, { y: 1010, duration: 0.38, ease: 'power3.out', immediateRender: false }, C.cta.t);
  }

  // ---------- legenda: palavra por palavra, desfoque que some em 4 quadros ----------
  const LIG = new Set(['a', 'o', 'as', 'os', 'e', 'é', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'que', 'por', 'pra', 'para', 'com', 'se', 'ao', 'aos', 'à', 'ou', 'mas', 'há', 'pelo', 'pela', 'seu', 'sua']);
  const norm = w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const ENF = new Set((C.enfase || []).map(norm));
  const L = document.getElementById('legenda');
  const frases = []; let cur = null;
  const cenaDe = t => { const cs = C.cenas || []; for (let k = cs.length - 1; k >= 0; k--) if (t >= cs[k].t0 - 0.02) return cs[k]; return cs[0] || {}; };
  PAL.forEach((p, k) => {
    const ant = PAL[k - 1]; const principais = cur ? cur.ws.filter(x => !LIG.has(norm(x.w))).length : 0;
    const letras = cur ? cur.ws.map(x => x.w).join(' ').length : 0;
    const quebra = !cur || /[.!?:;]$/.test(ant.w) || (/,$/.test(ant.w) && cur.ws.length >= 2) || p.s - ant.e > 0.32 || principais >= (C.palavras_por_frase || 3) && !LIG.has(norm(p.w)) || letras + p.w.length > 24 || cenaDe(p.s) !== cenaDe(cur.ws[0].s);
    if (quebra) { cur = { ws: [] }; frases.push(cur); }
    cur.ws.push(p);
  });
  frases.forEach((f, k) => {
    const c = cenaDe(f.ws[0].s); const temMapa = (c.objetos || []).some(o => o.tipo === 'mapa');
    const tag = (c.legenda || (temMapa ? 'etiqueta' : C.legenda)) === 'etiqueta';   // em cima de mapa claro, a legenda vira etiqueta preta (como nas referências)
    const claro = !(C.cta && f.ws[0].s >= C.cta.t ? CLARAS.indexOf(C.cta.fundo || 'laranja') >= 0 : escuroTxt(c));
    const d = el('div', 'frase ' + (tag ? 'tag ' : '') + (claro ? 'claro' : 'escuro')); L.appendChild(d);
    const t0 = f.ws[0].s - 0.04, prox = frases[k + 1] ? frases[k + 1].ws[0].s - 0.04 : FIM;
    const t1 = Math.min(prox, f.ws[f.ws.length - 1].e + 1.2);
    if (tag) {
      d.innerHTML = `<span class="caixa">${esc(f.ws.map(x => x.w).join(' '))}</span>`;
      tl.fromTo(d, { autoAlpha: 0, filter: 'blur(10px)' }, { autoAlpha: 1, filter: 'blur(0px)', duration: 0.16, ease: 'power2.out', immediateRender: false }, t0);
    } else {
      let i0 = 0; while (i0 < f.ws.length - 1 && LIG.has(norm(f.ws[i0].w))) i0++;
      const sup = el('div', 'sup'), pri = el('div', 'pri'); d.appendChild(sup); d.appendChild(pri);
      if (f.ws.slice(i0).some(x => ENF.has(norm(x.w)))) pri.classList.add('it');
      f.ws.forEach((x, j) => {
        const s = el('span', 'w' + (j >= i0 && LIG.has(norm(x.w)) ? ' pq' : ''), esc(x.w));
        (j < i0 ? sup : pri).appendChild(s); (j < i0 ? sup : pri).appendChild(document.createTextNode(' '));
        tl.fromTo(s, { opacity: 0, filter: 'blur(9px)', y: 6 }, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.14, ease: 'power2.out', immediateRender: false }, x.s - 0.04);
      });
      tl.set(d, { visibility: 'visible' }, t0);
    }
    tl.to(d, { autoAlpha: 0, filter: 'blur(8px)', duration: 0.09, ease: 'power1.in' }, t1 - 0.09);
  });

  // ---------- barra de progresso ----------
  if (C.barra !== false) tl.fromTo('#barra i', { scaleX: 0 }, { scaleX: 1, duration: FIM, ease: 'none', immediateRender: false }, 0);
  else document.getElementById('barra').style.display = 'none';

  tl.set({}, {}, FIM);
  window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
  window.__colagem = { tl, plano, frases };
})();
