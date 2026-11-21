// Prédios especiais: padaria, coreto, igreja e placa da cidade. Todos de frente para +z.
import * as THREE from "three";
import { caixa, cilindro, bola, em, cor, luz, mat, MT, escurecer, telhado, janela, placaPlana, piso } from "./kit.js";
import * as T from "./texturas.js";
import { PLACAS } from "./placas.js";

const FONTE_LETREIRO = "Fredoka";

// escreve diminuindo a letra se o texto não couber em 80% da largura da placa (a moldura da placa de bronze come as bordas)
function escrever(ctx, txt, x, y) {
  const max = ctx.canvas.width * 0.8;
  const w = ctx.measureText(txt).width;
  if (w > max) ctx.font = ctx.font.replace(/(\d+(?:\.\d+)?)px/, (m, v) => `${Math.floor((parseFloat(v) * max) / w)}px`);
  ctx.fillText(txt, x, y);
}
const FONTE_CURSIVA = "Pacifico";

// ---------- pães ----------
function pao(escala = 1) {
  const m = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.11 * escala, 0.28 * escala, 4, 10),
    mat("pao", () => new THREE.MeshStandardMaterial({ color: "#d4974a", roughness: 0.6 }))
  );
  m.rotation.z = Math.PI / 2;
  m.castShadow = true;
  return m;
}

function bolo() {
  const g = new THREE.Group();
  g.add(em(cilindro(0.32, 0.32, 0.3, 20, cor("#f3e1c6", 0.6)), 0, 0.15, 0));
  g.add(em(cilindro(0.33, 0.33, 0.08, 20, cor("#e46a8c", 0.5)), 0, 0.32, 0));
  g.add(em(bola(0.06, cor("#d1242f", 0.4), 10), 0, 0.42, 0));
  return g;
}

// ---------- padaria ----------
export function padaria() {
  const g = new THREE.Group();
  const w = 13, d = 12, hA = 4.7, h = 2 * hA + 0.6;
  const corParede = "#f2dcae", corDet = "#7b2b2b";
  const parede = MT.reboco(corParede);
  g.add(em(caixa(w, h, d, parede, 3), 0, h / 2, -d / 2));
  g.add(em(caixa(w + 0.3, 0.5, 0.6, MT.branco()), 0, h - 0.15, 0.1));
  g.add(em(caixa(w + 0.06, 0.24, 0.26, MT.branco()), 0, hA + 1.4, 0.07));
  for (const s of [-1, 1]) g.add(em(caixa(0.5, h - 0.2, 0.22, MT.branco()), s * (w / 2 - 0.22), (h - 0.2) / 2, 0.06));
  g.add(em(telhado(w + 0.5, d + 1.4, 3.2, parede), 0, h + 0.05, -d / 2));

  // andar de cima: 3 janelas, a do meio com sacada
  for (let i = 0; i < 3; i++) {
    const x = -4.2 + i * 4.2;
    g.add(em(janela({ corDet, sacada: i === 1, vaso: i !== 1, semente: 70 + i }), x, hA + 2.75, 0));
  }

  // fachada da loja (avança 0,35 da parede)
  const madeiraLoja = MT.madeira(corDet);
  g.add(em(caixa(w - 0.6, 0.9, 0.4, madeiraLoja, 1.5), 0, 0.45, 0.2)); // rodapé
  g.add(em(caixa(w - 0.6, 0.35, 0.45, madeiraLoja, 1.5), 0, 3.95, 0.22)); // viga de cima
  for (const x of [-6.05, -1.25, 1.25, 6.05]) g.add(em(caixa(0.35, 3.5, 0.45, madeiraLoja, 1.5), x, 2.35, 0.22));

  // vitrines com pães (luz quente lá dentro)
  for (const lado of [-1, 1]) {
    const cx = lado * 3.65;
    const fundo = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.9), luz("#ffb44f", 0.55));
    fundo.position.set(cx, 2.35, 0.03);
    g.add(fundo);
    for (const [y, n] of [[1.25, 7], [2.15, 7], [3.0, 6]]) {
      g.add(em(caixa(4.4, 0.08, 0.36, MT.madeira("#a0683a"), 1), cx, y - 0.12, 0.2));
      for (let i = 0; i < n; i++) {
        if (y > 2.8 && (i === 1 || i === 4)) {
          g.add(em(bolo(), cx - 1.9 + i * 0.62, y - 0.08, 0.2));
          continue;
        }
        const p = pao(0.9 + (i % 3) * 0.12);
        p.position.set(cx - 1.9 + i * 0.62, y + 0.02, 0.2);
        g.add(p);
      }
    }
    const vidro = new THREE.Mesh(
      new THREE.PlaneGeometry(4.45, 3.05),
      mat("vidroVitrine", () => new THREE.MeshStandardMaterial({ color: "#dff1ff", transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0.2 }))
    );
    vidro.position.set(cx, 2.35, 0.42);
    g.add(vidro);
  }
  // porta de vidro
  g.add(em(new THREE.Mesh(new THREE.PlaneGeometry(2.15, 3.3), luz("#ffb44f", 0.45)), 0, 2.2, 0.02));
  g.add(em(caixa(0.12, 3.3, 0.12, madeiraLoja), 0, 2.2, 0.3));
  g.add(em(caixa(2.2, 0.12, 0.12, madeiraLoja), 0, 1.6, 0.3));

  // toldo listrado com bordinha recortada
  const toldoTex = T.virar(T.texToldo(), 1, 1);
  const toldoMat = new THREE.MeshStandardMaterial({ map: toldoTex, roughness: 0.85, side: THREE.DoubleSide });
  const prof = 2.6, queda = 0.75;
  const toldo = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.2, Math.hypot(prof, queda)), toldoMat);
  toldo.rotation.x = -Math.PI / 2 + Math.atan2(queda, prof);
  toldo.position.set(0, 4.55 - queda / 2, prof / 2 + 0.3);
  toldo.castShadow = toldo.receiveShadow = true;
  g.add(toldo);
  const franja = placaPlana(w + 0.2, 0.55, 80, (ctx, W, H) => {
    const n = 26;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? "#f6ecd8" : "#c8302c";
      const x0 = (i * W) / n, x1 = ((i + 1) * W) / n;
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x1, 0);
      ctx.lineTo(x1, H * 0.55);
      ctx.arc((x0 + x1) / 2, H * 0.55, (x1 - x0) / 2, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
    }
  });
  franja.material.side = THREE.DoubleSide;
  franja.material.alphaTest = 0.5;
  franja.position.set(0, 4.55 - queda - 0.27, prof + 0.3);
  franja.castShadow = true;
  g.add(franja);
  for (const s of [-1, 1]) {
    const haste = caixa(0.06, 0.06, Math.hypot(prof, 1.2), MT.ferro());
    haste.position.set(s * 6.2, 4.2, prof / 2 + 0.3);
    haste.rotation.x = Math.atan2(1.2, prof);
    g.add(haste);
  }

  // letreiro: "Padaria" + "PÃO QUENTE"
  const letreiro = placaPlana(10.5, 1.35, 110, (ctx, W, H) => {
    ctx.fillStyle = "#1f4a3a";
    ctx.beginPath();
    ctx.roundRect(4, 4, W - 8, H - 8, 26);
    ctx.fill();
    ctx.strokeStyle = "#e7b54a";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.roundRect(16, 16, W - 32, H - 32, 18);
    ctx.stroke();
    ctx.fillStyle = "#f3c45a";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.round(H * 0.62)}px ${FONTE_CURSIVA}`;
    ctx.textAlign = "left";
    escrever(ctx, "Padaria", W * 0.06, H * 0.47);
    ctx.fillStyle = "#fbf1dc";
    ctx.textAlign = "right";
    ctx.font = `700 ${Math.round(H * 0.36)}px ${FONTE_LETREIRO}`;
    escrever(ctx, "PÃO QUENTE", W * 0.94, H * 0.48);
    ctx.font = `600 ${Math.round(H * 0.15)}px ${FONTE_LETREIRO}`;
    ctx.fillStyle = "#e7b54a";
    escrever(ctx, "DESDE 1958", W * 0.94, H * 0.78);
  });
  letreiro.position.set(0, 5.25, 0.12);
  g.add(letreiro);
  g.add(em(caixa(10.7, 1.5, 0.1, cor("#173a2d")), 0, 5.25, 0.05));

  // placa de bandeira com um pão desenhado
  const braco = caixa(1.6, 0.08, 0.08, MT.ferro());
  braco.rotation.y = Math.PI / 2;
  braco.position.set(6.2, 6.3, 0.8);
  g.add(braco);
  const bandeira = placaPlana(1.3, 1.3, 220, (ctx, W, H) => {
    ctx.fillStyle = "#f6e7c4";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W / 2 - 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.strokeStyle = "#7b2b2b";
    ctx.stroke();
    ctx.save();
    ctx.translate(W / 2, H / 2 - 4);
    ctx.rotate(-0.35);
    ctx.fillStyle = "#cf8d3e";
    ctx.beginPath();
    ctx.ellipse(0, 0, W * 0.3, H * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8a5520";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-W * 0.06, -H * 0.08);
    ctx.quadraticCurveTo(0, 0, -W * 0.06, H * 0.08);
    ctx.moveTo(W * 0.08, -H * 0.08);
    ctx.quadraticCurveTo(W * 0.14, 0, W * 0.08, H * 0.08);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#7b2b2b";
    ctx.textAlign = "center";
    ctx.font = `700 ${Math.round(H * 0.13)}px ${FONTE_LETREIRO}`;
    escrever(ctx, "PÃO", W / 2, H * 0.83);
  });
  bandeira.material.side = THREE.DoubleSide;
  bandeira.rotation.y = Math.PI / 2;
  bandeira.position.set(6.2, 5.55, 1.3);
  g.add(bandeira);

  // arandelas dos lados da porta
  for (const s of [-1, 1]) {
    g.add(em(caixa(0.12, 0.12, 0.35, MT.ferro()), s * 1.6, 3.55, 0.6));
    g.add(em(bola(0.2, luz("#ffc36b", 2.4), 12), s * 1.6, 3.4, 0.75));
  }

  // quadro-negro na calçada
  const quadro = new THREE.Group();
  const giz = placaPlana(1.15, 1.4, 260, (ctx, W, H) => {
    ctx.fillStyle = "#6d4527";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#2a302c";
    ctx.fillRect(16, 16, W - 32, H - 32);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f4f1e8";
    ctx.font = `700 ${Math.round(H * 0.13)}px ${FONTE_LETREIRO}`;
    escrever(ctx, "PÃO DE", W / 2, H * 0.26);
    escrever(ctx, "QUEIJO", W / 2, H * 0.41);
    ctx.fillStyle = "#f3c45a";
    ctx.font = `${Math.round(H * 0.12)}px ${FONTE_CURSIVA}`;
    escrever(ctx, "saindo agora!", W / 2, H * 0.64);
    ctx.strokeStyle = "#f4f1e8";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.83, H * 0.06, 0, Math.PI * 2);
    ctx.stroke();
  });
  giz.rotation.x = -0.18;
  giz.position.set(0, 0.72, 0.13);
  quadro.add(giz);
  const costas = caixa(1.15, 1.4, 0.05, MT.madeira("#6d4527"));
  costas.rotation.x = 0.18;
  costas.position.set(0, 0.72, -0.13);
  quadro.add(costas);
  g.add(em(quadro, -2.4, 0, 2.2, 0.25));

  // mesinha com duas cadeiras
  const mesa = new THREE.Group();
  mesa.add(em(cilindro(0.55, 0.55, 0.06, 20, cor("#f2efe8", 0.5)), 0, 1.05, 0));
  mesa.add(em(cilindro(0.05, 0.05, 1.0, 8, MT.ferro()), 0, 0.53, 0));
  mesa.add(em(cilindro(0.3, 0.3, 0.04, 16, MT.ferro()), 0, 0.02, 0));
  for (const s of [-1, 1]) {
    const cad = new THREE.Group();
    cad.add(em(caixa(0.6, 0.06, 0.6, MT.ferro()), 0, 0.68, 0));
    cad.add(em(caixa(0.6, 0.7, 0.05, MT.ferro()), 0, 1.03, -0.28));
    for (const [a, b] of [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]]) cad.add(em(caixa(0.04, 0.68, 0.04, MT.ferro()), a, 0.34, b));
    mesa.add(em(cad, s * 0.95, 0, 0, s * -Math.PI / 2));
  }
  mesa.add(em(pao(1.1), 0.1, 1.17, 0.1));
  g.add(em(mesa, 4.4, 0, 2.3));
  return g;
}

// ---------- coreto ----------
export function coreto() {
  const g = new THREE.Group();
  const R = 5.2, alt = 1.4, hCol = 3.9;
  const branco = MT.branco();
  const base = cilindro(R + 0.5, R + 0.7, 0.35, 8, cor("#d9d1c3"));
  base.rotation.y = Math.PI / 8;
  base.position.y = 0.17;
  g.add(base);
  const corpo = cilindro(R, R, alt - 0.35, 8, cor("#f3ede2"));
  corpo.rotation.y = Math.PI / 8;
  corpo.position.y = 0.35 + (alt - 0.35) / 2;
  g.add(corpo);
  const assoalho = cilindro(R - 0.05, R - 0.05, 0.08, 8, MT.madeira("#9a6a3e"));
  assoalho.rotation.y = Math.PI / 8;
  assoalho.position.y = alt + 0.04;
  g.add(assoalho);
  // escada na frente
  for (let i = 0; i < 4; i++) g.add(em(caixa(2.8, alt / 4, 0.55, cor("#e4ddd0")), 0, (alt / 4) * (i + 0.5), R + 1.75 - i * 0.5));
  const rc = R - 0.35;
  const colunas = [];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    const x = Math.sin(a) * rc, z = Math.cos(a) * rc;
    colunas.push([x, z]);
    g.add(em(cilindro(0.15, 0.17, hCol, 10, branco), x, alt + hCol / 2, z));
    g.add(em(caixa(0.45, 0.25, 0.45, branco), x, alt + hCol - 0.1, z));
    g.add(em(caixa(0.45, 0.25, 0.45, branco), x, alt + 0.12, z));
  }
  // guarda-corpo (menos na frente)
  const lado = 2 * rc * Math.sin(Math.PI / 8);
  for (let i = 0; i < 8; i++) {
    const a = ((i + 1) * Math.PI) / 4;
    if (i === 7) continue;
    const x = Math.sin(a) * rc * Math.cos(Math.PI / 8), z = Math.cos(a) * rc * Math.cos(Math.PI / 8);
    const gr = new THREE.Group();
    gr.add(em(caixa(lado - 0.3, 0.12, 0.16, branco), 0, alt + 1.05, 0));
    gr.add(em(caixa(lado - 0.3, 0.08, 0.1, branco), 0, alt + 0.2, 0));
    for (let k = 0; k < 9; k++) gr.add(em(cilindro(0.04, 0.04, 0.8, 6, branco), -(lado - 0.5) / 2 + (k * (lado - 0.5)) / 8, alt + 0.62, 0));
    gr.position.set(x, 0, z);
    gr.rotation.y = a;
    g.add(gr);
  }
  // telhado
  const yT = alt + hCol;
  const fascia = cilindro(R + 0.75, R + 0.75, 0.45, 8, branco);
  fascia.rotation.y = Math.PI / 8;
  fascia.position.y = yT + 0.1;
  g.add(fascia);
  const teto = new THREE.Mesh(
    new THREE.ConeGeometry(R + 1.0, 3.0, 8),
    mat("tetoCoreto", () => new THREE.MeshStandardMaterial({ color: "#b8452e", roughness: 0.7, flatShading: true }))
  );
  teto.rotation.y = Math.PI / 8;
  teto.position.y = yT + 0.33 + 1.5;
  teto.castShadow = teto.receiveShadow = true;
  g.add(teto);
  g.add(em(cilindro(0.08, 0.2, 0.8, 8, cor("#d9a93b", 0.35, 0.7)), 0, yT + 3.6, 0));
  g.add(em(bola(0.22, cor("#d9a93b", 0.35, 0.7), 12), 0, yT + 4.05, 0));
  // lampadinhas na borda do telhado
  const lamp = luz("#ffcf73", 3.2);
  for (let i = 0; i < 8; i++) {
    const a0 = (i * Math.PI) / 4, a1 = ((i + 1) * Math.PI) / 4;
    const r = (R + 0.75) * 0.99;
    for (let k = 0; k < 5; k++) {
      const t = (k + 0.5) / 5;
      const x = Math.sin(a0) * r * (1 - t) + Math.sin(a1) * r * t;
      const z = Math.cos(a0) * r * (1 - t) + Math.cos(a1) * r * t;
      g.add(em(bola(0.09, lamp, 8), x, yT - 0.22, z));
    }
  }
  // lustre no meio
  g.add(em(cilindro(0.02, 0.02, 1.0, 4, MT.ferro()), 0, yT - 0.4, 0));
  g.add(em(bola(0.35, luz("#ffc36b", 2.6), 16), 0, yT - 1.0, 0));
  g.userData.alturaTeto = yT + 0.1;
  g.userData.raioBorda = R + 0.75;
  return g;
}

// ---------- bandeirinhas (de um ponto a outro, com barriga) ----------
export function bandeirinhas(a, b, semente = 1, n = 18) {
  const g = new THREE.Group();
  const rnd = T.sorteio(semente);
  const cores = ["#e63946", "#f4a261", "#2a9d8f", "#e9c46a", "#8e5bd8", "#3a86ff", "#ff6fa8", "#5bc04a"];
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const pontos = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const p = A.clone().lerp(B, t);
    p.y -= Math.sin(t * Math.PI) * A.distanceTo(B) * 0.08;
    pontos.push(p);
  }
  const curva = new THREE.CatmullRomCurve3(pontos);
  const fio = new THREE.Mesh(new THREE.TubeGeometry(curva, 30, 0.015, 4), cor("#3b3b3b"));
  g.add(fio);
  const tri = new THREE.BufferGeometry();
  tri.setAttribute("position", new THREE.Float32BufferAttribute([-0.22, 0, 0, 0.22, 0, 0, 0, -0.5, 0], 3));
  tri.computeVertexNormals();
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const p = curva.getPoint(t);
    const tan = curva.getTangent(t);
    const m = new THREE.Mesh(
      tri,
      mat("band" + cores[i % 8], () => new THREE.MeshStandardMaterial({ color: cores[i % 8], roughness: 0.8, side: THREE.DoubleSide }))
    );
    m.position.copy(p);
    m.rotation.y = Math.atan2(-tan.z, tan.x);
    m.rotation.x = (rnd() - 0.5) * 0.3;
    m.castShadow = true;
    g.add(m);
  }
  return g;
}

// ---------- igreja matriz ----------
export function igreja() {
  const g = new THREE.Group();
  const w = 14, d = 22, h = 12.5;
  const corP = "#f7f3ea", corDet = "#d9a441";
  const parede = MT.reboco(corP);
  const det = cor(corDet, 0.75);
  g.add(em(caixa(w, h, d, parede, 3), 0, h / 2, -d / 2));
  // telhado com cumeeira ao longo de z
  const tel = telhado(d + 0.6, w + 1.2, 4.2, parede);
  tel.rotation.y = Math.PI / 2;
  tel.position.set(0, h, -d / 2);
  g.add(tel);
  // frontão triangular na fachada
  const s = new THREE.Shape();
  s.moveTo(-w / 2 - 0.3, 0);
  s.lineTo(w / 2 + 0.3, 0);
  s.lineTo(0, 5.2);
  s.closePath();
  const front = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: false }), parede);
  front.position.set(0, h, -0.3);
  front.castShadow = front.receiveShadow = true;
  g.add(front);
  // contorno do frontão
  for (const sgn of [-1, 1]) {
    const ang = Math.atan2(5.2, w / 2 + 0.3);
    const len = Math.hypot(5.2, w / 2 + 0.3);
    const borda = caixa(len + 0.4, 0.4, 0.8, det);
    borda.position.set((sgn * (w / 2 + 0.3)) / 2, h + 2.6, 0.05);
    borda.rotation.z = -sgn * ang;
    g.add(borda);
  }
  g.add(em(caixa(w + 0.8, 0.5, 0.8, det), 0, h, 0.05));
  // pilastras
  for (const x of [-w / 2 + 0.3, -2.6, 2.6, w / 2 - 0.3]) g.add(em(caixa(0.7, h, 0.3, det), x, h / 2, 0.1));
  // óculo (janela redonda)
  const anel = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.18, 10, 28), det);
  anel.position.set(0, h + 1.9, 0.35);
  g.add(anel);
  const oc = new THREE.Mesh(new THREE.CircleGeometry(1.0, 28), MT.vidro());
  oc.position.set(0, h + 1.9, 0.31);
  g.add(oc);
  // portão em arco
  const madeira = MT.madeira("#6a3d22");
  g.add(em(caixa(3.4, 5.0, 0.2, madeira, 1.6), 0, 2.5, 0.05));
  const arco = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.2, 24, 1, false, -Math.PI / 2, Math.PI), madeira);
  arco.rotation.x = -Math.PI / 2;
  arco.position.set(0, 5.0, 0.05);
  g.add(arco);
  const molduraArco = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.2, 8, 24, Math.PI), det);
  molduraArco.position.set(0, 5.0, 0.2);
  g.add(molduraArco);
  for (const sx of [-1, 1]) g.add(em(caixa(0.4, 5.0, 0.3, det), sx * 1.85, 2.5, 0.2));
  // janelas altas da fachada
  for (const sx of [-1, 1]) {
    g.add(em(caixa(1.4, 2.8, 0.1, MT.vidro()), sx * 4.6, 8.4, 0.05));
    g.add(em(caixa(1.8, 0.3, 0.4, det), sx * 4.6, 10.0, 0.15));
    g.add(em(caixa(1.9, 0.2, 0.45, det), sx * 4.6, 6.9, 0.15));
  }
  // escadaria (adro)
  for (let i = 0; i < 4; i++) g.add(em(caixa(w + 3, 0.28, 3.4 - i * 0.7, cor("#d9d1c3")), 0, 0.14 + i * 0.28, 1.7 - i * 0.35));

  // torre do sino à esquerda
  const torre = new THREE.Group();
  const tw = 4.6, th = 21;
  torre.add(em(caixa(tw, th, tw, parede, 3), 0, th / 2, 0));
  for (const y of [h, 16.2, th]) torre.add(em(caixa(tw + 0.5, 0.45, tw + 0.5, det), 0, y, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) torre.add(em(caixa(0.5, th, 0.5, det), (x * tw) / 2, th / 2, (z * tw) / 2));
  // vão do sino (frente e lados)
  for (const ry of [0, Math.PI / 2, -Math.PI / 2]) {
    const vao = caixa(2.2, 3.0, 0.1, cor("#1c1a18"));
    const p = new THREE.Group();
    p.add(em(vao, 0, 18.4, tw / 2 + 0.02));
    p.rotation.y = ry;
    torre.add(p);
  }
  const sino = new THREE.Mesh(
    new THREE.LatheGeometry([new THREE.Vector2(0.05, 0.9), new THREE.Vector2(0.45, 0.8), new THREE.Vector2(0.55, 0.3), new THREE.Vector2(0.85, -0.4), new THREE.Vector2(0.9, -0.55)], 20),
    cor("#c9952e", 0.35, 0.8)
  );
  sino.position.set(0, 18.4, 1.2);
  torre.add(sino);
  // relógio
  const relogio = placaPlana(2.4, 2.4, 200, (ctx, W, H) => {
    ctx.fillStyle = "#fbf6ea";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 16;
    ctx.strokeStyle = "#2b2b2b";
    ctx.stroke();
    ctx.fillStyle = "#2b2b2b";
    for (let i = 0; i < 12; i++) {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate((i * Math.PI) / 6);
      ctx.fillRect(-6, -W / 2 + 26, 12, i % 3 ? 22 : 40);
      ctx.restore();
    }
    const ponteiro = (ang, comp, larg) => {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(ang);
      ctx.fillRect(-larg / 2, -comp, larg, comp + 14);
      ctx.restore();
    };
    ponteiro((5.25 / 12) * Math.PI * 2, W * 0.25, 18); // 5h15
    ponteiro((15 / 60) * Math.PI * 2, W * 0.36, 11);
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 14, 0, Math.PI * 2);
    ctx.fill();
  });
  relogio.position.set(0, 14.4, tw / 2 + 0.06);
  torre.add(relogio);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.12, 8, 30), det);
  aro.position.set(0, 14.4, tw / 2 + 0.08);
  torre.add(aro);
  // telhado da torre e cruz
  const pira = new THREE.Mesh(new THREE.ConeGeometry(tw * 0.78, 5.0, 4), mat("pira", () => new THREE.MeshStandardMaterial({ color: "#b8452e", roughness: 0.7, flatShading: true })));
  pira.rotation.y = Math.PI / 4;
  pira.position.y = th + 2.7;
  pira.castShadow = true;
  torre.add(pira);
  torre.add(em(caixa(0.18, 1.6, 0.18, cor("#d9a93b", 0.35, 0.7)), 0, th + 5.9, 0));
  torre.add(em(caixa(0.9, 0.16, 0.16, cor("#d9a93b", 0.35, 0.7)), 0, th + 6.2, 0));
  torre.position.set(-w / 2 - tw / 2 + 0.2, 0, -tw / 2 + 0.4);
  torre.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  g.add(torre);
  return g;
}

// ---------- carrinho de pipoca ----------
export function carrinhoPipoca() {
  const g = new THREE.Group();
  const verm = cor("#c8302c", 0.55), branco = MT.branco();
  g.add(em(caixa(1.7, 0.9, 1.0, verm), 0, 0.95, 0));
  g.add(em(caixa(1.74, 0.14, 1.04, branco), 0, 1.3, 0));
  g.add(em(caixa(1.74, 0.1, 1.04, branco), 0, 0.55, 0));
  const vit = caixa(1.3, 0.75, 0.8, mat("pipocaVidro", () => new THREE.MeshStandardMaterial({ color: "#fff4c8", emissive: "#ffc94d", emissiveIntensity: 0.5, roughness: 0.3 })));
  vit.position.set(0, 1.75, 0);
  g.add(vit);
  for (const [x, z] of [[-0.66, -0.41], [0.66, -0.41], [-0.66, 0.41], [0.66, 0.41]]) g.add(em(caixa(0.07, 0.8, 0.07, verm), x, 1.75, z));
  g.add(em(caixa(1.4, 0.08, 0.9, verm), 0, 2.16, 0));
  const rnd = T.sorteio(31);
  const milho = [cor("#fffaf0", 0.9), cor("#fbe7a6", 0.9)];
  for (let i = 0; i < 26; i++) g.add(em(bola(0.07 + rnd() * 0.04, milho[i % 2], 6), (rnd() - 0.5) * 1.1, 1.45 + rnd() * 0.15, (rnd() - 0.5) * 0.6));
  // rodas e pé
  for (const s of [-1, 1]) {
    const roda = cilindro(0.36, 0.36, 0.1, 18, cor("#2b2b2b", 0.6));
    roda.rotation.x = Math.PI / 2;
    roda.position.set(-0.45, 0.36, s * 0.56);
    g.add(roda);
    g.add(em(cilindro(0.08, 0.08, 0.12, 10, MT.branco()), -0.45, 0.36, s * 0.62));
  }
  g.add(em(caixa(0.08, 0.5, 0.08, MT.ferro()), 0.7, 0.25, 0));
  g.add(em(caixa(0.7, 0.06, 0.06, MT.ferro()), -1.15, 1.2, 0.3));
  g.add(em(caixa(0.7, 0.06, 0.06, MT.ferro()), -1.15, 1.2, -0.3));
  // guarda-sol listrado
  g.add(em(cilindro(0.035, 0.035, 1.5, 6, MT.ferro()), 0, 2.9, 0));
  const sol = new THREE.Mesh(
    new THREE.ConeGeometry(1.45, 0.6, 16, 1, true),
    mat("guardaSol", () => new THREE.MeshStandardMaterial({ map: T.virar(T.texToldo("#e8b62c", "#fbf3df"), 1, 1), roughness: 0.8, side: THREE.DoubleSide }))
  );
  sol.position.y = 3.55;
  sol.castShadow = true;
  g.add(sol);
  // placa
  const placa = placaPlana(1.45, 0.5, 220, (ctx, W, H) => {
    ctx.fillStyle = "#fbf3df";
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 24);
    ctx.fill();
    ctx.fillStyle = "#c8302c";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.round(H * 0.62)}px ${FONTE_LETREIRO}`;
    escrever(ctx, "PIPOCA", W / 2, H * 0.54);
  });
  placa.position.set(0, 0.95, 0.52);
  g.add(placa);
  return g;
}

// ---------- placa da cidade ----------
export function placaCidade() {
  const g = new THREE.Group();
  const madeira = MT.madeira("#7a4e2c");
  for (const s of [-1, 1]) g.add(em(caixa(0.3, 3.2, 0.3, madeira, 1), s * 1.9, 1.6, 0));
  g.add(em(caixa(4.4, 1.9, 0.18, madeira, 1.5), 0, 2.35, 0));
  const p = placaPlana(4.1, 1.6, 200, (ctx, W, H) => {
    ctx.fillStyle = "#f4ead2";
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 30);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = "#7a4e2c";
    ctx.font = `600 ${Math.round(H * 0.15)}px ${FONTE_LETREIRO}`;
    escrever(ctx, PLACAS.bemVindo, W / 2, H * 0.24);
    ctx.fillStyle = "#1f4a3a";
    ctx.font = `700 ${Math.round(H * 0.3)}px ${FONTE_LETREIRO}`;
    escrever(ctx, PLACAS.cidade, W / 2, H * 0.56);
    ctx.fillStyle = "#b8452e";
    ctx.font = `700 ${Math.round(H * 0.17)}px ${FONTE_LETREIRO}`;
    escrever(ctx, PLACAS.habitantes, W / 2, H * 0.84);
  });
  p.position.set(0, 2.35, 0.1);
  g.add(p);
  // plaquinha pendurada: a regra
  for (const s of [-1, 1]) g.add(em(cilindro(0.02, 0.02, 0.3, 4, MT.ferro()), s * 1.3, 1.27, 0.05));
  const regra = placaPlana(3.0, 0.62, 260, (ctx, W, H) => {
    ctx.fillStyle = "#b8312c";
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 26);
    ctx.fill();
    ctx.strokeStyle = "#f4ead2";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(14, 14, W - 28, H - 28, 16);
    ctx.stroke();
    ctx.fillStyle = "#fbf3df";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.round(H * 0.5)}px ${FONTE_LETREIRO}`;
    escrever(ctx, PLACAS.regraCurta, W / 2, H * 0.54);
  });
  regra.position.set(0, 0.85, 0.06);
  g.add(regra);
  g.add(em(caixa(3.06, 0.66, 0.05, cor("#7a1f1b")), 0, 0.85, 0.02));
  return g;
}

// ---------- placa de bronze da lei (no pé do coreto) ----------
// Em pé, num pedestal. A parte de baixo é vazia de propósito: "a regra não diz que não pode juntar".
export function placaLei() {
  const g = new THREE.Group();
  const pedra = cor("#cfc8bb", 0.9);
  g.add(em(caixa(1.5, 0.25, 0.7, pedra), 0, 0.12, 0));
  g.add(em(caixa(1.3, 1.6, 0.5, pedra), 0, 1.05, 0));
  g.add(em(caixa(1.45, 0.16, 0.62, pedra), 0, 1.9, 0));
  const bronze = placaPlana(1.12, 1.4, 600, (ctx, W, H) => {
    const gr = ctx.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, "#c99a4a");
    gr.addColorStop(0.5, "#a77a35");
    gr.addColorStop(1, "#7d5826");
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 30);
    ctx.fill();
    ctx.strokeStyle = "#5e401a";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.roundRect(24, 24, W - 48, H - 48, 18);
    ctx.stroke();
    // texto gravado: sombra escura + luz por baixo
    const gravar = (txt, y, tam, peso = 700) => {
      ctx.font = `${peso} ${tam}px ${FONTE_LETREIRO}`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,230,170,0.45)";
      escrever(ctx, txt, W / 2 + 2, y + 3);
      ctx.fillStyle = "#3f2a10";
      escrever(ctx, txt, W / 2, y);
    };
    gravar(PLACAS.lei.titulo, H * 0.12, Math.round(W * 0.09));
    if (PLACAS.lei.texto[0]) gravar(PLACAS.lei.texto[0], H * 0.22, Math.round(W * 0.058), 600);
    if (PLACAS.lei.texto[1]) gravar(PLACAS.lei.texto[1], H * 0.28, Math.round(W * 0.058), 600);
    if (PLACAS.lei.destaque[0]) gravar(PLACAS.lei.destaque[0], H * 0.38, Math.round(W * 0.105));
    if (PLACAS.lei.destaque[1]) gravar(PLACAS.lei.destaque[1], H * 0.46, Math.round(W * 0.105));
    gravar(PLACAS.lei.rodape, H * 0.55, Math.round(W * 0.05), 600);
    gravar(PLACAS.lei.autor, H * 0.63, Math.round(W * 0.055), 600);
    // parafusos
    ctx.fillStyle = "#5e401a";
    for (const [x, y] of [[50, 50], [W - 50, 50], [50, H - 50], [W - 50, H - 50]]) {
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  bronze.material.metalness = 0.4;
  bronze.material.roughness = 0.5;
  bronze.material.emissive = new THREE.Color("#ffffff");
  bronze.material.emissiveMap = bronze.material.map;
  bronze.material.emissiveIntensity = 0.32;
  bronze.position.set(0, 1.05, 0.255);
  g.add(bronze);
  return g;
}

// ---------- rabisco de giz (no muro) ----------
export function rabiscoGiz() {
  const p = placaPlana(3.3, 1.6, 300, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const rnd = T.sorteio(1958);
    const giz = (txt, x, y, tam) => {
      ctx.font = `700 ${tam}px ${FONTE_LETREIRO}`;
      ctx.textAlign = "center";
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = `rgba(32,64,140,${0.3 + k * 0.1})`;
        escrever(ctx, txt, x + (rnd() - 0.5) * 4, y + (rnd() - 0.5) * 4);
      }
    };
    if (PLACAS.giz[0]) giz(PLACAS.giz[0], W * 0.5, H * 0.36, Math.round(H * 0.24));
    if (PLACAS.giz[1]) giz(PLACAS.giz[1], W * 0.46, H * 0.72, Math.round(H * 0.3));
    // boquinha com X desenhada do lado
    ctx.strokeStyle = "rgba(190,40,40,0.85)";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.ellipse(W * 0.88, H * 0.66, W * 0.06, H * 0.08, 0, 0, Math.PI * 2);
    ctx.moveTo(W * 0.83, H * 0.56);
    ctx.lineTo(W * 0.93, H * 0.76);
    ctx.moveTo(W * 0.93, H * 0.56);
    ctx.lineTo(W * 0.83, H * 0.76);
    ctx.stroke();
    // falhas do giz
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.3 + rnd() * 0.7})`;
      ctx.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 3, 1 + rnd() * 2);
    }
    ctx.globalCompositeOperation = "source-over";
  });
  p.material.roughness = 1;
  return p;
}

// ---------- risquinhos (contagem de 5 em 5) ----------
// densidade(x, y) de 0 a 1 diz onde tem mais risco; numero é escrito no meio, se vier
export function texRisquinhos(tamanho, semente, densidade, { cor = "rgba(245,240,228,0.85)", numero = null, fonte = FONTE_LETREIRO } = {}) {
  const c = document.createElement("canvas");
  c.width = c.height = tamanho;
  const ctx = c.getContext("2d");
  const rnd = T.sorteio(semente);
  ctx.strokeStyle = cor;
  ctx.lineCap = "round";
  const passo = tamanho / 26;
  for (let y = passo * 0.6; y < tamanho; y += passo * 1.15)
    for (let x = passo * 0.3; x < tamanho; x += passo * 1.05) {
      if (rnd() > densidade(x / tamanho, y / tamanho)) continue;
      ctx.save();
      ctx.translate(x + (rnd() - 0.5) * passo * 0.3, y + (rnd() - 0.5) * passo * 0.3);
      ctx.rotate((rnd() - 0.5) * 0.25);
      ctx.lineWidth = Math.max(1.2, passo * 0.07);
      const h = passo * 0.75, e = passo * 0.16;
      const n = rnd() < 0.85 ? 4 : 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) {
        ctx.beginPath();
        ctx.moveTo(k * e, 0);
        ctx.lineTo(k * e + (rnd() - 0.5) * 2, h);
        ctx.stroke();
      }
      if (n === 4) {
        ctx.beginPath();
        ctx.moveTo(-e * 0.6, h * 0.8);
        ctx.lineTo(e * 3.6, h * 0.2);
        ctx.stroke();
      }
      ctx.restore();
    }
  if (numero) {
    ctx.font = `700 ${Math.round(tamanho * 0.13)}px ${fonte}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(40,30,20,0.85)";
    ctx.fillRect(tamanho * 0.17, tamanho * 0.73, tamanho * 0.66, tamanho * 0.16);
    ctx.fillStyle = "#fbf6ea";
    escrever(ctx, numero, tamanho / 2, tamanho * 0.815);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export { piso };
