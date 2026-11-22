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
    const Z = { APTO: 0, CIDADE: -80, ESCONDE: -160, DIGITAL: -240, COFRE: -320, ESTUDIO: -540 };

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
    //  PALCOS DO VÍDEO "A ENTREVISTA DE EMPREGO QUE ABRIU A BINANCE"
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

    // ---------- 1. APARTAMENTO À NOITE (z = 0) ----------
    {
      const z0 = Z.APTO, g = new THREE.Group(); g.position.z = z0; scene.add(g);
      const piso = plano(14, 14, M('#8a5a3c', 0.55), g); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true;
      const tabuas = tex(512, 512, (c, w, h) => { for (let y = 0; y < h; y += 32) { c.fillStyle = (y / 32) % 2 ? '#8a5a3c' : '#7d5034'; c.fillRect(0, y, w, 31); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, y + 31, w, 1); } });
      tabuas.wrapS = tabuas.wrapT = THREE.RepeatWrapping; tabuas.repeat.set(4, 4); piso.material.map = tabuas; piso.material.color.set('#ffffff');
      const parede = M('#46557d', 0.9);
      box(14, 4.2, 0.2, parede, 0, 2.1, -4.2, g); box(0.2, 4.2, 9, parede, -4.2, 2.1, 0.3, g); box(0.2, 4.2, 9, parede, 4.2, 2.1, 0.3, g);
      // janela com a cidade à noite
      const cidadeNoite = tex(512, 512, (c, w, h) => { c.fillStyle = '#0d1440'; c.fillRect(0, 0, w, h); for (let x = 0; x < w;) { const bw = 40 + rnd() * 70, bh = 120 + rnd() * 300; c.fillStyle = '#1a1f4a'; c.fillRect(x, h - bh, bw, bh); for (let k = 0; k < 14; k++) { c.fillStyle = rnd() > 0.45 ? '#ffd27a' : '#2a3060'; c.fillRect(x + 6 + rnd() * (bw - 16), h - bh + 10 + rnd() * (bh - 20), 7, 9); } x += bw + 4; } c.fillStyle = '#f4f2ff'; c.beginPath(); c.arc(400, 90, 34, 0, 7); c.fill(); });
      const jan = plano(2.6, 2.0, E('#ffffff', 0.9, { emissiveMap: cidadeNoite }), g); jan.position.set(4.08, 2.1, -1.0); jan.rotation.y = -Math.PI / 2;
      box(0.12, 2.2, 0.12, escuro, 4.05, 2.1, -1.0, g, false);
      // mesa alta, laptop, caneca
      box(1.7, 0.07, 0.85, madeira, 0.35, 1.08, -0.7, g);
      for (const [x, z] of [[-0.45, -1.05], [1.15, -1.05], [-0.45, -0.35], [1.15, -0.35]]) box(0.06, 1.05, 0.06, escuro, x, 0.53, z, g);
      box(0.42, 0.025, 0.3, M('#c8ccd6', 0.3, 0.7), 0.15, 1.13, -0.62, g);
      const telaL = box(0.42, 0.28, 0.015, E('#9fd0ff', 1.6), 0.15, 1.27, -0.79, g, false); telaL.rotation.x = -0.25; P.telaLaptop = telaL;
      const luzTela = new THREE.PointLight('#8fc4ff', 2.5, 3, 2); luzTela.position.set(0.15, 1.35, -0.5); g.add(luzTela); P.luzTela = luzTela;
      cil(0.05, 0.045, 0.11, M('#e8402f', 0.5), 0.75, 1.17, -0.55, g, 16);
      // geladeira com bilhete "6"
      box(0.9, 2.0, 0.8, M('#e9eef6', 0.35, 0.2), 3.4, 1.0, -3.6, g);
      const bil = plano(0.25, 0.25, M('#ffe066', 0.8), g); bil.position.set(3.15, 1.4, -3.19); bil.material.map = placaTex('6', '#17121d', '#ffe066', 256, 256, 200);
      // luminária pendente quente
      cil(0.008, 0.008, 1.4, escuro, 0.35, 3.5, -0.7, g, 6);
      const lamp = cil(0.28, 0.12, 0.25, M('#2b2b33', 0.5), 0.35, 2.75, -0.7, g, 24); lamp.castShadow = false;
      const lampada = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), E('#ffd9a0', 4)); lampada.position.set(0.35, 2.6, -0.7); g.add(lampada);
      const luzMesa = new THREE.PointLight('#ffc77a', 9, 8, 2); luzMesa.position.set(0.35, 2.5, -0.7); luzMesa.castShadow = true; luzMesa.shadow.mapSize.set(1024, 1024); g.add(luzMesa); P.luzMesa = luzMesa;
      // porta de cofre na parede do fundo + brilho dourado atrás
      const pc = portaCofre(1.05, g); pc.g.position.set(-2.0, 1.25, -4.05); P.portaApto = pc;
      const brilho = plano(2.0, 2.0, new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc24a').multiplyScalar(2.2), transparent: true, opacity: 1, toneMapped: false }), g); brilho.position.set(-2.0, 1.25, -4.08); P.brilhoCofreApto = brilho;
      const luzCofre = new THREE.PointLight('#ffbf47', 0, 9, 1.6); luzCofre.position.set(-2.0, 1.3, -3.4); g.add(luzCofre); P.luzCofreApto = luzCofre;
      // quadro e planta
      box(0.9, 0.6, 0.04, M('#ff8a3d', 0.6), 1.6, 2.4, -4.08, g);
      peca('nature-kit/plant_bushDetailed', { alt: 0.9 }, -3.4, 0, -3.3, 0.5, g);
    }

    // ---------- 2. CIDADE AO ENTARDECER (z = -80) ----------
    {
      const z0 = Z.CIDADE, g = new THREE.Group(); g.position.z = z0; scene.add(g);
      const chao = plano(300, 300, M('#3a3550', 0.9), g); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true;
      const vidroT = tex(512, 1024, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2b5fb0'); gr.addColorStop(0.5, '#7ec8ff'); gr.addColorStop(1, '#203f8a'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 28) for (let x = 0; x < w; x += 36) { c.fillStyle = rnd() > 0.65 ? 'rgba(255,214,120,.85)' : 'rgba(255,255,255,.08)'; c.fillRect(x + 3, y + 3, 30, 22); }
        c.fillStyle = '#0e2350'; for (let x = 0; x < w; x += 36) c.fillRect(x, 0, 3, h); for (let y = 0; y < h; y += 28) c.fillRect(0, y, w, 3); });
      vidroT.wrapS = vidroT.wrapT = THREE.RepeatWrapping; vidroT.repeat.set(2, 4);
      const vidro = new THREE.MeshStandardMaterial({ map: vidroT, roughness: 0.12, metalness: 0.55, emissive: '#ffffff', emissiveMap: vidroT, emissiveIntensity: 0.35 });
      box(16, 56, 16, vidro, 0, 28, -10, g);
      box(16.6, 1.0, 16.6, ouro, 0, 56.5, -10, g);
      const cofreTopo = box(8, 6, 8, E('#ffbf3a', 2.2, { roughness: 0.4 }), 0, 60, -10, g);
      const luzTopo = new THREE.PointLight('#ffbf47', 60, 80, 1.5); luzTopo.position.set(0, 62, -10); g.add(luzTopo);
      const plc = plano(14, 3.2, new THREE.MeshBasicMaterial({ map: placaTex('MAIOR CORRETORA DO MUNDO', '#ffd23f', '#16151f', 1024, 220, 120), toneMapped: false }), g); plc.position.set(0, 50, -1.9);
      // cabos de luz saindo do cofre para a cidade
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const fim = new THREE.Vector3(Math.cos(a) * 60, 20, -10 + Math.sin(a) * 60);
        const cur = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 60, -10), new THREE.Vector3(fim.x * 0.5, 58, -10 + (fim.z + 10) * 0.5), fim]);
        const t = new THREE.Mesh(new THREE.TubeGeometry(cur, 40, 0.18, 8), E('#ffd27a', 2.5)); g.add(t); }
      // prédios ao redor
      const nomes = ['a', 'b', 'c', 'd', 'e'];
      for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + 0.2, r = 34 + rnd() * 26; peca('city-kit-commercial/building-skyscraper-' + nomes[i % 5], { alt: 26 + rnd() * 30 }, Math.cos(a) * r, 0, -10 + Math.sin(a) * r, rnd() * 6, g); }
      // telhado dos hackers (do outro lado da rua, perto da câmera)
      box(12, 18, 10, M('#2e2a40', 0.8), -10, 9, 20, g);
      box(12.4, 0.5, 10.4, M('#4a4560', 0.8), -10, 18.25, 20, g);
      for (let k = 0; k < 4; k++) box(0.9, 0.9, 0.9, M('#6a6580', 0.7), -14 + k * 1.3, 19, 23.5, g);
    }

    // ---------- 3. ESCONDERIJO (z = -160) ----------
    {
      const z0 = Z.ESCONDE, g = new THREE.Group(); g.position.z = z0; scene.add(g);
      const piso = plano(16, 16, M('#2a2a33', 0.85), g); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true;
      const par = M('#23202e', 0.95);
      box(16, 5, 0.3, par, 0, 2.5, -4.6, g); box(0.3, 5, 10, par, -5.5, 2.5, 0, g); box(0.3, 5, 10, par, 5.5, 2.5, 0, g);
      // fileira de mesas com monitores verdes
      const telaT = tex(256, 160, (c, w, h) => { c.fillStyle = '#04140c'; c.fillRect(0, 0, w, h); for (let y = 12; y < h; y += 14) { c.fillStyle = rnd() > 0.3 ? '#2cff8a' : '#1a9a55'; c.fillRect(10 + rnd() * 20, y, 40 + rnd() * 170, 6); } });
      for (let i = 0; i < 4; i++) {
        const x = -3.6 + i * 2.4; box(2.1, 0.08, 0.9, escuro, x, 0.95, -3.7, g);
        for (let k = -1; k <= 1; k++) { const m = box(0.62, 0.42, 0.04, E('#ffffff', 1.4, { emissiveMap: telaT }), x + k * 0.66, 1.42 - Math.abs(k) * 0.02, -3.95 + Math.abs(k) * 0.08, g, false); m.rotation.y = -k * 0.25; }
      }
      const verde = new THREE.PointLight('#2cff8a', 10, 12, 1.6); verde.position.set(0, 2.2, -2.6); g.add(verde);
      const roxo = new THREE.PointLight('#9b5de5', 8, 12, 1.6); roxo.position.set(-4, 3.5, 1.5); g.add(roxo);
      box(10, 0.06, 0.06, E('#b07cff', 4), 0, 4.7, -4.4, g, false);
      // parede falsa com portas "RH" e "CEO"
      for (const [x, txt] of [[-4.2, 'RH'], [4.2, 'CEO']]) { box(1.3, 2.4, 0.1, madeira, x, 1.2, -4.4, g); const p = plano(0.9, 0.38, new THREE.MeshBasicMaterial({ map: placaTex(txt, '#ffffff', '#1f6fd6', 512, 220, 170), toneMapped: false }), g); p.position.set(x, 2.15, -4.33); }
      // poltrona de couro e webcam
      cil(0.5, 0.5, 0.45, M('#5a2e1e', 0.45), 2.6, 0.3, -1.6, g, 24); box(1.0, 1.0, 0.25, M('#5a2e1e', 0.45), 2.6, 0.95, -2.05, g);
      // caixas de pizza
      for (let k = 0; k < 3; k++) box(0.6, 0.05, 0.6, M('#d9a464', 0.8), -2.6 + k * 0.08, 0.03 + k * 0.05, 1.2, g);
      // pilha de moedas (aparece na cena 9) e blocos de gelo (cena 12)
      const N = 700, mo = new THREE.InstancedMesh(geoMoeda, matOuro, N); mo.castShadow = true; g.add(mo);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s1 = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
      const lista = []; for (let i = 0; i < N; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 1.8; lista.push([1.0 + Math.cos(a) * r, rnd() * 1.1 * (1 - r / 1.9) + 0.02, 0.2 + Math.sin(a) * r * 0.8, rnd() * 3, rnd() * 3]); }
      lista.sort((a, b) => a[1] - b[1]); lista.forEach((p, i) => { e.set(p[3], p[4], 0); q.setFromEuler(e); m4.compose(v.set(p[0], p[1], p[2]), q, s1); mo.setMatrixAt(i, m4); });
      mo.count = 0; P.moedasEsc = mo; P.moedasEscN = N;
      const gelo = []; for (let i = 0; i < 9; i++) { const b = box(0.6 + rnd() * 0.5, 0.5 + rnd() * 0.6, 0.6 + rnd() * 0.4, matGelo, 0.2 + rnd() * 1.8, 0.3, -0.4 + rnd() * 1.2, g, false); b.rotation.y = rnd() * 3; b.visible = false; gelo.push(b); }
      P.geloEsc = gelo;
    }

    // ---------- 4. LABIRINTO DIGITAL (z = -240) ----------
    {
      const z0 = Z.DIGITAL, g = new THREE.Group(); g.position.z = z0; scene.add(g);
      const grade = tex(512, 512, (c, w, h) => { c.fillStyle = '#05081a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2f6bff'; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, h); c.stroke(); c.beginPath(); c.moveTo(0, i * 64); c.lineTo(w, i * 64); c.stroke(); } });
      grade.wrapS = grade.wrapT = THREE.RepeatWrapping; grade.repeat.set(10, 10);
      const piso = plano(60, 60, new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#ffffff', emissiveMap: grade, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.4 }), g); piso.rotation.x = -Math.PI / 2;
      const frisoT = tex(64, 256, (c, w, h) => { c.fillStyle = '#0b0f22'; c.fillRect(0, 0, w, h); for (let y = 10; y < h; y += 22) { c.fillStyle = rnd() > 0.5 ? '#4aa8ff' : '#7cff9a'; c.fillRect(8, y, 20 + rnd() * 30, 5); } });
      const torreMat = new THREE.MeshStandardMaterial({ color: '#141a33', roughness: 0.4, metalness: 0.6, emissive: '#ffffff', emissiveMap: frisoT, emissiveIntensity: 1.2 });
      P.torres = [];
      for (let i = -3; i <= 3; i++) for (let k = 0; k < 7; k++) { if (i === 0) continue; const t = box(1.2, 3.2, 1.2, torreMat, i * 2.6, 1.6, -k * 2.8, g); P.torres.push(t); }
      const maq = maquina(g); maq.g.position.set(0, 0, -21); maq.g.scale.setScalar(1.5); P.maqDig = maq;
      const ponto = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), E('#ff2a1a', 5)); g.add(ponto); P.ponto = ponto;
      const luzP = new THREE.PointLight('#ff2a1a', 8, 7, 1.5); ponto.add(luzP);
      // rastro do ponto (linha vermelha)
      const rastro = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.1, 2), new THREE.Vector3(0, 0.1, 1)]), 2, 0.05, 6), E('#ff2a1a', 3)); g.add(rastro); P.rastro = rastro;
      P.saltos = [[-2.6, 0], [-2.6, -5.6], [2.6, -8.4], [2.6, -14], [-2.6, -16.8], [0, -19.5]].map(([x, z]) => new THREE.Vector3(x, 3.4, z));
      P.saltos[5].y = 3.0;
    }

    // ---------- 5. O COFRE E OS 10 CANOS (z = -320) ----------
    {
      const z0 = Z.COFRE, g = new THREE.Group(); g.position.z = z0; scene.add(g);
      const chao = plano(300, 300, M("#2a2740", 0.9), g); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true;
      box(18, 13, 10, M('#3a3550', 0.8, 0.2), 0, 6.5, -12, g);
      box(18.6, 0.8, 10.6, ouro, 0, 13.3, -12, g);
      const pc = portaCofre(3.6, g); pc.g.position.set(0, 5.2, -6.9); P.portaCofre5 = pc;
      const relT = { c: document.createElement('canvas'), v: '' }; relT.c.width = 512; relT.c.height = 192;
      const relTex = new THREE.CanvasTexture(relT.c); relTex.encoding = THREE.sRGBEncoding;
      P.relogio = (txt) => { if (txt === relT.v) return; relT.v = txt; const c = relT.c.getContext('2d'); c.fillStyle = '#10060a'; c.fillRect(0, 0, 512, 192); c.font = `800 150px ${FONTE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ff3b30'; c.shadowColor = '#ff3b30'; c.shadowBlur = 24; c.fillText(txt, 256, 104); relTex.needsUpdate = true; };
      const rel = plano(5.2, 1.95, new THREE.MeshBasicMaterial({ map: relTex, toneMapped: false }), g); rel.position.set(0, 11.2, -6.85); P.relogio('00:00');
      // 10 canos que saem do topo do cofre para a cidade
      P.canos = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI * 0.95 + i / 9 * Math.PI * 0.9, fim = new THREE.Vector3(Math.cos(a) * 70, 6, -12 + Math.sin(a) * 70);
        const cur = new THREE.CatmullRomCurve3([new THREE.Vector3(-4 + i * 0.9, 13.6, -12), new THREE.Vector3(fim.x * 0.35, 30, -12 + (fim.z + 12) * 0.35), new THREE.Vector3(fim.x * 0.75, 22, -12 + (fim.z + 12) * 0.75), fim]);
        const matCano = new THREE.MeshStandardMaterial({ color: '#ffd27a', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.45, emissive: '#ffb02e', emissiveIntensity: 0.6 });
        const tubo = new THREE.Mesh(new THREE.TubeGeometry(cur, 60, 0.9, 12), matCano); g.add(tubo);
        const Nm = 70, mo = new THREE.InstancedMesh(geoMoeda, matOuro.clone(), Nm); mo.scale.setScalar(2.4); g.add(mo);
        P.canos.push({ cur, tubo, mo, Nm, mat: matCano, fase: rnd() });
      }
      // etiquetas USDT e USDC nos dois canos que congelam
      [['USDT', 2], ['USDC', 7]].forEach(([txt, i]) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: placaTex(txt, '#ffffff', '#1f6fd6', 512, 200, 150), toneMapped: false })); const p = P.canos[i].cur.getPoint(0.42); s.position.copy(p).add(new THREE.Vector3(0, 3, 0)); s.scale.set(7, 2.7, 1); g.add(s); P.canos[i].etiqueta = s; });
      // cidade ao redor
      const nomes = ['a', 'b', 'c', 'd', 'e'];
      for (let i = 0; i < 22; i++) { const a = -Math.PI + i / 21 * Math.PI, r = 45 + rnd() * 35; peca('city-kit-commercial/building-skyscraper-' + nomes[i % 5], { alt: 14 + rnd() * 24 }, Math.cos(a) * r, 0, -12 + Math.sin(a) * r, rnd() * 6, g); }
      const luzOuro = new THREE.PointLight('#ffbf47', 0, 60, 1.4); luzOuro.position.set(0, 18, -6); g.add(luzOuro); P.luzOuro5 = luzOuro;
      // neve
      const Nn = 1600, posN = new Float32Array(Nn * 3), semN = [];
      for (let i = 0; i < Nn; i++) semN.push([(rnd() - 0.5) * 60, rnd() * 40, -12 + (rnd() - 0.5) * 50, 1 + rnd() * 2]);
      const geoN = new THREE.BufferGeometry(); geoN.setAttribute('position', new THREE.BufferAttribute(posN, 3));
      const neve = new THREE.Points(geoN, new THREE.PointsMaterial({ color: '#ffffff', size: 0.25, transparent: true, opacity: 0.9, depthWrite: false })); neve.frustumCulled = false; g.add(neve);
      P.neve = (t, on) => { neve.visible = on; if (!on) return; for (let i = 0; i < Nn; i++) { const s = semN[i]; posN[i * 3] = s[0] + Math.sin(t + i) * 0.5; posN[i * 3 + 1] = 40 - ((s[1] + t * s[3]) % 40); posN[i * 3 + 2] = s[2]; } geoN.attributes.position.needsUpdate = true; };
    }

    // ---------- 6. ESTÚDIO DA REVELAÇÃO (z = -400) ----------
    {
      const z0 = Z.ESTUDIO, g = new THREE.Group(); g.position.z = z0; scene.add(g);
      const fundo = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 16, 48, 1, true, Math.PI * 0.5, Math.PI), new THREE.MeshStandardMaterial({ color: '#e6e9f2', roughness: 0.95, side: THREE.DoubleSide, emissive: '#c8cde0', emissiveIntensity: 0.35 })); fundo.position.set(0, 8, -2); fundo.castShadow = false; fundo.receiveShadow = false; g.add(fundo);
      const luzEst2 = new THREE.PointLight('#ffffff', 60, 30, 1.6); luzEst2.position.set(0, 7, 4); g.add(luzEst2);
      const piso = plano(40, 40, M('#d5d9e4', 0.9), g); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true;
      box(5.4, 5.4, 1.2, M('#7f8aa3', 0.4, 0.6), -2.6, 2.7, -5, g);
      const pc = portaCofre(2.0, g); pc.g.position.set(-2.6, 2.7, -4.3); P.portaEst = pc;
      const maq = maquina(g); maq.g.position.set(2.8, 0, -3.6); maq.g.rotation.y = -0.35; P.maqEst = maq;
      const pontoE = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), E('#ff2a1a', 6)); maq.g.add(pontoE); pontoE.position.set(0.75, 1.92, 0.5);
      P.papeis = []; const papelT = placaTex('SAQUE ✓', '#1f6fd6', '#fbf8f0', 512, 320, 110);
      for (let i = 0; i < 8; i++) { const p = plano(0.7, 0.45, new THREE.MeshStandardMaterial({ map: papelT, roughness: 0.8, side: THREE.DoubleSide }), g); p.visible = false; P.papeis.push(p); }
      const luzEst = new THREE.DirectionalLight('#ffffff', 1.2); luzEst.position.set(4, 10, 6); luzEst.target.position.set(0, 1, -4); g.add(luzEst, luzEst.target);
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
  global.Binance3D = { criar, Z: { APTO: 0, CIDADE: -80, ESCONDE: -160, DIGITAL: -240, COFRE: -320, ESTUDIO: -540 } };
})(window);
