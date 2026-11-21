// EPISÓDIO "Cem Palavras". Este é o arquivo que muda a cada vídeo:
// 1) os períodos (dia, noite, entardecer, 1958...), 2) o elenco e o que cada um faz em cada momento,
// 3) os planos de câmera, presos nos blocos e palavras da narração.
import { criarMotor, THREE, V, CHAO, B, aos, dentro, falando, virarPara } from "./motor.js";
import { criarBoneco, criarCachorro, criarPombo } from "./bonecos.js";
import { sorteio } from "./texturas.js";
import { caixa, cor, em, MT, placaPlana } from "./kit.js";
import { carrinhoPipoca } from "./predios.js";

// ---------- períodos (quando é dia, noite, entardecer, 1958...) ----------
const INI_NOITE2 = aos(21, 2);
function periodo(t) {
  if (t < B(9).ini) return "dia";
  if (t < B(14).ini) return "noite";
  if (t < B(18).ini) return "entardecer";
  if (t < B(20).ini) return "sepia";
  if (t < INI_NOITE2) return "entardecer2";
  return "noite2";
}

const motor = criarMotor({
  periodo,
  luzDoPeriodo: (per) => (per === "noite2" ? "noite" : per === "entardecer2" ? "entardecer" : per),
  filmeAntigo: (per) => per === "sepia",
});
const cena = motor.cena;
const ator = motor.ator;
const { bancos, mesa, lei } = motor.cidade;
// postes extras que acendem a mesa do dominó e o banco do final
motor.posteExtra(-14.4, 6.4, 60, 16);
motor.posteExtra(7.7, 11.6, 55, 14);

// ---------- elenco ----------
const MESA = V(mesa.x, 0, mesa.z);
const sorte = sorteio(318);
const escolher = (l) => l[Math.floor(sorte() * l.length)];
function morador(extra = {}) {
  return criarBoneco({
    pele: escolher(["#f0c49a", "#e8b48a", "#c98d5f", "#a8714a", "#7a4a2e", "#5a3520", "#f3d2b3"]),
    camisa: escolher(["#e86a7a", "#3f7d4f", "#f2b84b", "#6a8fd0", "#e07b39", "#8e5bb0", "#f4f1e8", "#2fa36b", "#d94848"]),
    calca: escolher(["#33405a", "#4a4038", "#5a4a3a", "#2f3b55", "#6b5a45", "#3d3a36"]),
    sapato: escolher(["#2a2420", "#f4f1e8", "#c8302c", "#3a2a20"]),
    roupa: escolher([{}, { listras: "rgba(255,255,255,0.35)" }, { gola: "#ffffff" }, { botoes: "#f4f1e8" }, { bolso: true }]),
    acessorio: escolher(["curto", "rabo", "bone", "cachos", "careca", "curto", "rabo"]),
    cabelo: escolher(["#2a1a14", "#3a2418", "#6b4a2e", "#c9a36a", "#1a1a1a", "#8a3b1e"]),
    corAcessorio: escolher(["#c8302c", "#2f5f8f", "#f2b84b", "#3f7d4f"]),
    mangaCurta: sorte() < 0.5, fase: Math.floor(sorte() * 20), expressao: "feliz", ...extra,
  });
}
const congelado = (t) => (dentro(t, B(15).ini, B(20).ini) ? B(15).ini : t);
const presente = (per) => per === "dia" || per === "entardecer" || per === "entardecer2";
const tarde = (per) => per === "entardecer" || per === "entardecer2";

// Juca
const juca = criarBoneco({
  pele: "#c98d5f", camisa: "#2c3e66", roupa: { estampa: "#f3c45a" }, calca: "#b89a6a", sapato: "#c8302c",
  acessorio: "gorro", corAcessorio: "#14c2b0", expressao: "feliz", fase: 0,
});
const lousa = new THREE.Group();
lousa.add(em(caixa(0.92, 0.7, 0.05, MT.madeira("#7a4e2c")), 0, 0, 0));
const giz3 = placaPlana(0.8, 0.58, 400, (ctx, W, H) => {
  ctx.fillStyle = "#283028";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(245,245,238,0.92)";
  ctx.lineCap = "round";
  ctx.lineWidth = 16;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.moveTo(W * (0.36 + k * 0.14), H * 0.2);
    ctx.lineTo(W * (0.35 + k * 0.14), H * 0.62);
    ctx.stroke();
  }
});
giz3.position.z = 0.03;
lousa.add(giz3);
lousa.position.set(0, 1.12, 0.62);
lousa.rotation.x = -0.15;
juca.corpo.add(lousa);
const pedrinha = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), cor("#8d8a84", 0.9));
pedrinha.position.y = -0.16;
juca.maos[1].add(pedrinha);
const BANCO_FIM = bancos[0];
ator(juca, (t, per) => {
  lousa.visible = dentro(t, B(7).ini, B(8).ini);
  pedrinha.visible = per === "noite2";
  if (per === "dia") {
    if (dentro(t, B(6).ini, B(7).ini)) return { x: 2.5, z: 10.1, ry: -0.55, pose: "conversar", expr: falando(t, "riso", "fala", 8) };
    if (dentro(t, B(7).ini, B(8).ini)) return { x: 2.5, z: 10.1, ry: 0.15, pose: "segurar", expr: "mudo", cab: { x: 0.12 } };
    return { x: 2.5, z: 10.1, ry: 0.25, pose: "parado", expr: "feliz" };
  }
  if (per === "noite") {
    const expr = t < aos(11, 3) + 0.6 ? "curioso" : "surpreso";
    return { x: -19.0, z: -0.03, ry: 1.077, pose: "parado", expr, cab: { y: 0 } };
  }
  if (per === "entardecer") {
    const ini = B(14).ini, k = Math.min(1, (t - ini) / 1.7);
    if (k < 1) return { x: -9.6, z: 8.6 - 5.1 * k, ry: Math.PI, pose: "andar", expr: "determinado" };
    let expr = "determinado";
    if (dentro(t, aos(14, 5), B(15).ini)) expr = falando(t, "fala", "determinado");
    if (t >= B(15).ini) expr = "surpreso";
    if (t >= aos(17, 0)) expr = "espanto";
    return { x: -9.6, z: 3.5, ry: -Math.PI / 2, pose: "parado", tPose: congelado(t), expr };
  }
  if (per === "entardecer2") return { x: -9.6, z: 3.5, ry: -Math.PI / 2, pose: "parado", expr: t < aos(21, 0) ? "surpreso" : "medo" };
  if (per === "noite2") return { x: BANCO_FIM.x, z: BANCO_FIM.z, ry: BANCO_FIM.ry, pose: "riscarSentado", expr: "determinado" };
  return { vis: false };
});

// Seu Zeca (adulto) com o prego
const zeca = criarBoneco({
  pele: "#b57a50", camisa: "#f2efe6", roupa: { botoes: "#c9c2b4", bolso: true }, calca: "#4a5a6a", sapato: "#2a2420",
  acessorio: "palha", estilo: { bigode: "#e8e4dc", sobrancelhaGrossa: true, corSobrancelha: "#d9d4cc" }, expressao: "determinado", fase: 4,
});
const prego = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.012, 0.36, 8), cor("#9a9a9a", 0.35, 0.8));
prego.position.y = -0.3;
prego.castShadow = true;
zeca.maos[1].add(prego);
const ZX = mesa.x - 1.35, ZZ = mesa.z;
ator(zeca, (t, per) => {
  prego.visible = per !== "dia";
  if (per === "dia") return { x: ZX, z: ZZ, ry: Math.PI / 2, pose: "sentadoJogando", expr: "determinado" };
  if (per === "noite") return { x: ZX, z: ZZ, ry: Math.PI / 2, pose: "riscar", expr: "determinado" };
  if (per === "entardecer") {
    const sobe = THREE.MathUtils.clamp((t - aos(14, 7)) / 0.6, 0, 1);
    let expr = "determinado";
    if (dentro(t, B(16).ini, B(17).ini)) expr = t > B(17).ini - 0.45 ? "surpreso" : "triste";
    if (dentro(t, B(17).ini, B(18).ini)) expr = falando(t, "fala", "triste", 6);
    return { x: ZX, z: ZZ, ry: Math.PI / 2, pose: "riscarParado", expr, cab: { x: 0.3 - 0.36 * sobe } };
  }
  if (per === "entardecer2") {
    const olhando = t >= aos(20, 5);
    return { x: ZX, z: ZZ, ry: Math.PI / 2, pose: "riscarParado", expr: "triste", cab: { x: olhando ? -0.06 : 0.28 } };
  }
  return { vis: false };
});

// Seu Tonico (só de dia)
const tonico = criarBoneco({
  pele: "#f0c9a5", camisa: "#c9573a", roupa: { listras: "#a8432b", bolso: true }, calca: "#5a4a3a", sapato: "#2a2420",
  acessorio: "careca", cabelo: "#e0dbd2", estilo: { barba: true, corSobrancelha: "#cfc9bf" }, expressao: "bravo", fase: 5,
});
ator(tonico, (t, per) => (per === "dia" ? { x: mesa.x + 1.35, z: mesa.z, ry: -Math.PI / 2, pose: "sentadoJogando", tPose: t + 2, expr: dentro(t, B(8).ini, B(9).ini) ? falando(t, "falaBrava", "bravo", 6) : "bravo" } : { vis: false }));

// Bia
const bia = criarBoneco({
  pele: "#7a4a2e", camisa: "#f2b84b", saia: "#f2b84b", calca: "#7a4a2e", sapato: "#f4f1e8", mangaCurta: true,
  acessorio: "cachos", cabelo: "#24160f", expressao: "feliz", fase: 1,
});
ator(bia, (t, per) => {
  if (per === "dia") return { x: 0.7, z: 10.7, ry: 0.95, pose: "parado", expr: t >= aos(6, 5) && t < B(7).ini ? "bocejo" : "feliz" };
  if (tarde(per)) return { x: -7.2, z: 2.2, ry: virarPara(-7.2, 2.2, MESA), pose: "parado", tPose: congelado(t), expr: t >= B(15).ini ? "surpreso" : "feliz" };
  return { vis: false };
});

// Seu Ademar, o padeiro
const ademar = criarBoneco({
  pele: "#e8b48a", camisa: "#e9eef5", roupa: { avental: "#fbfaf6" }, manga: "#e9eef5", mangaCurta: true,
  calca: "#3d3a36", sapato: "#2a2420", acessorio: "chef", estilo: { bigode: "#3a2a20", sobrancelhaGrossa: true }, expressao: "riso", fase: 2,
});
const bandeja = new THREE.Group();
bandeja.add(em(caixa(1.1, 0.06, 0.62, cor("#b9b6ae", 0.55, 0.45)), 0, 0, 0));
for (let i = 0; i < 5; i++) {
  const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.26, 4, 10), cor("#d4974a", 0.6));
  p.rotation.z = Math.PI / 2;
  p.rotation.y = 0.3 * (i % 2 ? 1 : -1);
  p.position.set(-0.36 + i * 0.18, 0.1, (i % 2) * 0.16 - 0.08);
  p.castShadow = true;
  bandeja.add(p);
}
bandeja.position.set(0, 1.12, 0.78);
ademar.corpo.add(bandeja);
ator(ademar, (t, per) => {
  if (per === "dia") return { x: 29.9, z: 0.7, ry: Math.PI, pose: "bandeja", expr: "riso" };
  if (tarde(per)) return { x: -7.0, z: 6.2, ry: virarPara(-7.0, 6.2, MESA), pose: "bandeja", tPose: congelado(t), expr: t >= B(15).ini ? "surpreso" : "riso" };
  return { vis: false };
});

// Lena
const lena = criarBoneco({
  pele: "#a8714a", camisa: "#e86a7a", roupa: { gola: "#ffffff" }, calca: "#2f3b55", sapato: "#e86a7a", acessorio: "rabo",
  cabelo: "#3a2418", expressao: "feliz", fase: 7,
});
lena.bracos[0].add(em(caixa(0.5, 0.6, 0.25, cor("#e7d7b5", 0.9)), 0, -0.85, 0.05));
ator(lena, (t, per) => {
  if (per === "dia") return { x: 29.9, z: -1.25, ry: 0, pose: dentro(t, aos(4, 2), B(5).ini) ? "apontar" : "parado", expr: "feliz" };
  if (tarde(per)) return { x: -13.4, z: 8.6, ry: virarPara(-13.4, 8.6, MESA), pose: "parado", tPose: congelado(t), expr: t >= B(15).ini ? "surpreso" : "feliz" };
  return { vis: false };
});

// Dona Cida e os pombos
const cida = criarBoneco({
  pele: "#f0c49a", camisa: "#8e5bb0", roupa: { gola: "#f6f1e6", botoes: "#f3c45a" }, saia: "#7e68b8", calca: "#7e68b8",
  sapato: "#3a2a20", acessorio: "coque", cabelo: "#d8d3cc", estilo: { oculos: true }, expressao: "feliz", fase: 3,
});
const BC = bancos[2];
ator(cida, (t, per) => {
  if (!presente(per)) return { vis: false };
  const curiosa = dentro(t, B(5).ini, aos(5, 4));
  return { x: BC.x, z: BC.z, ry: BC.ry, pose: "jogarMilho", tPose: congelado(t), expr: curiosa ? "curioso" : "feliz", cab: curiosa ? { y: 0.5 } : null };
});
const pombos = [];
for (let i = 0; i < 4; i++) {
  const p = criarPombo(i + 1);
  const fx = Math.sin(BC.ry), fz = Math.cos(BC.ry);
  const dist = 1.8 + (i % 2) * 0.7, lado = (i - 1.5) * 0.7;
  p.grupo.position.set(BC.x + fx * dist + fz * lado, CHAO, BC.z + fz * dist - fx * lado);
  p.grupo.rotation.y = BC.ry + Math.PI + (i - 1.5) * 0.5;
  cena.add(p.grupo);
  pombos.push(p);
}

// Caramelo
const caramelo = criarCachorro();
cena.add(caramelo.grupo);
motor.aCadaQuadro((t, per) => {
  caramelo.grupo.visible = presente(per);
  if (per === "dia") caramelo.grupo.position.set(26.0, CHAO, 3.2), (caramelo.grupo.rotation.y = 2.14);
  else caramelo.grupo.position.set(-8.3, CHAO, 1.0), (caramelo.grupo.rotation.y = virarPara(-8.3, 1.0, MESA));
  caramelo.pose("parado", congelado(t));
});

// o morador que leva o susto (bloco 2)
const assustado = morador({ acessorio: "bone", corAcessorio: "#c8302c", camisa: "#3f7d4f", expressao: "feliz" });
ator(assustado, (t, per) => {
  if (per === "dia") {
    if (dentro(t, B(2).ini, aos(2, 3))) return { x: -1.5, z: 15.5, ry: 0, pose: "maosNaBoca", expr: "medo" };
    if (dentro(t, aos(2, 3), B(3).ini)) return { x: -1.5, z: 15.5, ry: 0, pose: "parado", expr: "mudo", cab: { x: 0.15 } };
    return { x: -1.5, z: 15.5, ry: 0.4, pose: "parado", expr: "feliz" };
  }
  if (tarde(per)) return { x: -15.6, z: 6.6, ry: virarPara(-15.6, 6.6, MESA), pose: "parado", tPose: congelado(t), expr: t >= B(15).ini ? "surpreso" : "feliz" };
  return { vis: false };
});

// vizinhos que se cumprimentam sem falar (bloco 4)
for (const [z, ry] of [[6.3, Math.PI], [4.3, 0]]) {
  const v = morador();
  ator(v, (t, per) => (per === "dia" ? { x: 30.9, z, ry, pose: dentro(t, B(4).ini, aos(4, 2)) ? "acenar" : "parado", expr: "feliz" } : { vis: false }));
}

// pipoqueiro, cliente e o carrinho
const pipoca = carrinhoPipoca();
pipoca.position.set(-4.6, CHAO, 14.6);
pipoca.rotation.y = 0.35;
cena.add(pipoca);
const pipoqueiro = morador({ acessorio: "bone", corAcessorio: "#c8302c", camisa: "#f4f1e8", roupa: { avental: "#c8302c" }, expressao: "riso" });
ator(pipoqueiro, (t, per) => (presente(per) ? { x: -6.3, z: 13.9, ry: tarde(per) ? virarPara(-6.3, 13.9, MESA) : 0.6, pose: tarde(per) ? "parado" : "conversar", tPose: congelado(t), expr: t >= B(15).ini && tarde(per) ? "surpreso" : "riso" } : { vis: false }));
const cliente = morador({ expressao: "riso" });
ator(cliente, (t, per) => (presente(per) ? { x: -4.0, z: 16.4, ry: tarde(per) ? virarPara(-4.0, 16.4, MESA) : Math.PI + 0.3, pose: "parado", tPose: congelado(t), expr: "feliz" } : { vis: false }));

// duas crianças correndo (no canteiro de dia; em volta do coreto no entardecer)
for (const [i, a0] of [[0, 0], [1, 0.75]].entries()) {
  const c = morador({ expressao: i === 0 ? "riso" : "determinado" });
  c.grupo.scale.setScalar(0.78);
  ator(c, (t, per) => {
    if (!presente(per)) return { vis: false };
    const tt = congelado(t);
    if (per === "dia") {
      const a = a0 + 0.85 * tt;
      return { x: -13.5 + Math.sin(a) * 5.9, z: 13.5 + Math.cos(a) * 5.9, ry: a + Math.PI / 2, pose: "correr", tPose: tt, expr: i === 0 ? "riso" : "determinado" };
    }
    const a = -1.19 - 0.85 * B(15).ini - i * 0.6 + 0.85 * tt; // congelam do lado da mesa, seja qual for o tempo
    const parado = tt !== t;
    return { x: Math.sin(a) * 7.5, z: Math.cos(a) * 7.5, ry: a + Math.PI / 2, pose: "correr", tPose: tt, expr: parado ? "surpreso" : i === 0 ? "riso" : "determinado" };
  });
}

// outros moradores: de dia conversando/lendo; no entardecer em volta da mesa; em 1958 assistindo o menino
const outros = [
  { dia: [-2.6, -13.6, 0.9, "conversar"], tarde: [-16.0, 4.6] },
  { dia: [-1.1, -12.7, -2.2, "parado"], tarde: [-15.6, 1.2] },
  { dia: [12.4, -3.2, 2.9, "conversar"], tarde: [-8.8, 0.8] },
  { dia: [12.2, -4.9, 0.1, "parado"], tarde: [-9.0, -0.6] },
  { dia: [bancos[0].x, bancos[0].z, bancos[0].ry, "sentado"], tarde: [-13.2, -0.9] },
  { dia: [bancos[3].x, bancos[3].z, bancos[3].ry, "sentado"], tarde: [-11.0, -1.4] },
  { dia: [-6.0, -19.6, Math.PI / 2, "parado"], tarde: [-8.0, 4.4] },
  { dia: [-6.3, -18.7, Math.PI / 2, "parado"], tarde: [-7.6, 5.5], crianca: true },
];
const PLATEIA = []; // lugares em 1958, em arco na frente do coreto
for (let i = 0; i < 10; i++) {
  const a = -0.75 + (i / 9) * 1.5, r = 9 + (i % 3) * 1.2;
  PLATEIA.push([Math.sin(a) * r, Math.cos(a) * r]);
}
outros.forEach((o, i) => {
  const m = morador({ expressao: "feliz" });
  if (o.crianca) m.grupo.scale.setScalar(0.72);
  ator(m, (t, per) => {
    if (per === "dia") {
      const [x, z, ry, pose] = o.dia;
      if (i === 6 || i === 7) return { x: -9 + 1.1 * t + (i === 7 ? -0.2 : 0), z: o.dia[1], ry: Math.PI / 2, pose: "andar", tPose: t + i * 0.3, expr: "feliz", vis: t < 26 };
      return { x, z, ry, pose, expr: "feliz" };
    }
    if (tarde(per)) {
      const [x, z] = o.tarde;
      return { x, z, ry: virarPara(x, z, MESA), pose: "parado", tPose: congelado(t), expr: t >= B(15).ini ? (i % 2 ? "surpreso" : "espanto") : "feliz" };
    }
    if (per === "sepia") {
      const [x, z] = PLATEIA[i];
      return { x, z, ry: virarPara(x, z, V(0, 0, 0)), pose: "parado", expr: t < B(19).ini ? (i % 3 ? "feliz" : "riso") : "surpreso" };
    }
    return { vis: false };
  });
});
// mais dois só para a plateia de 1958
for (let i = 8; i < 10; i++) {
  const m = morador({ expressao: "feliz" });
  ator(m, (t, per) => {
    if (per !== "sepia") return { vis: false };
    const [x, z] = PLATEIA[i];
    return { x, z, ry: virarPara(x, z, V(0, 0, 0)), pose: "parado", expr: t < B(19).ini ? "riso" : "surpreso" };
  });
}

// o menino Zeca em 1958, em cima do coreto
const menino = criarBoneco({
  pele: "#b57a50", camisa: "#f2efe6", roupa: { botoes: "#c9c2b4" }, calca: "#6b5a45", canela: "#b57a50", sapato: "#3a2a20",
  acessorio: "palha", expressao: "riso", fase: 9,
});
menino.grupo.scale.setScalar(0.78);
const Y_CORETO = 1.55;
ator(menino, (t, per) => {
  if (per !== "sepia") return { vis: false };
  if (t < B(19).ini) return { x: 0, y: Y_CORETO, z: 2.6, ry: 0, pose: "conversar", expr: falando(t, "riso", "fala", 8) };
  return { x: 0, y: Y_CORETO, z: 2.6, ry: 0, pose: "maosNaBoca", expr: "medo" };
});

// o primeiro risco do Juca no banco (aparece quando ele risca)
const fx = Math.cos(BANCO_FIM.ry), fz = -Math.sin(BANCO_FIM.ry);
const PONTO_RISCO = V(BANCO_FIM.x + fx * 1.0, CHAO + 0.435, BANCO_FIM.z + fz * 1.0);
const risco = placaPlana(0.3, 0.3, 400, (ctx, W, H) => {
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(250,246,236,0.95)";
  ctx.lineCap = "round";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(W * 0.5, H * 0.18);
  ctx.lineTo(W * 0.47, H * 0.82);
  ctx.stroke();
});
risco.rotation.x = -Math.PI / 2;
risco.rotation.z = BANCO_FIM.ry;
risco.position.copy(PONTO_RISCO);
risco.material.polygonOffset = true;
risco.material.polygonOffsetFactor = -4;
cena.add(risco);


motor.aCadaQuadro((t, per) => {
  for (const p of pombos) {
    p.grupo.visible = presente(per);
    p.pose(congelado(t));
  }
  risco.visible = t >= aos(21, 2) + 1.2;
});

// ---------- planos de câmera (1 a 2 s cada, sempre andando devagar) ----------
const PL = V(lei.x + 0.255 * Math.sin(lei.ry), 1.2, lei.z + 0.255 * Math.cos(lei.ry)); // centro da placa de bronze
const fL = V(Math.sin(lei.ry), 0, Math.cos(lei.ry)), lL = V(Math.cos(lei.ry), 0, -Math.sin(lei.ry));
const naLei = (frente, lado, y) => PL.clone().addScaledVector(fL, frente).addScaledVector(lL, lado).setY(y);
const naPlacaLei = (lado, y) => PL.clone().addScaledVector(lL, lado).setY(y);
const fBc = V(Math.sin(BC.ry), 0, Math.cos(BC.ry)), lBc = V(fBc.z, 0, -fBc.x);
const naCida = (f, l, y) => V(BC.x, y, BC.z).addScaledVector(fBc, f).addScaledVector(lBc, l);
const J = V(-19.0, 0, -0.03), uJ = V(0.88, 0, 0.474), pJ = V(-0.474, 0, 0.88); // Juca atrás da árvore
const naJuca = (u, p, y) => J.clone().addScaledVector(uJ, u).addScaledVector(pJ, p).setY(y);
const fFim = V(Math.sin(BANCO_FIM.ry), 0, Math.cos(BANCO_FIM.ry)), lFim = V(fFim.z, 0, -fFim.x);
const noBanco = (f, l, y) => V(BANCO_FIM.x, y, BANCO_FIM.z).addScaledVector(fFim, f).addScaledVector(lFim, l);
const RELOGIO = V(-7.1, 14.55, -32.14);

motor.definirPlanos([
  // 1 — a regra
  { ini: aos(1), fov: 50, sombra: 78, raios: true, de: V(54, 33, 60), para: V(45, 28, 51), olharDe: V(0, 3, 0), olharPara: V(0, 3.5, 0) },
  { ini: aos(1, 4), fov: 50, sombra: 16, de: V(18.83, 1.7, 27.0), para: V(18.62, 1.65, 26.43), olharDe: V(16.22, 1.55, 19.86), olharPara: V(16.22, 1.5, 19.86) },
  // 2 — susto e esparadrapo
  { ini: aos(2), fov: 40, sombra: 12, de: V(-1.1, 2.0, 20.0), para: V(-1.2, 2.0, 19.4), olharDe: V(-1.5, 2.05, 15.5), olharPara: V(-1.5, 2.05, 15.5) },
  { ini: aos(2, 3), fov: 38, sombra: 12, de: V(-1.25, 2.15, 19.0), para: V(-1.3, 2.12, 18.5), olharDe: V(-1.5, 2.15, 15.5), olharPara: V(-1.5, 2.15, 15.5) },
  // 3 — a placa da lei
  { ini: aos(3), fov: 55, sombra: 16, de: V(-3.6, 0.9, 12.8), para: V(-3.3, 0.95, 12.1), olharDe: V(-1.4, 3.6, 2), olharPara: V(-1.4, 3.7, 2) },
  { ini: aos(3, 4), fov: 42, sombra: 10, de: naLei(3.6, 0, 1.35), para: naLei(3.2, 0, 1.32), olharDe: naPlacaLei(0, 1.22), olharPara: naPlacaLei(0, 1.22) },
  { ini: aos(3, 7), fov: 42, sombra: 10, de: naLei(2.9, 0, 1.1), para: naLei(2.6, 0, 1.08), olharDe: naPlacaLei(0, 1.0), olharPara: naPlacaLei(0, 1.0) },
  // 4 — bom-dia sem falar e o pão apontado
  { ini: aos(4), fov: 48, sombra: 14, de: V(25.4, 2.0, 5.4), para: V(25.9, 2.0, 5.3), olharDe: V(31.0, 1.9, 5.3), olharPara: V(31.0, 1.9, 5.3) },
  { ini: aos(4, 2), fov: 46, sombra: 14, de: V(22.6, 2.3, -0.25), para: V(23.2, 2.25, -0.25), olharDe: V(30.0, 1.9, -0.25), olharPara: V(30.0, 1.9, -0.25) },
  // 5 — fofoca e o giz no muro
  { ini: aos(5), fov: 44, sombra: 12, de: naCida(3.4, 1.5, 1.45), para: naCida(3.1, 1.1, 1.42), olharDe: V(BC.x, 1.35, BC.z), olharPara: V(BC.x, 1.38, BC.z) },
  { ini: aos(5, 4), fov: 50, sombra: 18, de: V(6.0, 1.3, -24.2), para: V(6.3, 1.4, -25.0), olharDe: V(6.65, 2.1, -32.57), olharPara: V(6.65, 2.15, -32.57) },
  // 6 — o Juca que fala demais
  { ini: aos(6), fov: 40, sombra: 12, de: V(3.6, 2.3, 13.8), para: V(3.4, 2.28, 13.3), olharDe: V(2.5, 2.2, 10.1), olharPara: V(2.5, 2.2, 10.1) },
  { ini: aos(6, 5), fov: 44, sombra: 12, de: V(1.6, 2.0, 16.4), para: V(1.6, 2.0, 15.8), olharDe: V(1.6, 1.8, 10.4), olharPara: V(1.6, 1.8, 10.4) },
  // 7 — mudo três vezes
  { ini: aos(7), fov: 42, sombra: 12, de: V(3.05, 1.75, 14.2), para: V(2.95, 1.75, 13.7), olharDe: V(2.5, 1.4, 10.1), olharPara: V(2.5, 1.4, 10.1) },
  // 8 — o dominó
  { ini: aos(8), fov: 52, sombra: 14, de: V(-11.5, 2.4, 9.0), para: V(-11.2, 2.35, 8.4), olharDe: V(-11.5, 1.3, 3.5), olharPara: V(-11.5, 1.3, 3.5) },
  { ini: aos(8, 5), fov: 40, sombra: 10, de: V(-10.3, 2.3, 5.4), para: V(-10.6, 2.25, 5.0), olharDe: V(-12.85, 2.05, 3.5), olharPara: V(-12.85, 2.05, 3.5) },
  // 9 — noite: ele risca a mesa
  { ini: aos(9), fov: 52, sombra: 22, de: V(-3.5, 8.5, 13.5), para: V(-4.3, 7.8, 12.4), olharDe: V(-11.5, 1.0, 3.5), olharPara: V(-11.5, 1.0, 3.5) },
  { ini: aos(9, 5), fov: 46, sombra: 10, de: V(-10.0, 2.2, 6.2), para: V(-10.3, 2.15, 5.8), olharDe: V(-12.3, 1.4, 3.5), olharPara: V(-12.3, 1.4, 3.5) },
  // 10 — risc, risc, risc
  { ini: aos(10), fov: 40, sombra: 8, de: V(-11.3, 1.45, 2.2), para: V(-11.4, 1.38, 2.35), olharDe: V(-11.95, 1.05, 2.85), olharPara: V(-11.95, 1.05, 2.85) },
  { ini: aos(10, 1), fov: 38, sombra: 8, de: V(-12.2, 1.95, 2.25), para: V(-12.15, 1.85, 2.35), olharDe: V(-11.95, 1.05, 2.85), olharPara: V(-11.95, 1.05, 2.85) },
  { ini: aos(10, 2), fov: 40, sombra: 8, de: naJuca(4.0, 1.6, 2.1), para: naJuca(3.8, 1.5, 2.08), olharDe: naJuca(0.3, -0.2, 2.0), olharPara: naJuca(0.3, -0.2, 2.0) },
  // 11 — ele estava guardando
  { ini: aos(11), fov: 44, sombra: 10, de: naJuca(3.0, 1.2, 1.9), para: naJuca(2.7, 1.1, 1.9), olharDe: naJuca(0, 0, 1.9), olharPara: naJuca(0, 0, 1.95) },
  { ini: aos(11, 3), fov: 38, sombra: 8, de: naJuca(3.4, 0.6, 2.2), para: naJuca(3.2, 0.55, 2.2), olharDe: naJuca(0, 0, 2.25), olharPara: naJuca(0, 0, 2.25) },
  { ini: aos(11, 7), fov: 45, sombra: 8, de: V(-11.3, 2.4, 3.2), para: V(-11.35, 2.2, 3.3), olharDe: V(-11.5, 1.03, 3.5), olharPara: V(-11.5, 1.03, 3.5) },
  // 12 — a brecha da regra
  { ini: aos(12), fov: 40, sombra: 10, de: naLei(3.2, -0.3, 1.2), para: naLei(3.0, 0.2, 1.18), olharDe: naPlacaLei(-0.1, 1.0), olharPara: naPlacaLei(0.1, 1.0) },
  { ini: aos(12, 6), fov: 40, sombra: 10, de: naLei(2.9, 0, 1.0), para: naLei(2.6, 0, 0.92), olharDe: naPlacaLei(0, 0.82), olharPara: naPlacaLei(0, 0.78) },
  // 13 — quarenta anos de risquinhos
  { ini: aos(13), fov: 50, sombra: 14, de: V(-8.5, 13, 9.5), para: V(-9.5, 11, 8.0), olharDe: V(-11.5, 0.2, 3.5), olharPara: V(-11.5, 0.2, 3.5) },
  { ini: aos(13, 4), fov: 44, sombra: 8, de: V(-9.9, 1.95, 3.5), para: V(-10.1, 1.85, 3.5), olharDe: V(-11.98, 1.04, 3.5), olharPara: V(-11.98, 1.04, 3.5) },
  // 14 — entardecer: a pergunta
  { ini: aos(14), fov: 50, sombra: 18, de: V(-6.0, 6.5, 11.5), para: V(-6.6, 6.0, 10.8), olharDe: V(-10.6, 1.4, 3.8), olharPara: V(-10.6, 1.4, 3.8) },
  { ini: aos(14, 5), fov: 38, sombra: 10, de: V(-13.9, 2.9, 1.9), para: V(-13.7, 2.85, 2.1), olharDe: V(-9.6, 2.25, 3.5), olharPara: V(-9.6, 2.25, 3.5) },
  { ini: aos(14, 7), fov: 38, sombra: 10, de: V(-8.6, 2.9, 5.0), para: V(-8.8, 2.85, 4.8), olharDe: V(-12.85, 2.05, 3.5), olharPara: V(-12.85, 2.05, 3.5) },
  // 15 — a praça congela
  { ini: aos(15), fov: 56, sombra: 22, de: V(-3.0, 7.5, 12.5), para: V(-3.4, 7.2, 12.0), olharDe: V(-10.0, 1.0, 4.0), olharPara: V(-10.0, 1.0, 4.0) },
  // 16 — ele abriu a boca
  { ini: aos(16), fov: 42, sombra: 10, de: V(-10.4, 1.5, 4.7), para: V(-10.7, 1.55, 4.4), olharDe: V(-12.85, 2.15, 3.5), olharPara: V(-12.85, 2.15, 3.5) },
  // 17 — "Fui eu."
  { ini: aos(17), fov: 34, sombra: 8, de: V(-10.9, 2.05, 4.1), para: V(-11.0, 2.03, 4.0), olharDe: V(-12.85, 2.0, 3.5), olharPara: V(-12.85, 2.0, 3.5) },
  // 18 e 19 — 1958, em sépia
  { ini: aos(18), fov: 50, sombra: 22, de: V(0.5, 2.6, 17.5), para: V(0.3, 2.8, 16.5), olharDe: V(0, 2.6, 2), olharPara: V(0, 2.7, 2) },
  { ini: aos(18, 2), fov: 40, sombra: 10, de: V(0.6, 3.3, 5.8), para: V(0.5, 3.3, 5.3), olharDe: V(0, 3.1, 2.6), olharPara: V(0, 3.1, 2.6) },
  { ini: aos(19), fov: 38, sombra: 10, de: V(0.4, 3.3, 5.2), para: V(0.35, 3.28, 4.9), olharDe: V(0, 3.15, 2.6), olharPara: V(0, 3.15, 2.6) },
  { ini: aos(19, 5), fov: 36, sombra: 30, de: V(-7.0, 12.5, -24.2), para: V(-7.05, 13.0, -25.4), olharDe: RELOGIO, olharPara: RELOGIO },
  // 20 — o silêncio e o olhar
  { ini: aos(20), fov: 40, sombra: 10, de: V(-10.0, 2.2, 5.0), para: V(-10.2, 2.18, 4.8), olharDe: V(-12.85, 2.05, 3.5), olharPara: V(-12.85, 2.05, 3.5) },
  { ini: aos(20, 3), fov: 54, sombra: 14, de: V(-11.2, 6.0, 11.0), para: V(-11.2, 5.7, 10.5), olharDe: V(-11.2, 1.4, 3.5), olharPara: V(-11.2, 1.4, 3.5) },
  { ini: aos(20, 5), fov: 34, sombra: 10, de: V(-9.3, 2.3, 3.5), para: V(-9.6, 2.25, 3.5), olharDe: V(-12.85, 2.12, 3.5), olharPara: V(-12.85, 2.12, 3.5) },
  // 21 — o Juca com medo e, à noite, no banco
  { ini: aos(21), fov: 40, sombra: 10, de: V(-12.8, 2.6, 2.2), para: V(-12.6, 2.55, 2.35), olharDe: V(-9.6, 2.25, 3.5), olharPara: V(-9.6, 2.25, 3.5) },
  { ini: aos(21, 2), fov: 44, sombra: 12, de: noBanco(4.4, 1.9, 2.0), para: noBanco(4.0, 1.5, 1.9), olharDe: V(BANCO_FIM.x, 1.5, BANCO_FIM.z), olharPara: V(BANCO_FIM.x, 1.5, BANCO_FIM.z) },
  // 22 — noventa e nove
  { ini: aos(22), fov: 40, sombra: 8, de: PONTO_RISCO.clone().addScaledVector(fFim, 0.9).setY(1.3), para: PONTO_RISCO.clone().addScaledVector(fFim, 0.6).setY(1.05), olharDe: PONTO_RISCO, olharPara: PONTO_RISCO },
  { ini: aos(22, 3), fov: 50, sombra: 40, de: V(3.0, 4.5, 15), para: V(2.0, 14, 25), olharDe: V(2, 1.2, 4), olharPara: V(0, 1.0, 2) },
]);

motor.iniciar();
