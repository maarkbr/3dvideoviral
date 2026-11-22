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

  const Z = { TORRE: 0, FGC: -60, BRB: -120, BC: -180, AERO: -240 };

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
    //  utilidades do caso Master: pilha de dinheiro (instanciada), chuva de notas, chuva de água
    // =====================================================================
    const texMaco = texCanvas(256, 128, (c, w, h) => {
      c.fillStyle = '#4fae5f'; c.fillRect(0, 0, w, h);
      for (let y = 6; y < h; y += 12) { c.fillStyle = y % 24 ? '#62c472' : '#3f9a50'; c.fillRect(0, y, w, 5); }
      c.fillStyle = '#f4f1dc'; c.fillRect(w * 0.42, 0, w * 0.16, h);
      c.fillStyle = '#d9c99a'; c.fillRect(w * 0.42, 0, 4, h); c.fillRect(w * 0.58 - 4, 0, 4, h);
    });
    const matMaco = M('#ffffff', { map: texMaco });
    function pilha(cx, cz, raio, alt, n, pai) {
      const geo = new THREE.BoxGeometry(0.62, 0.16, 0.3);
      const mesh = new THREE.InstancedMesh(geo, matMaco, n); mesh.castShadow = true; mesh.receiveShadow = true;
      const lista = [];
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * raio;
        const yMax = alt * Math.max(0, 1 - r / raio) ** 1.25;
        lista.push([cx + Math.cos(a) * r, rnd() * yMax + 0.08, cz + Math.sin(a) * r, rnd() * 3, (rnd() - 0.5) * 0.35]);
      }
      lista.sort((p, q) => p[1] - q[1]);
      const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), e = new THREE.Euler(), s1 = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
      lista.forEach((p, i) => { e.set(p[4], p[3], p[4] * 0.5); qt.setFromEuler(e); m4.compose(v.set(p[0], p[1], p[2]), qt, s1); mesh.setMatrixAt(i, m4); });
      mesh.count = 0; (pai || scene).add(mesh);
      return { mesh, set(k) { mesh.count = Math.max(0, Math.min(n, Math.floor(k * n))); mesh.visible = mesh.count > 0; } };
    }
    const texNotaV = texCanvas(128, 64, (c, w, h) => { c.fillStyle = '#62c472'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2d8a45'; c.lineWidth = 6; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = '#a8e6ae'; c.beginPath(); c.arc(w / 2, h / 2, 14, 0, 7); c.fill(); });
    function chuvaNotas(cx, cz, area, n, pai) {
      const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.42, 0.2), M('#ffffff', { map: texNotaV, side: THREE.DoubleSide }), n);
      const d = []; for (let i = 0; i < n; i++) d.push([cx + (rnd() - 0.5) * area, cz + (rnd() - 0.5) * area, rnd() * 14, 1.2 + rnd() * 1.4, rnd() * 9]);
      (pai || scene).add(mesh); mesh.visible = false;
      const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), e = new THREE.Euler(), s1 = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
      return { set(t, k) {
        mesh.visible = k > 0.001; if (!mesh.visible) return;
        d.forEach((p, i) => { const y = 14 - ((p[2] + t * p[3]) % 14); e.set(t * 2 + p[4], t * 1.3 + p[4], t + p[4]); qt.setFromEuler(e);
          m4.compose(v.set(p[0] + Math.sin(t + p[4]) * 0.6, y, p[1]), qt, s1.setScalar(k)); mesh.setMatrixAt(i, m4); });
        mesh.instanceMatrix.needsUpdate = true;
      } };
    }

    // =====================================================================
    //  PALCO 1 — TORRE DO BANCO MASTER (z = 0)
    // =====================================================================
    const torre = {};
    {
      const z0 = Z.TORRE, g = new THREE.Group(); g.position.set(0, 0, z0); scene.add(g);
      praca(z0, 40, 34, '#d8c6ae');
      const texVidro = texCanvas(512, 1024, (c, w, h) => {
        const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2a6fb8'); gr.addColorStop(0.5, '#5fb6e8'); gr.addColorStop(1, '#1d4f96');
        c.fillStyle = gr; c.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 42) { c.fillStyle = `rgba(255,255,255,${0.05 + rnd() * 0.18})`; c.fillRect(x + 3, y + 3, 36, 26); }
        c.fillStyle = '#123866'; for (let x = 0; x < w; x += 42) c.fillRect(x, 0, 3, h); for (let y = 0; y < h; y += 32) c.fillRect(0, y, w, 3);
        c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(0, h * 0.2); c.lineTo(w * 0.6, 0); c.lineTo(w * 0.85, 0); c.lineTo(0, h * 0.42); c.fill();
      });
      texVidro.wrapS = texVidro.wrapT = THREE.RepeatWrapping; texVidro.repeat.set(2, 3);
      const vidro = M('#ffffff', { map: texVidro, brilho: 110, especular: '#ffffff' });
      const TX = 0, TZ = -14;
      caixa(13, 44, 11, vidro, TX, 22 + 5, TZ, g);
      caixa(13.6, 0.5, 11.6, M('#c9a24a', { brilho: 90 }), TX, 49.2, TZ, g);
      caixa(10, 4, 8, vidro, TX, 51.5, TZ, g);
      caixa(1.0, 6, 1.0, M('#e8c45a', { brilho: 100, especular: '#fff3c0' }), TX, 56.5, TZ, g);
      // pódio de pedra escura com o letreiro dourado
      const pedra = M('#2b2a36', { brilho: 30 });
      caixa(19, 5.6, 14, pedra, TX, 2.8, TZ + 1, g);
      caixa(19.4, 0.4, 14.4, M('#c9a24a', { brilho: 90 }), TX, 5.8, TZ + 1, g);
      torre.letreiro = placa('MASTER', '#ffcf3d', '#16151f', 11, 2.0, TX, 4.0, TZ + 8.05, g, { fs: 210, luz: 1.25 });
      placa('BANCO', '#ffffff', '#16151f', 4, 0.8, TX, 2.3, TZ + 8.05, g, { fs: 170 });
      // entrada de vidro iluminada
      const porta = plano(5, 2.2, B('#ffe6a8', 1.15), g); porta.position.set(TX, 1.1, TZ + 8.04);
      for (const x of [-3.4, 3.4]) cil(0.38, 0.42, 5.6, M('#e8c45a', { brilho: 100 }), TX + x, 2.8, TZ + 8.3, g, 20);
      // tapete vermelho e postes de corda
      const tap = plano(3, 8, M('#b3261e'), g); tap.rotation.x = -Math.PI / 2; tap.position.set(TX, 0.03, TZ + 12);
      for (let i = 0; i < 4; i++) for (const x of [-1.9, 1.9]) cil(0.08, 0.12, 1.0, M('#e8c45a', { brilho: 100 }), TX + x, 0.5, TZ + 9.5 + i * 2, g, 10);
      // faixa de "FECHADO" (aparece na liquidação)
      const texFaixa = texCanvas(1024, 128, (c, w, h) => {
        for (let x = -h; x < w; x += 80) { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 40, 0); c.lineTo(x + 40 + h, h); c.lineTo(x + h, h); c.fill(); }
        c.fillStyle = 'rgba(0,0,0,0)';
        c.font = `800 92px ${FONTE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 16; c.strokeStyle = '#17121d'; c.strokeText('FECHADO  •  LIQUIDADO  •  FECHADO', w / 2, h / 2 + 8); c.fillStyle = '#ffffff'; c.fillText('FECHADO  •  LIQUIDADO  •  FECHADO', w / 2, h / 2 + 8);
      }, true);
      const fundoFaixa = texCanvas(64, 64, (c) => { c.fillStyle = '#17121d'; c.fillRect(0, 0, 64, 64); });
      torre.faixas = [];
      for (const [y, r] of [[3.2, -0.08], [1.6, 0.07]]) {
        const f = plano(14, 1.4, new THREE.MeshLambertMaterial({ map: texFaixa, color: '#ffffff' }), g); f.position.set(TX, y, TZ + 8.6); f.rotation.z = r;
        const fb = plano(14, 1.4, new THREE.MeshBasicMaterial({ map: fundoFaixa }), g); fb.position.set(TX, y, TZ + 8.58); fb.rotation.z = r;
        f.visible = fb.visible = false; torre.faixas.push(f, fb);
      }
      torre.pilha = pilha(TX + 5.2, TZ + 12.5, 4.2, 3.2, 1600, g);
      torre.chuva = chuvaNotas(TX, TZ + 9, 22, 260, g);
      for (const x of [-12, 12]) arvore(x, -2, 1.3);
      for (const x of [-9, 9]) { poste(x, 2); poste(x, -6); }
      cacto(14, 4, 1.2);
    }

    // =====================================================================
    //  PALCO 2 — COFRE DO FGC (z = -60)
    // =====================================================================
    const fgc = {};
    {
      const z0 = Z.FGC, g = new THREE.Group(); g.position.set(0, 0, z0); scene.add(g);
      praca(z0, 34, 30, '#cfd6e2');
      const texParede = texCanvas(512, 512, (c, w, h) => {
        c.fillStyle = '#8c96ab'; c.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 64) for (let x = (y / 64) % 2 ? -64 : 0; x < w; x += 128) { c.fillStyle = `rgb(${130 + rnd() * 30},${140 + rnd() * 30},${160 + rnd() * 30})`; c.fillRect(x + 3, y + 3, 122, 58); }
      });
      texParede.wrapS = texParede.wrapT = THREE.RepeatWrapping; texParede.repeat.set(4, 3);
      caixa(26, 14, 2, M('#ffffff', { map: texParede }), 0, 7, -9, g);
      // interior do cofre (aparece com a porta aberta)
      caixa(9, 9, 0.3, M('#3a3f52'), 0, 4.6, -12.5, g);
      const brilhoOuro = plano(9, 9, new THREE.MeshBasicMaterial({ map: TEX_LUZ, color: new THREE.Color('#ffcf5a').multiplyScalar(0.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), g);
      brilhoOuro.position.set(0, 4.6, -12.2);
      caixa(9, 0.3, 4, M('#5a6075'), 0, 0.15, -10.5, g);
      for (let i = 0; i < 6; i++) for (let k = 0; k < 3 - (i % 2); k++) caixa(0.9, 0.35, 0.45, M('#ffcf3d', { brilho: 120, especular: '#fff6c0' }), -2.4 + i * 0.95, 0.5 + k * 0.36, -11.6, g);
      fgc.pilha = pilha(0.2, -10.6, 3.6, 3.0, 1200, g);
      // furo redondo na parede: um anel grosso
      const anel = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.55, 16, 64), M('#5d667c', { brilho: 80 })); anel.position.set(0, 4.8, -7.9); g.add(anel);
      // porta redonda do cofre (gira na dobradiça da esquerda)
      const dob = new THREE.Group(); dob.position.set(-4.2, 4.8, -7.6); g.add(dob); fgc.dobradica = dob;
      const porta = new THREE.Group(); porta.position.set(4.2, 0, 0); dob.add(porta);
      const aco = M('#aab4c8', { brilho: 120, especular: '#ffffff' });
      const disco = cil(4.1, 4.1, 1.0, aco, 0, 0, 0, porta, 64); disco.rotation.x = Math.PI / 2;
      const disco2 = cil(3.3, 3.3, 1.1, M('#8a94aa', { brilho: 100 }), 0, 0, 0.05, porta, 64); disco2.rotation.x = Math.PI / 2;
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const p = cil(0.18, 0.18, 1.2, M('#6a7488', { brilho: 80 }), Math.cos(a) * 3.7, Math.sin(a) * 3.7, 0.1, porta, 12); p.rotation.x = Math.PI / 2; }
      const roda = new THREE.Group(); roda.position.set(0, 0, 0.75); porta.add(roda); fgc.roda = roda;
      const tor = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.16, 12, 40), M('#d9b44a', { brilho: 120 })); roda.add(tor);
      for (let i = 0; i < 3; i++) { const r = caixa(2.8, 0.2, 0.2, M('#d9b44a', { brilho: 120 }), 0, 0, 0, roda); r.rotation.z = i * Math.PI / 3; }
      cil(0.4, 0.4, 0.4, M('#d9b44a', { brilho: 120 }), 0, 0, 0, roda, 20).rotation.x = Math.PI / 2;
      // escudo FGC em cima
      const texEsc = texCanvas(512, 512, (c, w, h) => {
        c.fillStyle = '#17121d'; c.beginPath(); c.moveTo(w / 2, 30); c.lineTo(w - 50, 100); c.quadraticCurveTo(w - 60, 380, w / 2, h - 20); c.quadraticCurveTo(60, 380, 50, 100); c.closePath(); c.fill();
        c.fillStyle = '#1fb5a2'; c.beginPath(); c.moveTo(w / 2, 52); c.lineTo(w - 74, 114); c.quadraticCurveTo(w - 84, 366, w / 2, h - 46); c.quadraticCurveTo(84, 366, 74, 114); c.closePath(); c.fill();
        c.font = `800 150px ${FONTE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 20; c.strokeStyle = '#17121d'; c.strokeText('FGC', w / 2, h / 2 + 10); c.fillStyle = '#fff'; c.fillText('FGC', w / 2, h / 2 + 10);
      }, true);
      const esc = plano(3.4, 3.4, B('#ffffff', 1.1, { map: texEsc, transparent: true }), g); esc.position.set(0, 11.6, -7.95);
      placa('FUNDO GARANTIDOR', '#ffffff', '#1d2333', 9, 1.1, 0, 9.6, -7.95, g, { fs: 120 });
      // grades e postes
      for (const x of [-7.5, 7.5]) { cil(0.5, 0.6, 1.2, M('#c9cfdb'), x, 0.6, -5.5, g, 16); const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), B('#fff1c4', 1.3)); l.position.set(x, 1.4, -5.5); g.add(l); }
      arvore(-14, -3, 1.2); arvore(14, -4, 1.3);
    }

    // =====================================================================
    //  PALCO 3 — BRB, banco de Brasília (z = -120)
    // =====================================================================
    const brb = {};
    {
      const z0 = Z.BRB, g = new THREE.Group(); g.position.set(0, 0, z0); scene.add(g);
      praca(z0, 40, 34, '#e7d9c2');
      const texFach = texCanvas(512, 512, (c, w, h) => {
        c.fillStyle = '#f4f6fb'; c.fillRect(0, 0, w, h);
        for (let y = 20; y < h; y += 64) { c.fillStyle = '#1f6fd6'; c.fillRect(0, y, w, 26); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, y + 4, w, 5); }
      });
      texFach.wrapS = texFach.wrapT = THREE.RepeatWrapping; texFach.repeat.set(3, 3);
      const fach = M('#ffffff', { map: texFach, brilho: 60 });
      caixa(18, 16, 9, fach, -1, 8, -12, g);
      caixa(8, 22, 8, fach, 9, 11, -14, g);
      // pilotis (bem Brasília)
      for (let i = 0; i < 6; i++) cil(0.35, 0.35, 3, M('#ffffff', { brilho: 40 }), -8.5 + i * 3, 1.5, -7.2, g, 14);
      caixa(19, 0.6, 2.5, M('#e9edf5'), -1, 3.2, -7, g);
      brb.letreiro = placa('BRB', '#ffffff', '#1f6fd6', 6.5, 2.2, -1, 13.2, -7.45, g, { fs: 230, borda: '#ffd23f' });
      placa('BANCO DE BRASÍLIA', '#1f6fd6', '#ffffff', 8, 0.9, -1, 11.4, -7.45, g, { fs: 120 });
      // ipês floridos (amarelo e rosa)
      function ipe(x, z, cor, k = 1) {
        const gg = new THREE.Group(); gg.position.set(x, 0, z); g.add(gg);
        cil(0.18 * k, 0.26 * k, 2.6 * k, M('#6b4a32'), 0, 1.3 * k, 0, gg, 8);
        for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(facet(new THREE.IcosahedronGeometry((0.9 + rnd() * 0.5) * k, 0)), M(cor)); f.position.set((rnd() - 0.5) * 2.2 * k, (2.9 + rnd() * 1.4) * k, (rnd() - 0.5) * 2.2 * k); f.castShadow = true; gg.add(f); }
      }
      ipe(-13, -3, '#ffd23f', 1.3); ipe(13, -2, '#ff8fc4', 1.2); ipe(-16, -9, '#ff8fc4', 1.1); ipe(16, -9, '#ffd23f', 1.2);
      // caixas de contratos (empilhadas na entrada)
      const texCx = texCanvas(256, 256, (c, w, h) => {
        c.fillStyle = '#c99a62'; c.fillRect(0, 0, w, h); c.fillStyle = '#b3854f'; c.fillRect(0, h * 0.44, w, h * 0.12);
        c.fillStyle = '#fff'; c.fillRect(w * 0.18, h * 0.62, w * 0.64, h * 0.22); c.font = `800 38px ${FONTE}`; c.fillStyle = '#17121d'; c.textAlign = 'center'; c.fillText('CONTRATOS', w / 2, h * 0.78);
      }, true);
      const matCx = M('#ffffff', { map: texCx });
      brb.caixas = [];
      for (let i = 0; i < 18; i++) { const cx = caixa(0.9, 0.7, 0.7, matCx, 2.4 + (i % 4) * 0.95, 0.35 + Math.floor(i / 8) * 0.72, -2.6 - (Math.floor(i / 4) % 2) * 0.75, g); cx.rotation.y = (rnd() - 0.5) * 0.3; cx.visible = false; brb.caixas.push(cx); }
      // caminhão do Master chegando
      const cam = new THREE.Group(); g.add(cam); brb.caminhao = cam;
      const lat = M('#ffffff', { brilho: 60 });
      caixa(2.4, 2.6, 5.2, lat, 0, 1.75, 0, cam);
      const texBau = texCanvas(512, 256, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#16151f'; c.fillRect(0, h * 0.62, w, h * 0.38); c.font = `800 110px ${FONTE}`; c.textAlign = 'center'; c.fillStyle = '#c9a24a'; c.fillText('MASTER', w / 2, h * 0.5); }, true);
      for (const s of [-1, 1]) { const p = plano(5.1, 2.5, M('#ffffff', { map: texBau }), cam); p.position.set(s * 1.21, 1.8, 0); p.rotation.y = s * Math.PI / 2; }
      caixa(2.3, 1.8, 1.6, M('#16151f', { brilho: 60 }), 0, 1.3, 3.3, cam);
      caixa(2.0, 0.7, 0.1, M('#8fd3ff', { brilho: 100 }), 0, 1.8, 4.12, cam, false);
      for (const [x, z] of [[-1.1, 3.2], [1.1, 3.2], [-1.1, -1.6], [1.1, -1.6]]) { const r = cil(0.45, 0.45, 0.35, M('#1d1b26'), x, 0.45, z, cam, 16); r.rotation.z = Math.PI / 2; }
      cam.visible = false;
    }

    // =====================================================================
    //  PALCO 4 — BANCO CENTRAL (z = -180)
    // =====================================================================
    const bc = {};
    {
      const z0 = Z.BC, g = new THREE.Group(); g.position.set(0, 0, z0); scene.add(g);
      praca(z0, 40, 34, '#cfc6bb');
      const texBC = texCanvas(512, 1024, (c, w, h) => {
        c.fillStyle = '#2b2f3c'; c.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 32) { c.fillStyle = x % 64 ? '#3b4256' : '#4d5670'; c.fillRect(x, 0, 22, h); }
        for (let y = 0; y < h; y += 48) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, y, w, 6); }
      });
      texBC.wrapS = texBC.wrapT = THREE.RepeatWrapping; texBC.repeat.set(2, 2);
      caixa(22, 40, 7, M('#ffffff', { map: texBC, brilho: 80 }), 0, 20 + 2, -15, g);
      caixa(26, 2, 12, M('#d9d2c6'), 0, 1, -12, g);
      for (let i = 0; i < 4; i++) caixa(14 - i, 0.25, 1.4, M('#e6dfd3'), 0, 0.12 + i * 0.25, -5.4 - i * 0.5, g);
      placa('BANCO CENTRAL', '#ffffff', '#1d2333', 13, 1.6, 0, 3.4, -11.45, g, { fs: 150 });
      // bandeiras (verde e amarelo)
      const texBand = texCanvas(512, 340, (c, w, h) => {
        c.fillStyle = '#1f9a4a'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(w / 2, 26); c.lineTo(w - 30, h / 2); c.lineTo(w / 2, h - 26); c.lineTo(30, h / 2); c.fill();
        c.fillStyle = '#1f3f9a'; c.beginPath(); c.arc(w / 2, h / 2, 88, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 10; c.beginPath(); c.arc(w / 2, h / 2 + 150, 190, -2.0, -1.1); c.stroke();
      });
      bc.bandeiras = [];
      for (const x of [-9, 9]) {
        cil(0.08, 0.08, 10, M('#d9d4cc', { brilho: 60 }), x, 5, -4, g, 10);
        const b = plano(2.6, 1.7, M('#ffffff', { map: texBand, side: THREE.DoubleSide }), g); b.position.set(x + 1.35, 9, -4); bc.bandeiras.push(b);
      }
      arvore(-15, -2, 1.2); arvore(15, -3, 1.3);
    }

    // =====================================================================
    //  PALCO 5 — AEROPORTO À NOITE (z = -240)
    // =====================================================================
    const aero = {};
    {
      const z0 = Z.AERO, g = new THREE.Group(); g.position.set(0, 0, z0); scene.add(g);
      praca(z0, 46, 36, '#9a9aa6');
      // terminal de vidro iluminado
      const texTerm = texCanvas(1024, 256, (c, w, h) => {
        c.fillStyle = '#ffd58a'; c.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 64) { c.fillStyle = '#2b2f3c'; c.fillRect(x, 0, 6, h); }
        c.fillStyle = '#2b2f3c'; c.fillRect(0, h * 0.48, w, 8);
        for (let i = 0; i < 30; i++) { c.fillStyle = 'rgba(40,30,60,.55)'; const x = rnd() * w; c.fillRect(x, h * 0.62, 14, 60); c.beginPath(); c.arc(x + 7, h * 0.58, 10, 0, 7); c.fill(); }
      });
      const term = plano(36, 7, B('#ffffff', 1.0, { map: texTerm }), g); term.position.set(0, 3.6, -12);
      caixa(38, 1.2, 10, M('#3a3e4c', { brilho: 40 }), 0, 7.6, -14, g);
      caixa(38, 7, 0.4, M('#2b2f3c'), 0, 3.5, -17, g);
      aero.letreiro = placa('AEROPORTO', '#ffffff', '#1f6fd6', 12, 1.6, 0, 9.2, -9.4, g, { fs: 170, luz: 1.3 });
      const luzTerm = new THREE.PointLight('#ffcf8a', 0, 30, 1.5); luzTerm.position.set(0, 4, -8); g.add(luzTerm); aero.luzTerm = luzTerm;
      // painel de partidas
      const texPain = texCanvas(1024, 512, (c, w, h) => {
        c.fillStyle = '#0d0f16'; c.fillRect(0, 0, w, h); c.font = `800 64px ${FONTE}`; c.fillStyle = '#ffd23f'; c.fillText('PARTIDAS', 40, 80);
        const linhas = [['22:40', 'INTERNACIONAL', 'EMBARQUE'], ['23:05', 'INTERNACIONAL', 'CONFIRMADO'], ['23:30', 'SÃO PAULO', 'CONFIRMADO']];
        c.font = `700 52px ${FONTE}`;
        linhas.forEach((l, i) => { const y = 180 + i * 110; c.fillStyle = '#ffffff'; c.fillText(l[0], 40, y); c.fillText(l[1], 230, y); c.fillStyle = i === 0 ? '#7cff9a' : '#ffd23f'; c.fillText(l[2], 700, y); });
      }, true);
      cil(0.12, 0.12, 3.6, M('#2b2f3c'), -6, 1.8, -5.5, g, 8); cil(0.12, 0.12, 3.6, M('#2b2f3c'), -2.4, 1.8, -5.5, g, 8);
      const pain = plano(4.2, 2.1, B('#ffffff', 1.25, { map: texPain }), g); pain.position.set(-4.2, 4.2, -5.4);
      // avião estacionado ao fundo
      const av = new THREE.Group(); av.position.set(9, 0, -26); av.rotation.y = -0.5; g.add(av);
      const branco = M('#f4f6fb', { brilho: 80 });
      const fus = cil(1.6, 1.6, 22, branco, 0, 3.2, 0, av, 28); fus.rotation.x = Math.PI / 2;
      const nariz = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 16), branco); nariz.scale.set(1, 1, 1.6); nariz.position.set(0, 3.2, 11); av.add(nariz);
      caixa(20, 0.3, 3.2, branco, 0, 2.6, 0.5, av);
      caixa(0.3, 4, 3, M('#1f6fd6'), 0, 6, -9.5, av);
      caixa(7, 0.25, 2, branco, 0, 3.6, -9.8, av);
      for (let i = 0; i < 12; i++) { const j = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12), B('#ffe6a8', 1.3)); j.position.set(1.61, 3.6, -7 + i * 1.3); j.rotation.y = Math.PI / 2; av.add(j); }
      // luzes da pista
      for (let i = 0; i < 24; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), B(i % 2 ? '#7fb2ff' : '#ffd23f', 2.2)); l.position.set(-20 + i * 1.8, 0.15, -21); g.add(l); }
      // viatura da PF com giroflex
      const vt = new THREE.Group(); vt.position.set(4.2, 0, -2.2); vt.rotation.y = -0.35; g.add(vt);
      const preto = M('#15171f', { brilho: 80, especular: '#8aa0ff' });
      caixa(2.0, 0.75, 4.4, preto, 0, 0.75, 0, vt); caixa(1.8, 0.7, 2.3, preto, 0, 1.45, -0.2, vt);
      caixa(1.82, 0.5, 2.1, M('#2b3550', { brilho: 100 }), 0, 1.5, -0.2, vt, false);
      const texPF = texCanvas(512, 128, (c, w, h) => { c.fillStyle = '#15171f'; c.fillRect(0, 0, w, h); c.font = `800 90px ${FONTE}`; c.textAlign = 'center'; c.fillStyle = '#ffd23f'; c.fillText('POLÍCIA FEDERAL', w / 2, 96); }, true);
      for (const s of [-1, 1]) { const p = plano(3.6, 0.55, B('#ffffff', 1.1, { map: texPF }), vt); p.position.set(s * 1.01, 0.8, 0); p.rotation.y = s * Math.PI / 2; }
      for (const [x, z] of [[-1, 1.4], [1, 1.4], [-1, -1.4], [1, -1.4]]) { const r = cil(0.42, 0.42, 0.3, M('#0d0d12'), x, 0.42, z, vt, 16); r.rotation.z = Math.PI / 2; }
      const az = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.3), B('#2a6bff', 1)); az.position.set(-0.3, 1.9, -0.2); vt.add(az);
      const vm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.3), B('#ff2a1a', 1)); vm.position.set(0.3, 1.9, -0.2); vt.add(vm);
      const luzAz = new THREE.PointLight('#2a6bff', 0, 18, 1.5); luzAz.position.set(-0.6, 2.4, 0); vt.add(luzAz);
      const luzVm = new THREE.PointLight('#ff2a1a', 0, 18, 1.5); luzVm.position.set(0.6, 2.4, 0); vt.add(luzVm);
      aero.giro = { az, vm, luzAz, luzVm };
      for (const x of [-12, 12]) { poste(x, 1); poste(x, -6); }
      // chuva (linhas que caem)
      const N = 1400, pos = new Float32Array(N * 6), sem = [];
      for (let i = 0; i < N; i++) sem.push([(rnd() - 0.5) * 30, (rnd() - 0.5) * 24 + 2, rnd() * 12, 14 + rnd() * 6]);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const chuva = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#bcd0ff', transparent: true, opacity: 0.45, fog: false }));
      chuva.frustumCulled = false; g.add(chuva);
      aero.chuva = { obj: chuva, set(t, on) {
        chuva.visible = on; if (!on) return;
        for (let i = 0; i < N; i++) { const s = sem[i]; const y = 12 - ((s[2] + t * s[3]) % 12); const k = i * 6;
          pos[k] = s[0]; pos[k + 1] = y; pos[k + 2] = s[1]; pos[k + 3] = s[0] - 0.05; pos[k + 4] = y - 0.55; pos[k + 5] = s[1]; }
        geo.attributes.position.needsUpdate = true;
      } };
      // poças que refletem
      for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.8 + rnd(), 24), new THREE.MeshPhongMaterial({ color: '#3a4060', shininess: 140, specular: new THREE.Color('#ffffff'), transparent: true, opacity: 0.7 })); p.rotation.x = -Math.PI / 2; p.position.set((rnd() - 0.5) * 16, 0.025, (rnd() - 0.5) * 8); p.scale.set(1.6, 1, 1); g.add(p); }
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
    const corCeu = new THREE.Color(), corNoite = new THREE.Color('#3b4a8a'), corChaoNoite = new THREE.Color('#1a1530');
    function desenhar(t) {
      tAtual = t;
      posicionarCamera(t);
      if (cena.ceu) { corCeu.copy(cena.ceu(t)); ceuMat.color.copy(corCeu); scene.fog.color.copy(HORIZ).multiply(corCeu); }
      if (cena.tinta) final.uniforms.tinta.value.copy(cena.tinta(t));
      // noite (0 = dia, 1 = noite)
      const nt = cena.noite ? cena.noite(t) : 0;
      sun.intensity = 1.35 * (1 - nt) + 0.1 * nt; hemi.intensity = 0.42 * (1 - nt) + 0.3 * nt;
      hemi.color.set('#a9c8ff').lerp(corNoite, nt); hemi.groundColor.set('#b06a3a').lerp(corChaoNoite, nt);
      sol.material.opacity = 1 - nt; nuvens.forEach((n) => { n.material.opacity = 0.92 * (1 - 0.75 * nt); });
      aero.luzTerm.intensity = 2.6 * nt;
      bc.bandeiras.forEach((b, i) => { b.rotation.y = Math.sin(t * 2.2 + i) * 0.22; });
      nuvens.forEach((n, i) => { n.position.x += 0; n.material.rotation = 0; n.center.set(0.5 + Math.sin(t * 0.05 + i) * 0.02, 0.5); });
      if (cena.antes) cena.antes(t);
      composer.render();
    }
    function fontesProntas() { textos.forEach((f) => f()); }

    const cena = { scene, camera, cam, renderer, desenhar, projetar, sombra, fontesProntas, THREE, Z, torre, fgc, brb, bc, aero, final, get t() { return tAtual; } };
    return cena;
  }

  global.Master3D = { criar, Z };
})(window);
