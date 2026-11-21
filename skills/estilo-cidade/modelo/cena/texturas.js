// Texturas desenhadas em código (nada baixado, nada pago).
// Tudo usa sorteio com semente: a cidade sai igual em todo render.
import * as THREE from "three";

export function sorteio(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tela(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")];
}

function virarTextura(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 8;
  return t;
}

// mistura uma cor hex com variação de brilho
function variar(hex, rnd, forca = 0.12) {
  const c = new THREE.Color(hex);
  const d = (rnd() - 0.5) * 2 * forca;
  c.offsetHSL(0, 0, d);
  return "#" + c.getHexString();
}

function pintas(ctx, w, h, rnd, qtd, cor, tMin, tMax, alfa) {
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.fillStyle = cor;
  for (let i = 0; i < qtd; i++) {
    const r = tMin + rnd() * (tMax - tMin);
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const cache = new Map();
function guardar(chave, fazer) {
  if (!cache.has(chave)) cache.set(chave, fazer());
  return cache.get(chave);
}

// Calçada de pedra portuguesa com ondas (preto e branco)
export function texPedraPortuguesa() {
  return guardar("pedra", () => {
    const N = 1024, [c, ctx] = tela(N, N), rnd = sorteio(11);
    ctx.fillStyle = "#8d877c";
    ctx.fillRect(0, 0, N, N);
    const passo = 14;
    for (let y = 0; y < N; y += passo) {
      for (let x = 0; x < N; x += passo) {
        const cx = x + passo / 2, cy = y + passo / 2;
        const onda = (cy + 70 * Math.sin((2 * Math.PI * cx) / 512)) / 256;
        const preta = ((onda % 1) + 1) % 1 < 0.42;
        const base = preta ? "#3d3a38" : "#ece5d6";
        ctx.fillStyle = variar(base, rnd, preta ? 0.05 : 0.06);
        const j = () => (rnd() - 0.5) * 3;
        ctx.beginPath();
        ctx.moveTo(x + 1.5 + j(), y + 1.5 + j());
        ctx.lineTo(x + passo - 1.5 + j(), y + 1.5 + j());
        ctx.lineTo(x + passo - 1.5 + j(), y + passo - 1.5 + j());
        ctx.lineTo(x + 1.5 + j(), y + passo - 1.5 + j());
        ctx.closePath();
        ctx.fill();
      }
    }
    pintas(ctx, N, N, rnd, 900, "#000", 1, 4, 0.05);
    return c;
  });
}

// Paralelepípedo da rua
export function texParalelepipedo() {
  return guardar("rua", () => {
    const W = 512, H = 512, [c, ctx] = tela(W, H), rnd = sorteio(22);
    ctx.fillStyle = "#3c3732";
    ctx.fillRect(0, 0, W, H);
    const bw = 64, bh = 32;
    for (let row = 0; row < H / bh; row++) {
      const off = (row % 2) * (bw / 2);
      for (let col = -1; col < W / bw + 1; col++) {
        const x = col * bw + off, y = row * bh;
        ctx.fillStyle = variar(["#8a8178", "#7d756c", "#958b7f", "#6f6962"][Math.floor(rnd() * 4)], rnd, 0.05);
        const r = 7;
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, bw - 6, bh - 6, r);
        ctx.fill();
        // brilho em cima, sombra embaixo
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        ctx.fillRect(x + 6, y + 5, bw - 12, 4);
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(x + 6, y + bh - 9, bw - 12, 4);
      }
    }
    pintas(ctx, W, H, rnd, 500, "#000", 1, 3, 0.08);
    return c;
  });
}

// Calçada lisa (lajotas claras)
export function texCalcada() {
  return guardar("calcada", () => {
    const N = 256, [c, ctx] = tela(N, N), rnd = sorteio(33);
    ctx.fillStyle = "#a59c8e";
    ctx.fillRect(0, 0, N, N);
    const p = 64;
    for (let y = 0; y < N; y += p)
      for (let x = 0; x < N; x += p) {
        ctx.fillStyle = variar("#d8cfbf", rnd, 0.04);
        ctx.fillRect(x + 2, y + 2, p - 4, p - 4);
      }
    pintas(ctx, N, N, rnd, 300, "#5a5248", 0.5, 2, 0.12);
    return c;
  });
}

// Tijolo à vista
export function texTijolo() {
  return guardar("tijolo", () => {
    const N = 512, [c, ctx] = tela(N, N), rnd = sorteio(44);
    ctx.fillStyle = "#d9cbb5";
    ctx.fillRect(0, 0, N, N);
    const bw = 64, bh = 24;
    for (let row = 0; row < N / bh + 1; row++) {
      const off = (row % 2) * (bw / 2);
      for (let col = -1; col < N / bw + 1; col++) {
        ctx.fillStyle = variar(["#b2533a", "#a4482f", "#bd6044", "#9b4a36"][Math.floor(rnd() * 4)], rnd, 0.05);
        ctx.fillRect(col * bw + off + 2, row * bh + 2, bw - 4, bh - 4);
      }
    }
    pintas(ctx, N, N, rnd, 600, "#3a1a10", 1, 2.5, 0.1);
    return c;
  });
}

// Telha colonial (capa e canal)
export function texTelha() {
  return guardar("telha", () => {
    const W = 512, H = 512, [c, ctx] = tela(W, H), rnd = sorteio(55);
    ctx.fillStyle = "#6e2e1a";
    ctx.fillRect(0, 0, W, H);
    const tw = 32, th = 64;
    for (let row = 0; row < H / th; row++) {
      const off = (row % 2) * (tw / 2);
      for (let col = -1; col < W / tw + 1; col++) {
        const x = col * tw + off, y = row * th;
        const base = new THREE.Color(variar(["#c0613a", "#b5552f", "#c96d43", "#a94e2c"][Math.floor(rnd() * 4)], rnd, 0.05));
        const g = ctx.createLinearGradient(x, 0, x + tw, 0);
        const esc = base.clone().offsetHSL(0, 0, -0.16), cla = base.clone().offsetHSL(0, 0, 0.1);
        g.addColorStop(0, "#" + esc.getHexString());
        g.addColorStop(0.45, "#" + cla.getHexString());
        g.addColorStop(1, "#" + esc.getHexString());
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(x + 1, y, tw - 2, th - 4, [0, 0, 14, 14]);
        ctx.fill();
      }
      // sombra da fileira de cima
      ctx.fillStyle = "rgba(40,10,0,0.35)";
      ctx.fillRect(0, row * th, W, 6);
    }
    pintas(ctx, W, H, rnd, 400, "#2a1208", 1, 3, 0.1);
    return c;
  });
}

// Reboco pintado (fachada), com sujeira leve embaixo
export function texReboco(cor) {
  return guardar("reboco" + cor, () => {
    const N = 256, [c, ctx] = tela(N, N), rnd = sorteio(66);
    ctx.fillStyle = cor;
    ctx.fillRect(0, 0, N, N);
    pintas(ctx, N, N, rnd, 1400, "#ffffff", 0.5, 1.6, 0.07);
    pintas(ctx, N, N, rnd, 1400, "#000000", 0.5, 1.6, 0.05);
    pintas(ctx, N, N, rnd, 40, "#000000", 6, 20, 0.015);
    return c;
  });
}

export function texGrama() {
  return guardar("grama", () => {
    const N = 512, [c, ctx] = tela(N, N), rnd = sorteio(77);
    ctx.fillStyle = "#5c9a3a";
    ctx.fillRect(0, 0, N, N);
    pintas(ctx, N, N, rnd, 3000, "#7cb84a", 1, 3, 0.35);
    pintas(ctx, N, N, rnd, 3000, "#3f7a2a", 1, 3, 0.3);
    pintas(ctx, N, N, rnd, 60, "#2f6a22", 10, 30, 0.08);
    return c;
  });
}

export function texTerra() {
  return guardar("terra", () => {
    const N = 256, [c, ctx] = tela(N, N), rnd = sorteio(78);
    ctx.fillStyle = "#6b4a2e";
    ctx.fillRect(0, 0, N, N);
    pintas(ctx, N, N, rnd, 1200, "#8a6340", 1, 3, 0.4);
    pintas(ctx, N, N, rnd, 900, "#3e2a18", 1, 2.5, 0.4);
    return c;
  });
}

export function texMadeira(cor = "#8a5a34") {
  return guardar("madeira" + cor, () => {
    const W = 256, H = 256, [c, ctx] = tela(W, H), rnd = sorteio(88);
    ctx.fillStyle = cor;
    ctx.fillRect(0, 0, W, H);
    const tabuas = 4, tw = W / tabuas;
    for (let i = 0; i < tabuas; i++) {
      ctx.fillStyle = variar(cor, rnd, 0.06);
      ctx.fillRect(i * tw + 1, 0, tw - 2, H);
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 6; k++) {
        const x0 = i * tw + 6 + rnd() * (tw - 12);
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        for (let y = 0; y <= H; y += 16) ctx.lineTo(x0 + Math.sin(y / 30 + k) * 2.5, y);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(i * tw, 0, 2, H);
    }
    return c;
  });
}

// Toldo listrado
export function texToldo(cor1 = "#c8302c", cor2 = "#f6ecd8") {
  return guardar("toldo" + cor1 + cor2, () => {
    const W = 512, H = 128, [c, ctx] = tela(W, H);
    const n = 10;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? cor2 : cor1;
      ctx.fillRect((i * W) / n, 0, W / n, H);
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return c;
  });
}

// Veneziana (ripas horizontais)
export function texVeneziana(cor) {
  return guardar("venez" + cor, () => {
    const W = 128, H = 256, [c, ctx] = tela(W, H);
    ctx.fillStyle = cor;
    ctx.fillRect(0, 0, W, H);
    for (let y = 8; y < H - 8; y += 12) {
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(10, y + 8, W - 20, 3);
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(10, y, W - 20, 3);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    return c;
  });
}

// Céu: degradê do azul ao pêssego do fim de tarde
export function texCeu() {
  return guardar("ceu", () => {
    const [c, ctx] = tela(8, 512);
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#4f93dd");
    g.addColorStop(0.45, "#8cc2ef");
    g.addColorStop(0.75, "#f6d6b0");
    g.addColorStop(1, "#ffc78f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 512);
    return c;
  });
}

// ---------- placas com texto (redesenhadas quando as fontes chegam) ----------
const placas = [];

// desenhar(ctx, w, h) recebe o contexto e desenha a placa inteira
export function texPlaca(w, h, desenhar) {
  const [c, ctx] = tela(w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const item = { c, ctx, t, desenhar };
  placas.push(item);
  desenhar(ctx, w, h);
  return t;
}

export function redesenharPlacas() {
  for (const p of placas) {
    p.ctx.clearRect(0, 0, p.c.width, p.c.height);
    p.desenhar(p.ctx, p.c.width, p.c.height);
    p.t.needsUpdate = true;
  }
}

export function virar(c, rx, ry) {
  return virarTextura(c, rx, ry);
}
