// =====================================================================================
// CENA 3D: "Como construir uma represa gigante" (vídeo longo, 10 falas).
// MOTOR (renderer, luz, materiais, utilidades, peças GLB, bt, etiquetas, legenda) vem do modelo da skill video-3d.
// MUNDO: um cânion de deserto com um rio. A obra avança fala a fala (rio → túneis → ensecadeiras → paredões →
// concreto → blocos → formato → infiltração → cheia → usina).
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
const CEU = new THREE.Color("#8FD0F5"), CEU_T = new THREE.Color("#5F7886");
const NEV = new THREE.Color("#CFE7F2"), NEV_T = new THREE.Color("#71848F");
sc.background = CEU.clone();
sc.fog = new THREE.Fog(NEV.clone(), 70, 150);
const cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 400);

// luz
sc.add(new THREE.HemisphereLight("#EAF6FF", "#B98157", 1.15));
const sol = new THREE.DirectionalLight("#FFF1D6", 2.3);
sol.position.set(14, 42, 22); sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 110 });
sc.add(sol);

// utilidades
const mat = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: .9, metalness: 0, ...extra });
const M = {
  concreto: mat("#B9BDC2"), concretoEsc: mat("#9A9EA4"), terra: mat("#9B6A3C"), terraEsc: mat("#7A5230"),
  amarelo: mat("#F4C224"), preto: mat("#2A2C30"), branco: mat("#F3EFE6"), bege: mat("#E8D3A8"), laranja: mat("#E07A2E"),
  vermelho: mat("#D8483B"), azul: mat("#3C8DDC"),
  rocha: mat("#C9774B"), rochaEsc: mat("#A65C3A"), areia: mat("#E2B97E"), plato: mat("#DDA66B"),
  agua: mat("#2E8FD6", { transparent: true, opacity: .9 }),
  espuma: mat("#EAF8FF", { emissive: "#BFE9FF", emissiveIntensity: .3 }),
  gota: mat("#7FD6FF", { emissive: "#2FA8FF", emissiveIntensity: 1.1 }),
  gelo: mat("#BDF0FF", { emissive: "#5FD3FF", emissiveIntensity: 1.0 }),
  energia: mat("#FFE680", { emissive: "#FFC21A", emissiveIntensity: 1.6 }),
  quente: mat("#5E5A57", { emissive: "#FF4D00", emissiveIntensity: 0 }),
  D1: mat("#C3C7CC", { transparent: true }), D2: mat("#A9AEB4", { transparent: true }),
  tunel: mat("#A3A8AE", { side: THREE.DoubleSide }), cimento: mat("#8C939B", { emissive: "#55606B", emissiveIntensity: .3 }),
  telhado: mat("#8E949B"), chuva: mat("#DCEBF5", { transparent: true, opacity: .55 }),
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
// cilindro entre dois pontos
function tubo(a, b, r, m, seg = 10) {
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A);
  const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), seg), m);
  g.position.copy(A).add(Bv).multiplyScalar(.5); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  g.castShadow = true; g.receiveShadow = true; sc.add(g); return g;
}
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const fx = (t, a, b) => cl((t - a) / (b - a));              // fração 0..1 entre a e b
const io = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; // ease in-out
const pop = (x) => x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2); // back-out
const h = (i) => { let x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }; // hash fixo
const add = (o, g) => { sc.remove(o); g.add(o); return o; };
const lerp3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
// ponto ao longo de um caminho de vários trechos (u de 0 a 1, trechos de mesmo peso)
const caminho = (P, u) => { const n = P.length - 1, k = Math.min(n - 1, Math.floor(u * n)); return lerp3(P[k], P[k + 1], u * n - k); };

// ---------- peças GLB (biblioteca Kenney, CC0) ----------
// O HyperFrames espera o THREE.DefaultLoadingManager terminar antes de capturar: por isso o window.THREE.
window.THREE = THREE;
const PECAS = {};
const carregaPecas = (lista) => Promise.all(lista.map((arq) => new Promise((ok, erro) => {
  const nome = arq.split("/").pop().replace(/\.(glb|gltf)$/, "");
  new GLTFLoader().load(arq, (g) => { PECAS[nome] = g.scene; ok(); }, undefined, erro);
})));
function peca(nome, alvo, x = 0, y = 0, z = 0, rotY = 0) {
  const base = PECAS[nome]; if (!base) throw new Error("peça não carregada: " + nome);
  const o = base.clone(true); const b = new THREE.Box3().setFromObject(o); const s = new THREE.Vector3(); b.getSize(s);
  const e = alvo.esc ?? (alvo.alt ? alvo.alt / s.y : alvo.larg ? alvo.larg / s.x : alvo.comp ? alvo.comp / s.z : 1);
  o.scale.setScalar(e); o.position.set(-(b.min.x + s.x / 2) * e, -b.min.y * e, -(b.min.z + s.z / 2) * e);
  o.traverse((k) => { if (k.isMesh) { k.castShadow = true; k.receiveShadow = true; } });
  const g = new THREE.Group(); g.add(o); g.position.set(x, y, z); g.rotation.y = rotY; sc.add(g); return g;
}
await carregaPecas([
  "assets/pecas/nature-kit/cactus_tall.glb", "assets/pecas/nature-kit/cactus_short.glb",
  "assets/pecas/city-kit-commercial/building-skyscraper-a.glb", "assets/pecas/city-kit-commercial/building-skyscraper-b.glb",
  "assets/pecas/city-kit-commercial/building-skyscraper-d.glb", "assets/pecas/city-kit-commercial/building-a.glb",
  "assets/pecas/city-kit-commercial/building-c.glb", "assets/pecas/car-kit/truck.glb",
]);

// ---------- mundo ----------
// Cânion: paredões em x = ±6, chão do rio em y = 0, topo do platô em y = 13. O rio corre de -z (montante) para +z.
// A represa fica em z ≈ 0, com a face de montante em arco (o meio mais para -z).
const CW = 6, TOPO = 13, CREST = 12.4, NC = 8, NR = 8, RH = CREST / NR, NI = 11.4; // NI = fundo do vertedouro
const zU = (x) => -1.5 * (1 - (x / CW) ** 2);      // face de montante (arco)
const dEsp = (y) => 6 - 4.8 * (y / CREST);           // espessura: base larga, topo fino
const LADO = [];                                     // o que some no corte lateral (metade x > 0)
const lado = (o) => { LADO.push(o); return o; };

// chão de rocha e leito de areia (duas metades, por causa do corte lateral)
caixa(80, 6, 140, M.rochaEsc, -40, -3, 0, false); const baseR = lado(caixa(80, 6, 140, M.rochaEsc, 40, -3, 0, false));
caixa(CW, .1, 140, M.areia, -CW / 2, .05, 0, false); lado(caixa(CW, .1, 140, M.areia, CW / 2, .05, 0, false));

// paredões (em pedaços, para as vistas em corte)
const PAR = {};
for (const s of [-1, 1]) {
  const xs = s * (CW + 3), g = (o) => (s > 0 ? lado(o) : o), P = PAR[s] = {};
  P.baixo = g(caixa(6, 4, 40, M.rocha, xs, 2, 0));                                   // esconde na vista dos túneis
  g(caixa(6, 4, 50, M.rocha, xs, 2, -45)); g(caixa(6, 4, 50, M.rocha, xs, 2, 45));
  g(caixa(6, TOPO - 4, 59, M.rocha, xs, (TOPO + 4) / 2, -40.5));                       // z -70..-11
  g(caixa(6, NI - 4, 8, M.rocha, xs, (NI + 4) / 2, -7));                               // z -11..-3 (embaixo do vertedouro)
  P.tampa = g(pilar(6, TOPO - NI, 8, M.rocha, xs, NI, -7));                           // rocha que sai para abrir o vertedouro
  P.alto = g(caixa(6, TOPO - 4, 23, M.rocha, xs, (TOPO + 4) / 2, 8.5));               // z -3..20
  g(caixa(6, TOPO - 4, 50, M.rocha, xs, (TOPO + 4) / 2, 45));
  g(caixa(28, TOPO, 140, M.rocha, s * 26, TOPO / 2, 0));
  g(caixa(28, .16, 140, M.plato, s * 26, TOPO + .08, 0, false));
  g(caixa(6, .16, 59, M.plato, xs, TOPO + .08, -40.5, false)); g(caixa(6, .16, 50, M.plato, xs, TOPO + .08, 45, false));
  P.altoTopo = g(caixa(6, .16, 23, M.plato, xs, TOPO + .08, 8.5, false));
  P.tampaTopo = g(caixa(6, .16, 8, M.plato, xs, TOPO + .08, -7, false));
  P.faixas = [];
  [5.6, 8.3, 10.6].forEach((y, i) => {               // estratos na face do cânion
    const e = .4 + i * .1;
    g(caixa(.14, e, 59, M.rochaEsc, s * (CW - .02), y, -40.5, false));
    P.faixas.push(g(caixa(.14, e, 23, M.rochaEsc, s * (CW - .02), y, 8.5, false)));
    g(caixa(.14, e, 50, M.rochaEsc, s * (CW - .02), y, 45, false));
    if (y < NI) g(caixa(.14, e, 8, M.rochaEsc, s * (CW - .02), y, -7, false));
  });
}
// pedras soltas no platô e cactos
for (let i = 0; i < 26; i++) {
  const s = i % 2 ? 1 : -1, r = new THREE.Mesh(new THREE.DodecahedronGeometry(.5 + h(i) * 1.1, 0), i % 3 ? M.rocha : M.rochaEsc);
  let z = -60 + h(i + 13) * 120; const x = s * (13 + h(i + 7) * 20);
  if (s > 0 && x > 14 && z > 14 && z < 40) z -= 34;
  r.position.set(x, TOPO + .2, z); r.rotation.set(h(i) * 3, h(i + 1) * 3, 0); r.castShadow = true; sc.add(r); if (s > 0) lado(r);
}
for (let i = 0; i < 16; i++) {
  const s = i % 2 ? 1 : -1; let z = -34 + h(i + 32) * 64; const x = s * (13 + h(i + 31) * 9);
  if (s > 0 && z > 12) z -= 40;
  const c = peca(i % 3 ? "cactus_short" : "cactus_tall", { alt: 1.1 + h(i + 30) * 1.3 }, x, TOPO + .16, z, h(i) * 6); if (s > 0) lado(c);
}
peca("truck", { comp: 2.4 }, -9.5, TOPO + .16, 7, Math.PI * .1);

// água: rio a montante, trecho do meio (vira canteiro), rio a jusante, água de saída da usina e o lago (em faixas)
const agua = (x0, x1, z0, z1) => { const g = pilar(x1 - x0, 1, z1 - z0, M.agua, (x0 + x1) / 2, 0, (z0 + z1) / 2); g.castShadow = false; if (x0 >= 0) lado(g); return g; };
const U1 = [agua(-CW, 0, -70, -13.6), agua(0, CW, -70, -13.6)];
const MEIO = [agua(-CW, 0, -13.6, 13.6), agua(0, CW, -13.6, 13.6)];
const DES = [agua(-CW, 0, 13.6, 70), agua(0, CW, 13.6, 70)];
const TW = [agua(-CW, 0, 4.7, 13.6), agua(0, CW, 4.7, 13.6)];
const LAGO = []; for (let c = 0; c < NC; c++) { const x0 = -CW + 1.5 * c; LAGO.push(agua(x0, x0 + 1.5, -13.6, zU(x0 + .75) - .02)); }
const nivel = (arr, lv) => arr.forEach((g) => { g.visible = lv > .02; g.scale.y = Math.max(.001, lv); });
const espuma = Array.from({ length: 46 }, (_, i) => { const g = caixa(.5, .04, .14, M.espuma, 0, 0, 0, false); g.rotation.y = (h(i) - .5) * .4; return g; });

// guindaste no platô (fala 1) e os blocos de concreto que a correnteza leva
const GRUA = lado(new THREE.Group()); sc.add(GRUA); GRUA.position.set(9.5, TOPO, 3);
add(pilar(.6, 7.5, .6, M.amarelo, 0, 0, 0), GRUA); add(caixa(13, .45, .45, M.amarelo, -5, 7.5, 0), GRUA);
add(caixa(3, .5, .5, M.amarelo, 2.5, 7.5, 0), GRUA); add(caixa(1, 1, .8, M.concretoEsc, 3.6, 7, 0), GRUA);
add(caixa(1, .9, 1, M.branco, .9, 6.8, 0), GRUA); add(caixa(1.6, .3, 1.6, M.preto, 0, .15, 0), GRUA);
const cargas = [0, 1, 2].map(() => caixa(1.3, 1.3, 1.3, M.concreto, 0, 0, 0));
const cabo = pilar(.05, 1, .05, M.preto, 0, 0, 0);

// túneis de desvio: dois em cada paredão (meio tubo aberto para o cânion, para a vista em corte)
const TUN = [];
for (const s of [-1, 1]) for (const [xt, L] of [[8, 15.5], [10.4, 17.5]]) {
  const geo = new THREE.CylinderGeometry(.95, .95, 2 * L, 14, 1, true, 0, Math.PI); geo.rotateX(Math.PI / 2); geo.translate(0, 0, L);
  const tb_ = new THREE.Mesh(geo, M.tunel); tb_.position.set(s * xt, 1.6, -L); tb_.scale.x = s; tb_.receiveShadow = true; sc.add(tb_);
  const ag = pilar(1.3, .5, 2 * L, M.agua, s * xt, .72, 0); ag.castShadow = false;
  const broca = caixa(1.3, 1.3, .7, M.amarelo, s * xt, 1.6, -L);
  const portais = [-L, L].map((z) => { const p = cil(.95, .12, M.preto, s * (CW - .03), 1.6, z, 16); p.rotation.z = Math.PI / 2; return p; });
  const gotas = Array.from({ length: 7 }, () => { const g = new THREE.Mesh(new THREE.IcosahedronGeometry(.16, 0), M.gota); sc.add(g); return g; });
  const T_ = { s, xt, L, tubo: tb_, agua: ag, broca, portais, gotas, externo: xt > 9 };
  if (s > 0) [tb_, ag, broca, ...portais, ...gotas].forEach(lado);
  TUN.push(T_);
}

// ensecadeiras (barragens provisórias de terra e pedra)
const ENS = []; for (const z of [-12, 12]) for (const s of [-1, 1]) { const g = pilar(CW, 3, 3, M.terra, s * CW / 2, 0, z); if (s > 0) lado(g); ENS.push(g); }

// pedras soltas nos paredões e os escaladores (fala 4)
const pedras = Array.from({ length: 12 }, (_, i) => {
  const g = new THREE.Mesh(new THREE.DodecahedronGeometry(.32 + h(i + 60) * .28, 0), M.rochaEsc); g.castShadow = true; sc.add(g);
  const s = i % 2 ? 1 : -1, cai = i < 5;
  g.userData = { s, y: 5.6 + h(i + 40) * 5.2, z: -5 + h(i + 50) * 10, cai, k: cai ? i : i - 5 };
  if (s > 0) lado(g); return g;
});
const nuvens = pedras.map(() => { const g = new THREE.Mesh(new THREE.IcosahedronGeometry(.6, 0), mat("#F6E7D2", { transparent: true, opacity: 1 })); sc.add(g); return g; });
const escal = [[-1, 8.6, -2.2], [-1, 9.6, 1.8], [1, 9.0, -1.0], [1, 7.9, 2.6]].map(([s, y, z], i) => {
  const g = new THREE.Group(); g.position.set(s * (CW - .32), TOPO, z); sc.add(g);
  const corda = add(pilar(.035, 1, .035, M.preto, 0, 0, 0), g);
  const corpo = new THREE.Group(); g.add(corpo);
  add(caixa(.28, .42, .22, M.laranja, 0, .21, 0), corpo); add(caixa(.1, .3, .1, M.azul, 0, -.12, 0), corpo);
  add(new THREE.Mesh(new THREE.SphereGeometry(.12, 7, 5), M.bege), corpo).position.set(0, .54, 0);
  add(caixa(.2, .08, .2, M.branco, 0, .65, 0), corpo);
  if (s > 0) lado(g);
  return { g, corda, corpo, s, y, i };
});

// concreto num despejo só (fala 5): fatias que sobem, esquentam e racham
const mono = Array.from({ length: NR }, (_, r) => { const d = dEsp(r * RH + RH / 2); return pilar(12, RH, d, M.quente, 0, r * RH, -.75 + d / 2); });
const rachas = Array.from({ length: 12 }, (_, i) => {
  const r = 1 + (i % 6), d = dEsp(r * RH + RH / 2);
  const g = caixa(.1, RH * .95, .06, M.preto, -4.6 + i * .85, r * RH + RH / 2, -.75 + d + .04, false); g.rotation.z = (i % 2 ? .45 : -.4); return g;
});

// a represa em blocos (fala 6): 8 colunas x 8 camadas, com canos de água gelada por dentro
const blocos = [], canos = [];
for (let c = 0; c < NC; c++) for (let r = 0; r < NR; r++) {
  const xc = -CW + 1.5 * c + .75, y0 = r * RH, d = dEsp(y0 + RH / 2), zc = zU(xc) + d / 2;
  const g = pilar(1.5, RH, d, (c + r) % 2 ? M.D1 : M.D2, xc, y0, zc); g.userData = { c, r };
  const k = cil(.08, 1.5, M.gelo, xc, y0 + RH / 2, zc, 6); k.rotation.z = Math.PI / 2; k.castShadow = false;
  if (xc > 0) { lado(g); lado(k); }
  blocos.push(g); canos.push(k);
}
const gelo = Array.from({ length: 24 }, (_, i) => { const g = new THREE.Mesh(new THREE.IcosahedronGeometry(.12, 0), M.gelo); sc.add(g); return g; });

// setas da pressão da água (fala 7): maiores embaixo
const seta = (comp, cor) => {
  const g = new THREE.Group(); sc.add(g);
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, comp, 8), cor); haste.rotation.x = Math.PI / 2; haste.position.z = -comp / 2 - .5; g.add(haste);
  const ponta = new THREE.Mesh(new THREE.ConeGeometry(.34, .6, 8), cor); ponta.rotation.x = Math.PI / 2; ponta.position.z = -.3; g.add(ponta);
  return g;
};
const setas = [1.0, 3.0, 5.0, 7.0, 9.0, 11.0].map((y) => { const g = seta(.7 + (CREST - y) * .3, M.vermelho); g.position.set(-.75, y, zU(-.75) - .05); return g; });
const setasArco = [-1, 1].map((s) => { const g = seta(2.2, M.vermelho); g.position.set(s * 5.9, CREST + .5, .2); g.rotation.y = Math.atan2(s, .45); return g; });

// infiltração por baixo, cortina de cimento e poços de alívio (fala 8) — no plano do corte (x = .15)
const XC = .15;
const infil = Array.from({ length: 16 }, () => { const g = new THREE.Mesh(new THREE.IcosahedronGeometry(.17, 0), M.gota); sc.add(g); return g; });
const geoC = new THREE.BoxGeometry(.14, 5.2, .4); geoC.translate(0, -2.6, 0);
const cortina = new THREE.Mesh(geoC, M.cimento); cortina.position.set(XC, 0, -1.0); sc.add(cortina);
const haste = pilar(.07, 1, .07, M.preto, XC, 0, -1.0);
const pocos = [2.2, 3.3, 4.4].map((z) => cil(.1, 3.4, M.azul, XC, -1.7, z, 8));

// usina (U ao pé da represa), torres de tomada d'água, linha de energia e a cidade (fala 10)
const asas = [-1, 1].map((s) => { const g = caixa(3.6, 3, 2.6, M.branco, s * 3.9, 1.5, 8.1); if (s > 0) lado(g); return g; });
// por dentro (só na vista sem teto): piso e mureta
const dentro = [-1, 1].flatMap((s) => { const a = [caixa(3.6, 1.1, 2.6, M.concretoEsc, s * 3.9, .55, 8.1), caixa(3.6, 1.0, .2, M.branco, s * 3.9, 1.6, 6.9), caixa(3.6, 1.0, .2, M.branco, s * 3.9, 1.6, 9.3), caixa(.2, 1.0, 2.6, M.branco, s * 2.2, 1.6, 8.1), caixa(.2, 1.0, 2.6, M.branco, s * 5.6, 1.6, 8.1)]; if (s > 0) a.forEach(lado); return a; });
const tetos = [-1, 1].map((s) => { const g = caixa(3.8, .25, 2.8, M.telhado, s * 3.9, 3.12, 8.1); if (s > 0) lado(g); return g; });
const turbinas = [];
for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
  const g = new THREE.Group(); g.position.set(s * (2.8 + i * 1.1), 1.3, 8.1); sc.add(g);
  add(cil(.42, .3, M.amarelo, 0, 0, 0, 10), g); add(caixa(.8, .1, .14, M.vermelho, 0, .18, 0), g); add(caixa(.14, .1, .8, M.vermelho, 0, .18, 0), g);
  if (s > 0) lado(g); turbinas.push(g);
}
const saida = Array.from({ length: 12 }, () => { const g = caixa(.5, .05, .16, M.espuma, 0, 0, 0, false); return g; });
const torres = [];
for (const s of [-1, 1]) for (const z of [-3.9, -6.6]) {
  const a = cil(.55, 13.6, M.concreto, s * 4.6, 6.8, z, 10), b = cil(.78, .55, M.concretoEsc, s * 4.6, 13.85, z, 10);
  if (s > 0) { lado(a); lado(b); } torres.push(a, b);
}
const PL = [[3.9, 3.25, 8.1], [8.6, TOPO + .16, 13.5], [14, TOPO + .16, 18.5], [19.4, TOPO + .16, 23.5]];
const postes = PL.slice(1).map(([x, y, z]) => {
  const g = new THREE.Group(); g.position.set(x, y, z); sc.add(g);
  add(pilar(.14, 3.2, .14, M.concretoEsc, -.35, 0, 0), g).rotation.z = -.1; add(pilar(.14, 3.2, .14, M.concretoEsc, .35, 0, 0), g).rotation.z = .1;
  add(caixa(1.6, .14, .14, M.concretoEsc, 0, 3.15, 0), g); lado(g); return g;
});
const topoPoste = (i) => (i === 0 ? [PL[0][0], PL[0][1] + .1, PL[0][2]] : [PL[i][0], PL[i][1] + 3.15, PL[i][2]]);
const fios = [0, 1, 2].map((i) => lado(tubo(topoPoste(i), topoPoste(i + 1), .035, M.preto, 5)));
const faiscas = Array.from({ length: 9 }, () => { const g = new THREE.Mesh(new THREE.IcosahedronGeometry(.16, 0), M.energia); sc.add(g); lado(g); return g; });
const LUZ = [];
[["building-skyscraper-d", 6.4, 22, 28], ["building-skyscraper-b", 5.2, 25, 25.5], ["building-skyscraper-a", 3.8, 27.5, 29],
 ["building-c", 2.2, 21.5, 32], ["building-a", 2.6, 24.5, 32.5], ["building-skyscraper-a", 3.4, 19.5, 26], ["building-c", 2.0, 28.5, 33]]
  .forEach(([n, alt, x, z], i) => {
    const g = lado(peca(n, { alt }, x, TOPO + .16, z, (h(i) - .5) * .3));
    g.traverse((k) => { if (k.isMesh) { k.material = k.material.clone(); k.material.emissive = new THREE.Color("#FFC870"); k.material.emissiveIntensity = 0; LUZ.push(k.material); } });
  });

// vertedouros (fala 9): calha de concreto no topo de cada margem, comporta e o túnel inclinado até o túnel externo
const VERT = [-1, 1].map((s) => {
  const piso = caixa(5.6, .2, 8, M.concreto, s * (CW + 2.8), NI + .1, -7, false);
  const pa = caixa(5.6, 1.5, .25, M.concreto, s * (CW + 2.8), NI + .75, -10.9), pb = caixa(5.6, 1.5, .25, M.concreto, s * (CW + 2.8), NI + .75, -3.1);
  const comp = caixa(.35, 1.3, 7.4, M.amarelo, s * (CW + .2), NI + .65, -7);
  const ag = pilar(5.3, .4, 7.4, M.agua, s * (CW + 2.8), NI + .2, -7); ag.castShadow = false;
  const poco = tubo([s * 9.6, NI, -3.4], [s * 10.4, 1.6, 8], .62, M.concreto);
  const gotas = Array.from({ length: 14 }, () => { const g = new THREE.Mesh(new THREE.IcosahedronGeometry(.17, 0), M.gota); sc.add(g); return g; });
  const R = { s, piso, pa, pb, comp, ag, poco, gotas };
  if (s > 0) [piso, pa, pb, comp, ag, poco, ...gotas].forEach(lado);
  return R;
});
const transb = Array.from({ length: 14 }, () => { const g = new THREE.Mesh(new THREE.IcosahedronGeometry(.18, 0), M.gota); sc.add(g); return g; });
const chuva = Array.from({ length: 70 }, () => caixa(.03, .7, .03, M.chuva, 0, 0, 0, false));

// ---------- tomadas (câmera) ----------
const B = D.blocos; // início de cada fala (s)
// cada fala tem duração própria: os tempos internos foram pensados para 10 s e são escalados pela duração real
const LB = B.map((b, i) => (i + 1 < B.length ? B[i + 1] : D.dur - 1.2) - b);
const bt = (i, s) => B[i] + s * LB[i] / 10;
// [início, posição inicial, alvo inicial, posição final, alvo final, modo]
// modos: false | "tun" (corte dos túneis) | "lado" (corte lateral) | "planta" | "xray" | "vert" (corte do vertedouro) | "casa" (usina sem teto)
const T = [
  [0, [0, 21, 38], [0, 4, -2], [0, 18, 31], [0, 3, -4], false],
  [bt(0, 3.6), [4.5, 4, 12], [-1, 1, 4], [4, 3, 15], [0, 1, 9], false],
  [bt(0, 7), [5, 2.5, 18], [2, .6, 7], [4, 2.2, 20], [2, .6, 12], false],
  [B[1], [3, 5, 6], [-9, 1.6, -4], [2, 5, 2], [-9, 1.6, -8], "tun"],
  [bt(1, 3.6), [0, 6, 24], [-4, 1.5, -2], [0, 5.5, 20], [-4, 1.5, -4], "tun"],
  [bt(1, 7), [0, 6.5, -31], [-8, 1.6, -16], [1, 5.5, -27], [-8, 1.6, -15], "tun"],
  [B[2], [4, 3, 4], [0, .5, -6], [3, 2.5, 6], [0, .5, -6], false],
  [bt(2, 3.4), [0, 20, 27], [0, 0, -2], [0, 17, 22], [0, 0, -2], false],
  [bt(2, 7.2), [0, 5, -9], [0, 0, 8], [0, 4.5, -6], [0, 0, 8], false],
  [B[3], [2, 1.5, 6], [-5, 9, 0], [1.5, 2, 4], [-5, 7, 0], false],
  [bt(3, 4.4), [0, 9, 6], [-6, 8.6, 0], [-1, 9.5, 4], [-6, 8.6, 0], false],
  [bt(3, 7.6), [-2, 8, 12], [5.5, 8, 0], [-3, 8, 9], [5.5, 8, 0], false],
  [B[4], [0, 15, 34], [0, 6, 0], [0, 13, 29], [0, 6, 0], false],
  [bt(4, 5), [-6, 11, 25], [0, 6, 0], [-4, 10, 21], [0, 6, 0], false],
  [B[5], [0, 24, 28], [0, 5, 0], [0, 20, 23], [0, 5, 0], false],
  [bt(5, 3.8), [-4, 3, 14], [0, 6, 0], [-2, 5, 12], [0, 6, 0], false],
  [bt(5, 6.4), [2.5, 7, 9], [0, 6, 0], [1.5, 7, 7], [0, 6, 0], "xray"],
  [B[6], [24, 6, 1], [0, 5.5, 1], [21, 6, 1.5], [0, 5.5, 1], "lado"],
  [bt(6, 4.6), [18, 9, 8], [0, 5.5, .5], [16, 7, 6], [0, 5.5, .5], "lado"],
  [bt(6, 7.6), [0, 32, 6], [0, 0, -1], [0, 30, 5], [0, 0, -1], "planta"],
  [B[7], [-10, 20, -30], [0, 5, 0], [-8, 18, -24], [0, 5, 0], false],
  [bt(7, 2.6), [20, 0, 1], [0, -1.5, 1], [18, .5, 1], [0, -1.5, 1], "lado"],
  [bt(7, 6.4), [12, -.5, 2], [0, -2, 1], [11, 0, 2.5], [0, -2, 1], "lado"],
  [B[8], [0, 21, -31], [0, 9, 0], [0, 18, -25], [0, 9, 0], false],
  [bt(8, 3.4), [4, 14, 8], [0, 12, -1], [3, 13.5, 6], [0, 12, -1], false],
  [bt(8, 5.4), [-2, 17, -16], [-8, 11.4, -7], [-3, 16, -13], [-8, 11.4, -7], false],
  [bt(8, 7.6), [-1, 9, 20], [9, 5, 2], [-1, 8, 16], [9, 5, 2], "vert"],
  [B[9], [3.9, 9, 14.5], [3.9, 1, 8.1], [3.6, 8, 12.5], [3.9, 1, 8.1], "casa"],
  [bt(9, 3.2), [6, 18, 40], [20, 13, 26], [10, 20, 44], [20, 13, 26], false],
  [bt(9, 6), [6, 16, 34], [0, 6, -4], [18, 40, 70], [2, 6, -10], false],
];
const tomada = (t) => { let k = 0; for (let i = 0; i < T.length; i++) if (t >= T[i][0]) k = i; return k; };

// ---------- etiquetas e legenda (HTML por cima) ----------
const camada = document.getElementById("etq");
const ET = D.etiquetas.map((e) => { const d = document.createElement("div"); d.className = "etq"; d.style.color = "#F2C200"; d.textContent = e.txt; camada.appendChild(d); return { ...e, el: d }; });
const leg = document.getElementById("leg");
const v3 = new THREE.Vector3();
const CORTAVEIS = [PAR[-1].baixo, PAR[1].baixo, PAR[1].alto, PAR[1].altoTopo, ...PAR[1].faixas, ...tetos];

function renderAt(t) {
  [...LADO, ...CORTAVEIS].forEach((o) => o.visible = true);
  const tb = (i, a, b) => fx(t, bt(i, a), bt(i, b));
  const k = tomada(t), shot = T[k], modo = shot[5];

  // ----- níveis da água -----
  let lvM = .8 - .5 * io(tb(1, 5, 8)) + .4 * io(tb(2, 0, 2.6));
  lvM *= 1 - io(tb(2, 6, 8.4));
  const lago = .8 + 10.2 * io(tb(7, 0, 3)) + 1.8 * io(tb(8, .6, 4.4)) - 1.0 * io(tb(8, 6.2, 9.4));
  const tw = .8 * io(tb(9, 0, 1.5));
  nivel(U1, Math.max(.8, lago)); nivel(MEIO, lvM); nivel(DES, .8); nivel(TW, tw);
  nivel(LAGO, lago > .85 ? lago : 0);
  espuma.forEach((f, i) => {
    const z = -70 + ((t * 3.6 + h(i + 3) * 140) % 140), x = -5.4 + h(i + 5) * 10.8;
    let lv = z < -13.6 ? (lago > .9 ? 0 : .8) : z < 13.6 ? ((z > 4.7 && tw > .05) ? tw : lvM) : .8;
    if (z < zU(x) + .2 && lago > .9) lv = 0;
    f.visible = lv > .25; f.position.set(x, lv + .03, z);
  });

  // ----- fala 1: o guindaste joga concreto e a correnteza leva -----
  const tq = [0, 1, 2].map((i) => bt(0, 1.0 + i * 2.0));
  let pend = -1;
  cargas.forEach((c, i) => {
    const vis = t < B[1] && (i === 0 || t >= tq[i - 1] + .6);
    c.visible = vis; if (!vis) return;
    const x = -2.5 + i * 2.5, lt = t - tq[i];
    if (lt < 0) { c.position.set(x, 17, 2); c.rotation.set(0, 0, 0); pend = i; return; }
    if (lt < .6) { const u = lt / .6; c.position.set(x, 17 - (17 - .45) * u * u, 2); return; }
    const s = lt - .6; c.position.set(x + Math.sin(s * 1.3) * .5, .45 - Math.min(.25, s * .1), 2 + s * 3.4); c.rotation.set(s * .9, s * .6, s * .3);
  });
  cabo.visible = pend >= 0;
  if (pend >= 0) { const c = cargas[pend]; cabo.position.set(c.position.x, c.position.y + .65, 2); cabo.scale.y = 20.5 - (c.position.y + .65); }
  GRUA.visible = t < B[6];
  GRUA.rotation.y = Math.sin(t * .35) * .05;

  // ----- fala 2: túneis -----
  const fur = tb(1, .6, 5.2), fluxoT = t >= bt(1, 5) && t < bt(7, 1.5);
  const verteOn = t >= bt(8, 7.0) && t < B[9] + 3;
  TUN.forEach((T_, j) => {
    const p = io(cl(fur * 1.15 - (T_.externo ? .15 : 0)));
    T_.tubo.visible = p > .01; T_.tubo.scale.z = Math.max(.001, p);
    T_.broca.visible = p > .01 && p < 1; T_.broca.position.z = -T_.L + 2 * T_.L * p;
    T_.portais.forEach((o) => o.visible = p >= 1);
    const corre = fluxoT || (verteOn && T_.externo);
    T_.agua.visible = corre;
    T_.gotas.forEach((g, n) => {
      g.visible = corre; if (!corre) return;
      const u = (t * .11 + n / 7 + j * .13) % 1, s = T_.s;
      g.position.fromArray(caminho([[s * 5.5, 1.1, -T_.L], [s * T_.xt, 1.1, -T_.L], [s * T_.xt, 1.1, T_.L], [s * 5.5, 1.1, T_.L]], u < .1 ? u / .3 : u > .9 ? 2 / 3 + (u - .9) / .3 : 1 / 3 + (u - .1) / 2.4));
    });
  });

  // ----- fala 3: ensecadeiras -----
  const en = tb(2, 3.2, 6);
  ENS.forEach((g, i) => { let sy = io(cl(en * 1.25 - (i >> 1) * .25)); if (i >= 2) sy *= 1 - io(tb(9, 0, 1.5)); g.visible = sy > .01; g.scale.y = Math.max(.001, sy); });

  // ----- fala 4: pedras soltas e escaladores -----
  pedras.forEach((p, i) => {
    const u = p.userData, x0 = u.s * (CW - .25), n = nuvens[i];
    n.visible = false; p.visible = t < B[4]; p.scale.setScalar(1);
    p.position.set(x0, u.y, u.z); p.rotation.set(i, i * 2, 0);
    if (!p.visible || t < B[3]) return;
    if (u.cai) {
      const lt = t - bt(3, .4 + u.k * .55); if (lt <= 0) return;
      const td = .9;
      if (lt < td) { const a = lt / td; p.position.set(x0 - u.s * 1.6 * a, u.y - (u.y - .45) * a * a, u.z); p.rotation.x += lt * 5; }
      else { const b = lt - td; p.position.set(x0 - u.s * (1.6 + .7 * Math.min(b, .5)), .45 + Math.max(0, 1.4 * b - 4.9 * b * b), u.z); p.rotation.x += td * 5 + Math.min(b, .4) * 3; }
    } else {
      const lt = t - bt(3, 5.0 + u.k * .55); if (lt <= 0) return;
      p.position.set(x0 - u.s * lt * 3, u.y + lt * 2 - 4.9 * lt * lt, u.z); p.scale.setScalar(Math.max(.001, 1 - lt * 1.3)); p.visible = lt < .75;
      n.visible = lt < .7; n.position.set(x0 - u.s * .2, u.y, u.z); n.scale.setScalar(.2 + pop(cl(lt / .25)) * 1.1); n.material.opacity = 1 - cl(lt / .7);
    }
  });
  const desce = io(tb(3, 3.4, 5));
  escal.forEach((e) => {
    e.g.visible = t >= bt(3, 3.2) && t < B[4];
    const len = .3 + (TOPO - .3 - e.y) * desce;
    e.corda.position.y = -len; e.corda.scale.y = len; e.corpo.position.y = -len - .2;
    e.g.rotation.z = Math.sin(t * 2.2 + e.i) * .05 * e.s; e.corpo.rotation.y = -e.s * Math.PI / 2;
  });

  // ----- fala 5: um despejo só, esquenta e racha -----
  const mp = tb(4, .2, 2.6), some = io(tb(5, 0, 1.2));
  mono.forEach((g, r) => { const sy = io(cl(mp * NR - r)) * (1 - some); g.visible = t >= B[4] && sy > .01; g.scale.y = Math.max(.001, sy); });
  M.quente.emissiveIntensity = io(tb(4, 2.6, 5.2)) * .6 * (1 - some);
  rachas.forEach((g, i) => { const p = pop(tb(4, 6 + i * .25, 6.6 + i * .25)); g.visible = p > 0 && t < B[5]; g.scale.set(1, Math.max(.001, p), 1); });

  // ----- fala 6: blocos e canos de água gelada -----
  const xray = modo === "xray";
  [M.D1, M.D2].forEach((m) => { m.opacity = xray ? .25 : 1; m.depthWrite = !xray; });
  const b0 = bt(5, .8), b1 = bt(5, 6.2);
  blocos.forEach((g, i) => {
    const { c, r } = g.userData, ordem = r * NC + (c % 2) * (NC / 2) + (c >> 1);
    const s0 = b0 + ordem / (NC * NR) * (b1 - b0), p = io(fx(t, s0, s0 + .45));
    g.visible = p > 0; g.scale.y = Math.max(.001, p);
    canos[i].visible = xray && p >= 1;
  });
  gelo.forEach((g, i) => {
    g.visible = xray; if (!xray) return;
    const r = i % NR, x = -CW + ((t * 2.2 + h(i + 70) * 12) % 12), y = r * RH + RH / 2;
    g.position.set(x, y, zU(x) + dEsp(y) / 2);
  });

  // ----- fala 7: pressão e arco -----
  setas.forEach((g, i) => {
    const p = pop(tb(6, .3 + i * .35, .7 + i * .35)); g.visible = p > 0 && t < B[7];
    g.scale.setScalar(Math.max(.001, p)); g.scale.z = Math.max(.001, p * (1 + Math.sin(t * 6 + i) * .06));
  });
  setasArco.forEach((g, i) => { const p = pop(tb(6, 7.6 + i * .3, 8.1 + i * .3)); g.visible = p > 0 && t < B[7]; g.scale.setScalar(Math.max(.001, p)); });

  // ----- fala 8: infiltração, cortina de cimento e poços -----
  const cort = io(tb(7, 5.2, 7));
  const sOn = t >= bt(7, 2.4) && t < B[8];
  infil.forEach((g, i) => {
    g.visible = sOn; if (!sOn) return;
    let u = ((t - bt(7, 2.4)) * .3 + i / infil.length) % 1; let esc = 1;
    if (cort > .6) { u *= .42; if (u > .37) esc = Math.max(.001, (.42 - u) / .05); }
    const P = caminho([[XC, -.1, -6], [XC, -2.4, -3], [XC, -2.4, 4.5], [XC, -.1, 6.5]], u);
    g.position.fromArray(P); g.scale.setScalar(esc);
  });
  cortina.visible = cort > 0 && t < B[8]; cortina.scale.y = Math.max(.001, cort);
  haste.visible = cort > 0 && cort < 1; haste.position.y = -5.2 * cort; haste.scale.y = 5.2 * cort + .4;
  pocos.forEach((g, i) => { const p = pop(tb(7, 7.2 + i * .45, 7.6 + i * .45)); g.visible = p > 0 && t < B[8]; g.scale.y = Math.max(.001, p); });

  // ----- fala 9: tempestade, transbordo e vertedouros -----
  const tempo = cl(io(tb(8, 0, 1.2)) - io(tb(8, 8.6, 10)));
  sc.background.copy(CEU).lerp(CEU_T, tempo); sc.fog.color.copy(NEV).lerp(NEV_T, tempo);
  chuva.forEach((g, i) => {
    g.visible = tempo > .05; if (!g.visible) return;
    g.position.set(-14 + h(i + 1) * 28, 26 - ((t * 20 + h(i) * 26) % 26), -20 + h(i + 2) * 30);
  });
  const sobre = lago > CREST + .05;
  transb.forEach((g, i) => {
    g.visible = sobre; if (!sobre) return;
    const x = -5.2 + h(i + 90) * 10.4, u = (t * .7 + h(i + 91)) % 1;
    if (u < .25) { g.position.set(x, CREST + .12, zU(x) + u * 4 * 1.3); }
    else { const y = CREST * (1 - (u - .25) / .75); g.position.set(x, y + .12, zU(x) + dEsp(Math.min(CREST, y + RH)) + .1); }
  });
  const abre = io(tb(8, 5.0, 6.2)), comporta = io(tb(8, 6.6, 7.2));
  VERT.forEach((V, j) => {
    const P = PAR[V.s];
    P.tampa.visible = abre < .99; P.tampa.scale.y = Math.max(.001, 1 - abre);
    P.tampaTopo.visible = abre < .98; P.tampaTopo.position.y = NI + (TOPO - NI) * (1 - abre) + .08;
    const c = pop(tb(8, 6.0, 6.6));
    [V.piso, V.pa, V.pb].forEach((o) => { o.visible = c > 0; o.scale.y = Math.max(.001, c); });
    V.poco.visible = t >= bt(8, 6.0);
    V.comp.visible = c > 0 && comporta < 1; V.comp.position.y = NI + .65 - 1.3 * comporta;
    V.ag.visible = verteOn;
    V.gotas.forEach((g, n) => {
      g.visible = verteOn; if (!verteOn) return;
      const s = V.s, u = (t * .16 + n / 14 + j * .05) % 1;
      g.position.fromArray(caminho([[s * 4.6, lago - .1, -7], [s * 9.4, NI + .5, -7], [s * 9.6, NI + .3, -3.4], [s * 10.4, 1.6, 8], [s * 10.4, 1.1, 17.5], [s * 5.5, 1.1, 17.5], [s * 2.5, .9, 24]], u));
    });
  });

  // ----- fala 10: usina, linha de energia e cidade -----
  const usina = t >= B[6];
  [...asas, ...tetos].forEach((o) => o.visible = usina); dentro.forEach((o) => o.visible = false);
  torres.forEach((o) => o.visible = usina);
  turbinas.forEach((g, i) => { g.visible = usina; g.rotation.y = t > bt(9, .3) ? (t - bt(9, .3)) * (5 + i * .3) : 0; });
  const sOut = t >= bt(9, .6);
  saida.forEach((g, i) => {
    g.visible = sOut; if (!sOut) return;
    const x = (i % 2 ? 1 : -1) * (2.4 + h(i + 120) * 3), z = 9.6 + ((t * 3 + h(i + 121) * 16) % 16);
    g.position.set(x, .83, z);
  });
  const linha = pop(tb(9, 2.4, 3.2));
  postes.forEach((g) => { g.visible = linha > 0; g.scale.set(1, Math.max(.001, linha), 1); });
  fios.forEach((g) => g.visible = linha >= 1);
  const luzOn = t >= bt(9, 3.6);
  faiscas.forEach((g, i) => {
    g.visible = luzOn; if (!luzOn) return;
    const u = (t * .35 + i / faiscas.length) % 1;
    g.position.fromArray(caminho([topoPoste(0), topoPoste(1), topoPoste(2), topoPoste(3), [22, TOPO + 2.5, 27]], u));
  });
  const acende = io(tb(9, 4.0, 5.2));
  LUZ.forEach((m) => m.emissiveIntensity = acende * .3);

  // ----- vistas em corte -----
  if (modo === "lado") LADO.forEach((o) => o.visible = false);
  if (modo === "tun") { PAR[-1].baixo.visible = false; PAR[1].baixo.visible = false; }
  if (modo === "vert") [PAR[1].baixo, PAR[1].alto, PAR[1].altoTopo, ...PAR[1].faixas].forEach((o) => o.visible = false);
  if (modo === "casa") { [...tetos, ...asas, fios[0]].forEach((o) => o.visible = false); dentro.forEach((o) => o.visible = usina && !(o.position.x > 0 && modo === "lado")); }
  const plano = modo === "lado";
  [cortina, haste, ...pocos, ...infil].forEach((o) => { if (!plano) o.visible = false; });

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
