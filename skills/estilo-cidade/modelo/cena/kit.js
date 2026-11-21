// Kit de peças da cidade. Cada função devolve um THREE.Group montado de frente para +z.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import * as T from "./texturas.js";

// ---------- materiais ----------
const M = new Map();
export function mat(chave, criar) {
  if (!M.has(chave)) M.set(chave, criar());
  return M.get(chave);
}
export const cor = (hex, rough = 0.85, metal = 0) =>
  mat(`cor${hex}${rough}${metal}`, () => new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal }));

// todos os materiais que brilham (lâmpadas), para a noite e o entardecer
export function materiaisDeLuz() {
  return [...M.entries()].filter(([k]) => k.startsWith("luz")).map(([, m]) => m);
}

export const luz = (hex, forca = 2.5) =>
  mat(`luz${hex}${forca}`, () => new THREE.MeshStandardMaterial({ color: "#fff4dc", emissive: hex, emissiveIntensity: forca, roughness: 0.4 }));

function texMat(chave, canvas, extra = {}) {
  return mat(chave, () => new THREE.MeshStandardMaterial({ map: T.virar(canvas), roughness: 0.92, ...extra }));
}
export const MT = {
  reboco: (c) => texMat("reb" + c, T.texReboco(c)),
  tijolo: () => texMat("tijolo", T.texTijolo()),
  madeira: (c = "#8a5a34") => texMat("mad" + c, T.texMadeira(c), { roughness: 0.8 }),
  pedra: () => texMat("pedra", T.texPedraPortuguesa(), { roughness: 0.75 }),
  rua: () => texMat("rua", T.texParalelepipedo(), { roughness: 0.9 }),
  calcada: () => texMat("calc", T.texCalcada()),
  grama: () => texMat("grama", T.texGrama(), { roughness: 1 }),
  terra: () => texMat("terra", T.texTerra(), { roughness: 1 }),
  veneziana: (c) => texMat("ven" + c, T.texVeneziana(c), { roughness: 0.7 }),
  telha: () =>
    mat("telha", () => {
      const t = T.virar(T.texTelha(), 1 / 5, 1 / 5);
      t.rotation = Math.PI / 2;
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 });
    }),
  vidro: () => mat("vidro", () => new THREE.MeshStandardMaterial({ color: "#22344a", roughness: 0.12, metalness: 0.4, emissive: "#3a5f86", emissiveIntensity: 0.18 })),
  ferro: () => cor("#262a2c", 0.5, 0.6),
  branco: () => cor("#f6f1e6", 0.8),
};

export function escurecer(hex, l) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, l);
  return "#" + c.getHexString();
}

// ---------- formas básicas ----------
function sombra(m) {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// caixa com UV em metros (textura não estica)
export function caixa(w, h, d, material, metros = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (metros) {
    const uv = g.attributes.uv;
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++)
      for (let k = 0; k < 4; k++) {
        const i = f * 4 + k;
        uv.setXY(i, (uv.getX(i) * dims[f][0]) / metros, (uv.getY(i) * dims[f][1]) / metros);
      }
  }
  return sombra(new THREE.Mesh(g, material));
}

export function bloco(w, h, d, raio, material) {
  return sombra(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, raio), material));
}

export function cilindro(rTopo, rBase, h, lados, material) {
  return sombra(new THREE.Mesh(new THREE.CylinderGeometry(rTopo, rBase, h, lados), material));
}

export function bola(r, material, det = 16) {
  return sombra(new THREE.Mesh(new THREE.SphereGeometry(r, det, Math.max(8, det * 0.75)), material));
}

export function em(obj, x, y, z, ry = 0) {
  obj.position.set(x, y, z);
  obj.rotation.y = ry;
  return obj;
}

// chão plano com UV em metros
export function piso(w, d, material, metros) {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / metros, (uv.getY(i) * d) / metros);
  const m = new THREE.Mesh(g, material);
  m.receiveShadow = true;
  return m;
}

// ---------- telhado de duas águas (cumeeira ao longo de x) ----------
export function telhado(largura, prof, alt, paredeMat) {
  const s = new THREE.Shape();
  s.moveTo(-prof / 2, 0);
  s.lineTo(prof / 2, 0);
  s.lineTo(0, alt);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: largura, bevelEnabled: false });
  geo.translate(0, 0, -largura / 2);
  geo.rotateY(Math.PI / 2);
  return sombra(new THREE.Mesh(geo, [paredeMat, MT.telha()]));
}

// ---------- aberturas ----------
function moldura(w, h, prof, material) {
  const g = new THREE.Group();
  const e = 0.2;
  g.add(em(caixa(e, h, prof, material), -w / 2 - e / 2, 0, 0));
  g.add(em(caixa(e, h, prof, material), w / 2 + e / 2, 0, 0));
  g.add(em(caixa(w + 2 * e + 0.12, 0.3, prof + 0.06, material), 0, h / 2 + 0.15, 0.02));
  return g;
}

export function janela({ corDet = "#2f6b4f", sacada = false, vaso = false, semente = 1 }) {
  const g = new THREE.Group();
  const rnd = T.sorteio(semente);
  const w = 1.3, h = 2.0;
  g.add(em(caixa(w, h, 0.08, MT.vidro()), 0, 0, 0.02));
  // caixilho em cruz
  g.add(em(caixa(0.07, h, 0.05, MT.branco()), 0, 0, 0.08));
  g.add(em(caixa(w, 0.07, 0.05, MT.branco()), 0, 0.25, 0.08));
  g.add(em(moldura(w, h, 0.22, MT.branco()), 0, 0, 0.08));
  // peitoril
  g.add(em(caixa(w + 0.7, 0.16, 0.42, MT.branco()), 0, -h / 2 - 0.08, 0.16));
  // venezianas abertas
  for (const s of [-1, 1]) {
    const v = caixa(0.66, h, 0.06, MT.veneziana(corDet));
    v.position.set(s * (w / 2 + 0.2 + 0.36), 0, 0.09);
    v.rotation.y = s * -0.22;
    g.add(v);
  }
  if (sacada) {
    const y0 = -h / 2 - 0.25;
    g.add(em(caixa(2.6, 0.16, 1.0, MT.branco()), 0, y0, 0.5));
    g.add(em(caixa(2.6, 0.07, 0.07, MT.ferro()), 0, y0 + 1.0, 0.98));
    for (let i = 0; i <= 12; i++) g.add(em(caixa(0.04, 1.0, 0.04, MT.ferro()), -1.27 + (i * 2.54) / 12, y0 + 0.5, 0.98));
    for (const s of [-1, 1]) g.add(em(caixa(0.07, 0.07, 1.0, MT.ferro()), s * 1.27, y0 + 1.0, 0.5));
  }
  if (vaso) {
    g.add(em(caixa(1.2, 0.3, 0.32, cor("#b4532f")), 0, -h / 2 + 0.15, 0.2));
    const flores = ["#e2334f", "#f07aa0", "#ffffff", "#f3b52b"];
    for (let i = 0; i < 6; i++) {
      g.add(em(bola(0.14, cor(flores[Math.floor(rnd() * 4)], 0.7), 8), -0.5 + i * 0.2, -h / 2 + 0.38 + rnd() * 0.08, 0.2 + (rnd() - 0.5) * 0.12));
    }
    for (let i = 0; i < 4; i++) g.add(em(bola(0.13, cor("#3f8a35"), 6), -0.42 + i * 0.28, -h / 2 + 0.32, 0.12));
  }
  return g;
}

export function porta({ corDet = "#2f6b4f" }) {
  const g = new THREE.Group();
  const w = 1.7, h = 3.0;
  const madeira = MT.madeira(escurecer(corDet, 0.02));
  g.add(em(caixa(w, h, 0.1, madeira, 1.6), 0, h / 2, 0.0));
  // almofadas
  for (const y of [0.9, 2.1]) for (const x of [-0.42, 0.42]) g.add(em(caixa(0.6, 0.9, 0.05, cor(escurecer(corDet, -0.06))), x, y, 0.07));
  g.add(em(bola(0.07, cor("#d9a93b", 0.3, 0.8), 10), 0.62, 1.5, 0.12));
  g.add(em(moldura(w, h, 0.24, MT.branco()), 0, h / 2, 0.06));
  // bandeira de vidro em cima
  g.add(em(caixa(w, 0.5, 0.06, MT.vidro()), 0, h + 0.55, 0.03));
  g.add(em(caixa(w + 0.4, 0.2, 0.3, MT.branco()), 0, h + 0.9, 0.08));
  // degrau
  g.add(em(caixa(2.3, 0.22, 0.7, cor("#b9b0a2")), 0, 0.11, 0.38));
  return g;
}

// ---------- casa colonial ----------
export function casa({ w = 8, andares = 2, d = 11, corParede = "#f3eee4", corDet = "#2f6b4f", portaEm = 0, sacada = false, vasos = false, semente = 1 }) {
  const g = new THREE.Group();
  const rnd = T.sorteio(semente);
  const hA = 4.2;
  const h = andares * hA + 0.6;
  const parede = MT.reboco(corParede);
  g.add(em(caixa(w, h, d, parede, 3), 0, h / 2, -d / 2));
  g.add(em(caixa(w + 0.04, 0.8, 0.14, cor(escurecer(corParede, -0.22))), 0, 0.4, 0.05));
  g.add(em(caixa(w + 0.3, 0.5, 0.6, MT.branco()), 0, h - 0.15, 0.1));
  if (andares > 1) g.add(em(caixa(w + 0.06, 0.24, 0.26, MT.branco()), 0, hA + 0.35, 0.07));
  for (const s of [-1, 1]) g.add(em(caixa(0.5, h - 0.2, 0.22, MT.branco()), s * (w / 2 - 0.22), (h - 0.2) / 2, 0.06));
  g.add(em(telhado(w + 0.5, d + 1.4, 2.4 + d * 0.06, parede), 0, h + 0.05, -d / 2));
  const n = Math.max(2, Math.round(w / 3.1));
  const passo = (w - 0.8) / n;
  const colPorta = portaEm === "meio" ? Math.floor(n / 2) : Math.min(n - 1, portaEm);
  for (let a = 0; a < andares; a++)
    for (let i = 0; i < n; i++) {
      const x = -(w - 0.8) / 2 + passo * (i + 0.5);
      if (a === 0 && i === colPorta) {
        g.add(em(porta({ corDet }), x, 0, 0));
      } else {
        const y = a * hA + 2.45;
        g.add(em(janela({ corDet, sacada: a > 0 && sacada, vaso: vasos && rnd() < 0.6, semente: semente * 10 + i + a }), x, y, 0));
      }
    }
  return g;
}

// casa simples para o fundo (sem detalhes)
export function casaFundo({ w = 8, h = 7, d = 9, corParede = "#efe0bd" }) {
  const g = new THREE.Group();
  const parede = MT.reboco(corParede);
  g.add(em(caixa(w, h, d, parede, 3), 0, h / 2, -d / 2));
  g.add(em(telhado(w + 0.5, d + 1.2, 2.6, parede), 0, h, -d / 2));
  const n = Math.max(1, Math.round(w / 3.2));
  for (let a = 0; a < Math.floor(h / 4); a++)
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + (w / n) * (i + 0.5);
      g.add(em(caixa(1.2, 1.8, 0.1, MT.vidro()), x, a * 4 + 2.3, 0.03));
      g.add(em(caixa(1.6, 0.18, 0.2, MT.branco()), x, a * 4 + 1.3, 0.08));
    }
  return g;
}

// ---------- natureza e mobiliário ----------
export function arvore({ semente = 1, tipo = "verde", altura = 4 }) {
  const g = new THREE.Group();
  const rnd = T.sorteio(semente);
  const tronco = cilindro(0.22, 0.38, altura, 7, cor("#6b4a30"));
  tronco.position.y = altura / 2;
  g.add(tronco);
  const paletas = {
    verde: ["#4f8f3a", "#5fa244", "#3f7d33", "#6cae4c"],
    ipe: ["#f3c22f", "#f7d14a", "#e9b220", "#fbe07a"],
    rosa: ["#e98fb5", "#f2a9c7", "#d9739f", "#f7c2d6"],
  };
  const cores = paletas[tipo];
  const n = 6 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const r = 1.1 + rnd() * 0.9;
    const geo = new THREE.IcosahedronGeometry(r, 1);
    const m = sombra(new THREE.Mesh(geo, mat("folha" + cores[i % 4], () => new THREE.MeshStandardMaterial({ color: cores[i % 4], roughness: 0.9, flatShading: true }))));
    const ang = rnd() * Math.PI * 2, dist = i === 0 ? 0 : 0.9 + rnd() * 1.1;
    m.position.set(Math.cos(ang) * dist, altura + 0.6 + rnd() * 1.5, Math.sin(ang) * dist);
    m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    g.add(m);
  }
  // galhos
  for (let i = 0; i < 3; i++) {
    const gal = cilindro(0.06, 0.12, 1.6, 5, cor("#6b4a30"));
    gal.position.set(0, altura - 0.4, 0);
    gal.rotation.set(0.7, i * 2.1, 0);
    gal.translateY(0.7);
    g.add(gal);
  }
  if (tipo !== "verde") {
    // flores caídas no chão
    const caida = mat("caida" + tipo, () => new THREE.MeshStandardMaterial({ color: cores[0], roughness: 0.9 }));
    for (let i = 0; i < 26; i++) {
      const f = new THREE.Mesh(new THREE.CircleGeometry(0.09 + rnd() * 0.06, 6), caida);
      f.rotation.x = -Math.PI / 2;
      const a = rnd() * Math.PI * 2, d = rnd() * 2.6;
      f.position.set(Math.cos(a) * d, 0.03, Math.sin(a) * d);
      f.receiveShadow = true;
      g.add(f);
    }
  }
  return g;
}

export function poste() {
  const g = new THREE.Group();
  const verde = cor("#22402f", 0.45, 0.5);
  g.add(em(cilindro(0.32, 0.4, 0.6, 8, verde), 0, 0.3, 0));
  g.add(em(cilindro(0.09, 0.13, 5.2, 8, verde), 0, 3.0, 0));
  g.add(em(cilindro(0.2, 0.12, 0.25, 8, verde), 0, 5.6, 0));
  g.add(em(bola(0.42, luz("#ffc36b", 2.6), 16), 0, 6.1, 0));
  g.add(em(cilindro(0.08, 0.3, 0.22, 8, verde), 0, 6.6, 0));
  return g;
}

export function banco() {
  const g = new THREE.Group();
  const madeira = MT.madeira("#a0683a");
  for (let i = 0; i < 3; i++) g.add(em(caixa(3.2, 0.1, 0.24, madeira, 1), 0, 0.38, -0.3 + i * 0.27));
  for (let i = 0; i < 2; i++) {
    const encosto = caixa(3.2, 0.24, 0.08, madeira, 1);
    encosto.position.set(0, 0.85 + i * 0.32, -0.44);
    encosto.rotation.x = -0.15;
    g.add(encosto);
  }
  for (const s of [-1, 1]) {
    g.add(em(caixa(0.1, 0.36, 0.7, MT.ferro()), s * 1.4, 0.18, -0.05));
    g.add(em(caixa(0.1, 0.9, 0.08, MT.ferro()), s * 1.4, 0.8, -0.45));
  }
  return g;
}

export function canteiro(w, d, semente = 3, flores = true) {
  const g = new THREE.Group();
  const rnd = T.sorteio(semente);
  const meioFio = MT.branco();
  g.add(em(caixa(w, 0.35, 0.25, meioFio), 0, 0.17, d / 2));
  g.add(em(caixa(w, 0.35, 0.25, meioFio), 0, 0.17, -d / 2));
  g.add(em(caixa(0.25, 0.35, d, meioFio), w / 2, 0.17, 0));
  g.add(em(caixa(0.25, 0.35, d, meioFio), -w / 2, 0.17, 0));
  const gr = piso(w - 0.2, d - 0.2, MT.grama(), 4);
  gr.position.y = 0.28;
  g.add(gr);
  if (flores) {
    const cores = ["#e2334f", "#f07aa0", "#ffffff", "#f3b52b", "#b85fd0"];
    for (let i = 0; i < Math.floor(w * d * 0.9); i++) {
      const x = (rnd() - 0.5) * (w - 0.8), z = (rnd() - 0.5) * (d - 0.8);
      if (Math.abs(x) < w * 0.3 && Math.abs(z) < d * 0.3) continue;
      g.add(em(bola(0.12 + rnd() * 0.06, cor(cores[Math.floor(rnd() * 5)], 0.7), 6), x, 0.42, z));
    }
    for (let i = 0; i < Math.floor(w * d * 0.3); i++) {
      const x = (rnd() - 0.5) * (w - 0.8), z = (rnd() - 0.5) * (d - 0.8);
      g.add(em(bola(0.25 + rnd() * 0.15, cor("#3d8233"), 6), x, 0.35, z));
    }
  }
  return g;
}

// ---------- placas com texto ----------
export function placaPlana(w, h, pxPorM, desenhar, { emissivo = 0 } = {}) {
  const t = T.texPlaca(Math.round(w * pxPorM), Math.round(h * pxPorM), desenhar);
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, transparent: true });
  if (emissivo) {
    m.emissive = new THREE.Color("#ffffff");
    m.emissiveMap = t;
    m.emissiveIntensity = emissivo;
  }
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  return p;
}
