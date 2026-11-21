// =====================================================================================
// MODELO DE CENA 3D (exemplo completo: "Como construir um bunker").
// Como usar num tema novo:
//   • MOTOR (renderer, luz, materiais, utilidades caixa/cil/pilar, fx/io/pop/h, bt, etiquetas, legenda): mantenha.
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
// peca("ship-large", {comp: 11}, x, y, z, rotY): cópia escalada pelo tamanho pedido (alt, larg, comp ou esc),
// centrada em x/z e com a base no y dado. Devolve um grupo (gire/mova o grupo).
function peca(nome, alvo, x = 0, y = 0, z = 0, rotY = 0) {
  const base = PECAS[nome]; if (!base) throw new Error("peça não carregada: " + nome);
  const o = base.clone(true); const b = new THREE.Box3().setFromObject(o); const s = new THREE.Vector3(); b.getSize(s);
  const e = alvo.esc ?? (alvo.alt ? alvo.alt / s.y : alvo.larg ? alvo.larg / s.x : alvo.comp ? alvo.comp / s.z : 1);
  o.scale.setScalar(e); o.position.set(-(b.min.x + s.x / 2) * e, -b.min.y * e, -(b.min.z + s.z / 2) * e);
  o.traverse((k) => { if (k.isMesh) { k.castShadow = true; k.receiveShadow = true; } });
  const g = new THREE.Group(); g.add(o); g.position.set(x, y, z); g.rotation.y = rotY; sc.add(g); return g;
}

// ---------- mundo: ponte pênsil sobre mar fundo ----------
const PC = "assets/pecas/";
await carregaPecas([
  "watercraft-kit/ship-ocean-liner", "watercraft-kit/ship-cargo-a", "watercraft-kit/buoy-flag",
  ...["sedan", "taxi", "suv", "van", "police", "truck", "delivery", "ambulance", "hatchback-sports", "firetruck"].map((n) => "car-kit/" + n),
  ...["a", "b", "c", "d", "f", "n", "t"].map((n) => "city-kit-suburban/building-type-" + n),
  ...["skyscraper-a", "skyscraper-b", "skyscraper-c", "skyscraper-d", "l", "n"].map((n) => "city-kit-commercial/building-" + n),
  ...["default", "oak", "fat", "pineRoundA", "detailed"].map((n) => "nature-kit/tree_" + n),
].map((a) => PC + a + ".glb"));
// eixo da ponte em X. Mar entre x=-18 e 18 (superfície y=0, fundo y=-8). Margens com topo em y=DY.
// corte: plano z=ZC. Nas tomadas em corte, some tudo que está na frente dele.
sc.fog = new THREE.Fog("#BFE4F7", 90, 230); cam.far = 400; cam.updateProjectionMatrix();
sol.position.set(22, 40, 26);
Object.assign(sol.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 140 }); sol.shadow.camera.updateProjectionMatrix();
const DY = 5.2, FUNDO = -8, ZC = 2.7, XT = 10, HT = 19.5, ZCAB = 2.6;
const M2 = {
  agua: new THREE.MeshStandardMaterial({ color: "#2A86D0", transparent: true, opacity: .62, flatShading: true, roughness: .3, depthWrite: false }),
  aguaIn: new THREE.MeshStandardMaterial({ color: "#3A9BE0", transparent: true, opacity: .5, flatShading: true, roughness: .3, depthWrite: false }),
  areia: mat("#D9C38A"), areiaEsc: mat("#BFA56C"), torre: mat("#D9552B"), torreEsc: mat("#B8441F"), asfalto: mat("#4A4D52"),
  faixa: mat("#F4D23C"), cabo: mat("#C24A26"), casco: mat("#C93A32"), cinza: mat("#8E949B"),
  vento: new THREE.MeshBasicMaterial({ color: "#FFFFFF", transparent: true, opacity: 0 }),
  jato: new THREE.MeshStandardMaterial({ color: "#BFE9FF", transparent: true, opacity: .9, flatShading: true }),
};
const frenteObjs = []; // some nas tomadas em corte
const emGrupo = (g, o) => { sc.remove(o); g.add(o); return o; };

// fundo do mar (grosso, pra não aparecer céu por baixo nos cortes)
caixa(36, 22, 60 + ZC, M2.areia, 0, FUNDO - 11, (-60 + ZC) / 2, false);
frenteObjs.push(caixa(36, 22, 60 - ZC, M2.areia, 0, FUNDO - 11, (60 + ZC) / 2, false));
// margens (terra + grama), divididas no plano do corte
[-1, 1].forEach((s) => {
  const xc = s * 40, w = 44;
  caixa(w, 35, 60 + ZC, M.terra, xc, DY - 17.5, (-60 + ZC) / 2, false); caixa(w, .14, 60 + ZC, M.grama, xc, DY + .07, (-60 + ZC) / 2, false);
  frenteObjs.push(caixa(w, 35, 60 - ZC, M.terra, xc, DY - 17.5, (60 + ZC) / 2, false), caixa(w, .14, 60 - ZC, M.grama, xc, DY + .07, (60 + ZC) / 2, false));
  // praia inclinada na beira
  const pr = caixa(2.2, 6, 60 + ZC, M2.areiaEsc, s * 18.9, -.6, (-60 + ZC) / 2, false); pr.rotation.z = -s * .25;
  const prf = caixa(2.2, 6, 60 - ZC, M2.areiaEsc, s * 18.9, -.6, (60 + ZC) / 2, false); prf.rotation.z = -s * .25; frenteObjs.push(prf);
  // estrada em terra
  caixa(44, .08, 4.4, M2.asfalto, s * 40, DY + .17, 0, false);
  for (let x = 19; x < 62; x += 2.4) caixa(1.1, .02, .12, M2.faixa, s * x, DY + .22, 0, false);
});
// água: peça cheia (antes da ensecadeira) e peça com recorte quadrado (depois), sem emendas
const SQ = 2.7; // meia largura da ensecadeira (externa)
const aguaPeca = (P) => {
  const sh = new THREE.Shape(); sh.moveTo(P[0][0], -P[0][1]); P.slice(1).forEach(([x, z]) => sh.lineTo(x, -z));
  const g = new THREE.ExtrudeGeometry(sh, { depth: -FUNDO, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, FUNDO, 0);
  const m = new THREE.Mesh(g, M2.agua); m.renderOrder = 2; sc.add(m); return m;
};
const aguaCheia = aguaPeca([[-18, -60], [18, -60], [18, ZC], [-18, ZC]]);
const aguaRec = aguaPeca([[-18, -60], [18, -60], [18, ZC], [XT + SQ, ZC], [XT + SQ, -SQ], [XT - SQ, -SQ], [XT - SQ, ZC], [-XT + SQ, ZC], [-XT + SQ, -SQ], [-XT - SQ, -SQ], [-XT - SQ, ZC], [-18, ZC]]);
const aguaF = caixa(36, -FUNDO, 60 - ZC, M2.agua, 0, FUNDO / 2, (60 + ZC) / 2, false); aguaF.castShadow = false; aguaF.renderOrder = 2; frenteObjs.push(aguaF);
const aguaIn = [-1, 1].map((s) => { const a = pilar(2 * SQ - .8, -FUNDO, 2 * SQ - .8, M2.aguaIn, s * XT, FUNDO, 0); a.castShadow = false; a.renderOrder = 2; return a; });

// cidades nas duas margens
let ci = 0;
const CASAS = ["a", "b", "c", "d", "f", "n", "t"].map((n) => "building-type-" + n);
const ALTOS = ["building-skyscraper-a", "building-skyscraper-b", "building-skyscraper-c", "building-skyscraper-d", "building-l", "building-n"];
const ARV = ["tree_default", "tree_oak", "tree_fat", "tree_pineRoundA", "tree_detailed"];
const predio = (x, z) => {
  const k = ci++; const alto = h(k) > .62;
  const g = alto ? peca(ALTOS[Math.floor(h(k + 11) * ALTOS.length)], { alt: 7 + h(k + 7) * 6 }, x, DY, z, z > 0 ? Math.PI : 0)
                 : peca(CASAS[Math.floor(h(k + 11) * CASAS.length)], { larg: 3.4 + h(k + 3) * .8 }, x, DY, z, z > 0 ? Math.PI : 0);
  if (z > ZC - 1.5) frenteObjs.push(g);
};
const arvore = (x, z, i) => { const g = peca(ARV[i % ARV.length], { alt: 3 + h(i) * 1.2 }, x, DY, z, h(i + 5) * 6.28); if (z > ZC - 1.5) frenteObjs.push(g); };
[-1, 1].forEach((s) => {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const x = s * (34 + i * 4.6 + h(ci + 40) * 1.2), z = -7 - j * 5 - h(ci + 50) * 1.5; predio(x, z);
    if (j < 2) predio(s * (35 + i * 4.6), 7.5 + j * 5.5);
  }
  [[21, -7], [23, -12], [21.5, 8], [30, -15], [29, 12], [24, 15], [32, 7.5]].forEach(([x, z], i) => arvore(s * x, z, i + (s > 0 ? 20 : 0)));
});

// ensecadeiras (4 paredes) + bomba e jato
const ENS = [-1, 1].map((s) => {
  const x0 = s * XT, H = 9, t = .4;
  const w = [pilar(2 * SQ, H, t, M.concretoEsc, x0, FUNDO, -SQ + t / 2), pilar(2 * SQ, H, t, M.concretoEsc, x0, FUNDO, SQ - t / 2),
    pilar(t, H, 2 * SQ - 2 * t, M.concreto, x0 - SQ + t / 2, FUNDO, 0), pilar(t, H, 2 * SQ - 2 * t, M.concreto, x0 + SQ - t / 2, FUNDO, 0)];
  const bomba = caixa(.9, .7, .7, M.amarelo, x0 - s * 1.2, 1.35, -SQ + .2);
  const jato = Array.from({ length: 12 }, () => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.16, 0), M2.jato); m.visible = false; sc.add(m); return m; });
  const pier = pilar(3.6, 9, 3.6, M.concreto, x0, FUNDO, 0);
  return { x0, w, bomba, jato, pier };
});

// torres (grupo com pivô na base: inclina no problema da força do cabo)
const TORRES = [-1, 1].map((s) => {
  const g = new THREE.Group(); g.position.set(s * XT, 1, 0); sc.add(g);
  const pernas = [-ZCAB, ZCAB].map((z) => { const p = pilar(.75, HT, .75, M2.torre, 0, 0, z); emGrupo(g, p); return p; });
  const vigas = [2.4, 10.5, 15.5, 19.1].map((y) => { const v = caixa(.6, .7, 2 * ZCAB + .5, y < 3 ? M2.torreEsc : M2.torre, 0, y, 0); emGrupo(g, v); return v; });
  const selas = [-ZCAB, ZCAB].map((z) => { const c = caixa(1.1, .5, 1.0, M.preto, 0, HT + .25, z); emGrupo(g, c); return c; });
  return { s, g, pernas, vigas, selas };
});
const topoTorre = (T) => new THREE.Vector3(T.g.position.x - (HT + .4) * Math.sin(T.g.rotation.z), 1 + (HT + .4) * Math.cos(T.g.rotation.z), 0);

// ancoragens + pedaço de chão que é arrancado
const ANC = [-1, 1].map((s) => pilar(5, 6.6, 7.4, M.concreto, s * 27.5, DY - 3.2, 0));
const ANCf = [-1, 1].map((s) => caixa(.12, 1.2, 7.0, M.concretoEsc, s * 24.95, DY + 2.2, 0)); // friso
const CHAO = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 25.6, DY - .5, 0); sc.add(g);
  emGrupo(g, caixa(2.6, 1.0, 6.6, M.terra, 0, 0, 0)); emGrupo(g, caixa(2.6, .14, 6.6, M.grama, 0, .55, 0)); return g; });
const BURACO = [-1, 1].map((s) => caixa(2.6, .05, 6.6, M.terraEsc, s * 25.6, DY + .16, 0, false));

// cabos: 64 segmentos por cabo, cilindros orientados (raio = escala)
const UP = new THREE.Vector3(0, 1, 0);
const geoCil = new THREE.CylinderGeometry(1, 1, 1, 6);
const liga = (m, a, b, r) => { const d = new THREE.Vector3().subVectors(b, a); const L = d.length() || .001;
  m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1 / L)); m.scale.set(r, L, r); };
const NS = 16, NM = 32, NC = NS * 2 + NM;
const CABOS = [-ZCAB, ZCAB].map(() => Array.from({ length: NC }, () => { const m = new THREE.Mesh(geoCil, M2.cabo); m.castShadow = true; sc.add(m); return m; }));
let pontoAnc = [new THREE.Vector3(), new THREE.Vector3()];
function pontosCabo(z) {
  const tl = topoTorre(TORRES[0]), tr = topoTorre(TORRES[1]);
  const al = pontoAnc[0], ar = pontoAnc[1]; const out = [];
  for (let i = 0; i <= NC; i++) {
    let p;
    if (i <= NS) { const u = i / NS; p = new THREE.Vector3().lerpVectors(al, tl, u); p.y -= .8 * 4 * u * (1 - u); }
    else if (i <= NS + NM) { const u = (i - NS) / NM; p = new THREE.Vector3().lerpVectors(tl, tr, u); p.y -= (tl.y - 8.6) * 4 * u * (1 - u); }
    else { const u = (i - NS - NM) / NS; p = new THREE.Vector3().lerpVectors(tr, ar, u); p.y -= .8 * 4 * u * (1 - u); }
    p.z = z; out.push(p);
  }
  return out;
}
const yCaboEm = (pts, x) => { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; if ((x - a.x) * (x - b.x) <= 0) { const u = (x - a.x) / ((b.x - a.x) || 1); return a.y + (b.y - a.y) * u; } } return DY + 1; };
// carrinho do cable spinning
const roda = cil(.45, .22, M.vermelho, 0, 0, 0, 12); roda.rotation.x = Math.PI / 2;
const passarela = [-ZCAB, ZCAB].map(() => Array.from({ length: NC }, () => { const m = new THREE.Mesh(geoCil, M.preto); sc.add(m); return m; }));

// pista em segmentos (cada um é um grupo: laje + faixa + treliça)
const SEG = [];
for (let k = 0; k < 24; k++) {
  const x = -17.25 + k * 1.5; const g = new THREE.Group(); g.position.set(x, DY - .175, 0); sc.add(g);
  emGrupo(g, caixa(1.52, .35, 4.4, M2.asfalto, 0, 0, 0)); emGrupo(g, caixa(.8, .02, .12, M2.faixa, 0, .19, 0, false));
  emGrupo(g, caixa(1.52, .25, .15, M.concretoEsc, 0, .3, 2.15)); emGrupo(g, caixa(1.52, .25, .15, M.concretoEsc, 0, .3, -2.15));
  const tr = new THREE.Group(); tr.position.y = -.175; g.add(tr);
  [-2.1, 2.1].forEach((z) => {
    const c = emGrupo(tr, caixa(1.52, .12, .12, M2.torre, 0, -.85, z, false)); c.castShadow = false;
    [-1, 1].forEach((d) => { const dg = emGrupo(tr, caixa(1.75, .1, .1, M2.torre, 0, -.45, z, false)); dg.rotation.z = d * .52; dg.castShadow = false; });
    const v = emGrupo(tr, caixa(.1, .9, .1, M2.torre, .7, -.45, z, false)); v.castShadow = false;
  });
  [-1.2, 0, 1.2].forEach((z) => { const tv = emGrupo(tr, caixa(.1, .1, 4.2, M2.torre, .7, -.85, z, false)); tv.castShadow = false; });
  const dT = Math.abs(Math.abs(x) - XT); // distância até a torre mais perto: monta de dentro pra fora
  const pend = [-ZCAB, ZCAB].map(() => { const m = new THREE.Mesh(geoCil, M.preto); sc.add(m); return m; });
  SEG.push({ x, g, tr, dT, pend });
}
// carros
const MODC = ["sedan", "taxi", "suv", "van", "police", "truck", "delivery", "ambulance", "hatchback-sports", "firetruck"];
const CARROS = Array.from({ length: 10 }, (_, i) => {
  const g = new THREE.Group(); sc.add(g); const p = peca(MODC[i], { comp: 1.35 }, 0, 0, 0, Math.PI / 2); sc.remove(p); g.add(p); return g;
});
// navio
const NAVIO = new THREE.Group(); sc.add(NAVIO);
const NAV_G = peca("ship-ocean-liner", { comp: 14 }, 0, -.8, 0); sc.remove(NAV_G); NAVIO.add(NAV_G);
const NAV_C = peca("ship-cargo-a", { comp: 10 }, 0, -.9, 0); sc.remove(NAV_C); NAVIO.add(NAV_C);
// pilares do gancho (a solução errada)
const PIL = [-14, -7, 0, 7, 14].map((x) => pilar(1.3, DY - .5 - FUNDO, 1.3, M.concreto, x, FUNDO, 0));
const LAJE0 = caixa(36, .5, 4.4, M.concretoEsc, 0, DY - .25, 0);
// guindaste na balsa (bloco 3)
const BALSA = caixa(5, .8, 4, M.cinza, 1, .2, 7.5);
const GUI = new THREE.Group(); GUI.position.set(-.5, .6, 7.5); sc.add(GUI);
emGrupo(GUI, caixa(1.2, .8, 1.2, M.amarelo, 0, .4, 0)); emGrupo(GUI, pilar(.5, 6.5, .5, M.amarelo, 0, .8, 0));
const lanca = new THREE.Group(); lanca.position.set(0, 7.1, 0); GUI.add(lanca);
emGrupo(lanca, caixa(6.5, .4, .4, M.amarelo, 2.6, 0, 0));
const gancho = new THREE.Group(); gancho.position.set(5.6, 0, 0); lanca.add(gancho);
const fioG = emGrupo(gancho, caixa(.06, 3, .06, M.preto, 0, -1.5, 0));
const BOBINA = new THREE.Mesh(new THREE.TorusGeometry(1.0, .55, 6, 12), M2.cabo); BOBINA.castShadow = true; sc.add(BOBINA);
// vento
const VENTO = Array.from({ length: 22 }, () => { const m = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, 5), M2.vento.clone()); sc.add(m); return m; });

// roteiro v2: boias nas posições das torres, torre fantasma e carros estacionados ao lado do bloco
const BOIAS = [-1, 1].map((s) => peca("buoy-flag", { alt: 3.6 }, s * XT, -.9, 0));
const FANT = [-1, 1].map((s) => { const f = pilar(2.4, 1 + HT - FUNDO, 2.4, new THREE.MeshStandardMaterial({ color: "#FF8A3D", transparent: true, opacity: .3, flatShading: true, depthWrite: false }), s * XT, FUNDO, 0); f.castShadow = false; f.visible = false; return f; });
const PARK = ["sedan", "suv", "van", "taxi", "truck", "police"].map((n, i) => peca(n, { comp: 1.35 }, -30.2 + i * 1.15, DY + .02, -5.6));

// ---------- tomadas (câmera) ----------
// roteiro v2: 15 blocos. As etapas foram escritas para 6 blocos (bt antigo); o MAPA leva cada trecho antigo para o bloco novo.
const NB = D.blocos;
const NL = NB.map((b, i) => (i + 1 < NB.length ? NB[i + 1] : D.dur - 1.2) - b);
const nb = (i, s) => (i >= NB.length ? D.dur - 1.2 : NB[i] + s * NL[i] / 10);
const MAPA = [ // [bloco antigo, s0, s1, [bloco novo, s], [bloco novo, s]]
  [0, 0, 3.4, [0, 0], [1, 0]], [0, 3.4, 10, [1, 0], [2, 0]],
  [1, 0, 3.2, [4, 0], [4, 4.5]], [1, 3.2, 6.4, [4, 4.5], [5, 0]], [1, 6.4, 8.1, [5, 0], [5, 4.5]], [1, 8.1, 10, [5, 4.5], [6, 0]],
  [2, 0, 3.4, [6, 0], [7, 0]], [2, 3.4, 10, [7, 0], [9, 0]],
  [3, 0, 10, [9, 0], [10, 0]],
  [4, 0, 3.0, [11, 0], [12, 0]], [4, 3.0, 6.3, [12, 0], [13, 0]], [4, 6.3, 10, [13, 0], [14, 0]],
  [5, 0, 10, [14, 0], [15, 0]],
];
function bt(i, s) {
  const seg = MAPA.filter((m) => m[0] === i); let m = seg.find((g) => s >= g[1] && s <= g[2]);
  if (!m) m = s < seg[0][1] ? seg[0] : seg[seg.length - 1];
  const A = nb(...m[3]), Bt = nb(...m[4]); return A + (s - m[1]) / (m[2] - m[1]) * (Bt - A);
}
const B = [0, 1, 2, 3, 4, 5].map((i) => bt(i, 0));
const LB = B.map((b, i) => (i + 1 < B.length ? B[i + 1] : D.dur - 1.2) - b);
const T = [
  // [início, posição inicial, alvo inicial, posição final, alvo final, corte?]
  [0, [-54, 22, 3], [4, 0, -2], [-49, 20, 2.5], [4, 0, -2], false],                        // 1: as duas cidades e o mar
  [nb(0, 5.5), [12, 2, 20], [0, 3, -6], [9, 2.5, 18], [0, 3, -6], false],                   // 1: rente à água
  [nb(1, 0), [8, -2, 34], [0, -3, 0], [6, -1, 30], [0, -3, 0], true],                       // 2: pilares sobem (corte)
  [nb(1, 5), [16, 9, 14], [0, 3, -4], [14, 8, 12], [0, 3, -4], false],                      // 2: navio bate
  [nb(2, 0), [0, 21, 36], [0, 0, -2], [0, 18, 33], [0, 0, -2], false],                  // 3: boias e navio passando
  [nb(3, 0), [-2, -2, 27], [-10, 1.5, 0], [-3, -1, 23], [-10, 2.5, 0], true],               // 4: torre fantasma no fundo
  [nb(4, 0), [-28, 17, 22], [-4, 0, 0], [-24, 15, 19], [-4, 0, 0], false],                  // 5: paredes sobem
  [nb(4, 4.5), [-6, -1.5, 20], [-10, -3.5, 0], [-7, -1, 17], [-10, -3.5, 0], true],         // 5: bomba esvazia (corte)
  [nb(5, 0), [-13, -.5, 16], [-10, -4, 0], [-12, 0, 14], [-10, -4, 0], true],               // 6: chão seco, base (corte)
  [nb(5, 4.5), [-1, 2, 17], [-9, 4, -1], [-1, 3, 15.5], [-9, 11, -1], false],               // 6: torres sobem
  [nb(6, 0), [14, 5, 26], [2, 4, 6], [12, 6, 24], [2, 4, 6], false],                        // 7: guindaste tomba
  [nb(7, 0), [-30, 16, 30], [-6, 13, 0], [-26, 18, 26], [-6, 13, 0], false],                // 8: roda vai e volta
  [nb(7, 5), [30, 18, 26], [6, 13, 0], [26, 19, 24], [6, 13, 0], false],                    // 8: do outro lado
  [nb(8, 0), [-3, 7.5, 13], [-1, 9.5, 0], [-2, 8, 11.5], [-1, 9.6, 0], false],              // 9: close no cabo
  [nb(9, 0), [-24, 12, 36], [-16, 10, 0], [-22, 11, 33], [-16, 10, 0], false],              // 10: torre entorta
  [nb(9, 4.5), [-21, 12, 22], [-26, 6.5, 0], [-18, 13, 17], [-25, 7, 0], false],            // 10: bloco de concreto
  [nb(10, 0), [-18, 17, -16], [-27, 6, -3], [-20, 16, -13], [-27, 6.5, -3], false],         // 11: bloco e carros (escala)
  [nb(11, 0), [14, 13, 24], [0, 5, 0], [11, 12, 21], [0, 5, 0], false],                     // 12: pista sobe
  [nb(11, 5), [-14, 12, 22], [0, 5, 0], [-11, 11, 20], [0, 5, 0], false],                   // 12: do outro lado
  [nb(12, 0), [3, 9, 17], [0, 5.5, 0], [-2, 8, 15], [0, 5.5, 0], false],                    // 13: vento torce
  [nb(12, 5), [0, 6, 24], [0, 6, 0], [0, 7, 21], [0, 6, 0], false],                         // 13: de frente
  [nb(13, 0), [4.5, 3.2, 8.5], [0, 4.4, 0], [2.5, 3.0, 7.5], [-1, 4.5, 0], false],          // 14: grade de triângulos
  [nb(14, 0), [-13, 8.5, 15], [0, 6, 0], [-10, 8, 13], [1, 6, 0], false],                   // 15: carros + navio
  [nb(14, 4.4), [-22, 18, 30], [0, 6, 0], [-42, 46, 80], [0, 4, -4], false],                // 15: afasta e mostra tudo
];
const tomada = (t) => { let k = 0; for (let i = 0; i < T.length; i++) if (t >= T[i][0]) k = i; return k; };

// ---------- etiquetas e legenda ----------
const camada = document.getElementById("etq");
const ET = D.etiquetas.map((e) => { const d = document.createElement("div"); d.className = "etq"; d.textContent = e.txt; camada.appendChild(d); return { ...e, el: d }; });
const leg = document.getElementById("leg");
const v3 = new THREE.Vector3();
const vis = (o, v) => { o.visible = v; };

function renderAt(t) {
  const k = tomada(t), shot = T[k];
  const corte = shot[5] === true;

  // ===== bloco 1: pilares no meio + navio bate =====
  const pc = fx(t, bt(0, 3.5), bt(0, 5.2));
  const queda = io(fx(t, bt(0, 8.1), bt(0, 9.7)));
  PIL.forEach((p, i) => {
    p.visible = t >= bt(0, 3.4) && t < nb(2, 0);
    p.scale.y = Math.max(.001, io(cl(pc * 1.6 - i * .15)));
    p.rotation.x = queda * (.5 + h(i) * .4); p.position.y = FUNDO - queda * 9;
  });
  const lj = io(fx(t, bt(0, 5.1), bt(0, 5.9)));
  LAJE0.visible = lj > 0 && t < nb(2, 0); LAJE0.position.y = DY - .25 + (1 - lj) * 6 - queda * 9; LAJE0.rotation.x = queda * .5;
  // navio: no gancho vem e bate; no fim passa por baixo da ponte pronta
  if (t < nb(3, 0)) {
    const passa = io(fx(t, nb(2, 2), nb(2, 9.5)));
    const ida = io(fx(t, bt(0, 5.6), bt(0, 8.0)));
    const bate = Math.sin(cl(fx(t, bt(0, 8.0), bt(0, 8.8))) * Math.PI) * .9;
    NAVIO.visible = t >= bt(0, 5.4); NAV_G.visible = true; NAV_C.visible = false; NAVIO.position.set(0, 0, -32 + ida * 24.3 - bate + passa * 30); NAVIO.rotation.y = 0;
    NAVIO.rotation.z = Math.sin((t - bt(0, 8)) * 9) * .05 * (t > bt(0, 8) && t < bt(0, 9.5) ? 1 : 0);
  } else if (t >= B[5]) {
    NAVIO.visible = true; NAV_G.visible = false; NAV_C.visible = true; NAVIO.rotation.z = 0; NAVIO.position.set(3, 0, -26 + (t - B[5]) * 4.2);
  } else NAVIO.visible = false;

  // boias marcando as duas torres (bloco 3) e torre fantasma no fundo (bloco 4)
  BOIAS.forEach((b, i) => { const p = pop(fx(t, nb(2, 1.5 + i * .4), nb(2, 2.1 + i * .4))); b.visible = p > 0 && t < bt(1, .4); b.scale.setScalar(Math.max(.001, p)); b.position.y = -.9 + Math.sin(t * 2 + i) * .08; });
  FANT.forEach((f) => { const on = t >= nb(3, .5) && t < nb(4, 0); f.visible = on; f.material.opacity = on ? .5 + .15 * Math.sin((t - nb(3, .5)) * 4) : 0; });
  // carros estacionados ao lado do bloco (bloco 11: escala)
  PARK.forEach((c, i) => { const p = pop(fx(t, nb(10, 1 + i * .35), nb(10, 1.5 + i * .35))); c.visible = p > 0; c.scale.setScalar(Math.max(.001, p)); });

  // ===== bloco 2: ensecadeira, bomba, concreto no seco, torres =====
  const ew = fx(t, bt(1, .3), bt(1, 3.0));
  const bomb = io(fx(t, bt(1, 3.5), bt(1, 6.3)));
  const pierC = io(fx(t, bt(1, 6.5), bt(1, 8.0)));
  ENS.forEach((E, s) => {
    E.w.forEach((w, i) => { w.visible = t >= bt(1, .2); w.scale.y = Math.max(.001, io(cl(ew * 1.3 - i * .08))); });
    // mureta: a parede da frente fica baixa nas tomadas em corte
    if (corte && ew >= 1) E.w[1].scale.y = .3;
    E.bomba.visible = t >= bt(1, 3.2) && t < B[2];
    E.jato.forEach((j, i) => {
      const on = bomb > 0 && bomb < 1; j.visible = on; if (!on) return;
      const lt = ((t - bt(1, 3.5)) * 1.4 + i / E.jato.length) % 1;
      j.position.set(E.x0 + (s ? 1 : -1) * 1.2, 1.7 + lt * 2.2 - lt * lt * 4.6, -SQ - lt * 4.5);
    });
    E.pier.visible = t >= bt(1, 6.4); E.pier.scale.y = Math.max(.001, pierC);
  });
  aguaCheia.visible = ew < 1; aguaRec.visible = ew >= 1;
  aguaIn.forEach((a) => { a.visible = ew >= 1 && bomb < 1; a.scale.y = Math.max(.001, 1 - bomb); });
  // torres sobem
  const tg = io(fx(t, bt(1, 8.1), B[2] + .3));
  TORRES.forEach((Tw) => {
    Tw.g.visible = t >= bt(1, 8.0);
    Tw.pernas.forEach((p) => p.scale.y = Math.max(.001, tg));
    Tw.vigas.forEach((v) => v.visible = tg * HT > v.position.y + .3);
    Tw.selas.forEach((c) => c.visible = tg > .99);
  });

  // ===== bloco 3: guindaste tenta e tomba; carrinho estica fio por fio =====
  const sobe = io(fx(t, bt(2, .4), bt(2, 1.8)));
  const tomba = io(fx(t, bt(2, 1.8), bt(2, 3.2)));
  const gOn = t >= B[2] - .2 && t < bt(2, 3.4);
  BALSA.visible = GUI.visible = gOn;
  GUI.rotation.x = tomba * 1.15; GUI.position.y = .6 - tomba * .4;
  lanca.rotation.z = .25 - sobe * .15;
  fioG.scale.y = Math.max(.1, 1 - sobe * .6); fioG.position.y = -1.5 * fioG.scale.y;
  BOBINA.visible = gOn;
  if (gOn) {
    GUI.updateMatrixWorld(true); const gp = new THREE.Vector3(); gancho.getWorldPosition(gp);
    const solta = fx(t, bt(2, 2.4), bt(2, 3.2));
    const pend = gp.y - 3 * fioG.scale.y - 1.0;
    BOBINA.position.set(gp.x, solta > 0 ? Math.max(-1.2, pend - solta * solta * 10) : pend, gp.z);
    BOBINA.rotation.set(Math.PI / 2 * .2, 0, solta * 1.4);
  }
  // pontos de ancoragem do cabo: chão (antes) → arrancado (problema) → bloco de concreto (solução)
  const arr = io(fx(t, bt(3, 1.0), bt(3, 3.6)));
  const anc = io(fx(t, bt(3, 4.2), bt(3, 5.6)));
  const lean = .11 * arr * (1 - io(fx(t, bt(3, 4.8), bt(3, 6.4))));
  TORRES.forEach((Tw) => Tw.g.rotation.z = Tw.s * lean); // as duas torres puxadas pro meio
  CHAO.forEach((g, i) => {
    const s = i ? 1 : -1; g.visible = anc < .3;
    g.position.set(s * (25.6 - arr * 1.6), DY - .5 + arr * 2.4, 0); g.rotation.z = s * arr * .55;
  });
  BURACO.forEach((b) => b.visible = arr > .05 && anc < .3);
  ANC.forEach((a) => { a.visible = anc > 0; a.scale.y = Math.max(.001, anc); });
  ANCf.forEach((a) => a.visible = anc > .98);
  pontoAnc = [-1, 1].map((s, i) => {
    const g = CHAO[i]; const solo = new THREE.Vector3(g.position.x - s * .6, g.position.y + .6, 0);
    const bloco = new THREE.Vector3(s * 25.0, DY + 2.0, 0);
    return solo.lerp(bloco, anc);
  });
  // ===== bloco 5: pista por partes, vento torce, treliça =====
  const amp = io(fx(t, bt(4, 3.0), bt(4, 4.6))) * (1 - io(fx(t, bt(4, 6.6), bt(4, 8.2))));
  const trel = (S) => pop(fx(t, bt(4, 6.3) + (Math.abs(S.x) / 17.25) * LB[4] * .1, bt(4, 6.3) + (Math.abs(S.x) / 17.25) * LB[4] * .1 + .45));
  SEG.forEach((S) => {
    const ini = bt(4, .2 + (S.dT / 9.25) * 2.4);
    const sb = io(fx(t, ini, ini + LB[4] * .06));
    S.g.visible = t >= ini;
    const env = Math.abs(S.x) < XT ? Math.cos((S.x / XT) * Math.PI / 2) : .25;
    const onda = amp * env;
    S.g.position.y = (DY - .175) - (1 - sb) * (DY - .2) + onda * .8 * Math.sin(S.x * .32 - t * 4.2);
    S.g.rotation.x = onda * .38 * Math.sin(S.x * .3 - t * 5.0);
    const tz = trel(S); S.tr.visible = tz > 0; S.tr.scale.set(1, Math.max(.001, tz), 1);
  });
  // cabo
  const cbIni = bt(2, 3.4), cbFim = bt(2, 9.6);
  const cbOn = t >= cbIni;
  const per = 1.25; // ida+volta do carrinho em segundos de verdade
  const prim = fx(t, cbIni, cbIni + per / 2); // primeira passada revela o cabo
  const grosso = io(fx(t, cbIni + per / 2, cbFim));
  const raio = .03 + grosso * .27;
  [-ZCAB, ZCAB].forEach((z, c) => {
    const pts = pontosCabo(z);
    CABOS[c].forEach((m, i) => {
      m.visible = cbOn && (i + 1) / NC <= prim + .001;
      if (m.visible) liga(m, pts[i], pts[i + 1], raio);
    });
    // passarela provisória (fios pretos finos, um pouco abaixo) só durante a fiação
    passarela[c].forEach((m, i) => {
      m.visible = cbOn && t < cbFim + .3 && (i + 1) / NC <= prim + .001;
      if (m.visible) { const a = pts[i].clone(), b = pts[i + 1].clone(); a.y -= 1.0; b.y -= 1.0; a.z += c ? -.6 : .6; b.z += c ? -.6 : .6; liga(m, a, b, .03); }
    });
    if (c === 0) {
      roda.visible = cbOn && t < cbFim;
      if (roda.visible) {
        const ph = ((t - cbIni) / per) % 1; const s = ph < .5 ? ph * 2 : 2 - ph * 2;
        const f = s * NC, i0 = Math.min(NC - 1, Math.floor(f));
        const p = pts[i0].clone().lerp(pts[i0 + 1], f - i0); roda.position.set(p.x, p.y + .25, 0); roda.rotation.z = (t - cbIni) * 9;
      }
    }
    // pendurais (seguem a pista)
    SEG.forEach((S) => {
      const m = S.pend[c];
      if (!S.g.visible) { m.visible = false; return; }
      const zz = c ? 2.2 : -2.2;
      const yc = yCaboEm(pts, S.x);
      const r = S.g.rotation.x; const yb = S.g.position.y + .175 * Math.cos(r) + (c ? 1 : -1) * 2.2 * Math.sin(r);
      const zb = .175 * Math.sin(r) + zz * Math.cos(r);
      m.visible = true; liga(m, new THREE.Vector3(S.x, yb, zb), new THREE.Vector3(S.x, yc - .1, z), .045);
    });
  });

  // vento
  const vOn = fx(t, bt(4, 2.4), bt(4, 3.0)) * (1 - fx(t, bt(4, 9.2), bt(4, 9.9)));
  VENTO.forEach((m, i) => {
    m.visible = vOn > 0; if (!m.visible) return;
    const lt = ((t * .9 + h(i + 70) * 3) % 1.2) / 1.2;
    m.position.set(-11 + h(i + 80) * 22, 5.6 + h(i + 90) * 6, -16 + lt * 32);
    m.material.opacity = Math.sin(lt * Math.PI) * .85 * vOn;
  });

  // ===== bloco 6: carros =====
  CARROS.forEach((g, i) => {
    g.visible = t >= bt(4, 8.6);
    const dir = i % 2 ? 1 : -1, z = dir * 1.1;
    const x = ((t * 5.5 + i * 9.7) % 80) - 40;
    g.position.set(dir * x, DY + .02, z); g.rotation.y = dir > 0 ? 0 : Math.PI;
  });

  // frente do mundo some nos cortes
  frenteObjs.forEach((o) => o.visible = !corte);

  // câmera
  const fim = k + 1 < T.length ? T[k + 1][0] : D.dur;
  const u = io(fx(t, shot[0], fim));
  const L = (a, b) => new THREE.Vector3().fromArray(a).lerp(new THREE.Vector3().fromArray(b), u);
  cam.position.copy(L(shot[1], shot[3])); cam.lookAt(L(shot[2], shot[4]));
  rd.render(sc, cam);
  // etiquetas
  ET.forEach((e) => {
    const on = t >= e.a && t < e.b;
    if (!on) { e.el.style.opacity = 0; return; }
    v3.fromArray(e.p).project(cam);
    const x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H;
    const ap = pop(fx(t, e.a, e.a + .3));
    e.el.style.opacity = v3.z < 1 ? 1 : 0;
    e.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${ap})`;
  });
  const w = D.palavras.find((p) => t >= p.s && t < p.e);
  leg.textContent = w ? w.w : "";
}
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
window.__render = renderAt;
