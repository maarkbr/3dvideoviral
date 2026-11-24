/*
  MOTOR v2 do Tudo em 3D — cenário com peças 3D reais (Kenney, CC0), luz física (PBR) com reflexo de ambiente,
  sombras suaves, céu com nuvens, profundidade de campo (fundo desfocado), bloom e gradação de cor.
  Mesma interface do motor v1 (desenhar, projetar, sombra, cam.quadro, fontesProntas) para a montagem.js.
  Extra: cena.pronto (Promise: todas as peças carregadas), cena.foco(t) -> distância de foco em metros.
*/
(function (global) {
  'use strict';
  const THREE = global.THREE;
  let semente = 11;
  const rnd = () => { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; };
  const CAT = {}; // tamanhos do catálogo (preenchido no criar)

  function criar(canvas, opts = {}) {
    { const x = new XMLHttpRequest(); x.open('GET', 'pecas/catalogo.json', false); x.send(); Object.assign(CAT, JSON.parse(x.responseText)); }
    const W = opts.largura || 1080, H = opts.altura || 1920;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1); renderer.setSize(W, H, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 900);
    // reflexo de ambiente (luz indireta realista, sem baixar HDRI)
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;

    // céu em degradê + nuvens + sol
    const ceuTex = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 512; const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#2c6cf0'); gr.addColorStop(0.42, '#6aa6ff'); gr.addColorStop(0.5, '#cfe4ff'); gr.addColorStop(0.53, '#ffe9cc'); gr.addColorStop(1, '#ffe9cc');
      g.fillStyle = gr; g.fillRect(0, 0, 8, 512); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })();
    const ceu = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), new THREE.MeshBasicMaterial({ map: ceuTex, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false }));
    scene.add(ceu);
    scene.fog = new THREE.Fog('#d9e6ff', 70, 420);
    const nuvemTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
      g.fillStyle = '#fff'; [[130, 170, 90], [230, 130, 110], [340, 150, 95], [420, 180, 70], [80, 195, 55], [290, 195, 80]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(180,200,240,.5)'; g.fillRect(0, 190, 512, 70);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })();
    const nuvens = [];
    for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: nuvemTex, fog: false, depthWrite: false, toneMapped: false }));
      const a = -Math.PI / 2 + (rnd() - 0.5) * 2.6, r = 380 + rnd() * 200; s.position.set(Math.cos(a) * r, 90 + rnd() * 120, Math.sin(a) * r); const k = 60 + rnd() * 70; s.scale.set(k * 2, k, 1); scene.add(s); nuvens.push(s); }

    // luz: sol quente com sombra + céu/chão
    const sol = new THREE.DirectionalLight('#fff1dc', 3.2);

    sol.castShadow = true; sol.shadow.mapSize.set(4096, 4096); sol.shadow.bias = -0.0003; sol.shadow.normalBias = 0.02;
    Object.assign(sol.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 160 });
    scene.add(sol, sol.target);
    const hemi = new THREE.HemisphereLight('#bcd6ff', '#a5714a', 0.9); scene.add(hemi);
    const DIR_SOL = new THREE.Vector3(-0.6, 0.75, 0.35).normalize();

    const M = (cor, rough = 0.85, metal = 0) => new THREE.MeshStandardMaterial({ color: cor, roughness: rough, metalness: metal });
    const Z = { COB: 0, PORT: -80, BOLSA: -160, MARINA: -240, BANCO: -320, ESTUDIO: -400 };

    // ---------- peças Kenney ----------
    const loader = new THREE.GLTFLoader();
    const cache = {};
    const carregando = [];
    function peca(caminho, tam, x, y, z, rotY = 0, pai) {
      // tam: { alt | comp | larg } em metros; usa o catálogo para escalar
      const nome = caminho.split('/').pop(), kit = caminho.split('/')[0];
      const t = (CAT[kit] || {})[nome] || [1, 1, 1];
      const esc = tam.alt ? tam.alt / t[1] : tam.comp ? tam.comp / t[2] : tam.larg ? tam.larg / t[0] : 1;
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; g.scale.setScalar(esc); (pai || scene).add(g);
      if (!cache[caminho]) cache[caminho] = new Promise((ok, erro) => loader.load('pecas/' + caminho + '.glb', ok, undefined, erro));
      carregando.push(cache[caminho].then((gl) => {
        const o = gl.scene.clone(true);
        o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; if (m.material) { m.material = m.material.clone(); m.material.envMapIntensity = 0.8; } } });
        g.add(o);
      }));
      return g;
    }

    // =====================================================================
    //  helpers
    // =====================================================================
    const E = (cor, k = 1, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: '#000000', emissive: cor, emissiveIntensity: k, roughness: 1 }, extra));
    const box = (w, h, d, mat, x, y, z, pai, sombra = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = sombra; m.receiveShadow = true; (pai || scene).add(m); return m; };
    const cil = (rt, rb, h, mat, x, y, z, pai, seg = 32) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (pai || scene).add(m); return m; };
    const tex = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; };
    const FONTE = "'Baloo 2', system-ui, sans-serif";
    const placaTex = (txt, cor, fundo, w = 1024, h = 256, fs = 150) => tex(w, h, (g) => { g.fillStyle = fundo; g.fillRect(0, 0, w, h); g.font = `800 ${fs}px ${FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const k = Math.min(1, (w - 60) / g.measureText(txt).width); g.save(); g.translate(w / 2, h / 2 + 10); g.scale(k, 1); g.lineWidth = 18; g.strokeStyle = '#17121d'; g.strokeText(txt, 0, 0); g.fillStyle = cor; g.fillText(txt, 0, 0); g.restore(); });
    const plano = (w, h, mat, pai) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); (pai || scene).add(m); return m; };
    const aco = M('#9aa6bd', 0.28, 0.85), ouro = M('#e8b830', 0.25, 0.9), madeira = M('#9a6a44', 0.6), escuro = M('#1c1f2b', 0.7);
    const P = {};

    // porta de cofre redonda (dobradiça à esquerda); devolve { dob, roda, grupo }
    function portaCofre(r, pai) {
      const g = new THREE.Group(); (pai || scene).add(g);
      const anel = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, r * 0.13, 16, 64), M('#5d667c', 0.35, 0.8)); g.add(anel);
      const dob = new THREE.Group(); dob.position.set(-r, 0, 0.05); g.add(dob);
      const porta = new THREE.Group(); porta.position.set(r, 0, 0); dob.add(porta);
      const d1 = cil(r, r, r * 0.25, aco, 0, 0, 0, porta, 64); d1.rotation.x = Math.PI / 2;
      const d2 = cil(r * 0.8, r * 0.8, r * 0.28, M('#7f8aa3', 0.3, 0.85), 0, 0, 0.02, porta, 64); d2.rotation.x = Math.PI / 2;
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const p = cil(r * 0.045, r * 0.045, r * 0.3, M('#5d667c', 0.3, 0.8), Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, 0.02, porta, 12); p.rotation.x = Math.PI / 2; }
      const roda = new THREE.Group(); roda.position.z = r * 0.18; porta.add(roda);
      roda.add(new THREE.Mesh(new THREE.TorusGeometry(r * 0.32, r * 0.04, 12, 40), ouro));
      for (let i = 0; i < 3; i++) { const b = box(r * 0.66, r * 0.05, r * 0.05, ouro, 0, 0, 0, roda); b.rotation.z = i * Math.PI / 3; }
      return { g, dob, roda };
    }
    // máquina dourada de carimbar (o "serviço que assina os saques")
    function maquina(pai) {
      const g = new THREE.Group(); (pai || scene).add(g);
      box(2.2, 1.6, 1.6, ouro, 0, 0.8, 0, g);
      box(2.4, 0.2, 1.8, M('#b8901e', 0.3, 0.9), 0, 1.7, 0, g);
      const tela = box(1.2, 0.5, 0.05, E('#7cff9a', 1.4), 0, 1.15, 0.82, g, false);
      const braco = new THREE.Group(); braco.position.set(0, 2.8, 0); g.add(braco);
      box(0.25, 1.0, 0.25, M('#c9a227', 0.3, 0.9), 0, -0.3, 0.6, braco);
      const carimbo = box(0.7, 0.25, 0.5, M('#b3261e', 0.5), 0, -0.85, 0.6, braco);
      box(0.3, 1.2, 0.3, M('#c9a227', 0.3, 0.9), 0, 0.2, 0, g).position.set(0, 2.3, 0);
      const botao = cil(0.18, 0.18, 0.08, E('#ff2a1a', 2), 0.75, 1.75, 0.5, g, 20);
      return { g, braco, carimbo, botao, tela };
    }
    // moedas instanciadas
    const geoMoeda = new THREE.CylinderGeometry(0.11, 0.11, 0.025, 20);
    const matOuro = M('#ffcf3d', 0.22, 0.95); matOuro.emissive = new THREE.Color('#5a3a00'); matOuro.emissiveIntensity = 0.4;
    const matGelo = new THREE.MeshStandardMaterial({ color: '#cdeeff', roughness: 0.08, metalness: 0.05, transparent: true, opacity: 0.85, emissive: '#5ab8ff', emissiveIntensity: 0.25 });

    // =====================================================================
    //  PALCOS DO VÍDEO "COMO OS RICOS REALMENTE GANHAM DINHEIRO"
    // =====================================================================
    const verdeT = (w, h) => tex(w, h, (g) => { g.fillStyle = '#06140c'; g.fillRect(0, 0, w, h); g.font = `800 34px ${FONTE}`;
      const nomes = ['PETR', 'VALE', 'ITUB', 'BBAS', 'WEGE', 'ABEV', 'META', 'AAPL', 'AMZN', 'NVDA', 'MSFT', 'TSLA'];
      for (let y = 40, i = 0; y < h; y += 52) for (let x = 20; x < w; x += 250, i++) { const up = rnd() > 0.2; g.fillStyle = '#d7f5e2'; g.fillText(nomes[i % nomes.length], x, y);
        g.fillStyle = up ? '#2BE37A' : '#FF5A4E'; g.fillText((up ? '▲ +' : '▼ -') + (rnd() * 9).toFixed(1) + '%', x + 100, y); } });
    // contador digital (canvas) devolve { mesh, set(txt) }
    function painel(w, h, larg, alt, cor, fundo, fs, pai) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
      const m = plano(larg, alt, new THREE.MeshBasicMaterial({ map: t, toneMapped: false }), pai); let v = null;
      const set = (txt, sub) => { if (txt === v) return; v = txt; const g = c.getContext('2d'); g.fillStyle = fundo; g.fillRect(0, 0, w, h);
        g.textAlign = 'center'; g.textBaseline = 'middle'; if (sub) { g.font = `800 ${fs * 0.36}px ${FONTE}`; g.fillStyle = '#ffffff'; g.fillText(sub, w / 2, h * 0.22); }
        g.font = `800 ${fs}px ${FONTE}`; g.fillStyle = cor; g.shadowColor = cor; g.shadowBlur = 20; g.fillText(txt, w / 2, sub ? h * 0.62 : h / 2); g.shadowBlur = 0; t.needsUpdate = true; };
      return { m, set };
    }

    // ---------- 1. COBERTURA (z = 0) ----------
    {
      const z0 = Z.COB, g = new THREE.Group(); g.position.z = z0; scene.add(g);
      const marmore = tex(512, 512, (c, w, h) => { c.fillStyle = '#efe9df'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(160,150,140,.35)'; c.lineWidth = 3;
        for (let i = 0; i < 14; i++) { c.beginPath(); c.moveTo(rnd() * w, 0); c.bezierCurveTo(rnd() * w, h * 0.3, rnd() * w, h * 0.7, rnd() * w, h); c.stroke(); }
        c.strokeStyle = 'rgba(120,110,100,.25)'; c.lineWidth = 2; for (let x = 0; x <= w; x += 128) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); c.beginPath(); c.moveTo(0, x); c.lineTo(w, x); c.stroke(); } });
      marmore.wrapS = marmore.wrapT = THREE.RepeatWrapping; marmore.repeat.set(4, 4);
      const piso = plano(26, 26, new THREE.MeshStandardMaterial({ map: marmore, roughness: 0.25, metalness: 0.1 }), g); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true;
      // parapeito de vidro (frente e lados)
      const vidroM = new THREE.MeshStandardMaterial({ color: '#bfe3ff', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.25 });
      [[-13, 0, 0.0, 26], [13, 0, 0.0, 26]].forEach(([x]) => { const v = box(0.08, 1.1, 26, vidroM, x, 0.55, 0, g, false); });
      box(26, 0.12, 0.12, ouro, 0, 1.12, 13, g); box(0.12, 0.12, 26, ouro, -13, 1.12, 0, g); box(0.12, 0.12, 26, ouro, 13, 1.12, 0, g);
      // parede de fundo com o painel da fortuna
      box(26, 9, 0.4, M('#2a2433', 0.6), 0, 4.5, -8, g);
      box(9.4, 3.6, 0.2, ouro, 0, 5.2, -7.75, g);
      const pf = painel(1024, 400, 9, 3.3, '#2BE37A', '#07140c', 150, g); pf.m.position.set(0, 5.2, -7.6); P.painelFortuna = pf; pf.set('US$ 0', 'FORTUNA');
      // mesa de mogno, cadeira, maquetes de empresas
      box(3.2, 0.12, 1.4, M('#5a2e1a', 0.35), 0, 1.0, -2.6, g); box(3.0, 0.9, 1.2, M('#4a2414', 0.5), 0, 0.5, -2.7, g);
      cil(0.55, 0.55, 0.12, M('#1c1c24', 0.4), 0, 0.55, -3.8, g); box(1.0, 1.4, 0.15, M('#1c1c24', 0.4), 0, 1.2, -4.2, g);
      const mesaM = box(3.4, 0.9, 1.6, M('#f4efe6', 0.3), 3.6, 0.45, -1.8, g);
      P.maquetes = [];
      ['building-skyscraper-a', 'building-skyscraper-c', 'building-skyscraper-e', 'building-j', 'building-skyscraper-b'].forEach((n, i) => {
        const m = peca('city-kit-commercial/' + n, { alt: 0.6 + (i % 3) * 0.25 }, 2.4 + i * 0.62, 0.9, -1.8 + (i % 2) * 0.35, rnd(), g); P.maquetes.push(m); });
      const plSuas = plano(1.6, 0.4, new THREE.MeshBasicMaterial({ map: placaTex('SUAS', '#ffd23f', '#17121d', 512, 128, 90), toneMapped: false }), g); plSuas.position.set(3.6, 0.6, -0.99);
      // placa DONO (aparece na frase 11)
      const dono = new THREE.Group(); dono.position.set(0, 9.6, -7.8); g.add(dono);
      const dp = plano(8, 2.4, new THREE.MeshBasicMaterial({ map: placaTex('DONO', '#ffd23f', '#17121d', 1024, 300, 230), toneMapped: false }), dono); dp.position.z = 0.25;
      box(8.4, 2.8, 0.3, ouro, 0, 0, 0, dono); P.placaDono = dono; dono.scale.setScalar(0.001);
      // cidade lá embaixo (horizonte)
      const nomes = ['a', 'b', 'c', 'd', 'e'];
      for (let i = 0; i < 26; i++) { const a = -Math.PI * 0.95 + i / 25 * Math.PI * 0.9, r = 60 + rnd() * 70;
        peca('city-kit-commercial/building-skyscraper-' + nomes[i % 5], { alt: 50 + rnd() * 50 }, Math.cos(a) * r, -70, Math.sin(a) * r, rnd() * 6, g); }
      const luzC = new THREE.PointLight('#ffd9a0', 30, 20, 1.6); luzC.position.set(0, 5, 2); g.add(luzC);
    }

    // ---------- 2. PORTARIA (z = -80) ----------
    {
      const z0 = Z.PORT, g = new THREE.Group(); g.position.z = z0; scene.add(g);
      const pisoT = tex(512, 512, (c, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#d9d4cc' : '#bfb8ad'; c.fillRect(x * 64, y * 64, 64, 64); } });
      pisoT.wrapS = pisoT.wrapT = THREE.RepeatWrapping; pisoT.repeat.set(3, 3);
      const piso = plano(24, 24, new THREE.MeshStandardMaterial({ map: pisoT, roughness: 0.3 }), g); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true;
      box(24, 6, 0.3, M('#e8e2d6', 0.8), 0, 3, -5, g);                   // parede de fundo
      box(0.3, 6, 12, M('#e0d9cc', 0.8), -8, 3, 1, g);                  // parede esquerda
      // elevadores dourados
      [-3.2, 0.2].forEach((x) => { box(2.2, 3.2, 0.12, M('#c9a227', 0.25, 0.9), x, 1.6, -4.8, g); box(0.04, 3.2, 0.14, escuro, x, 1.6, -4.76, g); });
      const plaP = plano(5, 0.8, new THREE.MeshBasicMaterial({ map: placaTex('EDIFÍCIO OTÁVIO', '#ffd23f', '#17121d', 1024, 160, 100), toneMapped: false }), g); plaP.position.set(-1.5, 4.3, -4.82);
      // balcão da portaria (atrás do Juninho)
      box(3.6, 1.15, 0.9, M('#3a2a20', 0.5), 2.4, 0.58, -2.6, g); box(3.8, 0.08, 1.0, M('#efe9df', 0.3), 2.4, 1.18, -2.6, g);
      const mon = box(0.7, 0.45, 0.06, E('#7cc8ff', 1.2), 2.9, 1.5, -2.8, g, false);
      // vaso de planta
      cil(0.35, 0.28, 0.7, M('#d8d1c4', 0.6), -6.5, 0.35, -3.6, g); const folha = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), M('#3f8a3a', 0.8)); folha.position.set(-6.5, 1.5, -3.6); g.add(folha);
      // porta de vidro e o SUV de luxo lá fora
      box(0.2, 4, 0.2, ouro, 7.6, 2, -1, g); box(0.2, 4, 0.2, ouro, 7.6, 2, 3, g);
      const vidro = box(0.06, 4, 4, new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.18, roughness: 0.05 }), 7.6, 2, 1, g, false);
      peca('car-kit/suv-luxury', { comp: 4.6 }, 10.5, 0, 1, Math.PI / 2, g);
      const luzP = new THREE.PointLight('#fff3dd', 18, 18, 1.6); luzP.position.set(0, 5, 0); g.add(luzP);
    }

    // ---------- 3. BOLSA DE VALORES (z = -160) ----------
    {
      const z0 = Z.BOLSA, g = new THREE.Group(); g.position.z = z0; scene.add(g);
      const piso = plano(60, 60, M('#0b0f14', 0.35, 0.3), g); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true;
      const tick = verdeT(2048, 1024);
      const tela = plano(30, 15, new THREE.MeshBasicMaterial({ map: tick, toneMapped: false, color: '#9fbfaa' }), g); tela.position.set(0, 9, -12);
      box(31, 15.6, 0.4, M('#1a1f28', 0.5, 0.4), 0, 9, -12.3, g);
      // gráfico 3D que cresce
      const pts = []; let y = 1.5; for (let i = 0; i <= 24; i++) { y += 0.18 + rnd() * 0.55 - (i % 5 === 3 ? 0.6 : 0); pts.push(new THREE.Vector3(-12 + i, Math.max(1, y), -8)); }
      const curva = new THREE.CatmullRomCurve3(pts);
      const geoG = new THREE.TubeGeometry(curva, 240, 0.22, 10); const graf = new THREE.Mesh(geoG, E('#2BE37A', 2.4)); g.add(graf);
      P.grafico = (k) => { geoG.setDrawRange(0, Math.floor(geoG.index.count * Math.max(0, Math.min(1, k)) / 6) * 6); };
      P.grafico(0); P.curvaGrafico = curva;
      const ponta = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 14), E('#c6ffdc', 3)); g.add(ponta); P.pontaGrafico = ponta;
      // seta verde e moedas que jorram
      P.moedasB = new THREE.InstancedMesh(geoMoeda, matOuro, 260); P.moedasB.count = 0; P.moedasB.scale.setScalar(3); g.add(P.moedasB);
      // pódios com logos de empresa
      for (let i = 0; i < 6; i++) box(2.2, 0.6 + i * 0.5, 2.2, M('#1f2a36', 0.4, 0.5), -11 + i * 4.4, (0.6 + i * 0.5) / 2, -3, g);
      const luzB = new THREE.PointLight('#2BE37A', 60, 40, 1.4); luzB.position.set(0, 8, -2); g.add(luzB);
    }

    // ---------- 4. MARINA (z = -240) ----------
    {
      const z0 = Z.MARINA, g = new THREE.Group(); g.position.z = z0; scene.add(g);
      const agua = plano(200, 200, new THREE.MeshStandardMaterial({ color: '#1f7fc4', roughness: 0.12, metalness: 0.35 }), g); agua.rotation.x = -Math.PI / 2; agua.position.y = -0.4;
      // píer de madeira
      const tabua = M('#a8754a', 0.75); box(4, 0.3, 30, tabua, -4, 0, 6, g);
      for (let i = 0; i < 8; i++) { cil(0.15, 0.15, 1.6, M('#6d4a30', 0.8), -6, 0, -6 + i * 4, g, 10); cil(0.15, 0.15, 1.6, M('#6d4a30', 0.8), -2, 0, -6 + i * 4, g, 10); }
      // o iate
      P.iate = peca('watercraft-kit/ship-ocean-liner-small', { comp: 30 }, 10, -0.4, -6, -Math.PI / 2, g);
      peca('watercraft-kit/boat-speed-a', { comp: 6 }, -14, -0.4, 8, 0.4, g);
      peca('watercraft-kit/boat-sail-a', { comp: 7 }, -22, -0.4, -10, 1.0, g);
      [[3, 14], [-10, 18], [16, 14]].forEach(([x, z]) => peca('watercraft-kit/buoy', { alt: 1.4 }, x, -0.4, z, 0, g));
      const nomeIate = plano(7, 1.4, new THREE.MeshBasicMaterial({ map: placaTex('SÓ AÇÕES', '#ffffff', '#1d3a6e', 1024, 200, 140), toneMapped: false }), g); nomeIate.position.set(10, 3.2, 9.6); P.nomeIate = nomeIate;
    }

    // ---------- 5. BANCO (z = -320) ----------
    {
      const z0 = Z.BANCO, g = new THREE.Group(); g.position.z = z0; scene.add(g);
      const pisoT = tex(512, 512, (c, w, h) => { c.fillStyle = '#e8dcc4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c9b48a'; c.lineWidth = 6; for (let x = 0; x <= w; x += 128) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); c.beginPath(); c.moveTo(0, x); c.lineTo(w, x); c.stroke(); } });
      pisoT.wrapS = pisoT.wrapT = THREE.RepeatWrapping; pisoT.repeat.set(4, 4);
      const piso = plano(30, 30, new THREE.MeshStandardMaterial({ map: pisoT, roughness: 0.25 }), g); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true;
      box(30, 9, 0.4, M('#efe8da', 0.8), 0, 4.5, -7, g);
      [-10, -6, -2, 10].forEach((x) => cil(0.45, 0.5, 8, M('#f7f2e8', 0.5), x, 4, -5.6, g, 24));
      const plB = plano(9, 1.3, new THREE.MeshBasicMaterial({ map: placaTex('BANCO', '#17121d', '#ffd23f', 1024, 150, 120), toneMapped: false }), g); plB.position.set(0, 7.6, -6.75);
      const pc = portaCofre(2.3, g); pc.g.position.set(5.5, 2.6, -6.6); P.portaBanco = pc;
      // balcão
      box(6, 1.1, 1.2, M('#5a2e1a', 0.4), -1.0, 0.55, -2.2, g); box(6.2, 0.08, 1.4, M('#2a2a34', 0.3, 0.5), -1.0, 1.14, -2.2, g);
      // pilha de dinheiro (cresce na frase 7)
      const pilha = new THREE.Group(); pilha.position.set(-2.2, 1.18, -2.0); g.add(pilha); P.pilha = pilha;
      const maco = M('#6CCB78', 0.6), cinta = M('#ffd93d', 0.5);
      for (let i = 0; i < 24; i++) { const k = Math.floor(i / 6), j = i % 6; const b = box(0.36, 0.12, 0.18, maco, (j % 3) * 0.38 - 0.38, 0.06 + k * 0.13, Math.floor(j / 3) * 0.2, pilha); box(0.06, 0.125, 0.185, cinta, 0, 0, 0, b); }
      pilha.scale.setScalar(0.001);
      const luzBk = new THREE.PointLight('#fff0d0', 22, 20, 1.6); luzBk.position.set(0, 6, 1); g.add(luzBk);
    }

    // ---------- 6. ESTÚDIO: gráfico de barras e mapa do Brasil (z = -400) ----------
    {
      const z0 = Z.ESTUDIO, g = new THREE.Group(); g.position.z = z0; scene.add(g);
      const fundo = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 20, 64, 1, true, Math.PI * 0.5, Math.PI), new THREE.MeshStandardMaterial({ color: '#f1f3f8', roughness: 0.95, side: THREE.DoubleSide, emissive: '#d9deea', emissiveIntensity: 0.35 })); fundo.position.set(6, 10, -2); g.add(fundo);
      const piso = plano(60, 40, M('#e6e9f1', 0.9), g); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true;
      // barras: fortuna (US$ 401 bi) x imposto (US$ 13,6 bi = 3,4%)
      const bf = new THREE.Group(); bf.position.set(-2.2, 0, -6); g.add(bf); const barraF = box(2.6, 1, 2.6, M('#2BE37A', 0.35, 0.1), 0, 0.5, 0, bf);
      const bi = new THREE.Group(); bi.position.set(2.2, 0, -6); g.add(bi); const barraI = box(2.6, 1, 2.6, M('#FF5A4E', 0.35, 0.1), 0, 0.5, 0, bi);
      P.barras = (kf, ki) => { bf.scale.y = Math.max(0.001, kf * 12); bi.scale.y = Math.max(0.001, ki * 12 * 0.034); };
      P.barras(0, 0);
      // mapa do Brasil (contorno aproximado, lon/lat)
      const ll = [[-35.0,-5.0],[-38.5,-3.7],[-41.5,-2.9],[-44.3,-2.5],[-48.5,-1.4],[-50.0,0.0],[-51.5,4.0],[-54.5,2.3],[-57.0,1.9],[-60.0,5.2],[-63.0,2.0],[-66.8,1.2],[-69.9,1.0],[-69.6,-4.2],[-73.9,-7.4],[-72.5,-10.0],[-65.5,-9.8],[-63.0,-12.5],[-60.0,-13.5],[-58.2,-16.3],[-57.6,-19.8],[-58.1,-22.5],[-55.2,-24.1],[-54.6,-25.6],[-53.8,-27.2],[-57.6,-30.2],[-53.4,-33.7],[-50.6,-30.8],[-48.6,-28.0],[-48.5,-25.8],[-46.0,-24.0],[-43.2,-23.0],[-41.0,-22.0],[-39.7,-19.6],[-39.0,-17.0],[-38.9,-13.0],[-37.0,-10.9],[-35.2,-8.0]];
      const forma = new THREE.Shape(); ll.forEach(([lo, la], i) => { const x = (lo + 52) * 0.32, y = (la + 14) * 0.32; i ? forma.lineTo(x, y) : forma.moveTo(x, y); });
      const geoBR = new THREE.ExtrudeGeometry(forma, { depth: 0.5, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 });
      const br = new THREE.Mesh(geoBR, M('#1E9E4A', 0.5)); br.rotation.x = -Math.PI / 2; br.castShadow = true; br.receiveShadow = true;
      const mapa = new THREE.Group(); mapa.position.set(16, 0.05, -2); mapa.add(br); g.add(mapa); P.mapaBR = mapa;
      const borda = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.2, bevelEnabled: false }), M('#FFD93D', 0.4)); borda.rotation.x = -Math.PI / 2; borda.scale.set(1.03, 1.03, 1); borda.position.y = -0.05; mapa.add(borda);
      // placa que gira: ISENTO -> 10%
      const vira = new THREE.Group(); vira.position.set(16.3, 3.4, -2.6); g.add(vira); P.placaVira = vira;
      const pa = plano(5.2, 1.9, new THREE.MeshBasicMaterial({ map: placaTex('ISENTO', '#ffffff', '#1E9E4A', 1024, 380, 230), toneMapped: false, side: THREE.FrontSide }), vira); pa.position.z = 0.02;
      const pb = plano(5.2, 1.9, new THREE.MeshBasicMaterial({ map: placaTex('10%', '#17121d', '#ffd23f', 1024, 380, 260), toneMapped: false, side: THREE.FrontSide }), vira); pb.position.z = -0.02; pb.rotation.y = Math.PI;
      box(0.15, 3.4, 0.15, escuro, 16.3, 1.7, -2.75, g);
      const luzE = new THREE.PointLight('#ffffff', 60, 40, 1.6); luzE.position.set(6, 9, 6); g.add(luzE);
    }

    // sombra 2D (personagens)
    const texSombra = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.6, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
    function sombra(x, z, rx = 0.45, rz = 0.22, opacidade = 0.5) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texSombra, color: '#2a1a10', transparent: true, opacity: opacidade, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, 0.03, z); m.scale.set(rx * 2, rz * 2, 1); m.renderOrder = 2; m.userData.base = { rx, rz, opacidade }; scene.add(m); return m;
    }

    // ---------- pós: render -> profundidade de campo -> bloom -> cor/vinheta/grão -> FXAA ----------
    const alvo = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new THREE.EffectComposer(renderer, alvo); composer.setSize(W, H);
    composer.addPass(new THREE.RenderPass(scene, camera));
    const bokeh = new THREE.BokehPass(scene, camera, { focus: 8, aperture: 0.0016, maxblur: 0.014, width: W, height: H });
    composer.addPass(bokeh);
    composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.22, 0.6, 0.92));
    const grade = new THREE.ShaderPass({
      uniforms: { tDiffuse: { value: null }, t: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float t; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + t) * 43758.5453); }
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          float l = dot(c, vec3(0.299,0.587,0.114));
          c = mix(vec3(l), c, 1.16);                       // saturação
          c = mix(c, c * vec3(1.05, 1.0, 0.93), 0.6);      // calor
          c = (c - 0.5) * 1.06 + 0.5;                      // contraste
          vec2 p = vUv - 0.5; p.x *= 0.62; c *= mix(0.78, 1.0, smoothstep(0.75, 0.25, length(p)));  // vinheta
          c += (h(vUv * 1000.0) - 0.5) * 0.018;            // grão fino
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    composer.addPass(grade);
    const fxaa = new THREE.ShaderPass(THREE.FXAAShader); fxaa.uniforms.resolution.value.set(1 / W, 1 / H); composer.addPass(fxaa);

    // ---------- câmera ----------
    const cam = { quadro: () => ({ pos: [0, 1.7, 8], alvo: [0, 1.2, 0], fov: 42 }) };
    const va = new THREE.Vector3();
    function posicionar(t) {
      const q = cam.quadro(t);
      camera.position.set(...q.pos); va.set(...q.alvo); camera.lookAt(va);
      if (q.roll) camera.rotateZ(q.roll);
      if (q.fov && q.fov !== camera.fov) { camera.fov = q.fov; camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld();
      const foco = new THREE.Vector3().lerpVectors(camera.position, va, 0.4); foco.y = 0;
      sol.target.position.copy(foco); sol.position.copy(foco).addScaledVector(DIR_SOL, 80);
      ceu.position.copy(camera.position);
      bokeh.uniforms.focus.value = cena.foco ? cena.foco(t) : camera.position.distanceTo(va);
    }
    const vp = new THREE.Vector3(), vq = new THREE.Vector3();
    function projetar(x, y, z) {
      vp.set(x, y, z).project(camera); vq.set(x, y + 1, z).project(camera);
      const sx = (vp.x * 0.5 + 0.5) * W, sy = (-vp.y * 0.5 + 0.5) * H, sy1 = (-vq.y * 0.5 + 0.5) * H;
      return { x: sx, y: sy, ppm: sy - sy1, dist: camera.position.distanceTo(vq.set(x, y, z)), atras: vp.z > 1 || vp.z < -1 };
    }
    let tAtual = -1;
    function desenhar(t) { tAtual = t; if (cena.luz) { const l = cena.luz(t); sol.intensity = l.sol; sol.color.set(l.corSol); hemi.intensity = l.hemi; hemi.color.set(l.corHemi); ceu.material.color.set(l.ceu); scene.fog.color.set(l.nevoa); scene.fog.near = l.near || 70; scene.fog.far = l.far || 420; renderer.toneMappingExposure = l.exp || 1; nuvens.forEach((n) => { n.material.opacity = l.nuvens == null ? 1 : l.nuvens; }); } posicionar(t); grade.uniforms.t.value = t % 10; if (cena.antes) cena.antes(t); composer.render(); }

    const cena = { scene, camera, cam, renderer, desenhar, projetar, sombra, fontesProntas() {}, THREE, peca, P, Z, get t() { return tAtual; } };
    cena.pronto = Promise.all(carregando);
    return cena;
  }
  global.Ricos3D = { criar, Z: { COB: 0, PORT: -80, BOLSA: -160, MARINA: -240, BANCO: -320, ESTUDIO: -400 } };
})(window);
