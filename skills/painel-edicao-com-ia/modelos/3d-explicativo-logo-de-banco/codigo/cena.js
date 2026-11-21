// =====================================================================================
// MODELO DE CENA 3D EXPLICATIVA (exemplo: o logo novo de um banco e o sistema por trás).
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
// ================= MUNDO: auditório + palco (Caixa, logo e sistema) =================
const AZ = "#1B4FBF", LA = "#F28C28";
const mt = (c, r = .8, m = 0, extra = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: r, metalness: m, ...extra });
const mAz = mt(AZ, .45), mLa = mt(LA, .45), mCinza = mt("#A9AFB8", .7);
const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const FONTE = '900 88px "M", Arial, sans-serif';
const placaNova = mt("#fff", .5, 0, { map: tex(512, 128, (g, w, h) => { g.fillStyle = AZ; g.fillRect(0, 0, w, h); g.fillStyle = LA; g.fillRect(0, h - 14, w, 14); g.fillStyle = "#fff"; g.font = FONTE; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("caixa", w / 2, h / 2 - 4); }) });
const placaVelha = mt("#fff", .7, 0, { map: tex(512, 128, (g, w, h) => { g.fillStyle = "#8E95A3"; g.fillRect(0, 0, w, h); g.fillStyle = "#EEF0F4"; g.save(); g.transform(1, 0, -.22, 1, 40, 0); g.font = FONTE; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("CAIXA", w / 2 + 20, h / 2 + 2); g.restore(); }) });
const chao = new THREE.Mesh(new THREE.BoxGeometry(160, .2, 120), mt("#1A1F30", .9)); chao.position.y = -.1; chao.receiveShadow = true; sc.add(chao);
// salão: paredes laterais e fundo
const paredes = [caixa(40, 13, .6, mt("#232842", .9), 0, 6.5, -9.2, false), caixa(.6, 11, 40, mt("#1C2036", .9), -15, 5.5, 8, false), caixa(.6, 11, 40, mt("#1C2036", .9), 15, 5.5, 8, false)];
// poltronas com braço, plateia (gente simples) e corredor
const poltronas = []; const gente = [];
for (let r = 0; r < 5; r++) for (let c = -4; c <= 4; c++) {
  const x = c * 1.9 + (c > 0 ? .5 : -.5), z = 6.4 + r * 2.2; const cor = (r + c) % 3 === 0 ? "#4A2630" : "#3A1E2B"; const m = mt(cor, .85);
  poltronas.push(caixa(1.3, .7, 1.2, m, x, .35, z), caixa(1.3, 1.5, .28, m, x, 1.0, z + .62), caixa(.2, .5, 1.1, m, x - .66, .85, z), caixa(.2, .5, 1.1, m, x + .66, .85, z));
  if (r >= 2 && h(r * 9 + c + 40) > .55) { const cp = ["#E9ECF4", "#F4C224", "#5FB96A", "#D8483B", "#3C8DDC"][Math.floor(h(r * 5 + c) * 5)]; cil(.38, .8, mt(cp, .8), x, 1.1, z + .05, 8); const hd = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 6), mt("#E8B98C", .9)); hd.position.set(x, 1.8, z + .05); hd.castShadow = true; sc.add(hd); gente.push(hd); }
}
// palco com degrau e faixa de luz
caixa(17, .7, 7.4, mt("#7A4B28", .65), 0, .35, -3.6); caixa(17, .25, .5, mt("#E6B04A", .4, .2), 0, .75, .1);
// cortinas com dobras + sanefa
const cortE = new THREE.Group(), cortD = new THREE.Group(); sc.add(cortE, cortD);
for (let i = 0; i < 6; i++) { const wv = 1.0, z = -7.2 + Math.sin(i * 1.7) * .22; const a = new THREE.Mesh(new THREE.BoxGeometry(wv, 8.6, .35), mt(i % 2 ? "#B3262E" : "#9C1F27", .9)); a.position.set(-8 + i * 1.0, 4.9, z); a.castShadow = true; cortE.add(a); const b = a.clone(); b.position.x = 3 + i * 1.0 + 0; cortD.add(b); }
caixa(18, 1.3, .9, mt("#7E151D", .9), 0, 9.3, -7.0);
// luzes de palco (feixe suave) e pontos de luz
const luzes = [-5, 0, 5].map((x) => { const l = new THREE.SpotLight("#FFE2B0", 45, 40, .55, .6, 1.2); l.position.set(x, 10.5, 2); l.target.position.set(x * .6, 1, -3.5); sc.add(l, l.target); caixa(.8, .5, .8, mt("#22252E", .5, .5), x, 10.6, 2, false); return l; });
const quente = new THREE.PointLight('#FFB45A', 55, 16, 1.6); quente.position.set(-3.55, 4.6, -3.2); sc.add(quente);
const focoPlateia = new THREE.SpotLight('#FFD9A0', 160, 40, .62, .55, 1.0); focoPlateia.position.set(-3.55, 9, -5.8); focoPlateia.target.position.set(-3.55, 0.5, 10); sc.add(focoPlateia, focoPlateia.target);
// mesa com maços de notas
const mesa = [caixa(4.4, .18, 2.4, mt("#B07D4F", .6), -3.6, 1.6, -1), ...[[-5.5, 0], [-1.7, 0], [-5.5, -2], [-1.7, -2]].map(([x, z]) => caixa(.22, 1.3, .22, mt("#7B5233", .7), x, .95, z))];
const notas = [];
for (let b = 0; b < 3; b++) for (let i = 0; i < 6; i++) {
  const x = -4.5 + b * 0.95 + (h(b * 7 + i) - .5) * .08, y = 1.84 + i * .2, z = -1 + (h(i + b * 3) - .5) * .1;
  const g = caixa(.9, .17, 1.9, mt(i % 2 ? "#5FB96A" : "#79C97F", .8), x, y, z); g.rotation.y = (h(i + b) - .5) * .12; notas.push(g);
  if (i % 3 === 2) { const f = caixa(.35, .22, 1.98, mt("#F4EFE2", .8), x, y, z, false); notas.push(f); }
}
const volantes = Array.from({ length: 14 }, (_, i) => { const g = caixa(.95, .03, .45, mt("#79C97F", .7), 0, 0, 0, false); g.userData = { x: -3.6 + (h(i + 70) - .5) * 5, z: -1 + (h(i + 71) - .5) * 3, ph: h(i + 72) * 4 }; return g; });
// linha do tempo 2024 → 2026
const barraFundo = caixa(10.4, .25, .6, mt("#232842", .6), 0, 1.05, -1.4, false);
const barra = (() => { const geo = new THREE.BoxGeometry(10, .34, .7); geo.translate(5, 0, 0); const g = new THREE.Mesh(geo, mLa); g.position.set(-5, 1.15, -1.4); g.castShadow = true; sc.add(g); return g; })();
// letras (tipografia) em blocos: começam diferentes e inclinadas, depois ficam iguais
const LET = [-4.6, -3.3, -2.0, -.7, .6].map((x) => caixa(.95, 1, .75, mAz, x, 1, -1.2));
const alt0 = [1.9, .9, 1.4, 2.2, 1.0], alt1 = 1.5;
// quadro com o X montado por peças
const quadro = caixa(5.6, 3.8, .22, mt("#F4F6FA", .5), 3.2, 3.7, -4.5);
const moldura = caixa(5.9, 4.1, .2, mt("#C9CED8", .5, .2), 3.2, 3.7, -4.6);
const pernas = [caixa(.22, 2.8, .22, mt("#7B5233", .7), 1.2, 1.4, -4.8), caixa(.22, 2.8, .22, mt("#7B5233", .7), 5.2, 1.4, -4.8)];
function criaX(px, py, pz, comp, esp) {
  const g = new THREE.Group(); g.position.set(px, py, pz); sc.add(g);
  const defs = [[mAz, 1, 1], [mAz, -1, -1], [mLa, -1, 1], [mLa, 1, -1]]; // [material, sinal x, sinal y]
  const ps = defs.map(([m, sx, sy], i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(comp, esp, esp * .8), m); b.castShadow = true; const p = new THREE.Group(); p.add(b); g.add(p); p.userData = { sx, sy, i, comp, esp, b }; return p; });
  return { g, ps };
}
function montaX(X, t0, t, prof) {
  X.ps.forEach((p, i) => {
    const u = p.userData, k = io(fx(t, t0 + i * .28, t0 + i * .28 + .85)), s = pop(fx(t, t0 + i * .28, t0 + i * .28 + 1.05));
    const ang = u.sy * (u.sx > 0 ? 1 : 1) * Math.PI / 4 * (u.sx * u.sy > 0 ? 1 : -1);
    const dir = new THREE.Vector3(u.sx, u.sy, 0).normalize(), out = (1 - k) * 7, mid = u.comp * .5 * .72;
    p.position.set(dir.x * (mid + out) + (h(i + 90) - .5) * (1 - k) * 3, dir.y * (mid + out), (1 - k) * (i % 2 ? 4 : -4));
    p.rotation.z = (u.sx * u.sy > 0 ? Math.PI / 4 : -Math.PI / 4) + (1 - k) * (i % 2 ? 2.4 : -2.4); p.scale.setScalar(Math.max(.001, s));
    p.userData.b.scale.z = 1 + prof * .9; p.position.z += (i % 2 ? 1 : -1) * prof * .12;
  });
}
const X1 = criaX(3.2, 3.7, -4.2, 1.9, .8), X2 = criaX(0, 4.6, -3, 2.8, 1.1);
// cidade das agências: fachada, porta, janelas, toldo, placa
const CID = { x0: -29, z0: -3 };
caixa(60, .08, 6, mt("#3A3F4C", .95), CID.x0 + 6, .04, CID.z0 + 4.2, false);          // rua
const ags = Array.from({ length: 11 }, (_, i) => {
  const c = i % 4, r = Math.floor(i / 4); const x = CID.x0 + c * 3.8, z = CID.z0 + r * 4.2 - 5;
  const g = new THREE.Group(); g.position.set(x, 0, z); sc.add(g);
  const add = (w, hh, d, m, px, py, pz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); o.position.set(px, py, pz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  add(2.8, .25, 2.4, mt("#8E95A3", .8), 0, .12, 0); add(2.6, 1.9, 2.2, mt("#EFE8D8", .85), 0, 1.15, 0); add(3.0, .22, 2.6, mt("#4A4F5C", .7), 0, 2.2, 0);
  add(.85, 1.3, .06, mt("#2A3A55", .2, .3), 0, .9, 1.13); add(.12, 1.4, .1, mt("#C9CED8", .4, .4), -.5, .9, 1.14); add(.12, 1.4, .1, mt("#C9CED8", .4, .4), .5, .9, 1.14);
  add(.55, .6, .05, mt("#9CC8E8", .2, .2), -.95, 1.15, 1.12); add(.55, .6, .05, mt("#9CC8E8", .2, .2), .95, 1.15, 1.12);
  const placa = add(2.5, .62, .12, placaVelha, 0, 1.85, 1.17);
  const toldo = add(2.6, .12, .7, mCinza, 0, 1.5, 1.45); toldo.rotation.x = .22;
  return { g, placa, toldo };
});
const rede = Array.from({ length: 44 }, (_, i) => { const g = caixa(1.2, .9, 1.2, mCinza.clone(), CID.x0 - 4 + (i % 11) * 2.0, .45, CID.z0 - 12 - Math.floor(i / 11) * 2.3); return g; });
for (let i = 0; i < 12; i++) { const x = CID.x0 - 6 + i * 4.8, z = CID.z0 - 24 - (i % 2) * 2; cil(.2, 1.2, mt("#7B5233", .8), x, .6, z, 6); const f = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 7), mt("#3E9B3A", .8)); f.position.set(x, 2.4, z); f.castShadow = true; sc.add(f); }
// cartões do sistema (com pictogramas: app, caminhão, barco, placa, prédio)
const picto = (n) => tex(256, 170, (g, w, h2) => {
  const cor = [AZ, LA, "#F4C224", "#5FB96A", "#E9ECF4", "#C8352E"][n % 6]; g.fillStyle = cor; g.fillRect(0, 0, w, h2); g.fillStyle = n % 6 === 4 ? "#1B4FBF" : "#fff"; g.strokeStyle = g.fillStyle; g.lineWidth = 8;
  const k = n % 5;
  if (k === 0) { g.fillRect(88, 22, 80, 126); g.fillStyle = cor; g.fillRect(98, 36, 60, 38); g.fillStyle = LA; g.fillRect(98, 82, 60, 38); }
  if (k === 1) { g.fillRect(40, 56, 110, 60); g.fillRect(150, 76, 60, 40); g.beginPath(); g.arc(78, 124, 16, 0, 7); g.arc(180, 124, 16, 0, 7); g.fill(); }
  if (k === 2) { g.beginPath(); g.moveTo(40, 110); g.lineTo(216, 110); g.lineTo(190, 144); g.lineTo(66, 144); g.fill(); g.fillRect(110, 66, 60, 40); g.fillRect(138, 34, 8, 34); }
  if (k === 3) { g.fillRect(36, 46, 184, 50); g.fillStyle = cor; g.font = '900 40px "M", Arial'; g.textAlign = "center"; g.fillText("caixa", 128, 84); g.fillStyle = "#fff"; g.fillRect(122, 96, 12, 56); }
  if (k === 4) { g.fillRect(70, 44, 116, 104); g.fillStyle = cor; g.fillRect(90, 60, 24, 24); g.fillRect(142, 60, 24, 24); g.fillRect(114, 100, 28, 48); }
});
const cards = Array.from({ length: 48 }, (_, i) => {
  const c = i % 8, r = Math.floor(i / 8);
  const g = caixa(1.3, .88, .09, mt("#fff", .6, 0, { map: picto(c + r * 3) }), 0, 0, 0); g.userData = { x: (c - 3.5) * 1.55, y: 9 - r * 1.1, z: -5.6, i }; return g;
});
// ---------- cenas novas do texto longo ----------
// bolhas de pesquisa sobre a plateia (bloco 2)
const bolhas = gente.map((hd, i) => { const g = caixa(.95, .6, .12, mt("#F4F6FA", .5), hd.position.x, 3.1, hd.position.z, false); const ok = caixa(.34, .34, .16, i % 2 ? mLa : mAz, hd.position.x, 3.1, hd.position.z + .02, false); g.userData = { ok, i }; return g; });
// placa "Vem realizar" (bloco 5)
const placaVR = new THREE.Mesh(new THREE.BoxGeometry(10.5, 3.2, .35), mt("#fff", .5, 0, { map: tex(1024, 320, (g, w, hh) => { g.fillStyle = AZ; g.fillRect(0, 0, w, hh); g.fillStyle = LA; g.fillRect(0, hh - 26, w, 26); g.fillStyle = "#fff"; g.font = '900 150px "M", Arial, sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("Vem realizar", w / 2, hh / 2 - 8); }) }));
placaVR.position.set(0, 5, -5); placaVR.castShadow = true; sc.add(placaVR);
// celular do Novo App (bloco 6) + ícones que se juntam nele
const celular = new THREE.Group(); celular.position.set(0, 3.6, -3); sc.add(celular);
const corpo = new THREE.Mesh(new THREE.BoxGeometry(2.7, 5, .34), mt("#12151E", .4, .3)); corpo.castShadow = true; celular.add(corpo);
const tela = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.6), new THREE.MeshStandardMaterial({ map: tex(256, 480, (g, w, hh) => { g.fillStyle = "#F4F6FA"; g.fillRect(0, 0, w, hh); g.fillStyle = AZ; g.fillRect(0, 0, w, 150); g.fillStyle = "#fff"; g.font = '900 38px "M", Arial'; g.textAlign = "center"; g.fillText("caixa", w / 2, 92); g.fillStyle = LA; g.fillRect(20, 190, 100, 90); g.fillStyle = AZ; g.fillRect(136, 190, 100, 90); g.fillStyle = "#5FB96A"; g.fillRect(20, 300, 100, 90); g.fillStyle = "#F4C224"; g.fillRect(136, 300, 100, 90); }), roughness: .4 }));
tela.position.z = .18; celular.add(tela);
const icones = Array.from({ length: 6 }, (_, i) => { const g = caixa(.9, .9, .2, mt([AZ, LA, "#5FB96A", "#F4C224", "#C8352E", "#9AA3B5"][i], .5), 0, 0, 0); g.userData = { i }; return g; });
// agência-barco (bloco 8)
const agua = caixa(14, .12, 8, mt("#2F6FA8", .3, .1), -22, .06, 9, false);
const barco = new THREE.Group(); barco.position.set(-22, .15, 9); sc.add(barco);
{ const add = (w, hh, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); o.position.set(x, y, z); o.castShadow = true; barco.add(o); return o; };
  add(5, .8, 2, mt("#F4F1E8", .7), 0, .4, 0); add(2.4, 1.2, 1.7, mt("#F4F1E8", .7), -.4, 1.4, 0); add(2.5, .5, .14, placaNova, -.4, 1.5, .9); add(5.1, .18, 2.1, mLa, 0, .88, 0); }
// "conta" (bloco 10): número grande em HTML por cima, com "conta nossa" pequeno
const conta = document.createElement("div"); conta.style.cssText = 'position:absolute;left:0;width:1080px;top:640px;text-align:center;opacity:0;font:900 190px "M", Arial;color:#FFD21F;-webkit-text-stroke:12px #1A1A1A;paint-order:stroke fill;letter-spacing:-4px'; conta.textContent = "≈ R$ 140"; document.getElementById("etq").appendChild(conta);
const contaN = document.createElement("div"); contaN.style.cssText = 'position:absolute;left:0;width:1080px;top:900px;text-align:center;opacity:0;font:800 40px "M", Arial;color:#fff;-webkit-text-stroke:6px #1A1A1A;paint-order:stroke fill'; contaN.textContent = "conta nossa"; document.getElementById("etq").appendChild(contaN);
const contaP = document.createElement("div"); contaP.style.cssText = 'position:absolute;left:0;width:1080px;top:560px;text-align:center;opacity:0;font:800 46px "M", Arial;color:#fff;-webkit-text-stroke:7px #1A1A1A;paint-order:stroke fill'; contaP.textContent = "R$ 3,5 MI ÷ 24,6 MIL"; document.getElementById("etq").appendChild(contaP);
const logoBarato = new THREE.Group(); logoBarato.position.set(-3.55, 2.05, -2.7); logoBarato.rotation.y = Math.PI; logoBarato.rotation.x = -.5; logoBarato.scale.setScalar(1.3); sc.add(logoBarato);
{ const c = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, .06), mt("#F4F6FA", .6)); c.castShadow = true; logoBarato.add(c);
  for (const [m, r] of [[mAz, .78], [mLa, -.78]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.95, .2, .08), m); b.rotation.z = r; b.position.z = .05; logoBarato.add(b); } }
// ---------- tomadas (câmera): 2 a 3 por bloco ----------
const B = D.blocos;
const LB = B.map((b, i) => (i + 1 < B.length ? B[i + 1] : D.dur - 1.2) - b);
const bt = (i, s) => B[i] + s * LB[i] / 10;
const T = [
  [0, [-3.55, 4.1, -6.7], [-3.55, 1.4, 6], [-3.55, 3.7, -5.9], [-3.55, 1.7, 6]],
  [bt(0, 6), [-1.2, 2.8, -5.2], [-3.6, 1.9, -1], [-3.2, 3.0, -4.6], [-3.6, 2.1, -1]],
  [B[1], [-9, 5, 8], [0, 3, -4], [-3, 5, 10], [0, 3, -4]],
  [B[2], [0, 6.5, 11], [0, 1.4, -2.2], [0, 6, 13], [0, 1.6, -2.2]],
  [bt(2, 5), [-6, 3.6, 8], [-1.2, 1.6, -1.4], [-2, 3.2, 7], [-1.2, 1.6, -1.4]],
  [B[3], [0, 4.6, -5.5], [0, 1.8, 10], [0, 5.2, -4.5], [0, 2, 10]],
  [bt(3, 5), [5, 5.4, 3], [0, 2, 10], [-4, 6, 4], [0, 2, 10]],
  [B[4], [-3.2, 2.2, 4.2], [-2, 1.2, -1.2], [-1.2, 2.2, 3.4], [-2, 1.2, -1.2]],
  [B[5], [4, 4, 5.5], [3.2, 3.7, -4.2], [3.2, 4.2, 3.5], [3.2, 3.7, -4.2]],
  [bt(5, 5), [1, 4.2, 6], [3.2, 3.7, -4.2], [3.2, 4.4, 3], [3.2, 3.7, -4.2]],
  [B[6], [0, 5, 15], [0, 5, -5], [0, 5.2, 19], [0, 5, -5]],
  [B[7], [0, 3.6, 8], [0, 3.6, -3], [0, 4, 6], [0, 3.6, -3]],
  [B[8], [-17, 10, 17], [-24, .8, -3], [-13, 9, 15], [-24, 1, -3]],
  [bt(8, 5), [-30, 6, 13], [-26, 1, -2], [-22, 7, 12], [-25, 1, -2]],
  [B[9], [-22, 7, 21], [-22, 1, 4], [-22, 6, 17], [-22, 1, 4]],
  [bt(9, 5), [-30, 6, 14], [-26, 1, -8], [-20, 22, 6], [-26, 0, -6]],
  [B[10], [-16, 15, 7], [-26, 0, -4], [-20, 22, 10], [-26, 0, -5]],
  [B[11], [0, 6, 12], [0, 3.6, -3], [0, 5, 8], [0, 4, -3]],
  [B[12], [0, 5.4, 6.5], [0, 5.4, -6], [0, 5.8, 11], [0, 5.4, -6]],
  [bt(12, 5), [-6, 5.4, 5], [0, 5.4, -6], [4, 6.4, 7], [0, 5.4, -6]],
  [B[13], [0, 4.6, 6], [0, 4.6, -3], [0, 4.8, 12], [0, 4.6, -3]],
];
const tomada = (t) => { let k = 0; for (let i = 0; i < T.length; i++) if (t >= T[i][0]) k = i; return k; };
const v3 = new THREE.Vector3(), v3b = new THREE.Vector3();
const lp = (a, b, u) => v3.fromArray(a).lerp(v3b.fromArray(b), u).clone();
function poseShot(k, t) { const s = T[k]; const fim = k + 1 < T.length ? T[k + 1][0] : D.dur; const u = io(fx(t, s[0], fim)); return [lp(s[1], s[3], u), lp(s[2], s[4], u)]; }
const camada = document.getElementById("etq");
const ET = D.etiquetas.map((e) => { const d = document.createElement("div"); d.className = "etq"; d.textContent = e.txt; camada.appendChild(d); return { ...e, el: d }; });
const leg = document.getElementById("leg");
const BG = ["#0E1220", "#1B3BA8", "#1B3BA8", "#122A5E", "#E9EEF8", "#E9EEF8", "#1B3BA8", "#2A1B5E", "#E0A25A", "#E0A25A", "#E0A25A", "#0E1220", "#0E1220", "#1B3BA8"];
const cBG = BG.map((c) => new THREE.Color(c)); const tmp = new THREE.Color();
function bgAt(t) { let k = 0; for (let i = 0; i < B.length; i++) if (t >= B[i]) k = i; const u = io(fx(t, B[k], B[k] + .6)); return tmp.copy(cBG[Math.max(0, k - 1)]).lerp(cBG[k], k === 0 ? 1 : u); }
sc.add(sol.target);
const seg = (t, i) => t >= B[i] - .15 && t < (B[i + 1] ?? 1e9) + .15;   // bloco i está na tela
function renderAt(t) {
  const col = bgAt(t); sc.background.copy(col); sc.fog.color.copy(col); chao.material.color.copy(col).multiplyScalar(.62); paredes.forEach((p, i) => p.material.color.copy(col).multiplyScalar(i ? .55 : .75));
  const ab = io(fx(t, B[1] - .3, B[1] + 1.4)); cortE.position.x = -ab * 5.2; cortD.position.x = ab * 5.2;
  // b0: notas
  notas.forEach((n, i) => { const oi = (i % 8) * 2 + Math.floor(i / 8); const k = pop(fx(t, bt(0, .6) + oi * .09, bt(0, .6) + oi * .09 + .35)); n.visible = k > 0 && t < bt(2, 1); n.scale.setScalar(Math.max(.001, k)); });
  mesa.forEach((m) => m.visible = t < bt(2, 1));
  volantes.forEach((v, i) => { const t0 = B[0] + .5 + i * .35, u = (t - t0) / 2.4, on = u > 0 && u < 1 && t < bt(2, 1); v.visible = on; if (on) { v.position.set(v.userData.x + Math.sin(u * 6 + v.userData.ph) * .5, 7 - u * 5.3, v.userData.z); v.rotation.set(u * 5, u * 3, 0); } });
  const kl = pop(fx(t, B[0] + 3.2, B[0] + 4)); logoBarato.visible = t >= B[0] + 3.2 && t < bt(2, 1); logoBarato.scale.setScalar(Math.max(.001, kl) * 1.3); logoBarato.position.y = 2.05 + Math.sin(t * 2) * .03;
  // b1: linha do tempo 2024 → 2026
  const on1 = seg(t, 2); barra.visible = barraFundo.visible = on1; barra.scale.x = Math.max(.001, io(fx(t, B[2] + .5, bt(2, 8))));
  // b2: pesquisa (bolhas sobre a plateia)
  bolhas.forEach((g, i) => { const k = pop(fx(t, B[3] + .5 + i * .45, B[3] + .9 + i * .45)); const on = k > 0 && t < B[4]; g.visible = on; g.userData.ok.visible = on; g.scale.setScalar(Math.max(.001, k)); g.userData.ok.scale.setScalar(Math.max(.001, k)); g.position.y = 3.1 + Math.sin(t * 2 + i) * .08; g.userData.ok.position.y = g.position.y; });
  // b3: letras (unicase): começam diferentes e inclinadas, ficam em pé e iguais
  const ap3 = pop(fx(t, B[4] + .2, B[4] + 1)), ig = io(fx(t, bt(4, 4.2), bt(4, 7.2)));
  LET.forEach((g, i) => { const a = alt0[i] + (alt1 - alt0[i]) * ig; g.visible = seg(t, 4); g.scale.set(1, Math.max(.001, a * ap3), 1); g.position.y = .85 + a * ap3 / 2; g.rotation.z = (1 - ig) * (i % 2 ? .22 : -.18); });
  // b4: quadro e X montado por peças
  const vis4 = seg(t, 5) || seg(t, 4) && false; [quadro, moldura, ...pernas].forEach((o) => o.visible = vis4); X1.g.visible = vis4;
  const prof = io(fx(t, bt(5, 6), bt(5, 9))); montaX(X1, B[5] + .2, t, prof); X1.g.rotation.y = prof * .45 * Math.sin(t * 1.1);
  // b5: placa "Vem realizar"
  const k5 = pop(fx(t, B[6] + .2, B[6] + 1.1)); placaVR.visible = seg(t, 6); placaVR.scale.setScalar(Math.max(.001, k5)); placaVR.rotation.y = Math.sin((t - B[6]) * .9) * .12;
  // b6: ícones voam para o celular e o app aparece
  const k6 = pop(fx(t, B[7] + .1, B[7] + .9)); celular.visible = seg(t, 7); celular.scale.setScalar(Math.max(.001, k6)); celular.rotation.y = Math.sin((t - B[7]) * 1.1) * .35;
  icones.forEach((g, i) => { const u = io(fx(t, B[7] + 1 + i * .3, B[7] + 2.2 + i * .3)); const sx = (i % 2 ? 1 : -1) * (5 + i), sy = 1 + (i % 3) * 2.2; g.visible = seg(t, 7) && u < .98; g.position.set(sx + (0 - sx) * u, sy + (3.6 - sy) * u, -2); g.scale.setScalar(Math.max(.001, 1 - u * .6)); g.rotation.z = (1 - u) * 3; });
  // b7: agências recebem a placa nova (fachada e sinalização)
  ags.forEach((a, i) => { const k = fx(t, bt(8, 1.4 + i * .4), bt(8, 1.9 + i * .4)); a.placa.material = k > .45 ? placaNova : placaVelha; a.toldo.material = k > .45 ? mLa : mCinza; a.g.scale.setScalar(1 + .06 * Math.sin(k * Math.PI)); });
  // b8: rede e agência-barco
  const kb = pop(fx(t, B[9] + 2, B[9] + 3)); barco.visible = agua.visible = t >= B[9] + 1.8 && t < B[11]; barco.scale.setScalar(Math.max(.001, kb)); barco.position.y = .15 + Math.sin(t * 1.6) * .05;
  // b9: troca até 2030 (a rede cinza vira azul)
  const pr = io(fx(t, B[10] + 1.2, B[11] - .3)); rede.forEach((r, i) => { r.material.color.set("#A9AFB8").lerp(new THREE.Color(AZ), cl(pr * 1.6 - h(i) * .6)); });
  // b10: a conta (número grande em HTML) sobre o palco
  const o10 = seg(t, 11) ? 1 : 0; const kc = pop(fx(t, B[11] + .4, B[11] + 1.2));
  contaP.style.opacity = o10 * kc; conta.style.opacity = o10 * kc; contaN.style.opacity = o10 * pop(fx(t, B[11] + 1.6, B[11] + 2.2));
  conta.style.transform = `scale(${.6 + .4 * kc})`;
  // b11: cartões do sistema
  cards.forEach((c, i) => { const k = io(fx(t, B[12] + .4 + h(i) * 2.2, B[12] + 1.6 + h(i) * 2.2)); const u = c.userData; const sx = (h(i + 1) - .5) * 26, sy = 2 + h(i + 2) * 10, sz = 4 + h(i + 5) * 10;
    c.position.set(sx + (u.x - sx) * k, sy + (u.y - sy) * k, sz + (u.z - sz) * k); c.visible = t >= B[12] - .1 && t < B[13]; c.rotation.set((1 - k) * 2.2, (1 - k) * 1.5, 0); });
  // b12: X grande montado e girando
  X2.g.visible = t >= B[13] - .1; montaX(X2, B[13] + .1, t, .8); X2.g.rotation.y = Math.sin((t - B[13]) * .8) * .6;
  paredes[1].visible = paredes[2].visible = t < B[8] - 1.4;
  // câmera contínua
  const k = tomada(t); let [p, tg] = poseShot(k, t);
  const BL = .9; if (k > 0 && t < T[k][0] + BL) { const [p0, t0] = poseShot(k - 1, T[k][0]); const w = io(fx(t, T[k][0], T[k][0] + BL)); p = p0.lerp(p, w); tg = t0.lerp(tg, w); }
  cam.fov = 78 - 14 * io(fx(t, bt(0, 5), B[2])); cam.updateProjectionMatrix(); cam.position.copy(p); cam.lookAt(tg);
  sol.target.position.copy(tg); sol.position.copy(tg).add(new THREE.Vector3(10, 20, 14)); sol.target.updateMatrixWorld();
  rd.render(sc, cam);
  ET.forEach((e) => {
    const vis = t >= e.a && t < e.b; if (!vis) { e.el.style.opacity = 0; return; }
    v3.fromArray(e.p).project(cam); const x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H; const ap = pop(fx(t, e.a, e.a + .3));
    const hw = e.el.offsetWidth * .5 + 36, xs = Math.min(W - hw, Math.max(hw, x)), ys = Math.min(1180, Math.max(260, y));
    e.el.style.opacity = v3.z < 1 ? 1 : 0; e.el.style.transform = `translate(${xs}px, ${ys}px) translate(-50%, -100%) scale(${ap})`;
  });
  const w = D.palavras.find((p) => t >= p.s && t < p.e); leg.textContent = w ? w.w : "";
}
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(0);
window.__render = renderAt;
