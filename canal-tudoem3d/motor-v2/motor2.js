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
    for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: nuvemTex, fog: false, depthWrite: false, toneMapped: false }));
      const a = -Math.PI / 2 + (rnd() - 0.5) * 2.6, r = 380 + rnd() * 200; s.position.set(Math.cos(a) * r, 90 + rnd() * 120, Math.sin(a) * r); const k = 60 + rnd() * 70; s.scale.set(k * 2, k, 1); scene.add(s); }

    // luz: sol quente com sombra + céu/chão
    const sol = new THREE.DirectionalLight('#fff1dc', 3.2);
    sol.castShadow = true; sol.shadow.mapSize.set(4096, 4096); sol.shadow.bias = -0.0003; sol.shadow.normalBias = 0.02;
    Object.assign(sol.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 160 });
    scene.add(sol, sol.target);
    scene.add(new THREE.HemisphereLight('#bcd6ff', '#a5714a', 0.9));
    const DIR_SOL = new THREE.Vector3(-0.6, 0.75, 0.35).normalize();

    // chão (grama) e calçadas
    const M = (cor, rough = 0.85, metal = 0) => new THREE.MeshStandardMaterial({ color: cor, roughness: rough, metalness: metal });
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), M('#7fb85a', 0.95)); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; scene.add(chao);
    const calc = (x, w) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, 400), M('#d8d2c8', 0.9)); m.position.set(x, 0.09, -150); m.receiveShadow = true; scene.add(m); };
    calc(-6.2, 3.2); calc(6.2, 3.2);

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

    // rua: peças de asfalto ao longo de z
    for (let z = 20; z > -200; z -= 9) peca('city-kit-roads/road-straight', { larg: 9 }, 0, 0.02, z, Math.PI / 2);
    // casas dos dois lados (subúrbio) e prédios ao fundo
    const casas = ['building-type-a', 'building-type-b', 'building-type-d', 'building-type-f', 'building-type-n', 'building-type-t'];
    let i = 0;
    for (let z = 6; z > -120; z -= 14) {
      for (const lado of [-1, 1]) {
        const nome = casas[i++ % casas.length];
        peca('city-kit-suburban/' + nome, { alt: 8 }, lado * 13.5, 0.18, z, lado < 0 ? Math.PI / 2 : -Math.PI / 2);
        peca('city-kit-suburban/fence-1x3', { larg: 6 }, lado * 9.4, 0, z + 3, lado < 0 ? Math.PI / 2 : -Math.PI / 2);
        peca('nature-kit/tree_oak', { alt: 7 + rnd() * 2 }, lado * (8.6 + rnd()), 0, z - 5 + rnd() * 2, rnd() * 6);
        peca('nature-kit/plant_bushDetailed', { larg: 1.6 }, lado * 9.0, 0, z + 0.5, rnd() * 6);
        if (i % 3 === 0) peca('city-kit-roads/light-curved', { alt: 6 }, lado * 5.2, 0, z - 7, lado < 0 ? 0 : Math.PI);
      }
    }
    for (let k = 0; k < 9; k++) peca('city-kit-commercial/building-skyscraper-' + (k % 2 ? 'b' : 'd'), { alt: 40 + rnd() * 30 }, -60 + k * 15, 0, -230 - rnd() * 30, rnd() * 3);
    // carros
    peca('car-kit/suv-luxury', { comp: 4.8 }, -2.3, 0, -6, Math.PI);
    peca('car-kit/taxi', { comp: 4.6 }, 2.3, 0, -18, 0);
    peca('car-kit/sedan', { comp: 4.5 }, -2.3, 0, -30, Math.PI);
    peca('car-kit/police', { comp: 4.8 }, 2.3, 0, -44, 0.08);
    // flores na frente
    for (let k = 0; k < 14; k++) peca('nature-kit/flower_' + (k % 2 ? 'redA' : 'yellowA'), { alt: 0.5 }, -8 + rnd() * 1.5, 0.18, 2 - k * 0.6, rnd() * 6);

    // sombra 2D (personagens)
    const texSombra = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.6, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
    function sombra(x, z, rx = 0.45, rz = 0.22, opacidade = 0.5) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texSombra, color: '#2a1a10', transparent: true, opacity: opacidade, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, 0.2, z); m.scale.set(rx * 2, rz * 2, 1); m.renderOrder = 2; m.userData.base = { rx, rz, opacidade }; scene.add(m); return m;
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
    function desenhar(t) { tAtual = t; posicionar(t); grade.uniforms.t.value = t % 10; if (cena.antes) cena.antes(t); composer.render(); }

    const cena = { scene, camera, cam, renderer, desenhar, projetar, sombra, fontesProntas() {}, THREE, peca, get t() { return tAtual; } };
    cena.pronto = Promise.all(carregando);
    return cena;
  }
  global.Motor2 = { criar };
})(window);
