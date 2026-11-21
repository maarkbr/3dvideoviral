/*
  Cenário 3D — "Lavagem de dinheiro": uma cidade ensolarada (céu azul, mesas de pedra vermelha ao longe),
  com quatro palcos ao longo do eixo z (a câmera corta de um para o outro):
    POSTO  (z =    0)  posto de gasolina com o LAVA JATO (escovas girando, carro, espuma)
    BANCO  (z =  -60)  fachada de banco com colunas
    LAVAND (z = -120)  frente da lavanderia
    MAQ    (z = -180)  praça com a MÁQUINA DE LAVAR GIGANTE (tambor com notas, água, sirene)
  Mesma interface do shopping3d.js: desenhar(t), projetar(x,y,z), sombra(x,z,rx,rz), cam.quadro, fontesProntas().
  Extras: cena.ceu(t) -> THREE.Color (tinta do céu por tempo), cena.maq (peças da máquina), cena.lava (escovas, espuma).
  Só Lambert/Phong/Basic. Nada de Math.random(): gerador fixo.
*/
(function (global) {
  'use strict';
  const THREE = global.THREE;
  let semente = 7;
  const rnd = () => { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; };
  const FONTE = "'Baloo 2', system-ui, sans-serif";
  const textos = [];
  function texCanvas(w, h, desenha, comTexto) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); desenha(g, w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
    if (comTexto) textos.push(() => { g.clearRect(0, 0, w, h); desenha(g, w, h); t.needsUpdate = true; });
    return t;
  }

  const Z = { POSTO: 0, BANCO: -60, LAVAND: -120, MAQ: -180 };

  function criar(canvas, opts = {}) {
    const W = opts.largura || 1080, H = opts.altura || 1920;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1); renderer.setSize(W, H, false);
    renderer.outputEncoding = THREE.LinearEncoding;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;

    const scene = new THREE.Scene();
    const HORIZ = new THREE.Color('#ffd9b0');
    scene.fog = new THREE.Fog(HORIZ.clone(), 60, 420);
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 1200);

    // ---------- helpers ----------
    const M = (cor, extra = {}) => {
      const p = { color: cor };
      for (const k of ['emissive', 'emissiveIntensity', 'map', 'transparent', 'opacity', 'depthWrite', 'side', 'clippingPlanes']) if (k in extra) p[k] = extra[k];
      if (extra.brilho) return new THREE.MeshPhongMaterial(Object.assign(p, { shininess: extra.brilho, specular: new THREE.Color(extra.especular || '#555566') }));
      return new THREE.MeshLambertMaterial(p);
    };
    const B = (cor, k = 1, extra = {}) => { const m = new THREE.MeshBasicMaterial(Object.assign({ color: cor }, extra)); m.color.multiplyScalar(k); return m; };
    const facet = (geo) => { const g = geo.index ? geo.toNonIndexed() : geo; g.computeVertexNormals(); return g; };
    const caixa = (w, h, d, mat, x, y, z, pai, sombra = true) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
      m.castShadow = sombra; m.receiveShadow = true; (pai || scene).add(m); return m;
    };
    const cil = (rt, rb, h, mat, x, y, z, pai, seg = 28) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z);
      m.castShadow = true; m.receiveShadow = true; (pai || scene).add(m); return m;
    };
    const plano = (w, h, mat, pai) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); (pai || scene).add(m); return m; };
    const radial = (cor) => texCanvas(256, 256, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, cor); gr.addColorStop(0.5, cor.replace(/[\d.]+\)$/, '0.45)')); gr.addColorStop(1, cor.replace(/[\d.]+\)$/, '0)'));
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    const TEX_LUZ = radial('rgba(255,255,255,1)');
    const TEX_SOMBRA = radial('rgba(0,0,0,1)');

    // letreiro: texto grosso com contorno, num fundo
    function letreiro(texto, cor, fundo, opt = {}) {
      return texCanvas(opt.w || 1024, opt.h || 256, (g, w, h) => {
        if (fundo) { g.fillStyle = fundo; g.fillRect(0, 0, w, h); }
        if (opt.borda) { g.strokeStyle = opt.borda; g.lineWidth = 18; g.strokeRect(9, 9, w - 18, h - 18); }
        g.font = `800 ${opt.fs || 170}px ${FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        const larg = g.measureText(texto).width, esc = Math.min(1, (w - 80) / larg);
        g.save(); g.translate(w / 2, h / 2 + (opt.dy || 14)); g.scale(esc, 1);
        g.lineJoin = 'round'; g.lineWidth = opt.contorno || 22; g.strokeStyle = '#17121d'; g.strokeText(texto, 0, 0);
        g.fillStyle = cor; g.fillText(texto, 0, 0);
        g.restore();
      }, true);
    }

    // ---------- céu (cúpula com degradê; a cor vem de cena.ceu(t)) ----------
    const texCeu = texCanvas(64, 1024, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#2f6bff'); gr.addColorStop(0.36, '#5f95ff'); gr.addColorStop(0.49, '#a9cbff'); gr.addColorStop(0.55, '#ffe2bf'); gr.addColorStop(1, '#ffe2bf');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    const ceuMat = new THREE.MeshBasicMaterial({ map: texCeu, side: THREE.BackSide, fog: false, depthWrite: false });
    const ceuMesh = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 24), ceuMat);
    scene.add(ceuMesh);
    // nuvens (sprites fofos) e sol
    const texNuvem = texCanvas(512, 256, (g) => {
      const bolas = [[130, 170, 90], [230, 130, 110], [340, 150, 95], [420, 180, 70], [80, 195, 55], [290, 195, 80]];
      g.fillStyle = 'rgba(255,255,255,1)';
      bolas.forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(190,205,240,.55)'; g.fillRect(0, 195, 512, 80);
    });
    const nuvens = [];
    for (let i = 0; i < 26; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texNuvem, transparent: true, opacity: 0.92, fog: false, depthWrite: false }));
      const a = rnd() * Math.PI * 2, r = 380 + rnd() * 260;
      s.position.set(Math.cos(a) * r, 110 + rnd() * 150, -90 + Math.sin(a) * r);
      const k = 70 + rnd() * 90; s.scale.set(k * 2, k, 1); scene.add(s); nuvens.push(s);
    }
    const sol = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX_LUZ, color: new THREE.Color('#fff4d0').multiplyScalar(1.6), fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    sol.scale.set(200, 200, 1); scene.add(sol);

    // ---------- mesas de pedra ao longe (camadas vermelhas como no exemplo) ----------
    const texRocha = texCanvas(512, 512, (g, w, h) => {
      const cores = ['#c2452f', '#e0703f', '#b23a2d', '#f08c52', '#d45a36', '#9e2f2a', '#e47b44'];
      let y = 0; let i = 0;
      while (y < h) { const hh = 14 + rnd() * 34; g.fillStyle = cores[i++ % cores.length]; g.fillRect(0, y, w, hh); y += hh; }
      g.globalAlpha = 0.12; for (let k = 0; k < 400; k++) { g.fillStyle = rnd() > 0.5 ? '#fff' : '#400'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 20, 2); }
    });
    texRocha.wrapS = texRocha.wrapT = THREE.RepeatWrapping;
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2 + rnd() * 0.1, r = 330 + rnd() * 140;
      const w = 40 + rnd() * 80, h = 30 + rnd() * 60;
      const mat = M('#ffffff', { map: texRocha.clone() }); mat.map.needsUpdate = true; mat.map.repeat.set(w / 60, h / 60);
      const m = new THREE.Mesh(facet(new THREE.CylinderGeometry(w * 0.42, w * 0.55, h, 7)), mat);
      m.position.set(Math.cos(a) * r, h / 2 - 2, -90 + Math.sin(a) * r); m.rotation.y = rnd() * 3;
      scene.add(m);
    }

    // ---------- chão: areia quente, rua de asfalto com faixa, calçadas ----------
    const texAreia = texCanvas(512, 512, (g, w, h) => {
      g.fillStyle = '#e9a66b'; g.fillRect(0, 0, w, h);
      for (let k = 0; k < 2200; k++) { g.fillStyle = ['#d98f57', '#f4bb83', '#c97c4a', '#f7c897'][k % 4]; g.globalAlpha = 0.5; g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 6, 3 + rnd() * 6); }
    });
    texAreia.wrapS = texAreia.wrapT = THREE.RepeatWrapping; texAreia.repeat.set(140, 140);
    const chao = plano(1600, 1600, M('#ffffff', { map: texAreia })); chao.rotation.x = -Math.PI / 2; chao.position.set(0, -0.02, -90); chao.receiveShadow = true;
    const texAsfalto = texCanvas(512, 1024, (g, w, h) => {
      g.fillStyle = '#4d4a5c'; g.fillRect(0, 0, w, h);
      for (let k = 0; k < 3000; k++) { g.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.1)'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
      g.fillStyle = '#ffd23f'; g.fillRect(w / 2 - 10, 0, 20, h * 0.55);
      g.fillStyle = '#f2efe6'; g.fillRect(14, 0, 14, h); g.fillRect(w - 28, 0, 14, h);
    });
    texAsfalto.wrapT = THREE.RepeatWrapping; texAsfalto.repeat.set(1, 60);
    const rua = plano(10, 400, M('#ffffff', { map: texAsfalto })); rua.rotation.x = -Math.PI / 2; rua.position.set(0, 0.0, -100); rua.receiveShadow = true;
    // a rua passa ao lado dos palcos (x = -11), os palcos ficam numa praça de concreto
    rua.position.x = -14;
    const texConcreto = texCanvas(512, 512, (g, w, h) => {
      g.fillStyle = '#c9b6a2'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#a48f7a'; g.lineWidth = 5; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); }
      for (let k = 0; k < 900; k++) { g.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(80,60,40,.08)'; g.fillRect(rnd() * w, rnd() * h, 3, 3); }
    });
    texConcreto.wrapS = texConcreto.wrapT = THREE.RepeatWrapping;
    function praca(z, w = 26, d = 26, cor = '#ffffff') {
      const t = texConcreto.clone(); t.needsUpdate = true; t.repeat.set(w / 4, d / 4);
      const p = plano(w, d, M(cor, { map: t })); p.rotation.x = -Math.PI / 2; p.position.set(0, 0.01, z - 4); p.receiveShadow = true;
      return p;
    }

    // ---------- árvores, cactos, postes (enfeites) ----------
    const verdes = ['#3fae55', '#2f9a4a', '#5cc463', '#7dd36a'];
    function arvore(x, z, k = 1) {
      const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      cil(0.18 * k, 0.26 * k, 2.2 * k, M('#8a5a36'), 0, 1.1 * k, 0, g, 8);
      for (let i = 0; i < 4; i++) {
        const f = new THREE.Mesh(facet(new THREE.IcosahedronGeometry((1.1 + rnd() * 0.5) * k, 0)), M(verdes[i % 4]));
        f.position.set((rnd() - 0.5) * 1.4 * k, (2.6 + rnd() * 1.2) * k, (rnd() - 0.5) * 1.4 * k); f.castShadow = true; g.add(f);
      }
      return g;
    }
    function cacto(x, z, k = 1) {
      const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      const mat = M('#3f9f57');
      cil(0.28 * k, 0.32 * k, 2.4 * k, mat, 0, 1.2 * k, 0, g, 10);
      cil(0.18 * k, 0.18 * k, 0.9 * k, mat, 0.5 * k, 1.5 * k, 0, g, 10).rotation.z = 0;
      caixa(0.5 * k, 0.22 * k, 0.22 * k, mat, 0.28 * k, 1.1 * k, 0, g);
      cil(0.16 * k, 0.16 * k, 0.8 * k, mat, -0.46 * k, 1.9 * k, 0, g, 10);
      caixa(0.46 * k, 0.2 * k, 0.2 * k, mat, -0.24 * k, 1.55 * k, 0, g);
      return g;
    }
    function poste(x, z) {
      const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      cil(0.08, 0.12, 4.4, M('#2d2b3a', { brilho: 40 }), 0, 2.2, 0, g, 10);
      cil(0.2, 0.2, 0.2, M('#2d2b3a'), 0, 0.1, 0, g, 10);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), B('#fff1c4', 1.4)); lamp.position.set(0, 4.6, 0); g.add(lamp);
      cil(0.3, 0.12, 0.2, M('#2d2b3a'), 0, 4.9, 0, g, 10);
    }
    for (let z = 40; z > -230; z -= 9) { poste(-8.4, z); poste(-19.6, z + 4.5); }
    for (let z = 34; z > -230; z -= 13) { arvore(-23 - rnd() * 6, z + rnd() * 4, 1 + rnd() * 0.4); }

    // ---------- cartaz pintado (placa grande com texto) ----------
    function placa(texto, cor, fundo, w, h, x, y, z, pai, opt = {}) {
      const p = plano(w, h, B('#ffffff', opt.luz || 1.0, { map: letreiro(texto, cor, fundo, opt) }), pai);
      p.position.set(x, y, z); return p;
    }

    // =====================================================================
    //  PALCO 1 — POSTO LAVA JATO (z = 0)
    // =====================================================================
    const lava = { escovas: [], espuma: [], carro: null };
    {
      const z0 = Z.POSTO, g = new THREE.Group(); g.position.set(0, 0, z0); scene.add(g);
      praca(z0, 30, 30, '#e6d6c2');
      // cobertura do posto (à esquerda da tela)
      const cobX = -5.2;
      for (const [x, z] of [[cobX - 3, -3.5], [cobX + 3, -3.5], [cobX - 3, -8.5], [cobX + 3, -8.5]]) cil(0.22, 0.22, 4.6, M('#f4f1ea', { brilho: 30 }), x, 2.3, z, g, 14);
      caixa(9.4, 0.7, 7.4, M('#f4f1ea'), cobX, 4.9, -6, g);
      const texFaixa = texCanvas(512, 64, (c, w, h) => { c.fillStyle = '#e8402f'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffd23f'; c.fillRect(0, h * 0.62, w, h * 0.2); });
      const faixa = caixa(9.6, 0.8, 7.6, M('#ffffff', { map: texFaixa }), cobX, 4.9, -6, g); faixa.scale.set(1, 1, 1);
      placa('POSTO', '#ffd23f', '#1f5fd6', 4.0, 0.8, cobX, 4.9, -2.18, g, { fs: 190 });
      // bombas
      for (const x of [cobX - 1.6, cobX + 1.6]) {
        caixa(1.1, 0.25, 1.6, M('#cfc6ba'), x, 0.12, -6, g);
        caixa(0.8, 1.7, 0.6, M('#e8402f', { brilho: 30 }), x, 1.05, -6, g);
        caixa(0.6, 0.45, 0.62, B('#1b2a44', 1.0), x, 1.45, -6, g, false);
        placa('R$ 6,19', '#7cff9a', '#0d1730', 0.56, 0.18, x, 1.52, -5.68, g, { fs: 150, contorno: 4 });
        cil(0.04, 0.04, 0.9, M('#222'), x + 0.42, 1.0, -5.7, g, 8);
      }
      // prédio do lava jato (à direita da tela)
      const lx = 5.0, lz = -9.5;
      const paredeAzul = M('#2f7de1');
      caixa(1.0, 4.6, 7, paredeAzul, lx - 3.6, 2.3, lz, g);
      caixa(1.0, 4.6, 7, paredeAzul, lx + 3.6, 2.3, lz, g);
      caixa(8.2, 1.5, 7, paredeAzul, lx, 5.35, lz, g);
      caixa(8.2, 4.6, 0.4, M('#1d4fa0'), lx, 2.3, lz - 3.5, g);
      const texTeto = texCanvas(512, 128, (c, w, h) => { for (let x = 0; x < w; x += 64) { c.fillStyle = (x / 64) % 2 ? '#ffffff' : '#2fb6ff'; c.fillRect(x, 0, 64, h); } });
      texTeto.wrapS = THREE.RepeatWrapping; texTeto.repeat.set(2, 1);
      caixa(8.6, 0.5, 7.4, M('#ffffff', { map: texTeto }), lx, 6.3, lz, g);
      // letreiro LAVA JATO grande, com bolhas desenhadas
      const texLJ = texCanvas(1024, 384, (c, w, h) => {
        c.fillStyle = '#123a8a'; c.fillRect(0, 0, w, h);
        c.strokeStyle = '#ffd23f'; c.lineWidth = 16; c.strokeRect(14, 14, w - 28, h - 28);
        for (let i = 0; i < 18; i++) { c.fillStyle = 'rgba(160,220,255,.35)'; c.beginPath(); c.arc(rnd() * w, rnd() * h, 10 + rnd() * 30, 0, 7); c.fill(); }
        c.font = `800 210px ${FONTE}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineJoin = 'round'; c.lineWidth = 26; c.strokeStyle = '#17121d'; c.strokeText('LAVA JATO', w / 2, h / 2 + 18);
        c.fillStyle = '#ffffff'; c.fillText('LAVA JATO', w / 2, h / 2 + 18);
        c.fillStyle = '#7fd4ff'; c.save(); c.beginPath(); c.rect(0, h / 2 + 18, w, h); c.clip(); c.fillText('LAVA JATO', w / 2, h / 2 + 18); c.restore();
      }, true);
      const lj = plano(7.4, 2.8, B('#ffffff', 1.1, { map: texLJ }), g); lj.position.set(lx, 7.95, lz + 3.75);
      caixa(7.7, 3.1, 0.2, M('#0d1f4a'), lx, 7.95, lz + 3.6, g);
      lava.letreiro = lj;
      // escovas giratórias (cilindros "peludos")
      const texEsc = texCanvas(256, 256, (c, w, h) => {
        c.fillStyle = '#1e8fff'; c.fillRect(0, 0, w, h);
        for (let k = 0; k < 500; k++) { c.fillStyle = ['#6cc6ff', '#0b5fd0', '#ffffff'][k % 3]; c.globalAlpha = 0.6; c.fillRect(rnd() * w, rnd() * h, 3, 16 + rnd() * 20); }
      });
      for (const x of [lx - 2.3, lx + 2.3]) {
        const e = cil(0.75, 0.75, 3.6, M('#ffffff', { map: texEsc }), x, 2.2, lz + 0.6, g, 20);
        lava.escovas.push(e);
      }
      const rolo = cil(0.55, 0.55, 5.0, M('#ffffff', { map: texEsc }), lx, 4.2, lz + 0.6, g, 20); rolo.rotation.z = Math.PI / 2; lava.rolo = rolo;
      // carro (low poly) dentro do lava jato
      const carro = new THREE.Group(); carro.position.set(lx, 0, lz + 0.6); carro.rotation.y = 0; g.add(carro);
      const lat = M('#ff5a3c', { brilho: 70, especular: '#ffffff' });
      caixa(2.0, 0.75, 4.2, lat, 0, 0.75, 0, carro);
      caixa(1.7, 0.7, 2.2, lat, 0, 1.45, -0.2, carro);
      caixa(1.72, 0.5, 2.0, M('#8fd3ff', { brilho: 90, especular: '#ffffff' }), 0, 1.5, -0.2, carro, false);
      for (const [x, z] of [[-0.95, 1.3], [0.95, 1.3], [-0.95, -1.3], [0.95, -1.3]]) { const r = cil(0.42, 0.42, 0.3, M('#1d1b26'), x, 0.42, z, carro, 16); r.rotation.z = Math.PI / 2; }
      for (const x of [-0.6, 0.6]) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), B('#fff5c8', 1.6)); f.position.set(x, 0.85, 2.11); carro.add(f); }
      lava.carro = carro;
      // espuma (bolhas) — posição calculada pelo tempo em cena.lava.tempo
      const matBolha = M('#ffffff', { brilho: 90, especular: '#ffffff', transparent: true, opacity: 0.9 });
      for (let i = 0; i < 60; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.12 + rnd() * 0.2, 12, 10), matBolha);
        b.userData = { x: lx + (rnd() - 0.5) * 5.6, z: lz + 3.2 + rnd() * 2.6, v: 0.25 + rnd() * 0.6, f: rnd() * 6, y0: 0.2 + rnd() * 1.2 };
        g.add(b); lava.espuma.push(b);
      }
      // placa de preço alta
      cil(0.14, 0.14, 7, M('#d9d4cc'), -12.0, 3.5, -12, g, 10);
      placa('LAVA JATO', '#ffd23f', '#1f5fd6', 3.2, 1.1, -12.0, 7.2, -11.85, g, { fs: 180 });
      // enfeites
      cacto(12.6, -6, 1.2); cacto(-13.5, -2, 1.0); arvore(13.5, -14, 1.3);
      // bandeirinhas
      for (let i = 0; i < 12; i++) {
        const b = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 3), M(['#e8402f', '#ffd23f', '#2f9a4a', '#2f7de1'][i % 4]));
        b.rotation.x = Math.PI; b.position.set(cobX - 4.4 + i * 0.8, 4.35, -2.3 + Math.sin(i) * 0.02); g.add(b);
      }
    }

    // =====================================================================
    //  PALCO 2 — BANCO (z = -60)
    // =====================================================================
    const banco = {};
    {
      const z0 = Z.BANCO, g = new THREE.Group(); g.position.set(0, 0, z0); scene.add(g);
      praca(z0, 34, 30, '#e3d2bc');
      const fz = -7.5;
      const pedra = M('#f3ead9'), pedraS = M('#d8c8ae');
      // escadaria
      for (let i = 0; i < 4; i++) caixa(16 - i * 0.6, 0.28, 2.0 - i * 0.4, pedraS, 0, 0.14 + i * 0.28, fz + 1.6 - i * 0.3, g);
      // corpo
      caixa(15, 8.5, 6, M('#eadfc9'), 0, 1.12 + 4.25, fz - 3.0, g);
      // colunas
      for (let i = 0; i < 6; i++) {
        const x = -6 + i * 2.4;
        cil(0.42, 0.48, 6.6, pedra, x, 1.12 + 3.3, fz, g, 20);
        caixa(1.15, 0.3, 1.15, pedraS, x, 1.12 + 0.15, fz, g);
        caixa(1.2, 0.35, 1.2, pedraS, x, 1.12 + 6.75, fz, g);
      }
      caixa(15.4, 1.0, 1.6, pedra, 0, 8.9, fz, g);
      // frontão triangular
      const tri = new THREE.Shape(); tri.moveTo(-7.9, 0); tri.lineTo(7.9, 0); tri.lineTo(0, 2.6); tri.lineTo(-7.9, 0);
      const fr = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 1.4, bevelEnabled: false }), pedraS);
      fr.position.set(0, 9.4, fz - 0.7); fr.castShadow = true; g.add(fr);
      // letreiro BANCO dourado
      placa('BANCO', '#ffcf3d', '#2a2a3a', 6.2, 1.1, 0, 8.9, fz + 0.82, g, { fs: 200 });
      // cifrão no frontão
      placa('$', '#ffcf3d', null, 1.4, 1.4, 0, 10.3, fz + 0.72, g, { w: 256, h: 256, fs: 230 });
      // portas
      caixa(3.0, 4.2, 0.2, M('#6b3f26', { brilho: 30 }), 0, 1.12 + 2.1, fz - 0.6, g);
      caixa(0.12, 4.2, 0.24, M('#c9a24a', { brilho: 80 }), 0, 1.12 + 2.1, fz - 0.55, g);
      // janelas com grade dourada
      for (const x of [-4.8, 4.8]) {
        caixa(1.8, 2.6, 0.2, B('#8fc7ff', 0.85), x, 4.0, fz - 2.9, g, false);
        for (let k = -2; k <= 2; k++) caixa(0.08, 2.6, 0.24, M('#c9a24a', { brilho: 80 }), x + k * 0.36, 4.0, fz - 2.85, g);
      }
      // bandeiras e vasos
      for (const x of [-9.5, 9.5]) {
        cil(0.07, 0.07, 9, M('#d9d4cc'), x, 4.5, fz + 2.5, g, 8);
        const band = plano(1.8, 1.1, M(x < 0 ? '#2f9a4a' : '#ffd23f', { side: THREE.DoubleSide }), g); band.position.set(x + 0.92, 8.3, fz + 2.5);
        band.userData.fase = x; (banco.bandeiras = banco.bandeiras || []).push(band);
      }
      for (const x of [-7.6, 7.6]) {
        cil(0.55, 0.45, 0.9, M('#c47a4a'), x, 0.45, fz + 3.2, g, 16);
        const f = new THREE.Mesh(facet(new THREE.IcosahedronGeometry(0.85, 0)), M('#3fae55')); f.position.set(x, 1.5, fz + 3.2); f.castShadow = true; g.add(f);
      }
      arvore(-14, -6, 1.3); arvore(14, -8, 1.2); cacto(12.5, 1, 1.0);
    }

    // =====================================================================
    //  PALCO 3 — FRENTE DA LAVANDERIA (z = -120)
    // =====================================================================
    {
      const z0 = Z.LAVAND, g = new THREE.Group(); g.position.set(0, 0, z0); scene.add(g);
      praca(z0, 30, 26, '#f0c9a0');
      const fz = -6.5;
      caixa(14, 7.5, 5, M('#ff8a3d'), 0, 3.75, fz - 2.5, g);
      caixa(14.4, 0.6, 5.4, M('#d9622a'), 0, 7.6, fz - 2.5, g);
      // toldo listrado
      const texToldo = texCanvas(512, 64, (c, w, h) => { for (let x = 0; x < w; x += 64) { c.fillStyle = (x / 64) % 2 ? '#ffffff' : '#18b4a6'; c.fillRect(x, 0, 64, h); } });
      texToldo.wrapS = THREE.RepeatWrapping; texToldo.repeat.set(4, 1);
      const toldo = caixa(12.5, 0.15, 2.2, M('#ffffff', { map: texToldo }), 0, 4.55, fz + 1.0, g); toldo.rotation.x = 0.32;
      // letreiro
      placa('LAVANDERIA', '#ffffff', '#18b4a6', 9.5, 1.6, 0, 6.0, fz + 0.03, g, { fs: 190, borda: '#ffffff' });
      // vitrine com máquinas pequenas
      caixa(10, 3.4, 0.12, B('#bfe7ff', 0.9), 0, 2.3, fz - 0.4, g, false);
      for (let i = 0; i < 5; i++) {
        const x = -4 + i * 2;
        caixa(1.5, 1.6, 0.6, M('#ffffff', { brilho: 40 }), x, 1.4, fz - 0.15, g);
        const d = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 10, 28), M('#9aa3b8', { brilho: 80 })); d.position.set(x, 1.3, fz + 0.17); g.add(d);
        const v = new THREE.Mesh(new THREE.CircleGeometry(0.4, 28), B('#4aa8ff', 0.9)); v.position.set(x, 1.3, fz + 0.16); g.add(v);
      }
      caixa(10.6, 0.4, 0.4, M('#e8e1d5'), 0, 0.2, fz + 0.1, g);
      cacto(-9.5, -2, 1.3); arvore(10.5, -4, 1.2); poste(-7.5, 1.5); poste(7.5, 1.5);
    }

    // =====================================================================
    //  PALCO 4 — MÁQUINA DE LAVAR GIGANTE (z = -180)
    // =====================================================================
    const maq = {};
    {
      const z0 = Z.MAQ, g = new THREE.Group(); g.position.set(0, 0, z0); scene.add(g);
      praca(z0, 40, 36, '#b9d4e6');
      const MX = 0, MZ = -6.5, MW = 6.2, MH = 7.4, MD = 5.0;
      const corpo = new THREE.Group(); corpo.position.set(MX, 0, MZ); g.add(corpo); maq.corpo = corpo;
      const branco = M('#eef1fa', { brilho: 60, especular: '#ffffff' });
      // corpo com cantos arredondados (caixa + cilindros nas quinas)
      caixa(MW - 0.8, MH, MD - 0.4, branco, 0, MH / 2 + 0.3, -0.2, corpo);
      caixa(MW, MH - 0.8, MD - 0.4, branco, 0, MH / 2 + 0.3, -0.2, corpo);
      { // painel da frente com o furo da porta
        const r = 0.4, w = MW / 2, y0 = 0.3, y1 = MH + 0.3, sh = new THREE.Shape();
        sh.moveTo(-w + r, y0); sh.lineTo(w - r, y0); sh.quadraticCurveTo(w, y0, w, y0 + r); sh.lineTo(w, y1 - r); sh.quadraticCurveTo(w, y1, w - r, y1);
        sh.lineTo(-w + r, y1); sh.quadraticCurveTo(-w, y1, -w, y1 - r); sh.lineTo(-w, y0 + r); sh.quadraticCurveTo(-w, y0, -w + r, y0);
        const furoP = new THREE.Path(); furoP.absarc(0, 3.35, 1.86, 0, Math.PI * 2, true); sh.holes.push(furoP);
        const fr = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: false, curveSegments: 48 }), branco);
        fr.position.set(0, 0, MD / 2 - 0.4); fr.castShadow = true; fr.receiveShadow = true; corpo.add(fr);
      }
      for (const x of [-(MW / 2 - 0.4), MW / 2 - 0.4]) for (const y of [0.7, MH - 0.1]) { const c = cil(0.4, 0.4, MD - 0.4, branco, x, y, -0.2, corpo, 20); c.rotation.x = Math.PI / 2; }
      // pés
      for (const x of [-2.4, 2.4]) for (const z of [-1.8, 1.8]) cil(0.25, 0.3, 0.32, M('#4a4a5a'), x, 0.16, z, corpo, 12);
      // painel de cima
      caixa(MW - 0.3, 1.25, 0.25, M('#dde6f2', { brilho: 50 }), 0, MH - 0.4, MD / 2 + 0.05, corpo);
      const visor = plano(1.8, 0.62, B('#0e1f33', 1.0), corpo); visor.position.set(1.1, MH - 0.4, MD / 2 + 0.19);
      maq.texVisor = (() => {
        let txt = 'MOLHO';
        const c = document.createElement('canvas'); c.width = 512; c.height = 176; const gg = c.getContext('2d');
        const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding;
        const draw = () => { gg.fillStyle = '#0e1f33'; gg.fillRect(0, 0, 512, 176); gg.font = `800 112px ${FONTE}`; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.fillStyle = '#5cffb0'; gg.shadowColor = '#5cffb0'; gg.shadowBlur = 20; gg.fillText(txt, 256, 98); tx.needsUpdate = true; };
        draw(); textos.push(draw);
        return { tex: tx, set: (s) => { if (s !== txt) { txt = s; draw(); } } };
      })();
      visor.material = B('#ffffff', 1.3, { map: maq.texVisor.tex });
      for (const [x, cor] of [[-2.2, '#ff5a3c'], [-1.2, '#2f9a4a']]) { const k = cil(0.32, 0.32, 0.25, M(cor, { brilho: 60 }), x, MH - 0.4, MD / 2 + 0.25, corpo, 20); k.rotation.x = Math.PI / 2; }
      // sirene no topo (centro), bem visível
      cil(0.95, 1.05, 0.45, M('#3a3a48', { brilho: 40 }), 0, MH + 0.52, 0.2, corpo, 24);
      const sir = cil(0.72, 0.8, 1.1, M('#a00000', { emissive: '#ff1000', emissiveIntensity: 0.2, brilho: 80, especular: '#ff8070' }), 0, MH + 1.3, 0.2, corpo, 24);
      const topo = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), sir.material); topo.position.set(0, MH + 1.85, 0.2); corpo.add(topo);
      maq.sirene = sir;
      const luzSir = new THREE.PointLight('#ff2a1a', 0, 30, 1.4); luzSir.position.set(0, MH + 1.4, 2.0); corpo.add(luzSir); maq.luzSirene = luzSir;
      const haloSir = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX_LUZ, color: '#ff4a30', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      haloSir.position.set(0, MH + 1.4, 1.2); haloSir.scale.set(5, 5, 1); corpo.add(haloSir); maq.haloSirene = haloSir;
      // porta: aro cromado, vidro, tambor
      const DY = 3.35, DZ = MD / 2;
      const aro = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.28, 16, 48), M('#b8c2d6', { brilho: 100, especular: '#ffffff' }));
      aro.position.set(0, DY, DZ + 0.12); aro.castShadow = true; corpo.add(aro);
      const aro2 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.1, 10, 48), M('#5d667c', { brilho: 60 })); aro2.position.set(0, DY, DZ + 0.2); corpo.add(aro2);
      const furo = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 2.4, 40, 1, true), M('#1c2232', { side: THREE.BackSide }));
      furo.rotation.x = Math.PI / 2; furo.position.set(0, DY, DZ - 1.15); corpo.add(furo);
      const fundoT = new THREE.Mesh(new THREE.CircleGeometry(1.85, 40), M('#38425a')); fundoT.position.set(0, DY, DZ - 2.3); corpo.add(fundoT);
      // furinhos do tambor (giram)
      const tambor = new THREE.Group(); tambor.position.set(0, DY, DZ - 2.25); corpo.add(tambor); maq.tambor = tambor;
      for (let r = 0.5; r < 1.8; r += 0.42) for (let a = 0; a < Math.PI * 2; a += 0.5 / r) {
        const f = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8), B('#1a2030')); f.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.02); tambor.add(f);
      }
      for (let i = 0; i < 3; i++) { const p = caixa(0.25, 0.5, 2.2, M('#7a849c'), 0, 0, 0, null); p.position.set(Math.cos(i * 2.09) * 1.65, Math.sin(i * 2.09) * 1.65, 1.1); p.rotation.z = i * 2.09; tambor.add(p); }
      // água (corte horizontal muda o nível)
      maq.planoAgua = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
      const agua = new THREE.Mesh(new THREE.CylinderGeometry(1.84, 1.84, 2.3, 40), M('#3aa6ff', { transparent: true, opacity: 0.55, depthWrite: false, clippingPlanes: [maq.planoAgua], emissive: '#0b5fd0', emissiveIntensity: 0.25 }));
      agua.rotation.x = Math.PI / 2; agua.position.set(0, DY, DZ - 1.15); corpo.add(agua); maq.agua = agua;
      maq.nivel = (k, zMundo) => { // k: 0 vazio .. 1 cheio
        const yAgua = DY - 1.85 + 3.7 * k;
        maq.planoAgua.constant = yAgua; agua.visible = k > 0.01;
      };
      maq.nivel(0);
      // notas dentro do tambor (giram em volta do centro)
      const texNota = (suja) => texCanvas(256, 112, (c, w, h) => {
        c.fillStyle = suja ? '#8a8a4a' : '#5fc46f'; c.fillRect(0, 0, w, h);
        c.strokeStyle = suja ? '#5a5a2a' : '#2d8a45'; c.lineWidth = 10; c.strokeRect(8, 8, w - 16, h - 16);
        c.fillStyle = suja ? '#6e6e38' : '#9be0a0'; c.beginPath(); c.ellipse(w / 2, h / 2, 34, 38, 0, 0, 7); c.fill();
        c.font = `800 46px ${FONTE}`; c.fillStyle = suja ? '#40401c' : '#1f6b34'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('R$', 40, 32); c.fillText('100', w - 50, h - 30);
        if (suja) for (let k = 0; k < 9; k++) { c.fillStyle = 'rgba(60,40,10,.55)'; c.beginPath(); c.arc(rnd() * w, rnd() * h, 6 + rnd() * 16, 0, 7); c.fill(); }
      }, true);
      const tSuja = texNota(true), tLimpa = texNota(false);
      maq.notas = [];
      for (let i = 0; i < 26; i++) {
        const suja = i % 2 === 0;
        const n = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.55), M('#ffffff', { map: suja ? tSuja : tLimpa, side: THREE.DoubleSide }));
        n.userData = { suja, r: 0.5 + rnd() * 1.15, a0: rnd() * Math.PI * 2, z: -0.4 - rnd() * 1.6, giro: rnd() * 6, t0: 0 };
        n.visible = false; corpo.add(n); maq.notas.push(n);
      }
      maq.texLimpa = tLimpa;
      maq.porta = { y: DY, z: DZ };
      // vidro da porta (por cima de tudo)
      const vidro = new THREE.Mesh(new THREE.CircleGeometry(1.86, 48), new THREE.MeshPhongMaterial({ color: '#bfe4ff', transparent: true, opacity: 0.2, shininess: 120, specular: new THREE.Color('#ffffff'), depthWrite: false }));
      vidro.position.set(0, DY, DZ + 0.1); corpo.add(vidro);
      const reflexo = plano(0.35, 2.4, B('#ffffff', 1.0, { transparent: true, opacity: 0.35, depthWrite: false }), corpo); reflexo.position.set(-0.8, DY + 0.3, DZ + 0.14); reflexo.rotation.z = -0.6;
      // mangueira e balde de sabão ao lado
      cil(0.9, 0.75, 1.3, M('#2fb6ff', { brilho: 40 }), 4.6, 0.65, MZ + 2.2, g, 20);
      placa('SABÃO', '#ffffff', '#2f7de1', 1.4, 0.45, 4.6, 0.8, MZ + 3.06, g, { fs: 160 });
      // bolhas de sabão em volta (aparecem no molho)
      maq.bolhas = [];
      const matB = new THREE.MeshPhongMaterial({ color: '#d8f1ff', transparent: true, opacity: 0.55, shininess: 120, specular: new THREE.Color('#ffffff'), depthWrite: false });
      for (let i = 0; i < 40; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.15 + rnd() * 0.35, 14, 10), matB);
        b.userData = { x: (rnd() - 0.5) * 12, z: MZ + 2 + rnd() * 6, v: 0.3 + rnd() * 0.5, f: rnd() * 6, y0: rnd() * 7 };
        b.visible = false; g.add(b); maq.bolhas.push(b);
      }
      maq.origem = new THREE.Vector3(0, 0, z0);
      // varal com roupas (contexto de lavanderia)
      cil(0.06, 0.06, 4, M('#8a5a36'), -9, 2, MZ + 1, g, 8); cil(0.06, 0.06, 4, M('#8a5a36'), -14, 2, MZ - 1, g, 8);
      const roupas = ['#ff5a3c', '#ffd23f', '#2f7de1', '#ffffff', '#3fae55'];
      for (let i = 0; i < 5; i++) { const r = plano(0.8, 1.0, M(roupas[i], { side: THREE.DoubleSide }), g); r.position.set(-9.6 - i * 0.95, 3.3, MZ + 0.8 - i * 0.38); r.rotation.y = 0.38; }
      arvore(12, -10, 1.4); arvore(-15, -12, 1.2); cacto(9.5, 2, 1.1);
    }

    // ---------- luzes ----------
    const hemi = new THREE.HemisphereLight('#a9c8ff', '#b06a3a', 0.42); scene.add(hemi);
    const sun = new THREE.DirectionalLight('#ffe6c4', 1.35);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 });
    sun.shadow.bias = -0.0005; sun.shadow.radius = 4;
    scene.add(sun, sun.target);
    const SOL_DIR = new THREE.Vector3(-0.55, 0.62, 0.55).normalize();
    const ambienteQuente = new THREE.AmbientLight('#ffe7cf', 0.04); scene.add(ambienteQuente);

    // ---------- sombras suaves (para os 2D) ----------
    function sombra(x, z, rx = 0.45, rz = 0.22, opacidade = 0.5) {
      const m = plano(1, 1, new THREE.MeshBasicMaterial({ map: TEX_SOMBRA, color: '#3a1d10', transparent: true, opacity: opacidade, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, 0.03, z); m.scale.set(rx * 2, rz * 2, 1);
      m.renderOrder = 2; m.userData.base = { rx, rz, opacidade }; return m;
    }

    // ---------- pós: brilho + tom + gama + vinheta quente ----------
    const gl2 = renderer.capabilities.isWebGL2;
    const alvo = new THREE.WebGLRenderTarget(W, H, gl2 ? { type: THREE.HalfFloatType, samples: 4 } : {});
    const composer = new THREE.EffectComposer(renderer, alvo);
    composer.setPixelRatio(1); composer.setSize(W, H);
    composer.addPass(new THREE.RenderPass(scene, camera));
    const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.35, 0.5, 0.97);
    composer.addPass(bloom);
    const final = new THREE.ShaderPass({
      uniforms: { tDiffuse: { value: null }, exposicao: { value: 0.86 }, tinta: { value: new THREE.Color(1, 1, 1) }, satur: { value: 1.32 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float exposicao; uniform vec3 tinta; uniform float satur; varying vec2 vUv;
        vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb * exposicao;
          c = aces(c);
          c = pow(c, vec3(1.0/2.2));
          float l = dot(c, vec3(0.299,0.587,0.114)); c = mix(vec3(l), c, satur);
          c *= tinta;
          vec2 p = vUv - 0.5; p.x *= 0.8;
          float v = smoothstep(0.85, 0.25, length(p));
          c *= mix(0.7, 1.0, v);
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    composer.addPass(final);

    // ---------- câmera ----------
    const cam = { quadro: () => ({ pos: [0, 1.8, 6], alvo: [0, 1.2, -3], fov: 50 }) };
    const vAlvo = new THREE.Vector3();
    function posicionarCamera(t) {
      const q = cam.quadro(t);
      camera.position.set(q.pos[0], q.pos[1], q.pos[2]);
      vAlvo.set(q.alvo[0], q.alvo[1], q.alvo[2]); camera.lookAt(vAlvo);
      if (q.roll) camera.rotateZ(q.roll);
      if (q.fov && q.fov !== camera.fov) { camera.fov = q.fov; camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld();
      // sol e sombras acompanham o que a câmera olha
      const foco = new THREE.Vector3().lerpVectors(camera.position, vAlvo, 0.35); foco.y = 0;
      sun.target.position.copy(foco); sun.position.copy(foco).addScaledVector(SOL_DIR, 40);
      sol.position.copy(camera.position).addScaledVector(new THREE.Vector3(SOL_DIR.x, 0.32, -0.9).normalize(), 700);
      ceuMesh.position.copy(camera.position);
    }
    const vp = new THREE.Vector3(), vq = new THREE.Vector3();
    function projetar(x, y, z) {
      vp.set(x, y, z).project(camera); vq.set(x, y + 1, z).project(camera);
      const sx = (vp.x * 0.5 + 0.5) * W, sy = (-vp.y * 0.5 + 0.5) * H, sy1 = (-vq.y * 0.5 + 0.5) * H;
      const atras = vp.z > 1 || vp.z < -1;
      return { x: sx, y: sy, ppm: sy - sy1, dist: camera.position.distanceTo(vq.set(x, y, z)), atras };
    }

    let tAtual = -1;
    const corCeu = new THREE.Color();
    function desenhar(t) {
      tAtual = t;
      posicionarCamera(t);
      if (cena.ceu) { corCeu.copy(cena.ceu(t)); ceuMat.color.copy(corCeu); scene.fog.color.copy(HORIZ).multiply(corCeu); }
      if (cena.tinta) final.uniforms.tinta.value.copy(cena.tinta(t));
      // escovas e espuma do lava jato
      const kL = cena.lavaJato ? cena.lavaJato(t) : 0.4;
      lava.escovas.forEach((e, i) => { e.rotation.y = t * (2 + 9 * kL) * (i ? -1 : 1); });
      lava.rolo.rotation.x = t * (2 + 8 * kL);
      lava.espuma.forEach((b) => { const d = b.userData; const y = d.y0 + ((t * d.v + d.f) % 3.2); b.position.set(d.x + Math.sin(t * 2 + d.f) * 0.2, y, d.z); const s = kL * (1 - Math.max(0, (y - 2.6) / 0.6)); b.scale.setScalar(Math.max(0.001, s)); });
      banco.bandeiras && banco.bandeiras.forEach((b) => { b.rotation.y = Math.sin(t * 2.4 + b.userData.fase) * 0.25; });
      nuvens.forEach((n, i) => { n.position.x += 0; n.material.rotation = 0; n.center.set(0.5 + Math.sin(t * 0.05 + i) * 0.02, 0.5); });
      if (cena.antes) cena.antes(t);
      composer.render();
    }
    function fontesProntas() { textos.forEach((f) => f()); }

    const cena = { scene, camera, cam, renderer, desenhar, projetar, sombra, fontesProntas, THREE, Z, maq, lava, final, get t() { return tAtual; } };
    return cena;
  }

  global.Cidade3D = { criar, Z };
})(window);
