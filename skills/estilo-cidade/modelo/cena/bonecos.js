// Nossos bonecos: "cabeçudos" de blocos arredondados, com rosto desenhado na frente da cabeça.
// Cabeça grande e quadradinha, bochecha rosada, corpo curto. Nada copiado de jogo nenhum.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { cor, mat, bola, cilindro, em } from "./kit.js";
import { desenharRosto } from "./rostos.js";
export { desenharRosto };

function sombra(m) {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function rbox(w, h, d, r, material) {
  return sombra(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), material));
}
const liso = (hex) => mat("pele" + hex, () => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.62 }));

// ---------- roupa (frente do tronco) ----------
function desenharRoupa(ctx, W, H, r) {
  ctx.fillStyle = r.camisa;
  ctx.fillRect(0, 0, W, H);
  if (r.listras) {
    ctx.fillStyle = r.listras;
    for (let y = 0; y < H; y += H / 7) ctx.fillRect(0, y, W, H / 14);
  }
  if (r.gola) {
    ctx.fillStyle = r.gola;
    ctx.beginPath();
    ctx.moveTo(W * 0.3, 0);
    ctx.lineTo(W * 0.5, H * 0.22);
    ctx.lineTo(W * 0.7, 0);
    ctx.fill();
  }
  if (r.avental) {
    ctx.fillStyle = r.avental;
    ctx.beginPath();
    ctx.roundRect(W * 0.18, H * 0.18, W * 0.64, H * 0.9, W * 0.05);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = W * 0.012;
    ctx.strokeRect(W * 0.35, H * 0.55, W * 0.3, H * 0.2);
    ctx.fillStyle = r.avental;
    ctx.fillRect(W * 0.3, 0, W * 0.05, H * 0.2);
    ctx.fillRect(W * 0.65, 0, W * 0.05, H * 0.2);
  }
  if (r.botoes) {
    ctx.fillStyle = r.botoes;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(W * 0.5, H * (0.38 + i * 0.2), W * 0.025, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (r.estampa) {
    // uma estrela simples no peito
    ctx.fillStyle = r.estampa;
    ctx.save();
    ctx.translate(W * 0.5, H * 0.5);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? W * 0.07 : W * 0.16;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  if (r.bolso) {
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(W * 0.6, H * 0.35, W * 0.18, H * 0.16);
  }
}

function texCanvas(w, h, desenhar) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  desenhar(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { c, ctx, t };
}

// ---------- cabelos e chapéus ----------
function acessorio(tipo, o) {
  const g = new THREE.Group();
  const c = o.corAcessorio || o.cabelo || "#3a2a20";
  if (tipo === "gorro") {
    const malha = mat("gorro" + c, () => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
    g.add(em(rbox(1.08, 0.46, 1.0, 0.2, malha), 0, 0.36, -0.02));
    g.add(em(rbox(1.13, 0.2, 1.05, 0.09, cor(new THREE.Color(c).offsetHSL(0, 0, -0.08).getStyle(), 0.9)), 0, 0.2, -0.02));
    const pompom = sombra(new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), cor("#fbf8f0", 0.95)));
    pompom.position.set(0, 0.68, -0.02);
    g.add(pompom);
  } else if (tipo === "chef") {
    const tecido = cor("#fbfaf6", 0.75);
    g.add(em(rbox(0.98, 0.26, 0.9, 0.1, tecido), 0, 0.42, 0));
    const puf = bola(0.56, tecido, 24);
    puf.scale.set(1, 0.72, 0.95);
    puf.position.y = 0.88;
    g.add(puf);
    for (const s of [-1, 1]) {
      const b = bola(0.3, tecido, 16);
      b.position.set(s * 0.3, 0.86, 0.05);
      g.add(b);
    }
    g.traverse((o) => {
      if (o.isMesh) o.castShadow = false;
    });
  } else if (tipo === "coque") {
    g.add(em(rbox(1.07, 0.36, 0.98, 0.16, cor(c, 0.8)), 0, 0.33, -0.03));
    g.add(em(rbox(1.07, 0.6, 0.2, 0.08, cor(c, 0.8)), 0, 0.05, -0.42));
    g.add(em(bola(0.24, cor(c, 0.8), 14), 0, 0.55, -0.3));
  } else if (tipo === "cachos") {
    const m = cor(c, 0.85);
    const pts = [];
    for (let i = 0; i < 9; i++) pts.push([-0.45 + i * 0.11, 0.42, 0.25 - (i % 2) * 0.1]);
    for (let i = 0; i < 7; i++) pts.push([-0.42 + i * 0.14, 0.38, -0.2]);
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) pts.push([s * 0.5, 0.25 - i * 0.16, -0.05 - (i % 2) * 0.18]);
    for (let i = 0; i < 6; i++) pts.push([-0.4 + i * 0.16, 0.05 - (i % 2) * 0.12, -0.45]);
    pts.forEach(([x, y, z], i) => g.add(em(bola(0.2 + (i % 3) * 0.03, m, 10), x, y, z)));
  } else if (tipo === "bone") {
    g.add(em(rbox(1.06, 0.34, 0.98, 0.15, cor(c, 0.75)), 0, 0.33, -0.02));
    g.add(em(rbox(0.9, 0.06, 0.5, 0.03, cor(c, 0.75)), 0, 0.2, 0.6));
  } else if (tipo === "palha") {
    const palha = cor("#e6c77a", 0.9);
    g.add(em(cilindro(0.85, 0.85, 0.05, 24, palha), 0, 0.42, 0));
    g.add(em(cilindro(0.48, 0.52, 0.42, 20, palha), 0, 0.62, 0));
    g.add(em(cilindro(0.525, 0.525, 0.1, 20, cor("#7b2b2b", 0.8)), 0, 0.48, 0));
  } else if (tipo === "curto") {
    g.add(em(rbox(1.06, 0.26, 0.98, 0.12, cor(c, 0.8)), 0, 0.39, -0.03));
    g.add(em(rbox(1.06, 0.55, 0.16, 0.07, cor(c, 0.8)), 0, 0.12, -0.42));
  } else if (tipo === "rabo") {
    g.add(em(rbox(1.06, 0.28, 0.98, 0.13, cor(c, 0.8)), 0, 0.38, -0.03));
    g.add(em(rbox(1.06, 0.55, 0.16, 0.07, cor(c, 0.8)), 0, 0.12, -0.42));
    const rabo = bola(0.2, cor(c, 0.8), 12);
    rabo.scale.set(0.8, 1.6, 0.8);
    rabo.position.set(0, -0.05, -0.62);
    g.add(rabo);
  } else if (tipo === "careca") {
    for (const s of [-1, 1]) g.add(em(rbox(0.12, 0.3, 0.5, 0.05, cor(c, 0.8)), s * 0.5, 0.05, -0.15));
  }
  return g;
}

// ---------- boneco ----------
export function criarBoneco(o) {
  const op = {
    pele: "#f0c49a", camisa: "#3b5b8c", calca: "#4a4038", sapato: "#3a2a20", cabelo: "#3a2a20",
    acessorio: "curto", estilo: {}, roupa: {}, expressao: "neutro", saia: null, ...o,
  };
  const grupo = new THREE.Group();
  const corpo = new THREE.Group(); // tudo que balança junto
  grupo.add(corpo);
  const pele = liso(op.pele);

  // pernas (pivô no quadril e no joelho)
  const pernas = [], joelhos = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group();
    piv.position.set(s * 0.24, 0.8, 0);
    piv.add(em(rbox(0.42, 0.44, 0.46, 0.1, cor(op.calca, 0.8)), 0, -0.2, 0));
    const joelho = new THREE.Group();
    joelho.position.y = -0.38;
    joelho.add(em(rbox(0.4, 0.36, 0.44, 0.1, cor(op.canela || op.calca, 0.8)), 0, -0.16, 0));
    joelho.add(em(rbox(0.46, 0.2, 0.6, 0.08, cor(op.sapato, 0.6)), 0, -0.34, 0.06));
    piv.add(joelho);
    corpo.add(piv);
    pernas.push(piv);
    joelhos.push(joelho);
  }

  // tronco com frente desenhada
  const roupa = texCanvas(256, 224, (ctx, w, h) => desenharRoupa(ctx, w, h, { camisa: op.camisa, ...op.roupa }));
  const camisaLisa = cor(op.camisa, 0.82);
  const frenteRoupa = new THREE.MeshStandardMaterial({ map: roupa.t, roughness: 0.82 });
  const tronco = sombra(new THREE.Mesh(new RoundedBoxGeometry(1.02, 0.88, 0.6, 3, 0.15), [camisaLisa, camisaLisa, camisaLisa, camisaLisa, frenteRoupa, camisaLisa]));
  tronco.position.y = 0.8 + 0.44;
  corpo.add(tronco);
  if (op.saia) {
    const saia = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.72, 0.5, 4, 1), cor(op.saia, 0.8)));
    saia.rotation.y = Math.PI / 4;
    saia.scale.set(1, 1, 0.72);
    saia.position.y = 0.72;
    corpo.add(saia);
  }

  // braços (pivô no ombro)
  const bracos = [], maos = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group();
    piv.position.set(s * 0.68, 1.58, 0);
    piv.add(em(rbox(0.3, 0.58, 0.34, 0.1, op.mangaCurta ? pele : cor(op.manga || op.camisa, 0.82)), 0, -0.25, 0));
    if (op.mangaCurta) piv.add(em(rbox(0.33, 0.24, 0.37, 0.1, cor(op.manga || op.camisa, 0.82)), 0, -0.08, 0));
    piv.add(em(rbox(0.28, 0.24, 0.3, 0.1, pele), 0, -0.64, 0));
    const mao = new THREE.Group(); // ponto para segurar coisas (prego, pedrinha)
    mao.position.y = -0.64;
    piv.add(mao);
    corpo.add(piv);
    bracos.push(piv);
    maos.push(mao);
  }

  // cabeça
  const cabeca = new THREE.Group();
  cabeca.position.y = 1.68;
  const rosto = texCanvas(560, 504, (ctx, w, h) => desenharRosto(ctx, w, h, op.expressao, { pele: op.pele, ...op.estilo }));
  const frenteRosto = new THREE.MeshStandardMaterial({ map: rosto.t, roughness: 0.6 });
  const cab = sombra(new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.92, 0.9, 4, 0.2), [pele, pele, pele, pele, frenteRosto, pele]));
  cab.position.y = 0.46;
  cabeca.add(cab);
  if (op.acessorio) cabeca.add(em(acessorio(op.acessorio, op), 0, 0.46, 0));
  corpo.add(cabeca);

  let exprAtual = op.expressao;
  function mudarRosto(expr) {
    if (expr === exprAtual) return;
    exprAtual = expr;
    desenharRosto(rosto.ctx, rosto.c.width, rosto.c.height, expr, { pele: op.pele, ...op.estilo });
    rosto.t.needsUpdate = true;
  }

  // poses: tudo é função do tempo, então qualquer quadro sai igual
  const fase = (op.fase || 0) * 1.7;
  function pose(tipo, t) {
    const [pe, pd] = pernas, [be, bd] = bracos, [je, jd] = joelhos;
    for (const p of [pe, pd, be, bd, je, jd]) p.rotation.set(0, 0, 0);
    corpo.position.set(0, 0, 0);
    corpo.rotation.set(0, 0, 0);
    cabeca.rotation.set(0, 0, 0);
    const resp = Math.sin(t * 2.2 + fase);
    tronco.scale.y = 1 + resp * 0.012;
    cabeca.position.y = 1.68 + resp * 0.012;
    be.rotation.z = -0.08 - resp * 0.02;
    bd.rotation.z = 0.08 + resp * 0.02;
    cabeca.rotation.y = Math.sin(t * 0.7 + fase) * 0.08;
    cabeca.rotation.z = Math.sin(t * 0.5 + fase) * 0.03;
    if (tipo === "andar") {
      const a = Math.sin(t * 7 + fase);
      pe.rotation.x = a * 0.55;
      pd.rotation.x = -a * 0.55;
      je.rotation.x = Math.max(0, -a) * 0.7;
      jd.rotation.x = Math.max(0, a) * 0.7;
      be.rotation.x = -a * 0.5;
      bd.rotation.x = a * 0.5;
      corpo.position.y = Math.abs(Math.cos(t * 7 + fase)) * 0.08;
    } else if (tipo === "acenar") {
      bd.rotation.z = 2.6 + Math.sin(t * 9) * 0.35;
    } else if (tipo === "bandeja") {
      be.rotation.x = -1.35;
      bd.rotation.x = -1.35;
      be.rotation.z = 0.1;
      bd.rotation.z = -0.1;
    } else if (tipo === "sentado") {
      pe.rotation.x = -1.55;
      pd.rotation.x = -1.55;
      je.rotation.x = 1.45 + Math.sin(t * 2 + fase) * 0.08;
      jd.rotation.x = 1.45 - Math.sin(t * 2 + fase) * 0.08;
      corpo.position.y = -0.14;
      be.rotation.x = -0.5;
      bd.rotation.x = -0.5;
    } else if (tipo === "sentadoJogando") {
      pe.rotation.x = -1.55;
      pd.rotation.x = -1.55;
      je.rotation.x = 1.5;
      jd.rotation.x = 1.5;
      corpo.position.y = -0.14;
      be.rotation.x = -1.1;
      bd.rotation.x = -1.1 + Math.max(0, Math.sin(t * 1.3 + fase)) * 0.35;
      cabeca.rotation.x = 0.25;
    } else if (tipo === "maosNaCintura") {
      be.rotation.z = -0.9;
      bd.rotation.z = 0.9;
      be.rotation.x = 0.35;
      bd.rotation.x = 0.35;
    } else if (tipo === "apontar") {
      bd.rotation.x = -1.5;
      bd.rotation.y = 0.2;
    } else if (tipo === "susto") {
      // braços para cima e corpo jogado para trás, com um tremidinho
      const tr = Math.sin(t * 40) * 0.04;
      be.rotation.x = -0.35;
      bd.rotation.x = -0.35;
      be.rotation.z = -2.6 + tr;
      bd.rotation.z = 2.6 - tr;
      corpo.rotation.x = -0.1;
      cabeca.rotation.x = -0.12;
      cabeca.rotation.y = 0;
    } else if (tipo === "conversar") {
      const g = Math.max(0, Math.sin(t * 3.1 + fase));
      bd.rotation.x = -0.6 - g * 0.7;
      bd.rotation.z = 0.15 + g * 0.2;
      be.rotation.x = -0.15;
      cabeca.rotation.z = Math.sin(t * 2.4 + fase) * 0.06;
    } else if (tipo === "correr") {
      const a = Math.sin(t * 12 + fase);
      pe.rotation.x = a * 0.9;
      pd.rotation.x = -a * 0.9;
      je.rotation.x = Math.max(0, -a) * 1.2;
      jd.rotation.x = Math.max(0, a) * 1.2;
      be.rotation.x = -a * 0.9;
      bd.rotation.x = a * 0.9;
      be.rotation.z = -0.25;
      bd.rotation.z = 0.25;
      corpo.rotation.x = 0.12;
      corpo.position.y = Math.abs(Math.cos(t * 12 + fase)) * 0.18;
    } else if (tipo === "maosNaBoca") {
      be.rotation.x = -2.0;
      bd.rotation.x = -2.0;
      be.rotation.z = 0.6;
      bd.rotation.z = -0.6;
      corpo.rotation.x = -0.04;
      cabeca.rotation.y = 0;
    } else if (tipo === "segurar") {
      be.rotation.x = -1.2;
      bd.rotation.x = -1.2;
      be.rotation.z = 0.18;
      bd.rotation.z = -0.18;
    } else if (tipo === "riscar" || tipo === "riscarParado") {
      // sentado na mesa, riscando com o prego na mão direita
      pe.rotation.x = -1.55;
      pd.rotation.x = -1.55;
      je.rotation.x = 1.5;
      jd.rotation.x = 1.5;
      corpo.position.y = -0.14;
      const m = tipo === "riscar" ? 1 : 0;
      bd.rotation.x = -1.0 + Math.sin(t * 9) * 0.04 * m;
      bd.rotation.z = Math.sin(t * 9 + 1) * 0.14 * m;
      be.rotation.x = -1.15;
      be.rotation.z = 0.1;
      cabeca.rotation.x = 0.3;
      cabeca.rotation.y = 0;
      cabeca.rotation.z = 0;
    } else if (tipo === "riscarSentado") {
      pe.rotation.x = -1.55;
      pd.rotation.x = -1.55;
      je.rotation.x = 1.45;
      jd.rotation.x = 1.45;
      corpo.position.y = -0.14;
      bd.rotation.x = -0.45;
      bd.rotation.z = 0.55 + Math.sin(t * 6) * 0.06;
      be.rotation.x = -0.5;
      cabeca.rotation.x = 0.3;
      cabeca.rotation.y = -0.45;
    } else if (tipo === "jogarMilho") {
      pe.rotation.x = -1.55;
      pd.rotation.x = -1.55;
      je.rotation.x = 1.45;
      jd.rotation.x = 1.45;
      corpo.position.y = -0.14;
      const j = (t * 0.9 + fase) % 1;
      bd.rotation.x = j < 0.35 ? -0.4 - (j / 0.35) * 0.9 : -1.3 + ((j - 0.35) / 0.65) * 0.9;
      bd.rotation.z = 0.2;
      be.rotation.x = -0.6;
      cabeca.rotation.x = 0.18;
    }
  }
  pose("parado", 0);

  grupo.userData.boneco = true;
  return { grupo, corpo, cabeca, bracos, pernas, maos, mudarRosto, pose, op };
}

// ---------- cachorro caramelo ----------
export function criarCachorro() {
  const grupo = new THREE.Group();
  const caramelo = cor("#cf8a3c", 0.8), claro = cor("#f1cf98", 0.8), escuro = cor("#8a5326", 0.8);
  grupo.add(em(rbox(0.62, 0.55, 1.15, 0.2, caramelo), 0, 0.72, 0));
  grupo.add(em(rbox(0.5, 0.2, 0.9, 0.08, claro), 0, 0.5, 0));
  const patas = [];
  for (const [x, z] of [[-0.18, 0.38], [0.18, 0.38], [-0.18, -0.38], [0.18, -0.38]]) {
    const piv = new THREE.Group();
    piv.position.set(x, 0.55, z);
    piv.add(em(rbox(0.18, 0.5, 0.2, 0.06, caramelo), 0, -0.25, 0));
    piv.add(em(rbox(0.2, 0.08, 0.24, 0.03, claro), 0, -0.52, 0.02));
    grupo.add(piv);
    patas.push(piv);
  }
  const cabeca = new THREE.Group();
  cabeca.position.set(0, 1.05, 0.62);
  const rostoTex = texCanvas(256, 224, (ctx, W, H) => {
    ctx.fillStyle = "#cf8a3c";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f1cf98";
    ctx.beginPath();
    ctx.ellipse(W / 2, H * 0.74, W * 0.3, H * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f1a18";
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(W / 2 + s * W * 0.19, H * 0.42, W * 0.055, H * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff";
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(W / 2 + s * W * 0.19 + W * 0.015, H * 0.39, W * 0.018, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#2a1c16";
    ctx.beginPath();
    ctx.ellipse(W / 2, H * 0.62, W * 0.08, H * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2a1c16";
    ctx.lineWidth = W * 0.02;
    ctx.beginPath();
    ctx.moveTo(W * 0.42, H * 0.76);
    ctx.quadraticCurveTo(W * 0.5, H * 0.84, W * 0.58, H * 0.76);
    ctx.stroke();
    ctx.fillStyle = "#e46f6f";
    ctx.beginPath();
    ctx.ellipse(W * 0.53, H * 0.86, W * 0.05, H * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  const frente = new THREE.MeshStandardMaterial({ map: rostoTex.t, roughness: 0.75 });
  cabeca.add(sombra(new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.56, 0.55, 3, 0.16), [caramelo, caramelo, caramelo, caramelo, frente, caramelo])));
  for (const s of [-1, 1]) {
    const orelha = rbox(0.14, 0.34, 0.2, 0.05, escuro);
    orelha.position.set(s * 0.34, 0.08, -0.05);
    orelha.rotation.z = s * 0.35;
    cabeca.add(orelha);
  }
  grupo.add(cabeca);
  const rabo = new THREE.Group();
  rabo.position.set(0, 0.88, -0.58);
  const r = rbox(0.12, 0.12, 0.5, 0.05, caramelo);
  r.position.z = -0.22;
  rabo.add(r);
  rabo.rotation.x = 0.45;
  grupo.add(rabo);
  function pose(tipo, t) {
    rabo.rotation.y = Math.sin(t * 14) * 0.75;
    cabeca.rotation.z = Math.sin(t * 1.5) * 0.12;
    cabeca.rotation.x = -0.1 + Math.sin(t * 2.1) * 0.05;
    if (tipo === "andar") {
      const a = Math.sin(t * 9);
      patas[0].rotation.x = a * 0.5;
      patas[3].rotation.x = a * 0.5;
      patas[1].rotation.x = -a * 0.5;
      patas[2].rotation.x = -a * 0.5;
    }
  }
  return { grupo, pose, cabeca };
}

// ---------- pombinho ----------
export function criarPombo(semente = 1) {
  const g = new THREE.Group();
  const cinza = cor("#8e939c", 0.8), escuro = cor("#5d636c", 0.8);
  g.add(em(rbox(0.3, 0.28, 0.46, 0.1, cinza), 0, 0.24, 0));
  g.add(em(rbox(0.32, 0.14, 0.3, 0.05, escuro), 0, 0.3, -0.06));
  const cab = new THREE.Group();
  cab.position.set(0, 0.42, 0.18);
  cab.add(em(rbox(0.2, 0.2, 0.2, 0.07, cor("#6f7f8c", 0.6)), 0, 0, 0));
  cab.add(em(rbox(0.06, 0.05, 0.12, 0.02, cor("#e0a040")), 0, -0.03, 0.14));
  for (const s of [-1, 1]) cab.add(em(bola(0.025, cor("#111"), 6), s * 0.1, 0.03, 0.04));
  g.add(cab);
  for (const s of [-1, 1]) g.add(em(rbox(0.04, 0.12, 0.04, 0.01, cor("#c96b5a")), s * 0.07, 0.06, 0));
  const fase = semente * 1.3;
  function pose(t) {
    const bic = Math.max(0, Math.sin(t * 3 + fase));
    cab.position.y = 0.42 - bic * 0.16;
    cab.position.z = 0.18 + bic * 0.08;
    cab.rotation.x = bic * 0.9;
  }
  return { grupo: g, pose };
}
