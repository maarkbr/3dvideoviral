// Cenários do filme "O Salário que Já Chega Gasto": a cozinha da família (geometria estática, no Batch do mundo)
// e as três colunas de juros da praça (objetos próprios, crescem por quadro). Tudo com o sombreado em duas
// faixas do kit (lam/twoTone) e o traço preto do InkPass.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "./build";
import { twoTone } from "./shade";
import { D0, KX, KZ, PX, PZ } from "./story";

const tex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.name = key;
  return t;
};
// azulejo branco com rejunte e uma faixa verde-água (1 m = 1 repetição)
const azulejo = () => tex("azulejo", 512, 512, (g) => {
  g.fillStyle = "#9aa3a8"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const v = 236 + ((i * 7 + j * 3) % 5) * 3; g.fillStyle = j === 1 ? "#7cc7bd" : `rgb(${v},${v},${v - 4})`; g.fillRect(i * 128 + 3, j * 128 + 3, 122, 122);
  }
});
const reboco = () => tex("reboco", 512, 512, (g) => {
  g.fillStyle = "#e9c7a1"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 900; k++) { const x = (k * 97) % 512, y = (k * 233) % 512; g.fillStyle = k % 2 ? "rgba(255,240,220,.18)" : "rgba(160,110,70,.08)"; g.fillRect(x, y, 6, 3); }
});
const piso = () => tex("piso", 512, 512, (g) => {
  g.fillStyle = "#7c5a44"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? "#d9b48a" : "#cfa678"; g.fillRect(i * 256 + 4, j * 256 + 4, 248, 248); }
});
const madeira = () => tex("madeiraK", 512, 128, (g) => {
  g.fillStyle = "#a8724a"; g.fillRect(0, 0, 512, 128);
  for (let k = 0; k < 14; k++) { g.strokeStyle = k % 2 ? "rgba(70,40,20,.25)" : "rgba(255,220,180,.15)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 8 + k * 9); g.bezierCurveTo(170, 4 + k * 9, 340, 14 + k * 9, 512, 8 + k * 9); g.stroke(); }
});

/** a cozinha: chão, três paredes (a frente fica aberta para a câmera), janela, bancada, geladeira, mesa, cadeiras, lâmpada */
export const buildCozinha = (b: Batch, root: THREE.Object3D) => {
  const x0 = KX - 3, x1 = KX + 3, z0 = KZ - 2.5, z1 = KZ + 2.5, H = 2.8, y = D0;
  const M = {
    piso: lam("k_piso", () => ({ map: piso() })), azul: lam("k_azul", () => ({ map: azulejo() })), reboco: lam("k_reboco", () => ({ map: reboco() })),
    mad: lam("k_mad", () => ({ map: madeira() })), branco: lam("k_branco", () => ({ color: "#eef2f4" })), cinza: lam("k_cinza", () => ({ color: "#8f979e" })),
    armario: lam("k_armario", () => ({ color: "#8fbfae" })), escuro: lam("k_escuro", () => ({ color: "#3a3f47" })), vidro: lam("k_vidro", () => ({ color: "#bfe3f5" })),
    tampo: lam("k_tampo", () => ({ color: "#d8d2c4" })), cupula: lam("k_cupula", () => ({ color: "#2f6f62" })), cadeira: lam("k_cadeira", () => ({ color: "#c9603f" })),
  };
  // chão e rodapé
  b.add(boxGeo(V(x0, y - 0.05, z0), V(x1, y + 0.02, z1), 1), M.piso);
  // parede do fundo (z1): azulejo até 1,4 m, reboco acima
  b.add(boxGeo(V(x0, y, z1), V(x1, y + 1.4, z1 + 0.12), 1), M.azul);
  b.add(boxGeo(V(x0, y + 1.4, z1), V(x1, y + H, z1 + 0.12), 1.5), M.reboco);
  // parede direita da tela (x0) inteira; parede esquerda (x1) com janela
  b.add(boxGeo(V(x0 - 0.12, y, z0), V(x0, y + 1.4, z1), 1), M.azul);
  b.add(boxGeo(V(x0 - 0.12, y + 1.4, z0), V(x0, y + H, z1), 1.5), M.reboco);
  b.add(boxGeo(V(x1, y, z0), V(x1 + 0.12, y + 1.1, z1), 1), M.azul);
  b.add(boxGeo(V(x1, y + 2.3, z0), V(x1 + 0.12, y + H, z1), 1.5), M.reboco);
  b.add(boxGeo(V(x1, y + 1.1, z0), V(x1 + 0.12, y + 2.3, z0 + 1.2), 1.5), M.reboco);
  b.add(boxGeo(V(x1, y + 1.1, z0 + 2.9), V(x1 + 0.12, y + 2.3, z1), 1.5), M.reboco);
  b.add(boxGeo(V(x1 + 0.04, y + 1.1, z0 + 1.2), V(x1 + 0.08, y + 2.3, z0 + 2.9)), M.vidro);
  for (const zz of [z0 + 1.2, z0 + 2.05, z0 + 2.9]) b.add(boxGeo(V(x1 - 0.03, y + 1.08, zz - 0.04), V(x1 + 0.12, y + 2.32, zz + 0.04)), M.branco);
  b.add(boxGeo(V(x1 - 0.12, y + 1.04, z0 + 1.16), V(x1 + 0.12, y + 1.1, z0 + 2.94)), M.branco);
  // bancada no fundo, à direita da tela (x negativo): armários, tampo, pia, armário aéreo
  b.add(boxGeo(V(x0, y, z1 - 0.62), V(KX - 0.4, y + 0.86, z1)), M.armario);
  for (let xx = x0 + 0.6; xx < KX - 0.4; xx += 0.6) b.add(boxGeo(V(xx - 0.015, y + 0.08, z1 - 0.635), V(xx + 0.015, y + 0.8, z1 - 0.62)), M.escuro);
  b.add(boxGeo(V(x0, y + 0.86, z1 - 0.66), V(KX - 0.36, y + 0.92, z1)), M.tampo);
  b.add(boxGeo(V(KX - 1.9, y + 0.9, z1 - 0.5), V(KX - 1.2, y + 0.93, z1 - 0.12)), M.cinza);
  b.add(boxGeo(V(KX - 1.6, y + 0.92, z1 - 0.1), V(KX - 1.54, y + 1.25, z1 - 0.04)), M.cinza);
  b.add(boxGeo(V(x0, y + 1.75, z1 - 0.38), V(KX - 0.6, y + 2.45, z1)), M.armario);
  // geladeira (à esquerda da tela, x positivo)
  b.add(boxGeo(V(KX + 1.75, y, z1 - 0.75), V(KX + 2.55, y + 1.85, z1 - 0.05)), M.branco);
  b.add(boxGeo(V(KX + 1.74, y + 1.24, z1 - 0.76), V(KX + 2.56, y + 1.27, z1 - 0.06)), M.cinza);
  for (const [ya, yb] of [[1.4, 1.7], [0.6, 1.1]]) b.add(boxGeo(V(KX + 1.82, y + ya, z1 - 0.8), V(KX + 1.86, y + yb, z1 - 0.76)), M.cinza);
  // mesa e cadeiras
  const mx = KX - 0.3, mz = KZ + 0.4;
  b.add(boxGeo(V(mx - 0.75, y + 0.72, mz - 0.45), V(mx + 0.75, y + 0.78, mz + 0.45)), M.mad);
  for (const [dx, dz] of [[-0.68, -0.38], [0.68, -0.38], [-0.68, 0.38], [0.68, 0.38]]) b.add(boxGeo(V(mx + dx - 0.03, y, mz + dz - 0.03), V(mx + dx + 0.03, y + 0.72, mz + dz + 0.03)), M.mad);
  for (const [cx, cz] of [[mx, mz + 0.75], [mx + 1.0, mz + 0.2]]) {
    b.add(boxGeo(V(cx - 0.22, y + 0.44, cz - 0.22), V(cx + 0.22, y + 0.48, cz + 0.22)), M.cadeira);
    for (const [dx, dz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) b.add(boxGeo(V(cx + dx - 0.02, y, cz + dz - 0.02), V(cx + dx + 0.02, y + 0.44, cz + dz + 0.02)), M.escuro);
    b.add(boxGeo(V(cx - 0.22, y + 0.48, cz + 0.18), V(cx + 0.22, y + 0.95, cz + 0.22)), M.cadeira);
  }
  // fruteira e caneca na bancada
  b.add(boxGeo(V(KX - 2.6, y + 0.92, z1 - 0.45), V(KX - 2.2, y + 1.02, z1 - 0.15)), M.cupula);
  // lâmpada pendurada sobre a mesa: fio, cúpula e bulbo HDR (pega o bloom)
  b.add(boxGeo(V(mx - 0.01, y + 2.1, mz - 0.01), V(mx + 0.01, y + H, mz + 0.01)), M.escuro);
  const cup = new THREE.ConeGeometry(0.26, 0.22, 20, 1, true); b.add(cup, M.cupula, new THREE.Matrix4().makeTranslation(mx, y + 2.0, mz));
  const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(4.5, 3.6, 2.2), toneMapped: true }));
  bulbo.position.set(mx, y + 1.9, mz); root.add(bulbo);
};

/** as três colunas de juros (Selic 15, juro médio das famílias 64, rotativo 451,7) com base em PX, PZ */
export const VALORES = [15, 64, 451.7];
export const M_POR_PONTO = 0.04; // 15% -> 0,6 m; 451,7% -> 18 m
export const buildColunas = (root: THREE.Object3D) => {
  const cores = ["#5b7fd6", "#f0a03c", "#e2453c"];
  const base = lam("k_base", () => ({ color: "#d9d4c8" }));
  const chao = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 3.2), base); chao.position.set(PX, D0 + 0.06, PZ); chao.receiveShadow = true; root.add(chao);
  return cores.map((c, i) => {
    const g = new THREE.BoxGeometry(0.9, 1, 0.9); g.translate(0, 0.5, 0);
    const m = new THREE.Mesh(g, twoTone(new THREE.MeshLambertMaterial({ color: c })));
    m.position.set(PX + (i - 1) * 1.35, D0 + 0.12, PZ); m.castShadow = m.receiveShadow = true; m.scale.y = 0.001; root.add(m);
    return m;
  });
};
