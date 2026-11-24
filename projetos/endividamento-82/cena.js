// =====================================================================================
// CENA 3D EXPLICATIVA: por que 82% das famílias brasileiras estão endividadas.
// Como usar num tema novo:
//   • MOTOR (renderer, luz, materiais, utilidades caixa/cil/pilar, fx/io/pop/h, peças GLB, bt, etiquetas, legenda): mantenha.
//   • PEÇAS PRONTAS: carro, navio, casa, árvore... vêm da biblioteca Kenney (scripts/pecas_3d.py). Carregue com
//     `await carregaPecas([...])` antes de montar o mundo e use peca(nome, {comp|alt|larg}, x, y, z, rotY).
//   • MUNDO: troque os objetos (casa, terreno, a obra) pelos do seu tema. Tudo low poly com flatShading.
//   • TOMADAS (const T): uma linha por troca de câmera, a cada 3–4 s (em "segundos de bloco", escala 0–10).
//   • renderAt(t): cada etapa da obra é função do tempo, com bt(bloco, s). Nada de Math.random nem relógio.
// Regras de estilo: references/regras-3d.md
// =====================================================================================
import * as THREE from "./lib/three.module.js";

const W = 1080, H = 1920;
const D = window.DADOS; // { dur, blocos:[ini...], palavras:[{w,s,e}], etiquetas:[...] }
const cv = document.getElementById("cena");
const rd = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
rd.setPixelRatio(1); rd.setSize(W, H, false);
rd.shadowMap.enabled = true; rd.shadowMap.type = THREE.PCFSoftShadowMap;
rd.outputColorSpace = THREE.SRGBColorSpace; rd.toneMapping = THREE.ACESFilmicToneMapping; rd.toneMappingExposure = .95;
const sc = new THREE.Scene();
sc.background = new THREE.Color("#8FD0F5");
sc.fog = new THREE.Fog("#BFE4F7", 45, 110);
const cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 300);

// luz
sc.add(new THREE.HemisphereLight("#DCE8FF", "#3A3550", 1.0));
const sol = new THREE.DirectionalLight("#FFE6C0", 1.7);
sol.position.set(14, 26, 12); sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 70 }); sol.shadow.radius = 4; sol.shadow.bias = -0.0004;
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
window.THREE = THREE;
// ================= MUNDO: auditório + palco + bairro =================
const AZ = "#1B4FBF", LA = "#F28C28", VD = "#3FAE5A", VM = "#D8343B";
const mt = (c, r = .8, m = 0, extra = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: r, metalness: m, ...extra });
const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const txt = (g, s, x, y, px, cor = "#fff", al = "center") => { g.fillStyle = cor; g.font = `900 ${px}px "M", Arial, sans-serif`; g.textAlign = al; g.textBaseline = "middle"; g.fillText(s, x, y); };
const chao = new THREE.Mesh(new THREE.BoxGeometry(160, .2, 120), mt("#1A1F30", .9)); chao.position.y = -.1; chao.receiveShadow = true; sc.add(chao);
const paredes = [caixa(40, 13, .6, mt("#232842", .9), 0, 6.5, -9.2, false), caixa(.6, 11, 40, mt("#1C2036", .9), -15, 5.5, 8, false), caixa(.6, 11, 40, mt("#1C2036", .9), 15, 5.5, 8, false)];
// plateia
const gente = [];
for (let r = 0; r < 5; r++) for (let c = -4; c <= 4; c++) {
  const x = c * 1.9 + (c > 0 ? .5 : -.5), z = 6.4 + r * 2.2; const m = mt((r + c) % 3 === 0 ? "#4A2630" : "#3A1E2B", .85);
  caixa(1.3, .7, 1.2, m, x, .35, z); caixa(1.3, 1.5, .28, m, x, 1.0, z + .62); caixa(.2, .5, 1.1, m, x - .66, .85, z); caixa(.2, .5, 1.1, m, x + .66, .85, z);
  if (r >= 1 && h(r * 9 + c + 40) > .5) { const cp = ["#E9ECF4", "#F4C224", "#5FB96A", "#D8483B", "#3C8DDC"][Math.floor(h(r * 5 + c) * 5)]; cil(.38, .8, mt(cp, .8), x, 1.1, z + .05, 8); const hd = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 6), mt("#E8B98C", .9)); hd.position.set(x, 1.8, z + .05); hd.castShadow = true; sc.add(hd); gente.push(hd); }
}
// palco, cortina, luzes
caixa(17, .7, 7.4, mt("#7A4B28", .65), 0, .35, -3.6); caixa(17, .25, .5, mt("#E6B04A", .4, .2), 0, .75, .1);
const cortE = new THREE.Group(), cortD = new THREE.Group(); sc.add(cortE, cortD);
for (let i = 0; i < 6; i++) { const z = -7.2 + Math.sin(i * 1.7) * .22; const a = new THREE.Mesh(new THREE.BoxGeometry(1.0, 8.6, .35), mt(i % 2 ? "#B3262E" : "#9C1F27", .9)); a.position.set(-5.5 + i * 1.0, 4.9, z); a.castShadow = true; cortE.add(a); const b = a.clone(); b.position.x = .5 + i * 1.0; cortD.add(b); }
caixa(18, 1.3, .9, mt("#7E151D", .9), 0, 9.3, -7.0);
[-5, 0, 5].forEach((x) => { const l = new THREE.SpotLight("#FFE2B0", 45, 40, .55, .6, 1.2); l.position.set(x, 10.5, 2); l.target.position.set(x * .6, 1, -3.5); sc.add(l, l.target); caixa(.8, .5, .8, mt("#22252E", .5, .5), x, 10.6, 2, false); });
const quente = new THREE.PointLight("#FFB45A", 55, 16, 1.6); quente.position.set(0, 5, 2); sc.add(quente);
const Y0 = .7; // altura do palco
// --- b0: mesa com o salário (maços de notas) que some
const mesa = [caixa(4.4, .18, 2.4, mt("#B07D4F", .6), -3.6, 1.6, -1), ...[[-5.5, 0], [-1.7, 0], [-5.5, -2], [-1.7, -2]].map(([x, z]) => caixa(.22, 1.3, .22, mt("#7B5233", .7), x, .95, z))];
const notas = [];
for (let b = 0; b < 3; b++) for (let i = 0; i < 6; i++) {
  const x = -4.5 + b * .95 + (h(b * 7 + i) - .5) * .08, y = 1.84 + i * .2, z = -1 + (h(i + b * 3) - .5) * .1;
  const g = caixa(.9, .17, 1.9, mt(i % 2 ? "#5FB96A" : "#79C97F", .8), x, y, z); g.rotation.y = (h(i + b) - .5) * .12; g.userData = { x, y, z, o: b * 6 + i }; notas.push(g);
}
const volantes = Array.from({ length: 16 }, (_, i) => { const g = caixa(.95, .03, .45, mt("#79C97F", .7), 0, 0, 0, false); g.userData = { x: -3.6 + (h(i + 70) - .5) * 3, z: -1 + (h(i + 71) - .5) * 2, dx: (h(i + 73) - .5) * 14, ph: h(i + 72) * 4 }; return g; });
// --- b1: bairro (lares) com janelas que acendem + cartão, carnê e financiamento
const CX = -29, CZ = -3;
caixa(60, .08, 6, mt("#3A3F4C", .95), CX + 6, .04, CZ + 4.2, false);
const janelaOn = mt("#FFC861", .5, 0, { emissive: new THREE.Color("#FFB23E"), emissiveIntensity: 0 });
const casas = Array.from({ length: 12 }, (_, i) => {
  const c = i % 4, r = Math.floor(i / 4); const x = CX + c * 3.8, z = CZ + r * 4.2 - 5;
  const g = new THREE.Group(); g.position.set(x, 0, z); sc.add(g);
  const add = (geo, m, px, py, pz) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(2.6, 1.9, 2.2), mt(["#EFE8D8", "#F2D7B0", "#D9E6F2", "#F0C9C0"][i % 4], .85), 0, .95, 0);
  const tel = add(new THREE.ConeGeometry(2.0, 1.2, 4), mt("#C9533B", .8), 0, 2.5, 0); tel.rotation.y = Math.PI / 4;
  add(new THREE.BoxGeometry(.7, 1.2, .06), mt("#6B4A2E", .7), 0, .6, 1.12);
  const jm = janelaOn.clone(); add(new THREE.BoxGeometry(.55, .55, .05), jm, -.85, 1.2, 1.12); add(new THREE.BoxGeometry(.55, .55, .05), jm, .85, 1.2, 1.12);
  return { g, jm };
});
const rede = Array.from({ length: 48 }, (_, i) => { const x = CX - 4 + (i % 12) * 1.9, z = CZ - 13 - Math.floor(i / 12) * 2.2; const m = mt("#5A6070", .8); const b = caixa(1.1, .8, 1.1, m, x, .4, z); const t = new THREE.Mesh(new THREE.ConeGeometry(.85, .6, 4), mt("#7A3B30", .8)); t.position.set(x, 1.1, z); t.rotation.y = Math.PI / 4; sc.add(t); return b; });
const pictoTex = (k) => tex(256, 170, (g, w, hh) => {
  g.fillStyle = ["#1B3BA8", "#F4C224", "#3FAE5A"][k]; g.fillRect(0, 0, w, hh); g.fillStyle = "#fff";
  if (k === 0) { g.fillStyle = "#14204F"; g.fillRect(28, 30, 200, 112); g.fillStyle = "#E6B04A"; g.fillRect(48, 58, 40, 30); g.fillStyle = "#fff"; g.fillRect(48, 108, 150, 12); }
  if (k === 1) { for (let j = 0; j < 3; j++) { g.fillStyle = j === 2 ? "#fff" : "#EDE3C8"; g.fillRect(56 + j * 8, 26 + j * 8, 130, 110); } g.fillStyle = "#8A7A55"; for (let j = 0; j < 4; j++) g.fillRect(90, 66 + j * 18, 90, 6); }
  if (k === 2) { g.fillRect(50, 80, 156, 44); g.fillRect(84, 52, 90, 34); g.fillStyle = "#1A1A1A"; g.beginPath(); g.arc(88, 128, 16, 0, 7); g.arc(170, 128, 16, 0, 7); g.fill(); }
});
const pictos = [0, 1, 2].map((k) => { const g = caixa(1.9, 1.26, .1, mt("#fff", .6, 0, { map: pictoTex(k) }), CX + 2 + k * 4, 4.6, CZ + 3.6); return g; });
// --- b2: geladeira + 10 parcelas
const gel = new THREE.Group(); gel.position.set(-1.4, Y0, -2); sc.add(gel);
{ const add = (w, hh, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); o.position.set(x, y, z); o.castShadow = true; gel.add(o); return o; };
  add(1.7, 3.5, 1.4, mt("#EEF2F6", .35, .2), 0, 1.75, 0); add(1.72, .05, 1.42, mt("#9AA3B0", .4), 0, 2.4, 0); add(.08, .9, .1, mt("#9AA3B0", .3, .6), .6, 2.95, .74); add(.08, 1.3, .1, mt("#9AA3B0", .3, .6), .6, 1.4, .74); }
const parcelas = Array.from({ length: 10 }, (_, i) => { const g = caixa(.62, .42, .06, mt("#fff", .6, 0, { map: tex(160, 108, (c, w, hh) => { c.fillStyle = i < 9 ? "#F4C224" : VM; c.fillRect(0, 0, w, hh); txt(c, `${i + 1}/10`, w / 2, hh / 2 + 2, 52, "#1A1A1A"); }) }), 0, 0, 0); g.userData = { x: .6 + (i % 5) * .7, y: Y0 + 3.0 - Math.floor(i / 5) * .6, z: -1.6 }; return g; });
// --- b3: bolhas de resposta sobre a plateia (85% com cartão)
const cartaoMini = mt("#fff", .5, 0, { map: pictoTex(0) });
const bolhas = gente.map((hd, i) => { const g = caixa(1.0, .66, .12, h(i + 9) < .85 ? cartaoMini : mt("#9AA3B5", .6), hd.position.x, 3.0, hd.position.z, false); return g; });
// --- b4: a fatura e o rotativo
const fatura = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.4, .12), mt("#fff", .6, 0, { map: tex(320, 440, (g, w, hh) => {
  g.fillStyle = "#F7F5EF"; g.fillRect(0, 0, w, hh); g.fillStyle = "#1B3BA8"; g.fillRect(0, 0, w, 70); txt(g, "FATURA", w / 2, 38, 44);
  g.fillStyle = "#C8CCD4"; for (let j = 0; j < 6; j++) g.fillRect(30, 100 + j * 30, 260 - (j % 3) * 50, 12);
  g.fillStyle = VD; g.fillRect(20, 300, 280, 56); txt(g, "MÍNIMO", w / 2, 330, 40);
  g.fillStyle = "#1A1A1A"; g.fillRect(20, 372, 280, 50); txt(g, "TOTAL", w / 2, 399, 34); }) }));
fatura.position.set(-1.8, Y0 + 2.9, -5); fatura.castShadow = true; sc.add(fatura);
const rotBox = new THREE.Group(); rotBox.position.set(3.2, Y0, -4.6); sc.add(rotBox);
{ const a = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 2.2), mt(VM, .6)); a.position.y = .8; a.castShadow = true; rotBox.add(a);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .7), new THREE.MeshBasicMaterial({ map: tex(400, 116, (g, w, hh) => { g.fillStyle = VM; g.fillRect(0, 0, w, hh); txt(g, "ROTATIVO", w / 2, hh / 2 + 2, 66); }) })); p.position.set(0, .85, 1.11); rotBox.add(p); }
const resto = Array.from({ length: 8 }, (_, i) => { const g = caixa(1.1, .2, .7, mt(i % 2 ? "#79C97F" : "#5FB96A", .8), 0, 0, 0); g.userData = { i }; return g; });
// --- b5: barra vermelha dos juros
const barraJ = pilar(2.2, 1, 2.2, mt(VM, .55), 0, Y0, -3.4);
// --- b6: R$ 1.000 → R$ 2.000 e o teto
const pilhaA = Array.from({ length: 10 }, (_, i) => caixa(1.7, .26, 1.0, mt(i % 2 ? "#5FB96A" : "#79C97F", .8), -2.2, Y0 + .13 + i * .28, -2));
const pilhaB = Array.from({ length: 10 }, (_, i) => caixa(1.7, .26, 1.0, mt(i % 2 ? "#5FB96A" : "#79C97F", .8), 2.2, Y0 + .13 + i * .28, -2));
const teto = caixa(3.2, .14, 1.8, mt(VM, .4, 0, { transparent: true, opacity: .85 }), 2.2, Y0 + 2.86, -2, false);
// --- b7: 10 casinhas, 3 com conta atrasada
const VERM = [1, 5, 8];
const casinhas = Array.from({ length: 10 }, (_, i) => {
  const x = -2.4 + (i % 5) * 1.2, z = -3.2 + Math.floor(i / 5) * 1.8; const g = new THREE.Group(); g.position.set(x, Y0, z); sc.add(g);
  const m = mt("#EFE8D8", .8); const b = new THREE.Mesh(new THREE.BoxGeometry(.8, .7, .8), m); b.position.y = .35; b.castShadow = true; g.add(b);
  const t = new THREE.Mesh(new THREE.ConeGeometry(.66, .5, 4), mt("#8E95A3", .8)); t.position.y = .95; t.rotation.y = Math.PI / 4; g.add(t);
  return { g, m, t };
});
// --- b8: entrada fácil (verde) e saída cara (vermelha)
function arco(x, cor) { const g = new THREE.Group(); g.position.set(x, Y0, -3); sc.add(g); const m = mt(cor, .5, 0, { emissive: new THREE.Color(cor), emissiveIntensity: .25 });
  for (const [w, hh, px, py] of [[.4, 3.6, -1.1, 1.8], [.4, 3.6, 1.1, 1.8], [2.6, .45, 0, 3.8]]) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, .5), m); o.position.set(px, py, 0); o.castShadow = true; g.add(o); } return g; }
const arcoV = arco(-2.2, VD), arcoR = arco(2.2, VM);
// --- b9: cartão de crédito gigante
const cartao = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.8, .14), mt("#fff", .35, .2, { map: tex(640, 408, (g, w, hh) => {
  const gr = g.createLinearGradient(0, 0, w, hh); gr.addColorStop(0, "#14204F"); gr.addColorStop(1, "#2E4FCF"); g.fillStyle = gr; g.fillRect(0, 0, w, hh);
  g.fillStyle = "#E6B04A"; g.fillRect(60, 130, 90, 70); txt(g, "•••• •••• •••• 0082", 60, 290, 46, "#fff", "left"); txt(g, "CRÉDITO", w - 50, 70, 40, "#F4C224", "right"); }) }));
cartao.position.set(0, 4.6, -3); cartao.castShadow = true; sc.add(cartao);
// números grandes em HTML (b5 e b9)
const camada = document.getElementById("etq");
const big = (top, px, cor = "#FFD21F", st = 12) => { const d = document.createElement("div"); d.style.cssText = `position:absolute;left:0;width:1080px;top:${top}px;text-align:center;opacity:0;font:900 ${px}px "M", Arial;color:${cor};-webkit-text-stroke:${st}px #1A1A1A;paint-order:stroke fill;letter-spacing:-3px`; camada.appendChild(d); return d; };
// ---------- tomadas ----------
const B = D.blocos;
const LB = B.map((b, i) => (i + 1 < B.length ? B[i + 1] : D.dur - 1.2) - b);
const bt = (i, s) => B[i] + s * LB[i] / 10;
const T = [
  [0, [-3.55, 3.0, 3.2], [-3.55, 1.9, -1], [-3.55, 4.2, 6.5], [-3.55, 2.2, -1]],
  [bt(0, 5.5), [2, 6, 11], [-2.2, 2.6, -2], [-6, 7, 12], [-2.6, 2.6, -2]],
  [B[1], [-12, 9, 14], [-23, 1, -4], [-17, 11, 16], [-23, 1.4, -3]],
  [bt(1, 6), [-31, 15, 12], [-24, 0, -8], [-16, 17, 10], [-24, 0, -8]],
  [B[2], [0, 3.2, 7], [0, 2.4, -2], [2.2, 4, 8.5], [.4, 2.6, -2]],
  [B[3], [0, 4.6, -5.5], [0, 1.8, 10], [0, 5.2, -4.5], [0, 2, 10]],
  [bt(3, 5), [5, 5.4, 3], [0, 2, 10], [-4, 6, 4], [0, 2, 10]],
  [B[4], [0, 6.5, 14], [0, 4, -5], [0, 5.2, 9.5], [0, 3.8, -5]],
  [bt(4, 5), [-2, 4.8, 7.5], [.6, 2.8, -4.6], [1, 4.6, 8.5], [.8, 2.6, -4.6]],
  [B[5], [0, 3, 9], [0, 4.2, -3], [-2.5, 4, 8], [0, 4.6, -3]],
  [B[6], [0, 3.2, 8.5], [0, 2.2, -2], [2.5, 3.8, 7.5], [0, 2.4, -2]],
  [B[7], [0, 5.2, 6.5], [0, 1, -2.4], [-2, 4.2, 6], [0, 1, -2.4]],
  [B[8], [0, 4, 10], [0, 3, -3], [0, 3.6, 8], [0, 3, -3]],
  [B[9], [0, 4.6, 5.5], [0, 4.6, -3], [0, 4.8, 9.5], [0, 4.6, -3]],
];
const tomada = (t) => { let k = 0; for (let i = 0; i < T.length; i++) if (t >= T[i][0]) k = i; return k; };
const v3 = new THREE.Vector3(), v3b = new THREE.Vector3();
const lp = (a, b, u) => v3.fromArray(a).lerp(v3b.fromArray(b), u).clone();
function poseShot(k, t) { const s = T[k]; const fim = k + 1 < T.length ? T[k + 1][0] : D.dur; const u = io(fx(t, s[0], fim)); return [lp(s[1], s[3], u), lp(s[2], s[4], u)]; }
const ET = D.etiquetas.map((e) => { const d = document.createElement("div"); d.className = "etq"; d.textContent = e.txt; camada.appendChild(d); return { ...e, el: d }; });
const leg = document.getElementById("leg");
const BG = ["#0E1220", "#1B3BA8", "#2A1B5E", "#122A5E", "#0E1220", "#6E1219", "#E9EEF8", "#E0A25A", "#1B3BA8", "#0E1220"];
const cBG = BG.map((c) => new THREE.Color(c)); const tmp = new THREE.Color();
function bgAt(t) { let k = 0; for (let i = 0; i < B.length; i++) if (t >= B[i]) k = i; const u = io(fx(t, B[k], B[k] + .6)); return tmp.copy(cBG[Math.max(0, k - 1)]).lerp(cBG[k], k === 0 ? 1 : u); }
sc.add(sol.target);
const seg = (t, i) => t >= B[i] - .15 && t < (B[i + 1] ?? 1e9) + .15;
const sc1 = (o, k) => o.scale.setScalar(Math.max(.001, k));
function renderAt(t) {
  const col = bgAt(t); sc.background.copy(col); sc.fog.color.copy(col); chao.material.color.copy(col).multiplyScalar(.62); paredes.forEach((p, i) => p.material.color.copy(col).multiplyScalar(i ? .55 : .75));
  paredes.forEach((q) => q.visible = !(t > B[1] - 1 && t < B[2] + .2));
  const ab = io(fx(t, B[4] - .2, B[4] + 1.4)); cortE.position.x = -ab * 5.6; cortD.position.x = ab * 5.6;
  // b0: o salário chega e some
  const vis0 = t < B[1] + .3; mesa.forEach((m) => m.visible = vis0);
  notas.forEach((n) => { const u = n.userData, k = pop(fx(t, .2 + (u.o % 6) * .08 + Math.floor(u.o / 6) * .1, .55 + (u.o % 6) * .08 + Math.floor(u.o / 6) * .1));
    const s0 = bt(0, 1.6) + (17 - u.o) * .05, v = io(fx(t, s0, s0 + 1.1));
    n.visible = vis0 && v < .99; n.position.set(u.x + (h(u.o) - .5) * 6 * v, u.y + v * 5, u.z + v * 2); n.rotation.z = v * 3 * (h(u.o + 3) - .5); sc1(n, k * (1 - v)); });
  volantes.forEach((v, i) => { const t0 = bt(0, 1.6) + i * .12, u = (t - t0) / 2.2, on = u > 0 && u < 1 && t < B[1]; v.visible = on; if (on) { const d = v.userData; v.position.set(d.x + d.dx * u, 2.2 + u * 6, d.z + Math.sin(u * 6 + d.ph) * .5); v.rotation.set(u * 5, u * 3, 0); } });
  // b1: lares; cartão, carnê, financiamento; janelas acendem
  pictos.forEach((p, k) => { const kk = pop(fx(t, bt(1, 3.6 + k * .7), bt(1, 4.2 + k * .7))); p.visible = seg(t, 1); sc1(p, kk); p.position.y = 4.6 + Math.sin(t * 2 + k) * .1; p.rotation.y = Math.sin(t * 1.3 + k) * .25; });
  casas.forEach((c, i) => { const k = fx(t, bt(1, .6 + i * .2), bt(1, .9 + i * .2)); c.jm.emissiveIntensity = 1.4 * k; c.g.scale.setScalar(1 + .06 * Math.sin(k * Math.PI)); });
  rede.forEach((r, i) => { const k = cl(io(fx(t, bt(1, 6), bt(1, 9))) * 1.5 - h(i) * .5); r.material.color.set("#5A6070").lerp(new THREE.Color("#FFB23E"), k); });
  // b2: geladeira + parcelas
  gel.visible = seg(t, 2); sc1(gel, pop(fx(t, B[2] + .1, B[2] + .9)));
  parcelas.forEach((p, i) => { const u = io(fx(t, bt(2, 1.8) + i * .14, bt(2, 1.8) + i * .14 + .7)); const d = p.userData; p.visible = seg(t, 2) && u > 0; p.position.set(d.x + (1 - u) * 4, d.y - (1 - u) * 3, d.z + (1 - u) * 2); p.rotation.z = (1 - u) * 2.5; sc1(p, u); });
  // b3: bolhas
  bolhas.forEach((g, i) => { const k = pop(fx(t, B[3] + .4 + i * .22, B[3] + .8 + i * .22)); g.visible = seg(t, 3); sc1(g, k); g.position.y = 3.0 + Math.sin(t * 2 + i) * .08; });
  // b4: fatura → só o mínimo → o resto vai pro rotativo
  const v4 = seg(t, 4); fatura.visible = v4; rotBox.visible = v4; sc1(fatura, pop(fx(t, B[4] + .9, B[4] + 1.7))); sc1(rotBox, pop(fx(t, bt(4, 5), bt(4, 5.8)))); fatura.rotation.y = Math.sin(t * .8) * .08;
  resto.forEach((r, i) => { const s0 = bt(4, 6) + i * .14, u = io(fx(t, s0, s0 + .8)); r.visible = v4 && t > bt(4, 2.5) && u < .98; const x0 = -1.8, y0 = Y0 + .9 + i * .22; r.position.set(x0 + (3.2 - x0) * u, y0 + Math.sin(u * Math.PI) * 2 + (Y0 + 1.6 - y0) * u, -4.4 + (-4.6 + 4.4) * u); sc1(r, pop(fx(t, bt(4, 2.5) + i * .05, bt(4, 3) + i * .05))); });
  // b5: barra e número
  const k5 = io(fx(t, B[5] + .3, bt(5, 6.5))); barraJ.visible = seg(t, 5); barraJ.scale.y = Math.max(.001, .2 + k5 * 6.3);
  // b6: pilhas e teto
  const v6 = seg(t, 6), kA = pop(fx(t, B[6] + .2, B[6] + .9));
  pilhaA.forEach((p, i) => { p.visible = v6 && i < 5; sc1(p, kA); });
  pilhaB.forEach((p, i) => { const k = i < 5 ? kA : pop(fx(t, bt(6, 6.2) + (i - 5) * .18, bt(6, 6.6) + (i - 5) * .18)); p.visible = v6; sc1(p, k); });
  teto.visible = v6; teto.scale.x = Math.max(.001, io(fx(t, bt(6, 3), bt(6, 4.2))));
  // b7: casinhas, 3 ficam vermelhas
  casinhas.forEach((c, i) => { c.g.visible = seg(t, 7); sc1(c.g, pop(fx(t, B[7] + .1 + i * .07, B[7] + .5 + i * .07))); const j = VERM.indexOf(i);
    const kr = j < 0 ? 0 : fx(t, bt(7, 2.6 + j * .7), bt(7, 3 + j * .7)); c.m.color.set("#EFE8D8").lerp(new THREE.Color(VM), kr); c.t.material.color.set("#8E95A3").lerp(new THREE.Color("#7E151D"), kr); c.g.position.y = Y0 + Math.sin(kr * Math.PI) * .4; });
  // b8: arcos
  [arcoV, arcoR].forEach((a, i) => { a.visible = seg(t, 8); sc1(a, pop(fx(t, bt(8, 1 + i * 4), bt(8, 1.8 + i * 4)))); });
  // b9: cartão girando + comenta 3D
  cartao.visible = t >= B[9] - .1; sc1(cartao, pop(fx(t, B[9], B[9] + .8))); cartao.rotation.y = (t - B[9]) * 1.4; cartao.position.y = 4.2 + Math.sin(t * 1.5) * .15;
  // câmera contínua
  const k = tomada(t); let [p, tg] = poseShot(k, t);
  const BL = .9; if (k > 0 && t < T[k][0] + BL) { const [p0, t0] = poseShot(k - 1, T[k][0]); const w = io(fx(t, T[k][0], T[k][0] + BL)); p = p0.lerp(p, w); tg = t0.lerp(tg, w); }
  cam.fov = 66; cam.updateProjectionMatrix(); cam.position.copy(p); cam.lookAt(tg);
  sol.target.position.copy(tg); sol.position.copy(tg).add(new THREE.Vector3(10, 20, 14)); sol.target.updateMatrixWorld();
  rd.render(sc, cam);
  ET.forEach((e) => {
    const vis = t >= e.a && t < e.b; if (!vis) { e.el.style.opacity = 0; return; }
    v3.fromArray(e.p).project(cam); const x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H; const ap = pop(fx(t, e.a, e.a + .3));
    const hw = e.el.offsetWidth * .5 + 64, xs = Math.min(W - hw, Math.max(hw, x)), ys = Math.min(1180, Math.max(260, y));
    e.el.style.opacity = v3.z < 1 ? 1 : 0; e.el.style.transform = `translate(${xs}px, ${ys}px) translate(-50%, -100%) scale(${ap})`;
  });
  ovRender(t);
}

// ================= LETRAS E GRÁFICOS (estilo: texto com brilho, botão azul, cartão de vidro com borda limão) =================
const css = document.createElement("style");
css.textContent = `@font-face{font-family:"I";font-weight:100 900;src:url("lib/fonts/Inter-VF.woff2") format("woff2");}
#scrim{position:absolute;left:0;top:0;width:1080px;height:1100px;background:linear-gradient(rgba(4,8,20,.62),rgba(4,8,20,.35) 55%,rgba(4,8,20,0));pointer-events:none}
.g{position:absolute;left:40px;right:40px;text-align:center;pointer-events:none}
.l{display:block;margin:0 auto;will-change:transform,opacity,filter}
.sm{font:500 56px/1.15 "I";color:#D6E6FF;letter-spacing:-.5px;text-shadow:0 0 28px rgba(120,170,255,.55),0 3px 12px rgba(0,0,0,.55)}
.bg{font:900 140px/1.02 "I";color:#fff;letter-spacing:-5px;text-shadow:0 0 44px rgba(150,195,255,.6),0 8px 24px rgba(0,0,0,.55)}
.pill{display:table;margin:14px auto 0;padding:10px 52px 22px;border-radius:30px;font:800 86px/1.1 "I";color:#fff;letter-spacing:-2.5px;white-space:nowrap;
 background:linear-gradient(#4FA6FF,#1C6FE6);box-shadow:inset 0 3px 0 rgba(255,255,255,.4),inset 0 -6px 0 rgba(0,0,0,.15),0 14px 50px rgba(40,130,255,.6)}
.pill.red{background:linear-gradient(#FF6A6E,#D92B3A);box-shadow:inset 0 3px 0 rgba(255,255,255,.4),inset 0 -6px 0 rgba(0,0,0,.15),0 14px 50px rgba(255,60,70,.55)}
.card{display:table;margin:0 auto;padding:30px 64px 40px;border-radius:44px;background:rgba(16,18,24,.78);border:4px solid #D4FF3A;
 box-shadow:0 0 46px rgba(212,255,58,.45),inset 0 0 34px rgba(212,255,58,.1)}
.num{font:900 196px/1 "I";color:#D4FF3A;letter-spacing:-7px;white-space:nowrap;text-shadow:0 0 56px rgba(212,255,58,.6)}
.num.br{color:#fff;text-shadow:0 0 40px rgba(255,255,255,.35)}
.sub{font:600 58px/1.2 "I";color:#F1F4F8;letter-spacing:-.5px}
.sub b{color:#D4FF3A;font-weight:800}
#leg{top:1430px !important;font:800 84px "I" !important;letter-spacing:-1.5px;color:#fff !important;-webkit-text-stroke:0 !important;
 text-shadow:0 0 3px #000,0 5px 20px rgba(0,0,0,.75) !important}`;
document.head.appendChild(css);
const root = document.getElementById("root"); const scrim = document.createElement("div"); scrim.id = "scrim"; root.insertBefore(scrim, document.getElementById("etq"));
const nrm = (x) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
// tempo da n-ésima ocorrência de uma palavra dentro do bloco
function wt(i, w, n = 1) { const a = B[i] - .2, b = (B[i + 1] ?? 1e9); let c = 0; for (const p of D.palavras) if (p.s >= a && p.s < b && nrm(p.w).startsWith(nrm(w))) { if (++c === n) return p.s; } return B[i] + .3; }
const spr = (x) => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-6.5 * x) * Math.cos(9.5 * x);
const oC = (x) => 1 - Math.pow(1 - x, 3);
const fmt = (v) => Math.round(v).toLocaleString("pt-BR");
// grupos: cada linha entra na palavra; o grupo sai quando começa o próximo do mesmo lugar (ou no fim do bloco)
const G = [
  { b: 0, top: 330, ini: ["SALÁRIO"], L: [["sm", "você recebeu o", ["RECEBEU"]], ["bg", "salário", ["SALÁRIO"]]], ate: ["CALMA"] },
  { b: 0, top: 300, L: [["card", [["num", 82, "", "%", ["OITENTA"]], ["sub", "das famílias brasileiras", ["FAMÍLIAS"]]]], ["pill red", "endividadas", ["ENDIVIDADAS"]]] },
  { b: 1, top: 330, L: [["sm", "pra CNC, endividado", ["CNC"]], ["bg", "NÃO É", ["NÃO"]], ["pill red", "caloteiro", ["CALOTEIRO"]]], ate: ["SESSENTA"] },
  { b: 1, top: 330, L: [["card", [["num", 60, "", " mi", ["SESSENTA"]], ["sub", "de lares · <b>recorde</b>", ["LARES"]]]]] },
  { b: 2, top: 300, L: [["card", [["num", 10, "", "x", ["DEZ"]], ["sub", "e a geladeira é sua", ["VEZES"]]]]], ate: ["PRONTO"] },
  { b: 2, top: 330, L: [["sm", "pronto,", ["PRONTO"]], ["bg", "entrou na", ["ENTROU"]], ["pill", "estatística", ["ESTATÍSTICA"]]], ate: ["ARMADILHA"] },
  { b: 2, top: 360, L: [["sm", "e é aí que começa", ["COMEÇA"]], ["pill red", "a armadilha", ["ARMADILHA"]]] },
  { b: 3, top: 300, L: [["card", [["num", 85, "", "%", ["OITENTA"]], ["sub", "das endividadas têm <b>cartão</b>", ["FAMÍLIAS"]]]]], ate: ["PARCELADO"] },
  { b: 3, top: 330, L: [["sm", "o parcelado vira", ["PARCELADO"]], ["bg", "um salário", ["SALÁRIO"]], ["pill red", "que não existe", ["EXISTE"]]] },
  { b: 4, top: 330, L: [["sm", "e aqui", ["AQUI"]], ["bg", "a maioria", ["MAIORIA"]], ["pill red", "erra", ["ERRA"]]], ate: ["APERTA"] },
  { b: 4, top: 330, L: [["sm", "você paga só o", ["PAGA"]], ["bg", "mínimo", ["MÍNIMO"]], ["pill red", "o resto → rotativo", ["ROTATIVO"]]] },
  { b: 5, top: 280, L: [["card", [["num", 400, "+", "%", ["QUATROCENTOS"]], ["sub", "de juros <b>ao ano</b>", ["JUROS"]]]], ["sm", "segundo o Banco Central", ["BANCO"]]] },
  { b: 6, top: 330, L: [["sm", "desde 2024 existe um", ["DESDE"]], ["bg", "teto", ["TETO"]], ["pill", "100% da dívida", ["DÍVIDA"]]], ate: ["MESMO"] },
  { b: 6, top: 300, L: [["card", [["num br", 1000, "R$ ", "", ["MIL", 2]], ["num", 2000, "R$ ", "", ["DOIS", 2]]]], ["sm", "mesmo com o teto", ["MESMO"]]] },
  { b: 7, top: 300, L: [["card", [["num", 3, "", " em 10", ["TRÊS"]], ["sub", "famílias com <b>conta atrasada</b>", ["ATRASO"]]]]] },
  { b: 8, top: 330, L: [["sm", "não é que o brasileiro é", ["BRASILEIRO"]], ["bg", "gastão", ["GASTÃO"]]], ate: ["CRÉDITO"] },
  { b: 8, top: 330, L: [["sm", "é crédito", ["CRÉDITO"]], ["pill", "fácil na entrada", ["FÁCIL"]], ["pill red", "caríssimo na saída", ["CARÍSSIMO"]]] },
  { b: 9, top: 330, L: [["sm", "quer aprender a fazer vídeos assim?", ["APRENDER"]], ["bg", "comenta", ["COMENTA"]], ["pill", "3D", ["TRÊS"]]] },
];
const tW = (b, k) => wt(b, k[0], k[1] || 1);
const itens = [];   // {el, a (entrada), num?}
G.forEach((g, gi) => {
  const box = document.createElement("div"); box.className = "g"; box.style.top = g.top + "px"; camada.appendChild(box); g.el = box;
  const mk = (cls, html, k, parent) => { const d = document.createElement("div"); d.className = "l " + cls; d.innerHTML = html; parent.appendChild(d); const it = { el: d, a: tW(g.b, k), g }; itens.push(it); return it; };
  g.L.forEach((ln) => {
    if (ln[0] === "card") { const c = mk("card", "", ln[1][0][4], box); c.card = true;
      ln[1].forEach((x) => { if (x[0].startsWith("num")) { const it = mk(x[0], "", x[4], c.el); it.num = { v: x[1], pre: x[2], suf: x[3] }; } else mk(x[0], x[1], x[2], c.el); }); }
    else mk(ln[0], ln[1], ln[2], box);
  });
});
G.forEach((g, gi) => { g.a = Math.min(...itens.filter((i) => i.g === g).map((i) => i.a)); });
G.forEach((g, gi) => { g.z = g.ate ? tW(g.b, g.ate) - .05 : (B[g.b + 1] ?? D.dur + 1) - .12; });
function ovRender(t) {
  G.forEach((g) => { const on = t >= g.a - .05 && t < g.z + .35; g.el.style.display = on ? "block" : "none";
    const out = fx(t, g.z, g.z + .3); g.el.style.opacity = 1 - out; g.el.style.transform = `translateY(${-out * 40}px) scale(${1 - out * .06})`; });
  itens.forEach((it) => { if (it.g.el.style.display === "none") return;
    const k = fx(t, it.a, it.a + .55), s = spr(k), o = cl(k * 3.2), bl = (1 - cl(k * 2.6)) * 14;
    const sc0 = it.card ? .82 : .7;
    it.el.style.opacity = o; it.el.style.filter = bl > .2 ? `blur(${bl.toFixed(1)}px)` : "none";
    it.el.style.transform = `translateY(${(1 - oC(k)) * 60}px) scale(${sc0 + (1 - sc0) * s})`;
    if (it.num) { const u = oC(fx(t, it.a, it.a + 1.1)), punch = Math.sin(Math.PI * fx(t, it.a + 1.05, it.a + 1.4)) * .1;
      it.el.textContent = it.num.pre + fmt(it.num.v * (it.num.v <= 10 ? Math.max(u, .1) : u)) + it.num.suf; it.el.style.transform += ` scale(${1 + punch})`; } });
  const w = D.palavras.find((q) => t >= q.s && t < q.e);
  leg.textContent = w ? w.w : ""; const kp = w ? fx(t, w.s, w.s + .16) : 1; leg.style.transform = `scale(${.86 + .14 * spr(kp)})`;
}
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
window.__render = renderAt;
