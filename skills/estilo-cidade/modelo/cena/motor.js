// MOTOR dos vídeos "Nesta cidade". Igual em todo episódio: renderizador, céus, luz por período,
// raios de sol, cidade, atores, planos de câmera, sombra por plano, brilho, legenda e filme antigo.
// O que muda a cada vídeo (elenco, planos, períodos) fica em episodio.js.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { montarCidade } from "./cidade.js";
import { redesenharPlacas, sorteio } from "./texturas.js";
import { em, MT, materiaisDeLuz, poste } from "./kit.js";
import { DURACAO, BLOCOS, LEGENDA } from "./tempos.js";

export { THREE, DURACAO, BLOCOS, LEGENDA };
export const L = 1080, A = 1920, CHAO = 0.15;
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- tempos da narração (vêm de tempos.js, gerado pelo alinhar.py) ----------
export const B = (n) => BLOCOS[n - 1]; // bloco n do roteiro: { n, ini, fim }
export const palavrasDo = (n) => LEGENDA.filter((l) => l.bloco === n);
export const aos = (n, w = 0) => (w === 0 ? B(n).ini : palavrasDo(n)[w].t0 - 0.06); // começo do bloco n, ou da palavra w dele
export const dentro = (t, a, b) => t >= a && t < b;
export const falando = (t, a = "fala", b = "neutro", f = 7.5) => (Math.floor(t * f) % 2 ? a : b); // boca mexendo
export const virarPara = (x, z, alvo) => Math.atan2(alvo.x - x, alvo.z - z);

// ---------- luz de cada período (mude as cores aqui) ----------
export const LUZES = {
  dia: { ceu: "dia", fog: ["#f0d9bd", 140, 430], hemi: ["#cfe5ff", "#8a6a48", 0.72], sol: ["#ffd29a", 3.7, [-70, 52, 34]], rebate: 0.35, lamp: 1, janela: ["#3a5f86", 0.18], nuvem: ["#ffffff", "#fff1df", 0.35], bloom: 0.42, exp: 1.05, pontos: 0, estrelas: false },
  noite: { ceu: "noite", fog: ["#0f1530", 50, 260], hemi: ["#5b7cc8", "#14141f", 0.2], sol: ["#8fa8ff", 0.55, [40, 60, -30]], rebate: 0.06, lamp: 2.8, janela: ["#ffb24f", 1.3], nuvem: ["#2a3460", "#0f1530", 0.15], bloom: 0.9, exp: 1.0, pontos: 1.6, estrelas: true },
  sepia: { ceu: "dia", fog: ["#f0d9bd", 140, 430], hemi: ["#ffffff", "#8a6a48", 1.05], sol: ["#ffe2b8", 3.4, [-40, 60, 60]], rebate: 0.45, lamp: 0.5, janela: ["#3a5f86", 0.18], nuvem: ["#ffffff", "#fff1df", 0.35], bloom: 0.25, exp: 1.12, pontos: 0, estrelas: false },
  entardecer: { ceu: "entardecer", fog: ["#e8a987", 120, 420], hemi: ["#ffc6a0", "#5c4234", 0.6], sol: ["#ff9248", 3.4, [-80, 20, 40]], rebate: 0.22, lamp: 1.5, janela: ["#ffb24f", 0.45], nuvem: ["#ffd8bc", "#ff9a6a", 0.5], bloom: 0.6, exp: 1.02, pontos: 0.35, estrelas: false },
};

// periodo(t) -> nome do período; luzDoPeriodo(nome) -> chave de LUZES; filmeAntigo(nome) -> true liga a sépia
export function criarMotor({ periodo, luzDoPeriodo = (p) => p, filmeAntigo = () => false }) {
  const tl = window.__timelines.main;
  const canvas = document.getElementById("cena");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.setSize(L, A, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, L / A, 0.1, 900);

  // ---------- céus ----------
  function ceu(paradas) {
    const c = document.createElement("canvas");
    c.width = 8;
    c.height = 512;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    for (const [p, cor] of paradas) g.addColorStop(p, cor);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 512);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const CEUS = {
    dia: ceu([[0, "#4f93dd"], [0.45, "#8cc2ef"], [0.75, "#f6d6b0"], [1, "#ffc78f"]]),
    noite: ceu([[0, "#070d22"], [0.5, "#142250"], [0.8, "#2c3570"], [1, "#4a4475"]]),
    entardecer: ceu([[0, "#34508f"], [0.4, "#b8769a"], [0.7, "#f29a68"], [1, "#ffc06a"]]),
  };

  // ---------- luz ----------
  const ceuLuz = new THREE.HemisphereLight("#cfe5ff", "#8a6a48", 0.72);
  cena.add(ceuLuz);
  const sol = new THREE.DirectionalLight("#ffd29a", 3.7);
  sol.castShadow = true;
  sol.shadow.mapSize.set(4096, 4096);
  sol.shadow.bias = -0.0006;
  sol.shadow.normalBias = 0.035;
  cena.add(sol, sol.target);
  const rebate = new THREE.DirectionalLight("#a9c8ff", 0.35);
  rebate.position.set(60, 30, -40);
  cena.add(rebate);


  // ---------- cidade ----------
  const info = montarCidade();
  cena.add(info.cidade);
  const { nuvemMat } = info;
  const pontos = []; // luzes de poste: acendem conforme LUZES[...].pontos
  function pontoDeLuz(x, y, z, forca = 60, alcance = 16, corHex = "#ffc77a") {
    const l = new THREE.PointLight(corHex, 0, alcance, 2);
    l.position.set(x, y, z);
    cena.add(l);
    pontos.push({ l, forca });
    return l;
  }
  // um poste a mais com luz de verdade (para iluminar uma cena à noite)
  function posteExtra(x, z, forca = 60, alcance = 16) {
    cena.add(em(poste(), x, CHAO, z));
    return pontoDeLuz(x, 6.1, z, forca, alcance);
  }
  pontoDeLuz(0, 4.6, 0, 90, 22, "#ffcf8a"); // lustre do coreto
  // estrelas
  const estrelas = new THREE.Points(
    (() => {
      const g = new THREE.BufferGeometry(), r = sorteio(7), p = [];
      for (let i = 0; i < 900; i++) {
        const a = r() * Math.PI * 2, e = 0.08 + r() * 1.3, d = 380;
        p.push(Math.cos(a) * Math.cos(e) * d, Math.sin(e) * d, Math.sin(a) * Math.cos(e) * d);
      }
      g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
      return g;
    })(),
    new THREE.PointsMaterial({ color: "#fff7e0", size: 1.6, sizeAttenuation: false, fog: false })
  );
  cena.add(estrelas);

  let lampadas = null;
  const vidro = MT.vidro();
  const dirSolBase = {};
  let luzAtual = null;
  function aplicarLuz(nome) {
    if (luzAtual === nome) return;
    luzAtual = nome;
    const p = LUZES[nome];
    cena.background = CEUS[p.ceu];
    cena.fog = new THREE.Fog(...p.fog);
    ceuLuz.color.set(p.hemi[0]);
    ceuLuz.groundColor.set(p.hemi[1]);
    ceuLuz.intensity = p.hemi[2];
    sol.color.set(p.sol[0]);
    sol.intensity = p.sol[1];
    dirSolBase.v = V(...p.sol[2]).normalize();
    rebate.intensity = p.rebate;
    for (const m of lampadas) m.emissiveIntensity = m.userData.base * p.lamp;
    vidro.emissive.set(p.janela[0]);
    vidro.emissiveIntensity = p.janela[1];
    nuvemMat.color.set(p.nuvem[0]);
    nuvemMat.emissive.set(p.nuvem[1]);
    nuvemMat.emissiveIntensity = p.nuvem[2];
    bloom.strength = p.bloom;
    renderer.toneMappingExposure = p.exp;
    for (const { l, forca } of pontos) l.intensity = forca * p.pontos;
    estrelas.visible = p.estrelas;
    planoSombra = null; // força recalcular a sombra com o sol novo
  }

  // ---------- raios de sol (só no plano aéreo de abertura) ----------
  const raios = new THREE.Group();
  {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 256;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(64, 256);
    const suave = (a, b, x) => {
      const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 64; x++) {
        const v = 1 - y / 255, u = x / 63;
        const a = suave(0, 0.06, v) * Math.pow(1 - suave(0.12, 1, v), 1.3) * Math.pow(Math.sin(Math.PI * u), 2);
        const i = (y * 64 + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = Math.round(a * 255);
      }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    const rr = sorteio(55), dir = V(-70, 52, 34).normalize();
    for (let i = 0; i < 10; i++) {
      const comp = 170;
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(5 + rr() * 9, comp),
        new THREE.MeshBasicMaterial({ map: tex, color: "#ffe2b4", transparent: true, opacity: 0.09 + rr() * 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })
      );
      m.userData.centro = V(-34 + rr() * 60, 0, -30 + rr() * 52).addScaledVector(dir, comp / 2);
      m.userData.dir = dir;
      m.position.copy(m.userData.centro);
      raios.add(m);
    }
  }
  cena.add(raios);
  const _pc = V(0, 0, 0), _x = V(0, 0, 0), _m = new THREE.Matrix4();
  function orientarRaios() {
    for (const m of raios.children) {
      const d = m.userData.dir;
      _pc.subVectors(camera.position, m.userData.centro).addScaledVector(d, -_pc.dot(d)).normalize();
      _x.crossVectors(d, _pc).normalize();
      _m.makeBasis(_x, d, _pc);
      m.quaternion.setFromRotationMatrix(_m);
    }
  }


  // ---------- atores e coisas que mudam a cada quadro ----------
  const atores = [];
  const extras = [];
  function ator(b, regra) {
    cena.add(b.grupo);
    atores.push({ b, regra });
    return b;
  }
  function aCadaQuadro(fn) {
    extras.push(fn);
  }

  // ---------- planos de câmera ----------
  let planos = [];
  function definirPlanos(lista) {
    planos = lista;
    planos.forEach((p, i) => (p.fim = i + 1 < planos.length ? planos[i + 1].ini : DURACAO + 1));
  }
  // sombra do sol só na área do plano (nítida nos closes)
  let planoSombra = null;
  function ajustarSombra(p) {
    if (planoSombra === p) return;
    planoSombra = p;
    const centro = p.sombra > 50 ? V(0, 0, 0) : V(p.olharDe.x, 0, p.olharDe.z);
    sol.target.position.copy(centro);
    sol.position.copy(centro).addScaledVector(dirSolBase.v, 160);
    Object.assign(sol.shadow.camera, { left: -p.sombra, right: p.sombra, top: p.sombra, bottom: -p.sombra, near: 1, far: 340 });
    sol.shadow.camera.updateProjectionMatrix();
    sol.target.updateMatrixWorld();
  }

  const alvo = V(0, 0, 0);
  function cameraEm(t) {
    const p = planos.find((q) => t >= q.ini && t < q.fim) || planos[planos.length - 1];
    const k = THREE.MathUtils.clamp((t - p.ini) / (p.fim - p.ini), 0, 1);
    const e = k * 0.5 + k * k * (3 - 2 * k) * 0.5;
    camera.position.lerpVectors(p.de, p.para, e);
    alvo.lerpVectors(p.olharDe, p.olharPara, e);
    if (camera.fov !== p.fov) {
      camera.fov = p.fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(alvo);
    ajustarSombra(p);
    raios.visible = !!p.raios;
    if (raios.visible) orientarRaios();
  }

  // ---------- pós ----------
  const alvoRender = new THREE.WebGLRenderTarget(L, A, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, alvoRender);
  composer.setPixelRatio(1);
  composer.setSize(L, A);
  composer.addPass(new RenderPass(cena, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(L / 2, A / 2), 0.42, 0.55, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- legenda e filme antigo ----------
  const legenda = document.getElementById("legenda");
  const filme = document.getElementById("filme");
  let textoAtual = null;
  function legendaEm(t) {
    const l = LEGENDA.find((x) => t >= x.t0 && t < x.t1);
    const txt = l ? l.txt : "";
    if (txt !== textoAtual) {
      textoAtual = txt;
      legenda.textContent = txt;
    }
  }

  function desenhar(t) {
    const per = periodo(t);
    aplicarLuz(luzDoPeriodo(per));
    cameraEm(t);
    for (const { b, regra } of atores) {
      const r = regra(t, per);
      b.grupo.visible = r.vis !== false;
      if (!b.grupo.visible) continue;
      b.grupo.position.set(r.x, r.y ?? CHAO, r.z);
      b.grupo.rotation.y = r.ry;
      b.pose(r.pose, r.tPose ?? t);
      if (r.expr) b.mudarRosto(r.expr);
      if (r.cab) {
        if (r.cab.x !== undefined) b.cabeca.rotation.x = r.cab.x;
        if (r.cab.y !== undefined) b.cabeca.rotation.y = r.cab.y;
      }
    }
    for (const fn of extras) fn(t, per);
    // filme antigo: sépia, imagem tremendo e granulado
    const velho = filmeAntigo(per);
    canvas.style.filter = velho ? `sepia(0.9) contrast(1.08) saturate(0.85) brightness(${(0.95 + Math.sin(t * 37) * 0.025).toFixed(3)})` : "none";
    filme.style.opacity = velho ? "1" : "0";
    if (velho) filme.style.backgroundPosition = `${Math.floor(t * 24) * 37 % 300}px ${Math.floor(t * 24) * 53 % 300}px`;
    legendaEm(t);
    composer.render();
  }

  // chame no fim do episodio.js, depois de criar o elenco e os planos
  function iniciar() {
    lampadas = materiaisDeLuz();
    for (const m of lampadas) if (m.userData.base === undefined) m.userData.base = m.emissiveIntensity;
    tl.eventCallback("onUpdate", () => desenhar(tl.time()));
    desenhar(tl.time());
    Promise.all(['700 40px "Fredoka"', '600 40px "Fredoka"', '40px "Pacifico"', '800 40px "Inter"'].map((f) => document.fonts.load(f))).then(() => {
      redesenharPlacas();
      desenhar(tl.time());
    });
    window.__desenhar = desenhar;
  }

  return { cena, camera, renderer, cidade: info, ator, aCadaQuadro, pontoDeLuz, posteExtra, definirPlanos, iniciar };
}
