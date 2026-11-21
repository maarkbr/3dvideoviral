import * as THREE from "three";
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

// =====================================================================================
// MUNDO: "Como construir um túnel debaixo do mar" (vídeo longo, 10 falas).
// Um diorama em corte do estreito: Inglaterra à esquerda (x < 0), França à direita (x > 0).
// A face do corte fica em z = ZF; tudo que está atrás dela é rocha, mar e terra.
// O túnel da frente é um meio tubo (a metade de trás), visto pelo corte. Na vista de cima ("planta")
// a rocha de cima some e aparecem os três túneis (dois de trem e o de serviço no meio).
// =====================================================================================
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

await carregaPecas([
  "assets/pecas/watercraft-kit/ship-cargo-a.glb", "assets/pecas/watercraft-kit/ship-ocean-liner-small.glb",
  "assets/pecas/watercraft-kit/boat-tug-a.glb",
  "assets/pecas/train-kit/train-electric-bullet-a.glb", "assets/pecas/train-kit/train-electric-bullet-b.glb",
  "assets/pecas/train-kit/train-electric-bullet-c.glb", "assets/pecas/train-kit/train-carriage-dirt.glb",
  "assets/pecas/train-kit/train-diesel-a.glb", "assets/pecas/nature-kit/tree_default.glb",
  "assets/pecas/city-kit-suburban/building-type-a.glb", "assets/pecas/city-kit-suburban/building-type-c.glb",
]);

// ajustes do motor para um mundo mais largo
Object.assign(sol.shadow.camera, { left: -46, right: 46, top: 40, bottom: -40, near: 1, far: 140 });
sol.position.set(18, 48, 30); sol.shadow.camera.updateProjectionMatrix();
sc.fog.near = 95; sc.fog.far = 230;
sol.shadow.bias = -0.0004; sol.shadow.normalBias = .02;

const ZF = -1, ZS = -2.3, ZB = -16, BASE = -22, MAR = 18, R = 1, XL = 40, CWID = 80 / 130, XP = 14.4;
const Z_A = ZF, Z_S = -3.4, Z_B = -5.8; // os três túneis (vista de cima)
const N = {
  giz: mat("#EFE8D4"), marga: mat("#8FA6BA", { emissive: "#2C8BFF", emissiveIntensity: 0 }), argila: mat("#6F6253"),
  grama: mat("#6DBE45"), gramaF: mat("#7FC653"), areiaF: mat("#D9C08A"), fundoMar: mat("#B9A27A"),
  anel: mat("#DADDE1", { side: THREE.DoubleSide }), anel2: mat("#A3A9B0", { side: THREE.DoubleSide }),
  bruta: mat("#4F5E6E", { side: THREE.DoubleSide }), graute: mat("#7E858D", { side: THREE.DoubleSide }),
  tbm: mat("#F4C224"), cabeca: mat("#4A4D52"), laser: mat("#FF3B30", { emissive: "#FF2010", emissiveIntensity: 2.2 }),
  fumaca: mat("#4E535B", { transparent: true, opacity: .85 }),
  ar: mat("#E8F6FF", { transparent: true, opacity: .5, emissive: "#BFE9FF", emissiveIntensity: .5 }),
  camara: mat("#5FB8FF", { transparent: true, opacity: .55, emissive: "#2F9BFF", emissiveIntensity: .8 }),
  seta: mat("#7FD6FF", { emissive: "#2FA8FF", emissiveIntensity: 1.2 }), rota: mat("#FFD21F", { emissive: "#FFB800", emissiveIntensity: .9 }),
  agua: mat("#2E8FD6", { transparent: true, opacity: .84 }), aguaF: mat("#2E8FD6"),
  pele: mat("#F0C8A0"), roupa: mat("#E07A2E"), roupa2: mat("#3C8DDC"), porta: mat("#F3EFE6"),
};

// ---------- o perfil: túnel, leito do mar e camadas ----------
const PT = [[-38, 4.2], [-20, -9], [-10, -11], [10, -11], [20, -9], [38, 1.2]];
const yT = (x) => { if (x <= PT[0][0]) return PT[0][1]; for (let i = 0; i < PT.length - 1; i++) { const [x0, y0] = PT[i], [x1, y1] = PT[i + 1]; if (x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0); } return PT[PT.length - 1][1]; };
const incl = (x) => Math.atan2(yT(x + .05) - yT(x - .05), .1);
const fundo = (x) => -4.3 + 2.0 * Math.pow(Math.abs(x) / MAR, 2);
const topo = (x) => x < -MAR ? 5 : x > MAR ? 2 : fundo(x);
const margaTop = (x) => Math.min(topo(x) - 1.0, yT(x) + 2.4);
const margaBot = (x) => yT(x) - 2.6;

// guarda caixas por material, para juntar tudo em poucas malhas
const BALDES = { fixo: new Map(), topo: new Map() };
function poe(balde, m, x0, x1, y0, y1, z0, z1) {
  if (y1 - y0 < .005) return;
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  if (!BALDES[balde].has(m)) BALDES[balde].set(m, []); BALDES[balde].get(m).push(g);
}
// pinta uma faixa vertical com as camadas certas
function faixa(balde, x0, x1, y0, y1, z0, z1) {
  const xc = (x0 + x1) / 2, tp = topo(xc), terra = Math.abs(xc) > MAR;
  const cortes = [[BASE, margaBot(xc), N.argila], [margaBot(xc), margaTop(xc), N.marga], [margaTop(xc), tp - (terra ? .35 : .15), N.giz], [tp - (terra ? .35 : .15), tp, terra ? (xc < 0 ? N.grama : N.gramaF) : N.areiaF]];
  for (const [a, b, m] of cortes) poe(balde, m, x0, x1, Math.max(a, y0), Math.min(b, y1), z0, z1);
}
const matNoPonto = (x, y) => y < margaBot(x) ? N.argila : y < margaTop(x) ? N.marga : N.giz;

// colunas de 0,8 de largura: faixa da frente (com o buraco do túnel) e faixa de trás
const COL = [];
const TESTE = [-15, -9], YTE = -5.8, RTE = .6; // o túnel de teste da fala 1 (na rocha errada)
for (let x0 = -XL; x0 < XL - .001; x0 += CWID) {
  const x1 = x0 + CWID, xc = (x0 + x1) / 2, tp = topo(xc), y = yT(xc), noTunel = xc > -38.4 && xc < 38.4, yMin = Math.min(yT(x0), yT(x1)), yMax = Math.max(yT(x0), yT(x1)), meio = Math.abs(xc) < XP;
  const c = { xc, y, noTunel, meio, fill: null, fillT: null, casca: null, graute: null, trio: [] };
  // faixa de trás
  if (meio) { faixa("fixo", x0, x1, BASE, yMin - R, ZB, ZS); faixa("topo", x0, x1, yMin - R, tp, ZB, ZS); }
  else faixa("fixo", x0, x1, BASE, tp, ZB, ZS);
  // faixa da frente, com os buracos
  const buracos = [];
  if (noTunel) buracos.push([yMin - R, Math.min(yMax + R, tp), "T"]);
  if (xc > TESTE[0] && xc < TESTE[1]) buracos.push([YTE - RTE, YTE + RTE, "E"]);
  buracos.sort((a, b) => a[0] - b[0]);
  let yy = BASE;
  for (const [a, b, id] of buracos) {
    faixa(meio && yy >= yMin - R - .001 ? "topo" : "fixo", x0, x1, yy, a, ZS, ZF);
    const m = matNoPonto(xc, (a + b) / 2), f = pilar(CWID, b - a, ZF - ZS, m, xc, a, (ZS + ZF) / 2); f.castShadow = false;
    if (id === "T") c.fill = f; else c.fillT = f;
    yy = b;
  }
  faixa(meio && yy >= yMin - R - .001 ? "topo" : "fixo", x0, x1, yy, tp, ZS, ZF);
  COL.push(c);
}
const TOPO_M = [];
for (const [nome, mapa] of Object.entries(BALDES)) for (const [m, geos] of mapa) {
  const g = new THREE.Mesh(mergeGeometries(geos), m); g.castShadow = true; g.receiveShadow = true; sc.add(g);
  if (nome === "topo") TOPO_M.push(g);
}

// meio tubo (metade de trás, aberta para a câmera) ou (metade de baixo, aberta para cima)
function meioTubo(x0, x1, yf, z, r, m, deBaixo = false) {
  const ya = yf(x0), yb = yf(x1), len = Math.hypot(x1 - x0, yb - ya) + .03;
  const geo = new THREE.CylinderGeometry(r, r, len, 14, 1, true, deBaixo ? 0 : Math.PI / 2, Math.PI);
  geo.rotateZ(-Math.PI / 2);
  const g = new THREE.Mesh(geo, m); g.position.set((x0 + x1) / 2, (ya + yb) / 2, z); g.rotation.z = Math.atan2(yb - ya, x1 - x0);
  g.castShadow = false; g.receiveShadow = true; sc.add(g); return g;
}
const TRIO = [];
COL.forEach((c, i) => {
  if (!c.noTunel) return;
  const x0 = c.xc - CWID / 2, x1 = c.xc + CWID / 2;
  c.casca = meioTubo(x0, x1, yT, ZF, R, N.bruta); c.anel = i % 2 ? N.anel : N.anel2;
  c.graute = meioTubo(x0, x1, yT, ZF - .001, R + .12, N.graute);
  if (c.meio) for (const [z, r] of [[Z_A, R], [Z_S, .64], [Z_B, R]]) {
    const g = meioTubo(x0, x1, (x) => yT(x) - (R - r), z, r, i % 2 ? N.anel : N.anel2, true); TRIO.push(g);
  }
});
// o túnel de teste (fala 1)
const casTeste = meioTubo(TESTE[0], TESTE[1], () => YTE, ZF, RTE, N.bruta);
const aguaTeste = pilar(TESTE[1] - TESTE[0], 2 * RTE, .6, N.aguaF, (TESTE[0] + TESTE[1]) / 2, YTE - RTE, ZF - .3);
const rachaT = [[-13.6, fundo(-13.6)], [-12.9, -4.4], [-13.3, -4.9], [-12.6, YTE + .5]].map((p) => [p[0], p[1], ZF + .02]);
const rachasTeste = rachaT.slice(0, -1).map((p, i) => tubo(p, rachaT[i + 1], .07, M.preto, 5));
const rachaT2 = [[-10.6, fundo(-10.6)], [-10.1, -4.6], [-10.6, YTE + .5]].map((p) => [p[0], p[1], ZF + .02]);
rachasTeste.push(...rachaT2.slice(0, -1).map((p, i) => tubo(p, rachaT2[i + 1], .06, M.preto, 5)));

// mar: água na frente do corte e o mar que segue para trás
const AGUA = [caixa(2 * MAR, 4.5, ZF - ZB, N.agua, 0, -2.25, (ZF + ZB) / 2, false), caixa(2 * MAR, 4.5, 60, N.agua, 0, -2.25, ZB - 30, false)];
AGUA.forEach((g) => g.receiveShadow = false);
caixa(2 * MAR, 1.8, 60, N.fundoMar, 0, -5.2, ZB - 30);
// terra que segue para trás
caixa(XL - MAR, 10.65, 60, N.giz, -(XL + MAR) / 2, -.68, ZB - 30); caixa(XL - MAR, .35, 60, N.grama, -(XL + MAR) / 2, 4.83, ZB - 30);
caixa(XL - MAR, 7.65, 60, N.giz, (XL + MAR) / 2, -2.18, ZB - 30); caixa(XL - MAR, .35, 60, N.gramaF, (XL + MAR) / 2, 1.83, ZB - 30);

// casas, árvores e navios
const ENFEITE = [];
[[-34, -6, 0], [-30, -9, .4], [-37, -12, -.3], [-25, -7, .2], [-27, -13, 0]].forEach(([x, z, r], i) => ENFEITE.push(peca(i % 2 ? "building-type-a" : "building-type-c", { larg: 2.2 }, x, 5, z, r)));
[[30, -7, 0], [35, -10, .3], [25, -12, -.2], [37, -5, .1]].forEach(([x, z, r], i) => ENFEITE.push(peca(i % 2 ? "building-type-c" : "building-type-a", { larg: 2.2 }, x, 2, z, r)));
for (let i = 0; i < 18; i++) { const lado = i % 2 ? 1 : -1, x = lado * (21 + h(i) * 17), z = -3.5 - h(i + 9) * 22; ENFEITE.push(peca("tree_default", { alt: 1.4 + h(i + 4) * .8 }, x, lado < 0 ? 5 : 2, z, h(i) * 6)); }
const NAVIOS = [
  { g: peca("ship-cargo-a", { comp: 7 }, 0, -.5, -9, Math.PI / 2), x0: -10, v: .16, z: -9 },
  { g: peca("ship-ocean-liner-small", { comp: 6 }, 0, -.45, -13, -Math.PI / 2), x0: 9, v: -.13, z: -13 },
  { g: peca("boat-tug-a", { comp: 2.2 }, 0, -.25, -5.5, Math.PI / 2), x0: -4, v: .1, z: -5.5 },
];

// pessoinha
function pessoa(roupa = N.roupa) {
  const g = new THREE.Group(); sc.add(g);
  add(pilar(.2, .28, .14, roupa, 0, .14, 0), g); add(pilar(.08, .14, .08, M.preto, -.05, 0, 0), g); add(pilar(.08, .14, .08, M.preto, .05, 0, 0), g);
  const cab = new THREE.Mesh(new THREE.IcosahedronGeometry(.085, 0), N.pele); cab.position.y = .52; g.add(cab);
  const cap = caixa(.19, .06, .19, M.amarelo, 0, .6, 0); add(cap, g);
  return g;
}

// tuneladora: corpo amarelo, cabeça de corte que gira e o trem de apoio atrás
function tuneladora() {
  const g = new THREE.Group(); sc.add(g);
  const corpo = cil(R * .9, 2.6, N.tbm, 0, 0, 0, 14); corpo.rotation.z = Math.PI / 2; corpo.position.x = -1.3; add(corpo, g);
  const anelF = cil(R * .93, .2, M.preto, 0, 0, 0, 14); anelF.rotation.z = Math.PI / 2; anelF.position.x = -.25; add(anelF, g);
  const cab = new THREE.Group(); g.add(cab); cab.position.x = -.05;
  const disco = cil(R * .95, .22, N.cabeca, 0, 0, 0, 14); disco.rotation.z = Math.PI / 2; add(disco, cab);
  for (let k = 0; k < 4; k++) { const b = caixa(.1, 1.8, .16, M.amarelo, 0, 0, 0); b.position.x = .13; b.rotation.x = k * Math.PI / 4; add(b, cab); }
  const ponta = cil(.12, .3, M.concreto, 0, 0, 0, 6, .02); ponta.rotation.z = -Math.PI / 2; ponta.position.x = .2; add(ponta, cab);
  for (let k = 0; k < 3; k++) add(caixa(1.3, .55, .9, k % 2 ? M.laranja : M.concretoEsc, -3.3 - k * 1.5, -.5, 0), g);
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(R * .98, R * .98, .7, 16), N.camara); cam.rotation.z = Math.PI / 2; cam.position.x = .45; g.add(cam);
  const setas = [0, 1, 2, 3].map((k) => { const s = new THREE.Mesh(new THREE.ConeGeometry(.2, .55, 6), N.seta); s.rotation.z = -Math.PI / 2; s.position.set(1.0, Math.cos(k * Math.PI / 2) * .5, Math.sin(k * Math.PI / 2) * .5); g.add(s); return s; });
  return { g, cab, cam, setas };
}
const TE = tuneladora(), TF = tuneladora();
const poeNoTunel = (o, x, dir, z = ZF, chao = 0) => { o.position.set(x, yT(x) + chao, z); o.rotation.set(0, dir > 0 ? 0 : Math.PI, dir > 0 ? incl(x) : -incl(x)); };

// o operário com picareta (fala 3)
const OPER = pessoa(); OPER.scale.setScalar(1.6);
const pic = new THREE.Group(); OPER.add(pic); pic.position.set(.12, .38, 0);
add(caixa(.04, .5, .04, M.terraEsc, 0, .2, 0), pic); add(caixa(.3, .05, .05, M.concreto, 0, .45, 0), pic);
const lascas = Array.from({ length: 8 }, () => caixa(.12, .12, .12, N.giz, 0, 0, 0, false));

// rota tracejada, marga acesa e a cota de 75 m (fala 2)
const ROTA = []; for (let x = -37.5; x <= 37.5; x += 1.5) ROTA.push(caixa(.7, .16, .1, N.rota, x, yT(x), ZF + .08, false));
ROTA.forEach((g, i) => g.rotation.z = incl(g.position.x));
const COTA = pilar(.12, 11, .1, N.rota, 0, -11, ZF + .1); const cotaT = [caixa(.8, .1, .1, N.rota, 0, 0, ZF + .1, false), caixa(.8, .1, .1, N.rota, 0, -11, ZF + .1, false)];

// água entrando pelas rachaduras do lado francês (fala 4)
const RACHAS_F = [];
for (const [xa, k] of [[17.5, 0], [19.5, 1], [21.5, 2]]) {
  const P = [[xa, fundo(xa)], [xa - .5, fundo(xa) - 1.8], [xa + .3, yT(xa) + 2.6], [xa - .2, yT(xa) + 1.05]].map((p) => [p[0], p[1], ZF + .02]);
  P.slice(0, -1).forEach((p, i) => RACHAS_F.push(tubo(p, P[i + 1], .07, M.preto, 5)));
}
const JATOS = Array.from({ length: 42 }, () => caixa(.13, .13, .13, M.gota, 0, 0, 0, false));
const POCA = pilar(1, .25, 1.3, N.aguaF, 0, 0, ZF - .3);

// pedaços que caem do teto e o graute (fala 5)
const CAIDA = Array.from({ length: 12 }, (_, i) => { const g = new THREE.Mesh(new THREE.IcosahedronGeometry(.28 + h(i) * .22, 0), N.marga); g.castShadow = true; sc.add(g); return g; });

// vagões de entulho e o monte que vira terra nova (fala 6)
const VAGOES = [peca("train-diesel-a", { comp: 1.3 }, 0, 0, 0, Math.PI / 2), ...[0, 1, 2].map(() => peca("train-carriage-dirt", { comp: 1.2 }, 0, 0, 0, Math.PI / 2))].map((p) => { const o = new THREE.Group(); sc.add(o); add(p, o); return o; });
const MONTE = pilar(4.8, 2.6, ZF - ZB, N.giz, -15.6, -2.3, (ZF + ZB) / 2); const GRAMA_N = pilar(4.8, .3, ZF - ZB, N.grama, -15.6, .3, (ZF + ZB) / 2);
const MONTE_Z = pilar(4.8, 2.6, 14, N.giz, -15.6, -2.3, ZB - 7); const GRAMA_NZ = pilar(4.8, .3, 14, N.grama, -15.6, .3, ZB - 7);

// laser e o encontro (fala 7)
const LASERS = [cil(.05, 1, N.laser), cil(.05, 1, N.laser)]; const ALVO = [caixa(.1, .5, .5, N.laser, 0, 0, 0, false), caixa(.1, .5, .5, N.laser, 0, 0, 0, false)];
const ESTILH = Array.from({ length: 10 }, () => caixa(.28, .28, .28, N.marga, 0, 0, 0));

// trem (falas 8 e 10)
const TREM = ["train-electric-bullet-a", "train-electric-bullet-b", "train-electric-bullet-b", "train-electric-bullet-c"].map((n) => {
  const p = peca(n, { comp: 1.45 }, 0, 0, 0, Math.PI / 2);
  const o = new THREE.Group(); sc.add(o); add(p, o); return o;
});
const AR = caixa(1, 1.5, 1.5, N.ar, 0, 0, ZF, false);
const SETAS_AR = Array.from({ length: 5 }, () => { const s = new THREE.Mesh(new THREE.ConeGeometry(.18, .5, 6), N.seta); s.rotation.z = -Math.PI / 2; sc.add(s); return s; });

// dutos de alívio (fala 8): ligam os dois túneis de trem por cima do túnel de serviço
const DUTOS = [-8, -4, 0, 4, 8].map((x) => {
  const g = new THREE.Group(); sc.add(g); g.position.set(x, 0, 0);
  const P = [[0, -11.2, Z_A - .7], [0, -9.7, Z_A - 1.4], [0, -9.7, Z_B + 1.4], [0, -11.2, Z_B + .7]];
  P.slice(0, -1).forEach((p, i) => add(tubo(p, P[i + 1], .26, M.concreto, 8), g));
  return g;
});
const BOLHAS = Array.from({ length: 20 }, () => { const g = new THREE.Mesh(new THREE.IcosahedronGeometry(.13, 0), N.ar); sc.add(g); return g; });

// fogo e o túnel de serviço (fala 9)
const PASSAG = [-9, -3, 3, 9].flatMap((x) => [[x, Z_A, Z_S], [x, Z_B, Z_S]].map(([px, za, zb]) => {
  const g = new THREE.Group(); sc.add(g);
  const zc = (za + zb) / 2, len = Math.abs(za - zb) - 1.3;
  add(pilar(.6, .7, len, M.concretoEsc, px, -11.95, zc), g);
  const porta = pilar(.5, .55, .06, N.porta, px, -11.9, zb + (za > zb ? .66 : -.66)); add(porta, g);
  return { g, porta, za, zb };
}));
const FUMACA = Array.from({ length: 34 }, (_, i) => { const g = new THREE.Mesh(new THREE.IcosahedronGeometry(.35 + h(i) * .3, 0), N.fumaca); sc.add(g); return g; });
const AR_S = Array.from({ length: 8 }, () => { const s = new THREE.Mesh(new THREE.ConeGeometry(.16, .45, 6), N.seta); sc.add(s); return s; });
const GENTE = [0, 1, 2, 3].map((i) => pessoa(i % 2 ? N.roupa2 : N.roupa));
const RODAS = [];

// ---------- tomadas (câmera) ----------
const B = D.blocos;
const LB = B.map((b, i) => (i + 1 < B.length ? B[i + 1] : D.dur - 1.2) - b);
const bt = (i, s) => B[i] + s * LB[i] / 10;
// [início, posição inicial, alvo inicial, posição final, alvo final, modo]   modos: false | "planta"
const T = [
  [0, [40, 11, 22], [-6, -4, -8], [34, 9, 20], [-8, -5, -8], false],
  [bt(0, 3.6), [-40, 11, 22], [6, -4, -8], [-34, 9, 20], [8, -5, -8], false],
  [bt(0, 6.2), [-12.4, -3, 13], [-12, -5.5, -1], [-11.6, -3.5, 11.5], [-12, -5.7, -1], false],
  [bt(1, 0), [-38, 6, 24], [-2, -8, -3], [-31, 3, 22], [0, -9, -3], false],
  [bt(1, 5.5), [6, -2.5, 17], [0, -6, -1], [4, -3.5, 15], [0, -6.5, -1], false],
  [bt(2, 0), [-33.4, 7.6, 5.6], [-37.4, 5.2, -1.6], [-33, 7.2, 4.6], [-37.2, 5.1, -1.6], false],
  [bt(2, 4), [-30, 6, 12], [-36, 2.8, -1], [-25, 3, 12], [-31, -.6, -1], false],
  [bt(2, 7.2), [33, 3, 14], [27, -3, -1], [25, -1, 13], [19, -7, -1], false],
  [bt(3, 0), [24, -4.5, 10.5], [18.5, -8, -1], [22, -5.5, 9.5], [18, -8.5, -1], false],
  [bt(3, 4.4), [9.4, -8, 6.4], [13.5, -10.2, -1], [10.2, -8.8, 5.6], [13.2, -10.3, -1], false],
  [bt(4, 0), [-15.5, -4.2, 9.5], [-21, -8.2, -1.5], [-16.5, -4.8, 8.5], [-21.4, -8.4, -1.5], false],
  [bt(4, 4), [-20, -4, 11], [-19, -8.6, -1.5], [-28, 1, 11], [-27, -3, -1.5], false],
  [bt(5, 0), [-22, 0, 10], [-26, -4, -1.5], [-30, 6, 10], [-34, 1.5, -1.5], false],
  [bt(5, 3.4), [-5, 8, 13], [-16.5, 0, -6], [-7, 10, 15], [-16.5, 0, -7], false],
  [bt(6, 0), [0, -6.8, 14.5], [0, -10.3, -1], [0, -7.8, 11.5], [0, -10.6, -1], false],
  [bt(6, 5.4), [2.4, -9, 6], [0, -10.9, -1], [1.6, -9.6, 4.8], [0, -10.9, -1], false],
  [bt(7, 0), [-6, -8.4, 8.5], [-8, -10.6, -1], [-1, -8.8, 8.5], [-3, -10.6, -1], false],
  [bt(7, 4.6), [-16, 5, -2.6], [4, -11.6, -3.4], [-13, 3, -2], [6, -11.6, -3.4], "planta"],
  [bt(8, 0), [16, 4, -1.4], [-4, -11.6, -3.4], [13, 2.4, -2.4], [-5, -11.6, -3.4], "planta"],
  [bt(8, 5), [6.2, -8.4, .8], [2.6, -11.8, -4.2], [5.6, -8.9, .4], [2.4, -11.8, -4.2], "planta"],
  [bt(9, 0), [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], "segue"],
  [bt(9, 5), [-18, 16, 38], [0, -5, -8], [-36, 40, 78], [2, -5, -10], false],
];
const tomada = (t) => { let k = 0; for (let i = 0; i < T.length; i++) if (t >= T[i][0]) k = i; return k; };

// ---------- etiquetas e legenda (HTML por cima) ----------
const camada = document.getElementById("etq");
const ET = D.etiquetas.map((e) => { const d = document.createElement("div"); d.className = "etq"; d.style.color = "#F2C200"; d.textContent = e.txt; camada.appendChild(d); return { ...e, el: d }; });
const leg = document.getElementById("leg");
const v3 = new THREE.Vector3();

// posição de cada tuneladora (x da frente) ao longo do tempo
const chave = (K, t) => { if (t <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) if (t <= K[i + 1][0]) return K[i][1] + (K[i + 1][1] - K[i][1]) * fx(t, K[i][0], K[i + 1][0]); return K[K.length - 1][1]; };
const KE = [[bt(2, 4.5), -39], [B[3], -24], [B[4], -15], [B[5], -11], [B[6], -6], [bt(6, 6.5), -.05]];
const KF = [[bt(2, 4.5), 39], [B[3], 16], [B[4], 12], [B[5], 8], [B[6], 5], [bt(6, 6.5), .05]];

function renderAt(t) {
  const tb = (i, a, b) => fx(t, bt(i, a), bt(i, b));
  const k = tomada(t), shot = T[k], modo = shot[5], planta = modo === "planta";
  const xE = chave(KE, t), xF = chave(KF, t);
  const comecou = t >= bt(2, 4.5), encontro = t >= bt(6, 6.5), pronto = t >= B[7];

  // ----- túnel: o que já foi cavado e o que já tem anel -----
  const onda = fx(t, bt(4, 3.5), bt(4, 7.5));
  COL.forEach((c) => {
    if (!c.noTunel) { return; }
    const cav = pronto || (comecou && (c.xc < xE || c.xc > xF));
    c.fill.visible = !cav && !(planta && c.meio);
    let anel = false;
    if (pronto) anel = true;
    else if (t >= bt(4, 7.5)) anel = c.xc < xE - 1.5 || c.xc > xF + 1.5;
    else if (t >= bt(4, 3.5)) anel = (c.xc < xE - 1.5 && c.xc > xE - 1.5 - (xE + 39) * io(onda)) || (c.xc > xF + 1.5 && c.xc < xF + 1.5 + (39 - xF) * io(onda));
    c.casca.visible = cav && !(planta && c.meio);
    c.casca.material = anel ? c.anel : N.bruta;
    c.graute.visible = c.casca.visible && anel;
  });
  TRIO.forEach((g) => g.visible = planta);
  TOPO_M.forEach((g) => g.visible = !planta);
  AGUA.forEach((g) => g.visible = !planta);
  NAVIOS.forEach((n) => { n.g.visible = !planta; n.g.position.x = n.x0 + n.v * t; });

  // ----- fala 1: o túnel de teste na rocha rachada inunda -----
  const tOn = t >= bt(0, 4.6) && t < B[1];
  const cavT = fx(t, bt(0, 4.6), bt(0, 6.2));
  COL.forEach((c) => { if (c.fillT) c.fillT.visible = !planta && !(tOn && c.xc < TESTE[0] + (TESTE[1] - TESTE[0]) * cavT); });
  casTeste.visible = tOn; casTeste.scale.x = Math.max(.001, cavT); casTeste.position.x = TESTE[0] + (TESTE[1] - TESTE[0]) * cavT / 2;
  const inun = io(tb(0, 6.6, 9.4));
  aguaTeste.visible = tOn && inun > .01; aguaTeste.scale.y = Math.max(.001, inun);
  rachasTeste.forEach((r, i) => { r.visible = t >= bt(0, 6.2 + i * .15) && t < B[1]; });

  // ----- fala 2: a camada de marga acende e a rota aparece -----
  const brilho = Math.sin(fx(t, bt(1, .8), bt(1, 9.8)) * Math.PI);
  N.marga.emissiveIntensity = .55 * brilho;
  ROTA.forEach((g, i) => { const a = bt(1, 1.5 + 4 * i / ROTA.length); g.visible = t >= a && t < B[2] + 1.5; g.scale.setScalar(pop(fx(t, a, a + .3)) || .001); });
  const cota = io(tb(1, 6, 7.6)); COTA.visible = cota > 0 && t < B[2]; COTA.scale.y = Math.max(.001, cota); COTA.position.y = -11 * cota;
  cotaT.forEach((g, i) => g.visible = t >= bt(1, i ? 7.6 : 6) && t < B[2]);

  // ----- fala 3: picareta e depois as tuneladoras -----
  OPER.visible = t < bt(2, 4.6);
  OPER.position.set(-37.2, 5, -1.7); OPER.rotation.y = -.5;
  pic.rotation.z = .9 * Math.max(0, Math.sin(t * 7));
  lascas.forEach((g, i) => { const u = ((t * 1.4 + h(i)) % 1); g.visible = OPER.visible && t > bt(2, .3); g.position.set(-37.6 - h(i + 2) * .5 + u * (h(i) - .5), 5.05 + u * 1.2 - u * u * 1.8, -1.6 + (h(i + 5) - .5) * .5); });
  const aparece = pop(fx(t, bt(2, 4.5), bt(2, 5.0)));
  [[TE, xE, 1], [TF, xF, -1]].forEach(([m, x, dir]) => {
    m.g.visible = comecou && t < bt(6, 9.3);
    const xx = cl(x, -38.6, 38.6);
    poeNoTunel(m.g, xx, dir); m.g.scale.setScalar(Math.max(.001, aparece));
    m.cab.rotation.x = t * 3 * dir;
  });
  // câmara pressurizada só na francesa (fala 4)
  const sela = io(tb(3, 4.4, 5.4));
  TE.cam.visible = false; TE.setas.forEach((s) => s.visible = false);
  TF.cam.visible = sela > .01 && t < B[5]; TF.cam.scale.setScalar(Math.max(.001, sela));
  TF.setas.forEach((s, i) => { s.visible = sela > .5 && t < B[4]; s.position.x = 1.0 + .25 * Math.sin(t * 6 + i); });

  // ----- fala 4: jatos de água pelas rachaduras -----
  RACHAS_F.forEach((r, i) => r.visible = t >= bt(3, .2 + i * .12) && t < B[5]);
  const vaza = t >= bt(3, .6) && t < bt(3, 6.2);
  JATOS.forEach((g, i) => {
    const r = i % 3, xa = [17.5, 19.5, 21.5][r] - .2, ya = yT(xa) + 1.05;
    const u = (t * 1.6 + h(i)) % 1;
    const ax = Math.max(xF + 1.4, xa - 1.5 + h(i + 3) * 2), alvo = [ax, yT(ax) - .85, ZF - .4];
    g.visible = vaza && t > bt(3, .6) + h(i) * .6 && xa > xF + .5;
    g.position.set(xa + (alvo[0] - xa) * u, ya + (alvo[1] - ya) * u + Math.sin(u * Math.PI) * .5, ZF - .1 + (alvo[2] + .1 - ZF) * u);
  });
  const poca = io(tb(3, 1.2, 4.5)) * (1 - io(tb(3, 6, 8.5)));
  POCA.visible = poca > .02 && t < B[4]; POCA.scale.set(5, Math.max(.001, poca), 1);
  POCA.position.set(xF + 2.6 + 2.5, yT(xF + 5.1) - R + .05, ZF - .35); POCA.rotation.z = -incl(xF + 5.1) * -1;

  // ----- fala 5: rocha cedendo atrás da máquina -----
  CAIDA.forEach((g, i) => {
    const t0 = bt(4, .5 + h(i) * 2.6), u = t - t0, x = -23 + h(i + 7) * 2.6;
    g.visible = t >= t0 - .3 && t < B[5];
    const y0 = yT(x) + .75, y = Math.max(yT(x) - .85, y0 - 4.9 * Math.max(0, u) * Math.max(0, u));
    g.position.set(x, y, ZF - .35 - h(i + 1) * .4); g.rotation.set(h(i) * 3 + Math.max(0, u) * 3, h(i + 2) * 3, 0);
  });

  // ----- fala 6: vagões de entulho e a terra nova -----
  const vu = fx(t, bt(5, .2), bt(5, 6.5));
  VAGOES.forEach((o, i) => {
    const x = -14 - vu * 25 + i * 1.32;
    o.visible = t >= bt(5, .2) && t < B[6] && x > -38.8;
    poeNoTunel(o, x, -1, ZF - .1, -R + .03);
  });
  const mt = io(tb(5, 3, 7.2));
  [MONTE, MONTE_Z].forEach((g) => { g.visible = mt > .01; g.scale.y = Math.max(.001, mt); });
  [GRAMA_N, GRAMA_NZ].forEach((g) => { const p = pop(tb(5, 7.2, 8)); g.visible = p > .01; g.scale.set(1, Math.max(.001, p), 1); });

  // ----- fala 7: laser guiando e o encontro -----
  const laserOn = t >= bt(6, .8) && t < bt(6, 7);
  [[xE, 1], [xF, -1]].forEach(([x, dir], i) => {
    const a = [x - dir * 7, yT(x - dir * 7) + .55, ZF - .2], b = [x - dir * 3.4, yT(x - dir * 3.4) + .55, ZF - .2];
    const L = LASERS[i]; L.visible = laserOn && Math.abs(x) < 9;
    const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A);
    L.position.copy(A).add(Bv).multiplyScalar(.5); L.scale.set(1, d.length(), 1); L.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    ALVO[i].visible = L.visible; ALVO[i].position.set(...b);
  });
  ESTILH.forEach((g, i) => {
    const u = t - bt(6, 6.3 + h(i) * .3);
    g.visible = u > 0 && u < 1.6;
    g.position.set((h(i) - .5) * .6, -11 + (h(i + 1) - .5) * 1.4 + 2.5 * u - 4.9 * u * u * .6, ZF - .2 + u * (1 + h(i + 2) * 2));
    g.rotation.set(u * 4, u * 3, 0);
  });

  // ----- trem (fala 8 no túnel e fala 10 atravessando) -----
  let frente = null;
  if (t >= B[7] && t < B[8]) frente = -14 + 16 * io(tb(7, 0, 5)) + 6 * io(tb(7, 5, 10));
  if (t >= B[9]) frente = -40 + 80 * tb(9, 0, 9.6);
  TREM.forEach((o, i) => {
    const x = frente === null ? 0 : frente - .75 - i * 1.48;
    o.visible = frente !== null && x > -38.6 && x < 38.6;
    poeNoTunel(o, x, 1, ZF - .05, -R + .04);
  });
  const arOn = t >= B[7] && t < B[8], comp = 1 - .55 * io(tb(7, 5, 7));
  AR.visible = arOn && t < bt(7, 8);
  if (frente !== null) {
    const largA = (2.4 + 1.6 * io(tb(7, 0, 4.5))) * comp;
    AR.scale.set(largA, 1, 1); AR.position.set(frente + largA / 2, yT(frente) - .1, ZF - .1);
    N.ar.opacity = .32 + .3 * io(tb(7, .5, 4.5)) * comp;
    SETAS_AR.forEach((s, i) => { s.visible = arOn && t < bt(7, 5.2); s.position.set(frente + 1 + i * .55 + .3 * ((t * 2 + i * .3) % 1), yT(frente) - .2 + (i % 2 ? .35 : -.35), ZF + .25); });
  } else SETAS_AR.forEach((s) => s.visible = false);
  DUTOS.forEach((g, i) => { const p = pop(tb(7, 4.8 + i * .25, 5.4 + i * .25)); g.visible = planta && p > .01 && t < B[8]; g.scale.setScalar(Math.max(.001, p)); g.position.y = (1 - p) * -.0; });
  BOLHAS.forEach((g, i) => {
    const d = i % 5, u = (t * .7 + h(i)) % 1;
    const P = [[0, -11.2, Z_A - .7], [0, -9.7, Z_A - 1.4], [0, -9.7, Z_B + 1.4], [0, -11.2, Z_B + .7]];
    const p = caminho(P, u); g.visible = planta && t >= bt(7, 6) && t < B[8]; g.position.set([-8, -4, 0, 4, 8][d] + p[0], p[1], p[2]);
  });

  // ----- fala 9: fumaça num túnel, o de serviço limpo -----
  const fogo = t >= B[8] && t < B[9];
  FUMACA.forEach((g, i) => {
    const c = io(tb(8, .2 + h(i) * 2, 1.6 + h(i) * 2));
    g.visible = fogo && c > .02;
    g.position.set(-10 + h(i) * 20 + Math.sin(t + i) * .3, -11.5 + h(i + 3) * 1.1, Z_B + (h(i + 6) - .5) * 1.1);
    g.scale.setScalar(Math.max(.001, c));
  });
  PASSAG.forEach((p, i) => {
    p.g.visible = planta && t >= B[8] - .001 && t < B[9];
    const abre = io(tb(8, 4.2, 5));
    p.porta.position.x = [-9, -9, -3, -3, 3, 3, 9, 9][i] + (p.za === Z_B ? .55 * abre : 0);
  });
  AR_S.forEach((s, i) => {
    const x = [-9, -3, 3, 9][i % 4], para = i < 4 ? Z_A : Z_B, u = (t * 1.2 + h(i)) % 1;
    s.visible = fogo && planta && t > bt(8, 2);
    s.position.set(x, -11.55, Z_S + (para - Z_S) * (.25 + .4 * u));
    s.rotation.set(para > Z_S ? Math.PI / 2 : -Math.PI / 2, 0, 0);
  });
  GENTE.forEach((g, i) => {
    const u = fx(t, bt(8, 4.6 + i * .7), bt(8, 7.4 + i * .5)), x0 = 1.4 + i * .35, xd = 3 + (i % 2) * .15;
    const p = caminho([[x0, -12, Z_B], [xd, -12, Z_B], [xd, -12, Z_S], [2 - i * .45, -12, Z_S]], u);
    g.visible = fogo && planta;
    g.position.set(p[0], p[1] + Math.abs(Math.sin(t * 9 + i)) * .03 * (u > 0 && u < 1 ? 1 : 0), p[2]);
    g.rotation.y = u < .33 ? 0 : u < .66 ? -Math.PI / 2 : Math.PI;
  });

  // câmera
  const fim = k + 1 < T.length ? T[k + 1][0] : D.dur;
  const u = io(fx(t, shot[0], fim));
  const L = (a, b) => new THREE.Vector3().fromArray(a).lerp(new THREE.Vector3().fromArray(b), u);
  cam.position.copy(L(shot[1], shot[3])); cam.lookAt(L(shot[2], shot[4]));
  if (modo === "segue" && frente !== null) { const f = cl(frente, -36, 30); cam.position.set(f - 2.5, yT(f) + 3, 12.5); cam.lookAt(f - 2.2, yT(f) - .5, -1); }
  rd.render(sc, cam);
  // etiquetas presas nos objetos
  ET.forEach((e) => {
    const vis = t >= e.a && t < e.b;
    if (!vis) { e.el.style.opacity = 0; return; }
    if (e.txt === "35 MINUTOS" && frente !== null) v3.set(frente - 2, yT(frente - 2) + 1.3, -.3).project(cam); else v3.fromArray(e.p).project(cam);
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
