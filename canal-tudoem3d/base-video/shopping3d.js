/*
  Cenário 3D — corredor de shopping à noite (Three.js r147, scripts clássicos).
  Lojas acesas (café, lanchonete, loja de móveis), lojas fechadas, piso de azulejo
  com reflexo, vasos de planta, luz quente das vitrines e sombra azulada.

  Uso:
    const cena = Shopping3D.criar(canvas, { largura: 1080, altura: 1920 });
    cena.desenhar(t)            // desenha o quadro do tempo t (puro: mesmo t, mesma imagem)
    cena.projetar(x, y, z)      // ponto do mundo -> { x, y, ppm (pixels por metro), dist }
    cena.sombra(x, z, rx, rz)   // sombra suave no chão (para personagens e objetos 2D)
    cena.camera.quadro = (t) => ({ pos: [x,y,z], alvo: [x,y,z], fov })   // caminho da câmera
*/
(function (global) {
  'use strict';
  const THREE = global.THREE;

  // pseudo-aleatório fixo
  let semente = 3;
  const rnd = () => { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; };

  const texturasDeTexto = [];
  function texCanvas(w, h, desenha, comTexto) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    desenha(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    if (comTexto) texturasDeTexto.push(() => { g.clearRect(0, 0, w, h); desenha(g, w, h); t.needsUpdate = true; });
    return t;
  }
  const FONTE = "'Baloo 2', system-ui, sans-serif";

  function criar(canvas, opts = {}) {
    const W = opts.largura || 1080, H = opts.altura || 1920;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.outputEncoding = THREE.LinearEncoding; // a última passada faz tom + gama
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const NOITE = new THREE.Color('#0b0f30');
    scene.background = NOITE;
    scene.fog = new THREE.Fog(NOITE, 12, 44);
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 140);

    const CORR = 3.3;   // meia largura do corredor
    const TETO = 6.2;
    const FUNDO = -42;

    // ---------- materiais ----------
    // Lambert/Phong funcionam em qualquer WebGL (inclusive no painel de prévia do app)
    const M = (cor, extra = {}) => {
      const p = { color: cor };
      for (const k of ['emissive', 'emissiveIntensity', 'map', 'transparent', 'opacity', 'depthWrite']) if (k in extra) p[k] = extra[k];
      if (extra.brilho) return new THREE.MeshPhongMaterial(Object.assign(p, { shininess: extra.brilho, specular: new THREE.Color(extra.especular || '#3a3a58') }));
      return new THREE.MeshLambertMaterial(p);
    };
    const facetado = (geo) => { const g = geo.index ? geo.toNonIndexed() : geo; g.computeVertexNormals(); return g; };
    const B = (cor, intens = 1, extra = {}) => { const m = new THREE.MeshBasicMaterial(Object.assign({ color: cor }, extra)); m.color.multiplyScalar(intens); return m; };
    const caixa = (w, h, d, mat, x, y, z, pai) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
      (pai || scene).add(m); return m;
    };
    const cilindro = (rt, rb, h, mat, x, y, z, pai, seg = 24) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
      (pai || scene).add(m); return m;
    };
    const plano = (w, h, mat, pai) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); (pai || scene).add(m); return m; };

    // textura de brilho redondo (manchas de luz no chão, sombras)
    const radial = (cor) => texCanvas(256, 256, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, cor); gr.addColorStop(0.55, cor.replace(/[\d.]+\)$/, '0.45)')); gr.addColorStop(1, cor.replace(/[\d.]+\)$/, '0)'));
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    const TEX_LUZ = radial('rgba(255,255,255,1)');
    const TEX_SOMBRA = radial('rgba(0,0,0,1)');

    // ---------- piso de azulejo com reflexo ----------
    const texPiso = texCanvas(1024, 1024, (g, w) => {
      const n = 2, s = w / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        g.fillStyle = (i + j) % 2 ? '#8a84ad' : '#7a7499';
        g.fillRect(i * s, j * s, s, s);
        for (let k = 0; k < 260; k++) { // pintinhas do granito
          g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '70,60,110'},${0.06 + rnd() * 0.08})`;
          g.fillRect(i * s + rnd() * s, j * s + rnd() * s, 2 + rnd() * 3, 2 + rnd() * 3);
        }
      }
      g.strokeStyle = '#4b4568'; g.lineWidth = 7;
      for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, w); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
    });
    texPiso.wrapS = texPiso.wrapT = THREE.RepeatWrapping;
    const COMPR = 70, Z0 = 12;
    texPiso.repeat.set((CORR * 2) / 1.6, COMPR / 1.6);
    const espelho = new THREE.Reflector(new THREE.PlaneGeometry(CORR * 2, COMPR), {
      textureWidth: W / 2, textureHeight: H / 2, color: 0x76739c, clipBias: 0.003,
    });
    espelho.rotation.x = -Math.PI / 2;
    espelho.position.set(0, -0.004, Z0 - COMPR / 2);
    scene.add(espelho);
    const piso = plano(CORR * 2, COMPR, M('#ffffff', { map: texPiso, brilho: 45, especular: '#55557e', transparent: true, opacity: 0.7 }));
    piso.rotation.x = -Math.PI / 2;
    piso.position.set(0, 0, Z0 - COMPR / 2);
    piso.receiveShadow = true;

    // ---------- teto com claraboia ----------
    const teto = plano(CORR * 2 + 2, COMPR, M('#161a3c'));
    teto.rotation.x = Math.PI / 2; teto.position.set(0, TETO, Z0 - COMPR / 2);
    const clarab = plano(2.2, COMPR, B('#2f4bb0', 1.0));
    clarab.rotation.x = Math.PI / 2; clarab.position.set(0, TETO - 0.02, Z0 - COMPR / 2);
    for (let z = Z0 - 2; z > FUNDO; z -= 3.2) {
      for (const x of [-2.2, 2.2]) {
        const spot = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), B('#dfe8ff', 1.05));
        spot.rotation.x = Math.PI / 2; spot.position.set(x, TETO - 0.03, z); scene.add(spot);
      }
    }
    // vigas da claraboia
    for (let z = Z0 - 1; z > FUNDO; z -= 2.4) caixa(2.4, 0.12, 0.12, M('#2a2f5c'), 0, TETO - 0.08, z);

    // ---------- parede do fundo: vidraça com céu de noite ----------
    const texCeu = texCanvas(1024, 1024, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#0b1150'); gr.addColorStop(0.6, '#2a2a86'); gr.addColorStop(1, '#5a3f9e');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; const r = rnd() * 2.2 + 0.6; g.beginPath(); g.arc(rnd() * w, rnd() * h * 0.7, r, 0, 7); g.fill(); }
      const lx = w * 0.7, ly = h * 0.26;
      const halo = g.createRadialGradient(lx, ly, 20, lx, ly, 220);
      halo.addColorStop(0, 'rgba(220,230,255,.7)'); halo.addColorStop(1, 'rgba(220,230,255,0)');
      g.fillStyle = halo; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f4f2ff'; g.beginPath(); g.arc(lx, ly, 64, 0, 7); g.fill();
      g.fillStyle = 'rgba(160,170,220,.5)'; g.beginPath(); g.arc(lx - 18, ly + 10, 14, 0, 7); g.arc(lx + 20, ly - 18, 9, 0, 7); g.fill();
      g.fillStyle = '#120d33'; // prédios
      for (let x = 0; x < w;) { const bw = 50 + rnd() * 90, bh = 80 + rnd() * 240; g.fillRect(x, h - bh, bw, bh); for (let k = 0; k < 6; k++) { g.fillStyle = rnd() > 0.5 ? '#ffd27a' : '#120d33'; g.fillRect(x + 8 + rnd() * (bw - 20), h - bh + 12 + rnd() * (bh - 30), 8, 10); } g.fillStyle = '#120d33'; x += bw + 6; }
    });
    const ceu = plano(CORR * 2, TETO, B('#ffffff', 1.0, { map: texCeu, fog: false }));
    ceu.position.set(0, TETO / 2, FUNDO);
    for (let x = -CORR; x <= CORR + 0.01; x += CORR * 2 / 4) caixa(0.12, TETO, 0.12, M('#20244a'), x, TETO / 2, FUNDO + 0.05);
    caixa(CORR * 2, 0.12, 0.12, M('#20244a'), 0, TETO * 0.55, FUNDO + 0.05);

    // ---------- luzes gerais (azuladas) ----------
    scene.add(new THREE.HemisphereLight('#6476f0', '#181334', 0.26));
    const lua = new THREE.DirectionalLight('#9fb4ff', 0.36);
    lua.position.set(-3, 14, 4); lua.target.position.set(0, 0, -6);
    lua.castShadow = true;
    lua.shadow.mapSize.set(2048, 2048);
    Object.assign(lua.shadow.camera, { left: -9, right: 9, top: 12, bottom: -12, near: 1, far: 40 });
    lua.shadow.bias = -0.0006;
    lua.shadow.radius = 5;
    scene.add(lua, lua.target);
    const palco = new THREE.SpotLight('#c9d3ff', 0.75, 14, 0.6, 0.95, 1.5);
    palco.position.set(0, 6.0, 1.2); palco.target.position.set(0, 0, -0.2);
    scene.add(palco, palco.target);

    // ---------- letreiros ----------
    function letreiro(texto, cor, corFundo, icone) {
      return texCanvas(1024, 256, (g, w, h) => {
        g.fillStyle = corFundo; g.fillRect(0, 0, w, h);
        g.font = `800 150px ${FONTE}`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        const larg = Math.min(g.measureText(texto).width, w - 200);
        const x0 = icone ? w / 2 + 60 : w / 2;
        g.shadowColor = cor; g.shadowBlur = 36;
        g.fillStyle = cor;
        g.save(); g.translate(x0, h / 2 + 12); const esc = Math.min(1, (w - 230) / g.measureText(texto).width); g.scale(esc, 1);
        g.fillText(texto, 0, 0); g.shadowBlur = 0; g.fillStyle = '#fff8ec'; g.globalAlpha = 0.55; g.fillText(texto, 0, 0); g.restore();
        g.globalAlpha = 1;
        if (icone) { g.save(); g.translate(x0 - (larg * Math.min(1, (w - 230) / larg)) / 2 - 90, h / 2 + 6); g.shadowColor = cor; g.shadowBlur = 30; icone(g, cor); g.restore(); }
      }, true);
    }
    const iconeXicara = (g, cor) => {
      g.strokeStyle = cor; g.lineWidth = 12; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-50, -20); g.lineTo(-40, 50); g.lineTo(30, 50); g.lineTo(40, -20); g.closePath(); g.stroke();
      g.beginPath(); g.arc(52, 8, 22, -1.4, 1.4); g.stroke();
      for (const x of [-22, 0, 22]) { g.beginPath(); g.moveTo(x, -40); g.quadraticCurveTo(x + 12, -55, x, -72); g.stroke(); }
    };
    const iconeLanche = (g, cor) => {
      g.strokeStyle = cor; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-58, -6); g.quadraticCurveTo(0, -78, 58, -6); g.closePath(); g.stroke();
      g.beginPath(); g.moveTo(-62, 14); g.lineTo(62, 14); g.stroke();
      g.beginPath(); g.moveTo(-56, 34); g.lineTo(56, 34); g.quadraticCurveTo(56, 56, 30, 56); g.lineTo(-30, 56); g.quadraticCurveTo(-56, 56, -56, 34); g.stroke();
    };
    const iconeSofa = (g, cor) => {
      g.strokeStyle = cor; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-60, 40); g.lineTo(-60, -10); g.quadraticCurveTo(-60, -40, -30, -40); g.lineTo(30, -40); g.quadraticCurveTo(60, -40, 60, -10); g.lineTo(60, 40); g.stroke();
      g.beginPath(); g.moveTo(-60, 10); g.lineTo(60, 10); g.stroke();
      g.beginPath(); g.moveTo(-48, 40); g.lineTo(-48, 58); g.moveTo(48, 40); g.lineTo(48, 58); g.stroke();
    };

    // ---------- lojas ----------
    const luzesLojas = [];
    function loja(lado, zc, tipo, nome) {
      const g = new THREE.Group();
      g.position.set(lado * CORR, 0, zc);
      g.rotation.y = lado < 0 ? Math.PI / 2 : -Math.PI / 2;
      scene.add(g);
      const LARG = 6, ALT_V = 3.3, PROF = 4.2;
      const paredeEsc = M('#1f2347');
      // pilares e faixa de cima
      caixa(0.7, TETO, 0.7, M('#353b72'), -LARG / 2, TETO / 2, 0.1, g);
      caixa(0.7, TETO, 0.7, M('#353b72'), LARG / 2, TETO / 2, 0.1, g);
      caixa(0.74, 0.25, 0.74, M('#7d86c6'), -LARG / 2, 0.12, 0.1, g);
      caixa(0.74, 0.25, 0.74, M('#7d86c6'), LARG / 2, 0.12, 0.1, g);
      caixa(LARG, TETO - ALT_V, 0.3, paredeEsc, 0, ALT_V + (TETO - ALT_V) / 2, -0.1, g);
      // filete de neon azul em cima
      caixa(LARG, 0.06, 0.06, B('#7fb2ff', 2.2), 0, TETO - 0.55, 0.12, g);
      const acesa = tipo !== 'fechada';
      // letreiro
      const L = { cafe: ['CAFÉ', '#ffb35c', iconeXicara], lanchonete: ['LANCHONETE', '#ffd84a', iconeLanche], moveis: ['MÓVEIS', '#5ef0d0', iconeSofa] }[tipo];
      const placa = plano(4.4, 1.1, acesa
        ? B('#ffffff', 1.25, { map: letreiro(L[0], L[1], '#15142e', L[2]) })
        : M('#ffffff', { map: letreiro(nome || 'LOJA', '#6f74a6', '#191a35'), roughness: 0.6 }), g);
      placa.position.set(0, ALT_V + 0.95, 0.07);
      caixa(4.6, 1.3, 0.08, M('#121330'), 0, ALT_V + 0.95, 0.02, g);
      // base da vitrine
      caixa(LARG - 0.7, 0.35, 0.25, M('#2b2f5a'), 0, 0.175, 0.0, g);
      if (!acesa) {
        // porta de enrolar baixada
        const texGrade = texCanvas(256, 512, (c, w, h) => {
          c.fillStyle = '#454c7c'; c.fillRect(0, 0, w, h);
          for (let y = 0; y < h; y += 16) { c.fillStyle = '#2c3160'; c.fillRect(0, y, w, 4); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, y + 5, w, 2); }
        });
        texGrade.wrapS = texGrade.wrapT = THREE.RepeatWrapping; texGrade.repeat.set(3, 2);
        const grade = plano(LARG - 0.7, ALT_V - 0.35, M('#ffffff', { map: texGrade, brilho: 25 }), g);
        grade.position.set(0, 0.35 + (ALT_V - 0.35) / 2, 0.02); grade.receiveShadow = true;
        caixa(LARG - 0.7, 0.18, 0.3, M('#2b2f5a'), 0, ALT_V - 0.05, 0.02, g);
        return g;
      }
      // interior iluminado
      const corParede = { cafe: '#d9945a', lanchonete: '#e8a85a', moveis: '#d99a62' }[tipo];
      const piso2 = { cafe: '#8a5a3c', lanchonete: '#c84b3c', moveis: '#9f7652' }[tipo];
      const mInt = M(corParede, { emissive: '#ff8a30', emissiveIntensity: 0.16 });
      caixa(LARG - 0.7, ALT_V, 0.1, mInt, 0, ALT_V / 2, -PROF, g);                          // fundo
      caixa(0.1, ALT_V, PROF, mInt, -(LARG - 0.7) / 2, ALT_V / 2, -PROF / 2, g);           // lados
      caixa(0.1, ALT_V, PROF, mInt, (LARG - 0.7) / 2, ALT_V / 2, -PROF / 2, g);
      caixa(LARG - 0.7, 0.05, PROF, M(piso2, { emissive: '#ff8a3a', emissiveIntensity: 0.12 }), 0, 0.02, -PROF / 2, g);
      caixa(LARG - 0.7, 0.1, PROF, M('#e8b47a', { emissive: '#ffb45a', emissiveIntensity: 0.45 }), 0, ALT_V, -PROF / 2, g);
      // vidro e caixilhos
      const vidro = plano(LARG - 0.7, ALT_V - 0.35, new THREE.MeshPhongMaterial({ color: '#a9c6ff', transparent: true, opacity: 0.1, shininess: 90, specular: new THREE.Color('#ffffff'), depthWrite: false }), g);
      vidro.position.set(0, 0.35 + (ALT_V - 0.35) / 2, 0.03);
      for (const x of [-1.2, 1.2]) caixa(0.07, ALT_V - 0.35, 0.07, M('#1e2147'), x, 0.35 + (ALT_V - 0.35) / 2, 0.04, g);
      caixa(LARG - 0.7, 0.08, 0.08, M('#1e2147'), 0, ALT_V - 0.02, 0.04, g);
      // luz quente: dentro e derramando no corredor
      const dentro = new THREE.PointLight('#ff9e45', 1.3, 9, 2); dentro.position.set(0, 2.6, -1.6); g.add(dentro);
      const fora = new THREE.PointLight('#ff9438', 1.8, 9, 2); fora.position.set(0, 1.4, 1.6); g.add(fora);
      luzesLojas.push(dentro, fora);
      const mancha = plano(6.2, 5.2, new THREE.MeshBasicMaterial({ map: TEX_LUZ, color: new THREE.Color('#ff8a2e').multiplyScalar(0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), g);
      mancha.rotation.x = -Math.PI / 2; mancha.position.set(0, 0.012, 1.7);
      // brilho atrás do vidro (para o bloom)
      const brilho = plano(LARG - 1.2, ALT_V - 0.9, new THREE.MeshBasicMaterial({ map: TEX_LUZ, color: new THREE.Color('#ff9a40').multiplyScalar(0.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), g);
      brilho.position.set(0, 1.8, -0.15);

      if (tipo === 'cafe') {
        caixa(3.2, 1.05, 0.7, M('#6b3f26'), 0.4, 0.53, -2.9, g);
        caixa(3.3, 0.08, 0.8, M('#e3c49c'), 0.4, 1.08, -2.9, g);
        caixa(0.55, 0.55, 0.45, M('#c9ccd8', { brilho: 60 }), 1.2, 1.4, -2.95, g);
        caixa(2.2, 0.9, 0.06, B('#2b4a35', 1.0), -0.6, 2.35, -4.12, g);
        for (const x of [-1.6, -0.2, 1.2]) {
          cilindro(0.01, 0.01, 0.6, M('#222'), x, 2.95, -2.2, g);
          const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 12), B('#ffd08a', 2.4)); lamp.position.set(x, 2.6, -2.2); g.add(lamp);
        }
        for (const x of [-1.7, 1.6]) {
          cilindro(0.42, 0.42, 0.05, M('#f1e4d0'), x, 0.78, -1.0, g);
          cilindro(0.05, 0.05, 0.75, M('#3a2a20'), x, 0.39, -1.0, g);
          caixa(0.4, 0.5, 0.4, M('#c2593a'), x - 0.6, 0.3, -1.0, g);
          caixa(0.4, 0.5, 0.4, M('#c2593a'), x + 0.6, 0.3, -1.0, g);
        }
      }
      if (tipo === 'lanchonete') {
        const texBalcao = texCanvas(256, 64, (c, w, h) => { for (let x = 0; x < w; x += 32) { c.fillStyle = (x / 32) % 2 ? '#ffffff' : '#e8463a'; c.fillRect(x, 0, 32, h); } });
        texBalcao.wrapS = THREE.RepeatWrapping; texBalcao.repeat.set(4, 1);
        caixa(4.2, 1.05, 0.7, M('#ffffff', { map: texBalcao }), 0, 0.53, -2.6, g);
        caixa(4.3, 0.08, 0.8, M('#ffd84a'), 0, 1.08, -2.6, g);
        const texMenu = texCanvas(512, 160, (c, w, h) => {
          c.fillStyle = '#1b1a2e'; c.fillRect(0, 0, w, h);
          ['#ffd84a', '#ff7a4a', '#7ee081'].forEach((cor, i) => { c.fillStyle = cor; c.beginPath(); c.arc(90 + i * 165, 70, 42, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillRect(50 + i * 165, 124, 80, 12); });
        });
        const menu = plano(3.6, 1.1, B('#ffffff', 1.3, { map: texMenu }), g); menu.position.set(0, 2.35, -4.12);
        for (const x of [-1.5, -0.5, 0.5, 1.5]) { cilindro(0.22, 0.22, 0.08, M('#e8463a'), x, 0.75, -1.9, g); cilindro(0.04, 0.04, 0.72, M('#cfd3e0', { brilho: 60 }), x, 0.36, -1.9, g); }
      }
      if (tipo === 'moveis') {
        // sofá
        const mSofa = M('#2fb3a0');
        caixa(2.2, 0.45, 0.9, mSofa, -0.7, 0.35, -2.6, g);
        caixa(2.2, 0.7, 0.25, mSofa, -0.7, 0.75, -3.0, g);
        caixa(0.25, 0.6, 0.9, mSofa, -1.9, 0.5, -2.6, g);
        caixa(0.25, 0.6, 0.9, mSofa, 0.5, 0.5, -2.6, g);
        // abajur
        cilindro(0.03, 0.03, 1.5, M('#2b2b33'), 1.5, 0.75, -3.2, g);
        const cupula = cilindro(0.18, 0.32, 0.35, B('#ffe0a0', 1.8), 1.5, 1.6, -3.2, g); cupula.castShadow = false;
        // estante
        caixa(1.4, 2.0, 0.35, M('#b07a4f'), 1.4, 1.0, -3.95, g);
        for (const y of [0.6, 1.2, 1.8]) caixa(1.3, 0.05, 0.36, M('#8a5a36'), 1.4, y, -3.9, g);
        caixa(0.3, 0.35, 0.25, M('#e8463a'), 1.0, 0.8, -3.85, g); caixa(0.25, 0.3, 0.25, M('#ffd84a'), 1.7, 1.4, -3.85, g);
        // tapete
        const tap = plano(2.6, 1.6, M('#e9a65a'), g); tap.rotation.x = -Math.PI / 2; tap.position.set(-0.6, 0.06, -1.9);
        // quadro
        caixa(1.0, 0.7, 0.05, B('#6fd6ff', 1.0), -0.7, 2.2, -4.12, g);
      }
      return g;
    }
    // lado esquerdo e direito do corredor
    loja(-1, 4.5, 'fechada', 'PERFUMES');
    loja(-1, -2.5, 'fechada', 'MODA');
    loja(-1, -9.5, 'cafe');
    loja(-1, -16.5, 'moveis');
    loja(-1, -23.5, 'fechada', 'ÓTICA');
    loja(-1, -30.5, 'fechada', 'LIVROS');
    loja(-1, -37.5, 'fechada', 'SAPATOS');
    loja(1, 3.5, 'fechada', 'JOIAS');
    loja(1, -3.5, 'fechada', 'BRINQUEDOS');
    loja(1, -10.5, 'lanchonete');
    loja(1, -17.5, 'fechada', 'ESPORTES');
    loja(1, -24.5, 'fechada', 'GAMES');
    loja(1, -31.5, 'fechada', 'BOLSAS');
    loja(1, -38.5, 'fechada', 'RELÓGIOS');

    // ---------- vasos de planta ----------
    const verdes = ['#3fae55', '#2f8f47', '#5cc463', '#279048'];
    function vaso(x, z, alto = 1) {
      const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      cilindro(0.46, 0.36, 0.8, M('#eae6f5', { brilho: 20 }), 0, 0.4, 0, g, 28);
      cilindro(0.5, 0.5, 0.08, M('#cfc9e4', { brilho: 20 }), 0, 0.82, 0, g, 28);
      cilindro(0.42, 0.42, 0.04, M('#3b2a22'), 0, 0.83, 0, g, 24);
      const n = 9;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rnd();
        const r = 0.12 + rnd() * 0.22, y = 1.1 + rnd() * 0.9 * alto;
        const folha = new THREE.Mesh(facetado(new THREE.IcosahedronGeometry(0.28 + rnd() * 0.18, 0)), M(verdes[i % 4]));
        folha.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        folha.scale.set(1, 1.3 + rnd() * 0.5, 1);
        folha.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
        folha.castShadow = true; g.add(folha);
      }
      for (let i = 0; i < 6; i++) { // folhas compridas
        const a = (i / 6) * Math.PI * 2;
        const f = new THREE.Mesh(facetado(new THREE.ConeGeometry(0.09, 1.1 * alto, 5)), M(verdes[(i + 1) % 4]));
        f.position.set(Math.cos(a) * 0.18, 1.35 + 0.3 * alto, Math.sin(a) * 0.18);
        f.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
        f.castShadow = true; g.add(f);
      }
      return g;
    }
    vaso(-2.55, 0.9, 1.1); vaso(2.6, -0.4, 1.0);
    vaso(-2.55, -6.2, 1.2); vaso(2.6, -7.0, 1.0);
    vaso(-2.55, -13.2); vaso(2.6, -14.0, 1.1);
    vaso(-2.55, -20.2); vaso(2.6, -21.0);
    vaso(-2.55, -27.2); vaso(2.6, -28.0);
    // banco
    function banco(x, z) {
      const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      caixa(0.5, 0.08, 1.8, M('#b8834f'), 0, 0.48, 0, g);
      caixa(0.08, 0.5, 1.8, M('#b8834f'), x < 0 ? -0.24 : 0.24, 0.78, 0, g);
      for (const zz of [-0.75, 0.75]) caixa(0.45, 0.46, 0.07, M('#2b2f4a', { brilho: 40 }), 0, 0.23, zz, g);
    }
    banco(2.75, -11.0);
    banco(-2.75, -18.0);

    // ---------- sombras suaves (para os 2D) ----------
    function sombra(x, z, rx = 0.45, rz = 0.22, opacidade = 0.62) {
      const m = plano(1, 1, new THREE.MeshBasicMaterial({ map: TEX_SOMBRA, color: '#05061c', transparent: true, opacity: opacidade, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, 0.015, z); m.scale.set(rx * 2, rz * 2, 1);
      m.renderOrder = 2;
      m.userData.base = { rx, rz, opacidade };
      return m;
    }

    // ---------- pós-processamento: brilho + tom + gama ----------
    const gl2 = renderer.capabilities.isWebGL2;
    const alvo = new THREE.WebGLRenderTarget(W, H, gl2 ? { type: THREE.HalfFloatType, samples: 4 } : {});
    const composer = new THREE.EffectComposer(renderer, alvo);
    composer.setPixelRatio(1);
    composer.setSize(W, H);
    composer.addPass(new THREE.RenderPass(scene, camera));
    const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.55, 0.5, 0.9);
    composer.addPass(bloom);
    composer.addPass(new THREE.ShaderPass({
      uniforms: { tDiffuse: { value: null }, exposicao: { value: 0.92 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float exposicao; varying vec2 vUv;
        vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb * exposicao;
          c = aces(c);
          c = pow(c, vec3(1.0/2.2));
          vec2 p = vUv - 0.5; p.x *= 0.75;
          float v = smoothstep(0.78, 0.2, length(p));
          c *= mix(0.62, 1.0, v);
          c = mix(c, c * vec3(0.92, 0.96, 1.08), 0.5);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));

    // ---------- câmera ----------
    const cam = {
      quadro: () => ({ pos: [0, 1.8, 4], alvo: [0, 1.2, -3], fov: 52 }),
    };
    const vAlvo = new THREE.Vector3();
    function posicionarCamera(t) {
      const q = cam.quadro(t);
      camera.position.set(q.pos[0], q.pos[1], q.pos[2]);
      vAlvo.set(q.alvo[0], q.alvo[1], q.alvo[2]);
      camera.lookAt(vAlvo);
      if (q.fov && q.fov !== camera.fov) { camera.fov = q.fov; camera.updateProjectionMatrix(); }
      camera.updateMatrixWorld();
    }
    const vp = new THREE.Vector3(), vq = new THREE.Vector3();
    function projetar(x, y, z) {
      vp.set(x, y, z).project(camera);
      vq.set(x, y + 1, z).project(camera);
      const sx = (vp.x * 0.5 + 0.5) * W, sy = (-vp.y * 0.5 + 0.5) * H;
      const sy1 = (-vq.y * 0.5 + 0.5) * H;
      return { x: sx, y: sy, ppm: sy - sy1, dist: camera.position.distanceTo(vq.set(x, y, z)) };
    }

    let tAtual = -1;
    function desenhar(t) {
      tAtual = t;
      posicionarCamera(t);
      if (cena.antes) cena.antes(t);
      composer.render();
    }
    function fontesProntas() { texturasDeTexto.forEach((f) => f()); }

    const cena = { scene, camera, cam, renderer, desenhar, projetar, sombra, fontesProntas, THREE, get t() { return tAtual; } };
    return cena;
  }

  global.Shopping3D = { criar };
})(window);
