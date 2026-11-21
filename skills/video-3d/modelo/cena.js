// =====================================================================================
// MODELO DE CENA 3D (exemplo completo: "Como construir um bunker").
// Como usar num tema novo:
//   • MOTOR (renderer, luz, materiais, utilidades caixa/cil/pilar, fx/io/pop/h, peças GLB, bt, etiquetas, legenda): mantenha.
//   • PEÇAS PRONTAS: carro, navio, casa, árvore... vêm da biblioteca Kenney (scripts/pecas_3d.py). Carregue com
//     `await carregaPecas([...])` antes de montar o mundo e use peca(nome, {comp|alt|larg}, x, y, z, rotY).
//   • MUNDO: troque os objetos (casa, terreno, a obra) pelos do seu tema. Tudo low poly com flatShading.
//   • TOMADAS (const T): uma linha por troca de câmera, a cada 3–4 s (em "segundos de bloco", escala 0–10).
//   • renderAt(t): cada etapa da obra é função do tempo, com bt(bloco, s). Nada de Math.random nem relógio.
// Regras de estilo: references/regras-3d.md
// =====================================================================================
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"; // o index.html tem o importmap de "three"

const W = 1080, H = 1920;
const D = window.DADOS; // { dur, blocos:[ini...], palavras:[{w,s,e}], etiquetas:[...] }
const cv = document.getElementById("cena");
const rd = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
rd.setPixelRatio(1); rd.setSize(W, H, false);
rd.shadowMap.enabled = true; rd.shadowMap.type = THREE.PCFSoftShadowMap;
rd.outputColorSpace = THREE.SRGBColorSpace;
const sc = new THREE.Scene();
sc.background = new THREE.Color("#8FD0F5");
sc.fog = new THREE.Fog("#BFE4F7", 45, 110);
const cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 300);

// luz
sc.add(new THREE.HemisphereLight("#E9F6FF", "#6E8F4A", 1.1));
const sol = new THREE.DirectionalLight("#FFF1D6", 2.2);
sol.position.set(14, 26, 12); sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 80 });
sc.add(sol);

// utilidades
const mat = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: .9, metalness: 0, ...extra });
const M = {
  grama: mat("#6DBE45"), terra: mat("#9B6A3C"), terraEsc: mat("#7A5230"), concreto: mat("#B9BDC2"), concretoEsc: mat("#9A9EA4"),
  aco: mat("#E07A2E"), amarelo: mat("#F4C224"), preto: mat("#2A2C30"), branco: mat("#F3EFE6"), telhado: mat("#C9533B"),
  tronco: mat("#7B5233"), folha: mat("#3E9B3A"), azul: mat("#3C8DDC"), vermelho: mat("#D8483B"), bege: mat("#E8D3A8"),
  porta: mat("#7F8790", { metalness: .35, roughness: .5 }), madeira: mat("#B07D4F"), lencol: mat("#7FC6E8"),
  vidro: new THREE.MeshStandardMaterial({ color: "#9FE3FF", transparent: true, opacity: .35, flatShading: true }),
};
function caixa(w, h, d, m, x = 0, y = 0, z = 0, sombra = true) {
  const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  g.position.set(x, y, z); g.castShadow = sombra; g.receiveShadow = true; sc.add(g); return g;
}
function cil(r, h, m, x = 0, y = 0, z = 0, seg = 8, r2 = r) {
  const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r2, h, seg), m);
  g.position.set(x, y, z); g.castShadow = true; g.receiveShadow = true; sc.add(g); return g;
}
// caixa ancorada embaixo (escala Y cresce do chão)
function pilar(w, h, d, m, x, yBase, z) {
  const geo = new THREE.BoxGeometry(w, h, d); geo.translate(0, h / 2, 0);
  const g = new THREE.Mesh(geo, m); g.position.set(x, yBase, z); g.castShadow = true; g.receiveShadow = true; sc.add(g); return g;
}
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const fx = (t, a, b) => cl((t - a) / (b - a));              // fração 0..1 entre a e b
const io = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; // ease in-out
const pop = (x) => x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2); // back-out
const h = (i) => { let x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }; // hash fixo

// ---------- peças GLB (biblioteca Kenney, CC0) ----------
// O HyperFrames espera o THREE.DefaultLoadingManager terminar antes de capturar: por isso o window.THREE.
window.THREE = THREE;
const PECAS = {};
const carregaPecas = (lista) => Promise.all(lista.map((arq) => new Promise((ok, erro) => {
  const nome = arq.split("/").pop().replace(/\.(glb|gltf)$/, "");
  new GLTFLoader().load(arq, (g) => { PECAS[nome] = g.scene; ok(); }, undefined, erro);
})));
// peca("ship-cargo-a", {comp: 10}, x, y, z, rotY): cópia escalada pelo tamanho pedido (comp = eixo z, alt = y, larg = x,
// ou esc), centrada em x/z e com a base no y dado. Veículos e navios do Kenney apontam para +z. Devolve um grupo.
function peca(nome, alvo, x = 0, y = 0, z = 0, rotY = 0) {
  const base = PECAS[nome]; if (!base) throw new Error("peça não carregada: " + nome);
  const o = base.clone(true); const b = new THREE.Box3().setFromObject(o); const s = new THREE.Vector3(); b.getSize(s);
  const e = alvo.esc ?? (alvo.alt ? alvo.alt / s.y : alvo.larg ? alvo.larg / s.x : alvo.comp ? alvo.comp / s.z : 1);
  o.scale.setScalar(e); o.position.set(-(b.min.x + s.x / 2) * e, -b.min.y * e, -(b.min.z + s.z / 2) * e);
  o.traverse((k) => { if (k.isMesh) { k.castShadow = true; k.receiveShadow = true; } });
  const g = new THREE.Group(); g.add(o); g.position.set(x, y, z); g.rotation.y = rotY; sc.add(g); return g;
}

// ---------- mundo ----------
// buraco: x -3..3, z -2..2, fundo em y=-4. Terreno com 5 m de espessura.
const PX = 3, PZ = 2, FUNDO = -4, TOPO_TETO = -1.0;
const solo = [];
const blocoSolo = (w, d, x, z) => { const t = caixa(w, 5, d, M.terra, x, -2.5, z, false); const g = caixa(w, .12, d, M.grama, x, .06, z, false); solo.push(t, g); return [t, g]; };
const esq = blocoSolo(37, 60, -PX - 18.5, 0), dir = blocoSolo(37, 60, PX + 18.5, 0);
const fundoS = blocoSolo(2 * PX, 28, 0, -PZ - 14), frente = blocoSolo(2 * PX, 28, 0, PZ + 14);
// miolo que vai sendo cavado
const miolo = caixa(2 * PX, 5, 2 * PZ, M.terra, 0, -2.5, 0, false);
const mioloG = caixa(2 * PX, .12, 2 * PZ, M.grama, 0, .06, 0, false);
// monte de terra
const monte = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.2, 7), M.terraEsc); monte.position.set(-6.5, 0, 4.2); monte.castShadow = true; sc.add(monte);

// casa
caixa(7, 4, 6, M.branco, 2, 2, -12); const tel = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.6, 4), M.telhado);
tel.position.set(2, 5.3, -12); tel.rotation.y = Math.PI / 4; tel.castShadow = true; sc.add(tel);
caixa(1.2, 2.2, .1, M.madeira, 2, 1.1, -8.95); caixa(1.4, 1.2, .1, M.vidro, -.4, 2.4, -8.95); caixa(1.4, 1.2, .1, M.vidro, 4.4, 2.4, -8.95);
// árvores e cerca
[[-9, -6], [-11, 3], [10, -4], [12, 6], [-8, 12]].forEach(([x, z], i) => {
  cil(.3, 2, M.tronco, x, 1, z, 6); const f = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7 + h(i) * .6, 0), M.folha);
  f.position.set(x, 3.2, z); f.castShadow = true; sc.add(f);
});
for (let i = -14; i <= 14; i += 1.5) { caixa(.15, 1, .15, M.madeira, i, .5, -18); }
caixa(29, .12, .1, M.madeira, 0, .8, -18);

// escavadeira
const esc = new THREE.Group(); sc.add(esc); esc.position.set(-5.2, 0, 1.2);
const add = (o, g) => { sc.remove(o); g.add(o); return o; };
add(caixa(2.4, .5, 1.6, M.preto, 0, .25, 0), esc); add(caixa(2, .9, 1.4, M.amarelo, 0, .95, 0), esc);
add(caixa(.9, .9, 1.1, M.vidro, -.4, 1.85, 0), esc);
const braco = new THREE.Group(); braco.position.set(.8, 1.3, 0); esc.add(braco);
const b1 = caixa(2.4, .3, .3, M.amarelo, 1.2, 0, 0); add(b1, braco);
const ante = new THREE.Group(); ante.position.set(2.4, 0, 0); braco.add(ante);
add(caixa(.3, 1.8, .3, M.amarelo, 0, -.9, 0), ante); add(caixa(.6, .5, .6, M.preto, .1, -1.9, 0), ante);

// vergalhões (perímetro das paredes)
const verg = [];
const per = [];
for (let x = -2.6; x <= 2.61; x += .65) { per.push([x, -1.75], [x, 1.75]); }
for (let z = -1.1; z <= 1.11; z += .55) { per.push([-2.75, z], [2.75, z]); }
per.forEach(([x, z]) => { const g = pilar(.07, 2.9, .07, M.aco, x, FUNDO, z); g.scale.y = .001; verg.push(g); });
const anel = [-3.6, -2.6, -1.6].map((y) => { const a = [caixa(5.6, .06, .06, M.aco, 0, y, -1.75), caixa(5.6, .06, .06, M.aco, 0, y, 1.75), caixa(.06, .06, 3.5, M.aco, -2.75, y, 0), caixa(.06, .06, 3.5, M.aco, 2.75, y, 0)]; a.forEach((o) => o.visible = false); return a; });

// concreto
const piso = pilar(5.9, .3, 3.9, M.concreto, 0, FUNDO, 0);
const paredes = [pilar(5.9, 2.7, .3, M.concreto, 0, FUNDO + .3, -1.8), pilar(5.9, 2.7, .3, M.concreto, 0, FUNDO + .3, 1.8),
  pilar(.3, 2.7, 3.3, M.concreto, -2.8, FUNDO + .3, 0), pilar(.3, 2.7, 3.3, M.concretoEsc, 2.8, FUNDO + .3, 0)];
const teto = caixa(5.9, .3, 3.9, M.concreto, 0, TOPO_TETO - .15, 0);
// cobertura de terra (1 m) e grama de volta
const cobre = pilar(5.98, 1.0, 3.98, M.terra, 0, TOPO_TETO, 0);
const cobreG = caixa(6, .12, 4, M.grama, 0, .06, 0, false);

// entrada em L (vista de cima): sai pela parede direita
const corredor = [];
const parC = (w, d, x, z) => { const g = pilar(w, 2.4, d, M.concretoEsc, x, FUNDO + .3, z); corredor.push(g); return g; };
parC(3.2, .25, 4.5, -.75); parC(3.2, .25, 4.5, .75); parC(.25, 1.75, 6.0, 0); // trecho 1 + parede da curva
parC(.25, 4.0, 5.25, 2.6); parC(.25, 4.0, 6.75, 2.6);                        // trecho 2 (vira pra +z)
const porta = cil(.75, .22, M.porta, 3.05, FUNDO + 1.3, 0, 16); porta.rotation.z = Math.PI / 2;
const macan = caixa(.12, .5, .12, M.preto, 2.9, FUNDO + 1.3, .35);
const chaoPlanta = caixa(10, .4, 16, M.terraEsc, 7.5, FUNDO - .2, 1, false); chaoPlanta.visible = false;
const onda = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2, .25), new THREE.MeshStandardMaterial({ color: "#7FD6FF", emissive: "#3AB4FF", emissiveIntensity: .8, transparent: true, opacity: 0, flatShading: true }));
sc.add(onda);

// ventilação
const cano = cil(.22, 4.2, M.concretoEsc, -2.1, -.9, -1.2, 10);
const chapeu = cil(.4, .15, M.preto, -2.1, 1.2, -1.2, 10);
const filtro = caixa(.9, .8, .7, M.branco, -2.1, -1.8, -1.2); const filtroF = caixa(.92, .2, .72, M.azul, -2.1, -1.5, -1.2);
const vent = new THREE.Group(); vent.position.set(-1.0, -2.0, -1.3); sc.add(vent);
add(cil(.12, .2, M.preto, 0, 0, 0, 8), vent).rotation.x = Math.PI / 2;
const pas = new THREE.Group(); vent.add(pas);
for (let i = 0; i < 3; i++) { const p = caixa(.16, .7, .04, M.amarelo, 0, 0, 0); add(p, pas); p.geometry.translate(0, .38, 0); p.rotation.z = i * 2.094; }
const manivela = caixa(.08, .5, .08, M.vermelho, .25, -.35, .1); add(manivela, vent);
const ar = Array.from({ length: 14 }, (_, i) => { const s = new THREE.Mesh(new THREE.TorusGeometry(.14, .035, 5, 10), new THREE.MeshStandardMaterial({ color: "#FFFFFF", transparent: true, opacity: 0, flatShading: true })); sc.add(s); return s; });

// interior: prateleiras, beliche, luminária
const estante = []; [-3.3, -2.6, -1.9].forEach((y) => estante.push(caixa(2.4, .08, .5, M.madeira, 1.2, y, -1.38)));
const itens = [];
for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) {
  const x = .25 + i * .38, y = -3.3 + r * .7 + .04;
  const tipo = (r + i) % 3;
  const g = tipo === 0 ? cil(.12, .45, M.azul, x, y + .225, -1.38, 8) : tipo === 1 ? cil(.13, .26, M.vermelho, x, y + .13, -1.38, 10) : caixa(.3, .3, .3, M.bege, x, y + .15, -1.38);
  g.userData.y = g.position.y; itens.push(g);
}
const beliche = [caixa(1.9, .12, .9, M.madeira, -1.5, -3.2, .9), caixa(1.9, .12, .9, M.madeira, -1.5, -2.2, .9), caixa(1.8, .14, .8, M.lencol, -1.5, -3.08, .9), caixa(1.8, .14, .8, M.lencol, -1.5, -2.08, .9),
  caixa(.08, 1.8, .08, M.madeira, -2.42, -2.9, .48), caixa(.08, 1.8, .08, M.madeira, -2.42, -2.9, 1.32), caixa(.08, 1.8, .08, M.madeira, -.58, -2.9, .48), caixa(.08, 1.8, .08, M.madeira, -.58, -2.9, 1.32)];
const lamp = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 6), new THREE.MeshStandardMaterial({ color: "#FFE7A0", emissive: "#FFC94A", emissiveIntensity: 0, flatShading: true }));
lamp.position.set(0, -1.5, 0); sc.add(lamp);
const luzLamp = new THREE.PointLight("#FFD27A", 0, 8); luzLamp.position.set(0, -1.6, 0); sc.add(luzLamp);


// partículas de radiação
const rad = Array.from({ length: 26 }, (_, i) => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(.13, 0), new THREE.MeshStandardMaterial({ color: "#9CFF5C", emissive: "#5BFF2A", emissiveIntensity: 1.2, flatShading: true })); s.visible = false; sc.add(s); return s; });

// ---------- tomadas (câmera) ----------
const B = D.blocos; // início de cada fala (s)
// cada fala tem duração própria: os tempos internos foram pensados para 10 s e são escalados pela duração real
const LB = B.map((b, i) => (i + 1 < B.length ? B[i + 1] : D.dur - 1.2) - b);
const bt = (i, s) => B[i] + s * LB[i] / 10;
const T = [
  // [início, posição inicial, alvo inicial, posição final, alvo final, corte (esconde a frente?)]
  [0, [14, 13, 22], [0, -.5, 0], [10, 9, 15], [0, -1, 0], false],
  [bt(0, 3.4), [-1, 2.4, 7.5], [-3.5, .5, 0], [.5, 1.8, 6.5], [-2.5, -1, 0], false],
  [bt(0, 6.8), [0, -1.2, 11], [0, -2.2, 0], [0, -1.6, 9.5], [0, -2.4, 0], true],
  [B[1], [4.5, -.8, 8], [0, -2.6, 0], [3, -1.2, 7], [0, -2.4, 0], true],
  [bt(1, 3.4), [-4.5, -1, 8], [0, -2.6, 0], [-3, -1.5, 7.2], [0, -2.5, 0], true],
  [bt(1, 6.8), [0, 2.5, 10], [0, -1.8, 0], [2, 3.5, 9], [0, -1.5, 0], true],
  [B[2], [0, -.3, 10.5], [0, -1.2, 0], [0, 0, 9.5], [0, -1, 0], true],
  [bt(2, 4.2), [6, 7, 16], [0, 3, 0], [4, 3, 13], [0, -.5, 0], true],
  [B[3], [4.6, 13, 1.4], [4.6, -3, 1.3], [4.6, 11, 1.2], [4.6, -3, 1.3], "planta"],
  [bt(3, 4.2), [6, 3.5, 7.5], [5.4, -2.6, 1.2], [4.8, 2.6, 4.5], [4.8, -2.8, 0], "planta"],
  [B[4], [1.5, -2.1, 6.5], [-1.6, -2, -1], [.5, -2, 5.5], [-1.8, -1.9, -1], true],
  [bt(4, 4.2), [-.2, -1.9, 1.8], [-1, -2, -1.3], [-.6, -1.9, 1.3], [-1.1, -2, -1.3], true],
  [B[5], [1.4, -2.4, 4.8], [1.2, -2.6, -1.4], [1.0, -2.3, 4.0], [1.2, -2.6, -1.4], true],
  [bt(5, 4.6), [0, -1.6, 9], [0, -2.4, 0], [0, 6, 26], [0, -1, -4], true],
];
const tomada = (t) => { let k = 0; for (let i = 0; i < T.length; i++) if (t >= T[i][0]) k = i; return k; };

// ---------- etiquetas e legenda (HTML por cima) ----------
const camada = document.getElementById("etq");
const ET = D.etiquetas.map((e) => { const d = document.createElement("div"); d.className = "etq"; d.textContent = e.txt; camada.appendChild(d); return { ...e, el: d }; });
const leg = document.getElementById("leg");
const v3 = new THREE.Vector3();

function renderAt(t) {
  // escavação (bloco 1)
  const cav = io(fx(t, .6, bt(1, -.4)));
  const topo = -cav * 4; // topo do miolo desce até -4
  miolo.scale.y = Math.max(.001, (5 + topo) / 5); miolo.position.y = -5 + (5 + topo) / 2;
  mioloG.visible = cav < .02; mioloG.position.y = topo + .06;
  monte.scale.setScalar(.05 + cav * .95); monte.position.y = monte.scale.y * 1.1;
  const sw = Math.sin(t * 3.1);
  braco.rotation.z = -.35 + sw * .25 * (cav > 0 && cav < 1 ? 1 : 0) - cav * .25; ante.rotation.z = -.4 + Math.cos(t * 3.1) * .3 * (cav < 1 ? 1 : 0);
  esc.visible = t < B[2];
  // vergalhão (bloco 2, 1ª parte)
  const vg = fx(t, bt(1, .2), bt(1, 3.2));
  const vergOn = t >= B[1] && t < bt(1, 7.0); // depois do concreto, o aço fica dentro da parede
  verg.forEach((g, i) => { g.scale.y = Math.max(.001, io(cl(vg * 1.6 - (i / verg.length) * .6))); g.visible = vergOn; });
  anel.forEach((a, i) => a.forEach((o) => o.visible = vergOn && vg > .6 + i * .12));
  // concreto
  const cc = fx(t, bt(1, 3.4), bt(1, 6.6));
  piso.visible = t >= bt(1, 3.2); piso.scale.y = Math.max(.001, io(fx(t, bt(1, 3.2), bt(1, 4))));
  paredes.forEach((p, i) => { p.visible = cc > 0; p.scale.y = Math.max(.001, io(cl(cc * 1.3 - i * .08))); });
  const tq = io(fx(t, bt(1, 6.9), bt(1, 8.2)));
  teto.visible = tq > 0; teto.position.y = TOPO_TETO - .15 + (1 - tq) * 6;
  // cobertura de terra (bloco 3)
  const cb = io(fx(t, bt(2, .2), bt(2, 3.6)));
  cobre.visible = cb > 0; cobre.scale.y = Math.max(.001, cb);
  cobreG.visible = cb > .97;
  // radiação caindo e quicando
  const rOn = t >= bt(2, 4.2) && t < B[3];
  rad.forEach((s, i) => {
    s.visible = rOn; if (!rOn) return;
    const lt = (t - (bt(2, 4.2)) - h(i) * 3.2); const x = -3 + h(i + 9) * 6, z = -2 + h(i + 21) * 4;
    if (lt < 0) { s.visible = false; return; }
    const y0 = 14, tq2 = 1.1; let y;
    if (lt < tq2) y = y0 - (y0 - .3) * (lt / tq2) * (lt / tq2); else { const b = lt - tq2; y = .3 + Math.max(0, 2.2 * b - 4.9 * b * b); }
    s.position.set(x, y, z); s.material.opacity = 1;
    s.scale.setScalar(lt > tq2 + .45 ? Math.max(.001, 1 - (lt - tq2 - .45) * 2) : 1);
  });
  // corredor, porta e onda (bloco 4)
  const k = tomada(t), shot = T[k];
  const planta = shot[5] === "planta";
  const cr = io(fx(t, bt(3, .2), bt(3, 2)));
  corredor.forEach((g, i) => { g.visible = t >= B[3]; g.scale.y = Math.max(.001, cl(cr * 1.4 - i * .1)); });
  porta.visible = macan.visible = t >= bt(3, 1.6);
  const on = fx(t, bt(3, 4.6), bt(3, 7.4));
  onda.visible = on > 0 && on < 1;
  if (onda.visible) {
    // entra pelo trecho 2 (z de 4.6 até 0), bate na parede da curva e se espalha
    const a = cl(on / .7), b = cl((on - .7) / .3);
    onda.position.set(6, FUNDO + 1.4, 4.6 - a * 4.4); onda.rotation.y = 0;
    onda.scale.set(1 + b * 1.6, 1 + b * .3, 1); onda.material.opacity = .75 * (1 - b);
  }
  // ventilação (bloco 5)
  const vOn = t >= bt(4, -.2);
  [cano, chapeu, filtro, filtroF].forEach((o) => o.visible = vOn);
  vent.visible = vOn;
  pas.rotation.z = -(t - B[4]) * 7; manivela.rotation.z = -(t - B[4]) * 7;
  ar.forEach((s, i) => {
    const lt = ((t - B[4]) * .9 + i / ar.length) % 1;
    s.visible = vOn && t < B[5];
    s.position.set(-2.1 + lt * 3.4, -1.6 - Math.sin(lt * 3.14) * .5 - lt * .5, -1.2 + lt * 1.6);
    s.rotation.y = lt * 6; s.material.opacity = Math.sin(lt * 3.14) * .9;
  });
  // interior: itens aparecendo (bloco 6)
  itens.forEach((g, i) => { const p = pop(fx(t, bt(5, .3) + i * .17, bt(5, .3) + i * .17 + .35)); g.visible = p > 0; g.scale.setScalar(Math.max(.001, p)); });
  const ac = fx(t, bt(5, 3.5), bt(5, 4.1)); lamp.material.emissiveIntensity = ac * 2; luzLamp.intensity = ac * 6;
  // frente do terreno some nos cortes
  const corte = shot[5] === true || planta;
  frente.forEach((o) => o.visible = !corte);
  // parede da frente do bunker: só na tomada em que ela sobe; depois some pra mostrar o interior (vista em corte)
  // nos cortes a parede da frente fica como uma mureta (maquete em corte): mostra o concreto sem tampar o interior
  if (corte && k !== 4 && paredes[1].visible && cc >= 1) paredes[1].scale.y = .3;
  [...estante, ...beliche].forEach((o) => o.visible = t >= bt(4, -.2));
  chaoPlanta.visible = planta;
  // na planta, tira a terra/grama de cima do corredor
  dir.forEach((o) => o.visible = !planta); cobre.visible = cobre.visible && !planta; cobreG.visible = cobreG.visible && !planta; teto.visible = teto.visible && !planta;
  // câmera
  const fim = k + 1 < T.length ? T[k + 1][0] : D.dur;
  const u = io(fx(t, shot[0], fim));
  const L = (a, b) => new THREE.Vector3().fromArray(a).lerp(new THREE.Vector3().fromArray(b), u);
  cam.position.copy(L(shot[1], shot[3])); cam.lookAt(L(shot[2], shot[4]));
  rd.render(sc, cam);
  // etiquetas presas nos objetos
  ET.forEach((e) => {
    const vis = t >= e.a && t < e.b;
    if (!vis) { e.el.style.opacity = 0; return; }
    v3.fromArray(e.p).project(cam);
    const x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H;
    const ap = pop(fx(t, e.a, e.a + .3));
    e.el.style.opacity = v3.z < 1 ? 1 : 0;
    e.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${ap})`;
  });
  // legenda de uma palavra
  const w = D.palavras.find((p) => t >= p.s && t < p.e);
  leg.textContent = w ? w.w : "";
}
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
window.__render = renderAt;
