// Monta a Vila do Sossego: praça com coreto, casas, igreja, padaria e o fundo.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { caixa, cilindro, bola, em, cor, MT, piso, casa, casaFundo, arvore, poste, banco, canteiro } from "./kit.js";
import { padaria, coreto, igreja, placaCidade, bandeirinhas, placaLei, rabiscoGiz, texRisquinhos } from "./predios.js";
import { placaPlana } from "./kit.js";
import * as T from "./texturas.js";

export const PRACA = 21; // meia largura da praça
export const FRENTE = 33; // onde começam as fachadas
const ALTURA_CALCADA = 0.15;

const PALETA = [
  ["#f4efe4", "#2f6b4f"],
  ["#f3cf6b", "#2f5f8f"],
  ["#ee9f7e", "#f6f1e6"],
  ["#efe0bd", "#7b2b2b"],
  ["#e7a9a6", "#2f6b4f"],
  ["#f6e3a3", "#7b2b2b"],
  ["#dcb98c", "#2f5f8f"],
  ["#f4efe4", "#7b2b2b"],
];

function fileira(rnd, inicio, fim, pular = []) {
  const g = new THREE.Group();
  let x = inicio, i = Math.floor(rnd() * PALETA.length);
  while (x < fim - 3) {
    let w = [7, 8, 9, 10][Math.floor(rnd() * 4)];
    const buraco = pular.find(([a, b]) => x + w > a && x < b);
    if (buraco) {
      x = buraco[1];
      continue;
    }
    w = Math.min(w, fim - x);
    if (w < 5) break;
    const [corParede, corDet] = PALETA[i % PALETA.length];
    i += 1 + Math.floor(rnd() * 2);
    const andares = rnd() < 0.7 ? 2 : 1;
    const c = casa({
      w, andares, d: 11 + Math.floor(rnd() * 3), corParede, corDet,
      portaEm: Math.floor(rnd() * 3), sacada: rnd() < 0.5, vasos: rnd() < 0.7, semente: Math.floor(rnd() * 1000),
    });
    c.position.set(x + w / 2, ALTURA_CALCADA, 0);
    g.add(c);
    x += w;
  }
  return g;
}

export function montarCidade() {
  const cidade = new THREE.Group();
  const estatico = new THREE.Group();
  cidade.add(estatico);
  const rnd = T.sorteio(2026);

  // ---------- chão ----------
  const grama = piso(700, 700, MT.grama(), 6);
  grama.position.y = -0.05;
  grama.userData.chao = true;
  estatico.add(grama);
  const rua = piso(2 * FRENTE + 30, 2 * FRENTE + 30, MT.rua(), 4);
  rua.userData.chao = true;
  estatico.add(rua);
  const pedra = piso(2 * PRACA, 2 * PRACA, MT.pedra(), 9);
  pedra.position.y = ALTURA_CALCADA;
  pedra.userData.chao = true;
  estatico.add(pedra);
  // meio-fio da praça
  for (const [x, z, w, d] of [[0, PRACA, 2 * PRACA + 0.3, 0.3], [0, -PRACA, 2 * PRACA + 0.3, 0.3], [PRACA, 0, 0.3, 2 * PRACA], [-PRACA, 0, 0.3, 2 * PRACA]])
    estatico.add(em(caixa(w, 0.2, d, cor("#cfc8bb")), x, 0.1, z));
  // calçadas das fachadas
  for (let k = 0; k < 4; k++) {
    const lado = new THREE.Group();
    const c = piso(2 * FRENTE - 6, 3.4, MT.calcada(), 1.6);
    c.position.set(0, ALTURA_CALCADA, -1.7);
    c.userData.chao = true;
    lado.add(c);
    lado.add(em(caixa(2 * FRENTE - 6, 0.2, 0.25, cor("#cfc8bb")), 0, 0.1, -3.4));
    lado.rotation.y = (k * Math.PI) / 2;
    lado.translateZ(FRENTE);
    estatico.add(lado);
  }

  // ---------- fileiras de casas ----------
  // norte (fundo da praça): igreja no meio
  const norte = fileira(rnd, -29, 29, [[-11.6, 9.4]]);
  norte.position.z = -FRENTE;
  estatico.add(norte);
  const ig = igreja();
  ig.position.set(2, ALTURA_CALCADA, -FRENTE + 0.4);
  estatico.add(ig);
  const giz = rabiscoGiz();
  giz.position.set(2 + 4.65, ALTURA_CALCADA + 2.35, -FRENTE + 0.4 + 0.03);
  cidade.add(giz);
  // leste: padaria no meio, de frente para o sol da tarde
  const leste = fileira(rnd, -29, 29, [[-6.6, 6.6]]);
  leste.rotation.y = -Math.PI / 2;
  leste.position.x = FRENTE;
  estatico.add(leste);
  const pad = padaria();
  pad.rotation.y = -Math.PI / 2;
  pad.position.set(FRENTE, ALTURA_CALCADA, 0);
  estatico.add(pad);
  // sul e oeste
  const sul = fileira(rnd, -29, 29);
  sul.rotation.y = Math.PI;
  sul.position.z = FRENTE;
  estatico.add(sul);
  const oeste = fileira(rnd, -29, 29);
  oeste.rotation.y = Math.PI / 2;
  oeste.position.x = -FRENTE;
  estatico.add(oeste);

  // ---------- praça ----------
  const cor0 = coreto();
  cor0.position.y = ALTURA_CALCADA;
  estatico.add(cor0);
  const cantos = [
    [13.5, 13.5, "ipe"], [-13.5, 13.5, "verde"], [-13.5, -13.5, "ipe"], [13.5, -13.5, "rosa"],
  ];
  for (const [x, z, tipo] of cantos) {
    const ct = canteiro(9, 9, Math.floor(x * 7 + z * 3 + 100));
    ct.position.set(x, ALTURA_CALCADA, z);
    estatico.add(ct);
    const a = arvore({ semente: Math.floor(x * 13 + z), tipo, altura: 4.2 });
    a.position.set(x, ALTURA_CALCADA + 0.3, z);
    estatico.add(a);
  }
  // árvores na borda da praça
  for (const [x, z, s] of [[-18, 0, 5], [-9, -18.5, 6], [8, 18.5, 7], [-8, 18.5, 8], [18, -7, 9], [12, -18.5, 10]]) {
    const a = arvore({ semente: s, tipo: "verde", altura: 4.6 });
    a.position.set(x, ALTURA_CALCADA, z);
    estatico.add(a);
    estatico.add(em(cilindro(1.2, 1.2, 0.25, 16, MT.terra()), x, ALTURA_CALCADA + 0.05, z));
  }
  // postes
  const postes = [];
  for (const [x, z] of [[19.3, 19.3], [-19.3, 19.3], [19.3, -19.3], [-19.3, -19.3], [19.3, 6], [-19.3, 6], [6, 19.3], [-6, -19.3], [19.3, -6]]) {
    const p = poste();
    p.position.set(x, ALTURA_CALCADA, z);
    estatico.add(p);
    postes.push([x, z]);
  }
  // bancos virados para o coreto
  const bancos = [];
  for (const ang of [Math.PI * 0.18, Math.PI * 0.82, Math.PI * 1.18, Math.PI * 1.82]) {
    const r = 10.5;
    const b = banco();
    const x = Math.sin(ang) * r, z = Math.cos(ang) * r;
    b.position.set(x, ALTURA_CALCADA, z);
    b.rotation.y = ang + Math.PI;
    estatico.add(b);
    bancos.push({ x, z, ry: ang + Math.PI });
  }
  // mesa de dominó
  const mesa = new THREE.Group();
  mesa.add(em(cilindro(0.85, 0.85, 0.12, 24, cor("#d9d1c3")), 0, 0.82, 0));
  mesa.add(em(cilindro(0.3, 0.4, 0.8, 12, cor("#cfc8bb")), 0, 0.4, 0));
  for (const s of [-1, 1]) mesa.add(em(cilindro(0.34, 0.38, 0.42, 14, cor("#cfc8bb")), s * 1.35, 0.21, 0));
  mesa.position.set(-11.5, ALTURA_CALCADA, 3.5);
  // risquinhos: tampo da mesa coberto e o chão em volta (cada vez menos longe da mesa)
  const tampo = new THREE.Mesh(
    new THREE.CircleGeometry(0.84, 40),
    new THREE.MeshStandardMaterial({ map: texRisquinhos(1024, 7, () => 0.97), transparent: true, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 })
  );
  tampo.rotation.x = -Math.PI / 2;
  tampo.position.set(-11.5, ALTURA_CALCADA + 0.885, 3.5);
  cidade.add(tampo);
  const numeroMesa = placaPlana(0.9, 0.22, 600, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(250,248,240,0.92)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.round(H * 0.8)}px Fredoka`;
    ctx.fillText("1.460.000", W / 2, H * 0.55);
  });
  numeroMesa.rotation.x = -Math.PI / 2;
  numeroMesa.rotation.z = Math.PI / 2;
  numeroMesa.position.set(-11.5 - 0.48, ALTURA_CALCADA + 0.889, 3.5);
  numeroMesa.material.polygonOffset = true;
  numeroMesa.material.polygonOffsetFactor = -4;
  cidade.add(numeroMesa);
  const chaoRiscado = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
      map: texRisquinhos(2048, 8, (x, y) => Math.max(0, 1 - Math.hypot(x - 0.5, y - 0.5) / 0.5) ** 0.8, { cor: "rgba(250,245,232,0.8)" }),
      transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2,
    })
  );
  chaoRiscado.rotation.x = -Math.PI / 2;
  chaoRiscado.position.set(-11.5, ALTURA_CALCADA + 0.01, 3.5);
  chaoRiscado.receiveShadow = true;
  cidade.add(chaoRiscado);
  // placa de bronze da lei, ao lado da escada do coreto
  const lei = placaLei();
  lei.position.set(-2.7, ALTURA_CALCADA, 8.3);
  lei.rotation.y = 0.15;
  cidade.add(lei);
  estatico.add(mesa);

  // placa da cidade na esquina
  const placa = placaCidade();
  placa.position.set(16.2, ALTURA_CALCADA, 19.8);
  placa.rotation.y = 0.35;
  estatico.add(placa);

  // bandeirinhas do coreto até os postes
  const yT = cor0.userData.alturaTeto + ALTURA_CALCADA - 0.1;
  const rb = cor0.userData.raioBorda;
  for (const [i, [x, z]] of [[19.3, 19.3], [-19.3, 19.3], [19.3, -19.3], [-19.3, -19.3]].entries()) {
    const ang = Math.atan2(x, z);
    estatico.add(bandeirinhas([Math.sin(ang) * rb, yT, Math.cos(ang) * rb], [x, ALTURA_CALCADA + 5.6, z], i + 1, 20));
  }
  for (const [i, [x, z]] of [[19.3, 6], [-19.3, 6], [6, 19.3], [-6, -19.3]].entries()) {
    const ang = Math.atan2(x, z);
    estatico.add(bandeirinhas([Math.sin(ang) * rb, yT, Math.cos(ang) * rb], [x, ALTURA_CALCADA + 5.6, z], i + 7, 16));
  }

  // ---------- fundo: mais casas, árvores e morros ----------
  const fundo = T.sorteio(77);
  for (let i = 0; i < 70; i++) {
    const ang = fundo() * Math.PI * 2;
    const dist = 55 + fundo() * 60;
    const x = Math.sin(ang) * dist, z = Math.cos(ang) * dist;
    if (Math.abs(x) < 7 || Math.abs(z) < 7) continue; // deixa as ruas livres
    if (Math.abs(Math.abs(x) - Math.abs(z)) < 18) continue; // e as diagonais, por onde a câmera aérea olha
    const [corParede] = PALETA[Math.floor(fundo() * PALETA.length)];
    const c = casaFundo({ w: 7 + Math.floor(fundo() * 4), h: 4.5 + Math.floor(fundo() * 2) * 4, d: 9, corParede });
    c.position.set(x, 0, z);
    c.rotation.y = Math.round(Math.atan2(-x, -z) / (Math.PI / 2)) * (Math.PI / 2);
    estatico.add(c);
  }
  for (let i = 0; i < 90; i++) {
    const ang = fundo() * Math.PI * 2;
    const dist = 48 + fundo() * 90;
    const x = Math.sin(ang) * dist, z = Math.cos(ang) * dist;
    if (Math.abs(x) < 6 || Math.abs(z) < 6) continue;
    if (dist < 80 && Math.abs(Math.abs(x) - Math.abs(z)) < 12) continue;
    const a = arvore({ semente: 500 + i, tipo: fundo() < 0.12 ? "ipe" : "verde", altura: 3.5 + fundo() * 2 });
    a.position.set(x, 0, z);
    a.scale.setScalar(1 + fundo() * 0.4);
    estatico.add(a);
  }
  const morroMats = ["#5f9a45", "#6fa84f", "#4e8a3b", "#7cb35a"].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true })
  );
  for (let i = 0; i < 30; i++) {
    const ang = (i / 30) * Math.PI * 2 + fundo() * 0.15;
    const dist = 205 + fundo() * 55;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), morroMats[i % 4]);
    m.scale.set(38 + fundo() * 34, 10 + fundo() * 14, 36 + fundo() * 26);
    m.position.set(Math.sin(ang) * dist, -3, Math.cos(ang) * dist);
    m.rotation.y = fundo() * 3;
    m.receiveShadow = true;
    estatico.add(m);
  }

  fundirEstaticos(estatico);

  // nuvens de algodão (fora da névoa, para ficarem bem brancas)
  const nuvemMat = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#fff1df", emissiveIntensity: 0.35, roughness: 1, fog: false });
  const bolaNuvem = new THREE.SphereGeometry(1, 14, 10);
  const ceu = T.sorteio(404);
  for (let i = 0; i < 22; i++) {
    const n = new THREE.Group();
    const partes = 5 + Math.floor(ceu() * 4);
    for (let k = 0; k < partes; k++) {
      const b = new THREE.Mesh(bolaNuvem, nuvemMat);
      const r = 0.7 + ceu() * 0.6;
      b.scale.set(r * 1.3, r * 0.85, r);
      b.position.set((k - partes / 2) * 1.1 + ceu() * 0.4, ceu() * 0.5 + (k % 2) * 0.35, ceu() * 0.6);
      n.add(b);
    }
    const ang = (i / 22) * Math.PI * 2 + ceu() * 0.25;
    const dist = 230 + ceu() * 70;
    n.position.set(Math.sin(ang) * dist, 48 + ceu() * 45, Math.cos(ang) * dist);
    n.scale.setScalar(9 + ceu() * 9);
    n.lookAt(0, n.position.y, 0);
    cidade.add(n);
  }
  return { cidade, bancos, postes, mesa: { x: -11.5, z: 3.5 }, nuvemMat, lei: { x: -2.7, z: 8.3, ry: 0.15 } };
}

// Junta as peças que usam o mesmo material (muito menos trabalho para a placa de vídeo)
function fundirEstaticos(grupo) {
  grupo.updateMatrixWorld(true);
  const porMaterial = new Map();
  const remover = [];
  grupo.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material) || o.material.transparent || o.userData.chao) return;
    const geo = o.geometry;
    if (!geo.attributes.uv || !geo.attributes.normal) return;
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const nome of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(nome)) g.deleteAttribute(nome);
    g.clearGroups();
    g.applyMatrix4(o.matrixWorld);
    const lista = porMaterial.get(o.material) || [];
    lista.push({ g, sombra: o.castShadow });
    porMaterial.set(o.material, lista);
    remover.push(o);
  });
  for (const o of remover) o.parent.remove(o);
  for (const [material, lista] of porMaterial) {
    const fundida = mergeGeometries(lista.map((x) => x.g), false);
    if (!fundida) continue;
    const m = new THREE.Mesh(fundida, material);
    m.castShadow = true;
    m.receiveShadow = true;
    grupo.add(m);
  }
}
