// MOTOR DE SOM do modo animado (estilo-palitinho) — tudo feito em código (sem banco de sons, sem IA paga).
// Efeitos presos às palavras da narração + trilha + mixagem em -14 LUFS.
// Uso:  node <skill>/animado/scripts/som.mjs <pasta-do-video>
// O projeto precisa de: audio/palavras.json, a narração e som/deixas.mjs (a lista de sons do vídeo).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const PASTA = path.resolve(process.argv[2] || '.');
process.chdir(PASTA);
const VIDEO = await import(pathToFileURL(path.join(PASTA, 'som', 'deixas.mjs')).href);
const CFG = VIDEO.config;

const SR = 44100, DUR = CFG.duracao, N = Math.round(SR * DUR);
const PAL = JSON.parse(fs.readFileSync('audio/palavras.json', 'utf8'));
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]/g, '');
const W = (txt, bloco) => {
  const p = PAL.find((w) => (!bloco || w.bloco === bloco) && norm(w.texto) === norm(txt));
  if (!p) throw new Error('palavra não achada: ' + txt);
  return p.inicio;
};
const B = (b) => PAL.find((w) => w.bloco === b).inicio;

let semente = 20251117;
const rnd = () => { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; };
const ruido = () => rnd() * 2 - 1;
const TAU = Math.PI * 2;
const hz = (nota) => 440 * Math.pow(2, (nota - 69) / 12); // MIDI -> Hz

// ---------------- ferramentas ----------------
const vazio = (seg) => new Float32Array(Math.round(seg * SR));
function somar(dest, t, sinal, ganho = 1) {
  const i0 = Math.round(t * SR);
  for (let i = 0; i < sinal.length; i++) { const j = i0 + i; if (j >= 0 && j < dest.length) dest[j] += sinal[i] * ganho; }
}
function filtro(x, tipo, fFn, q = 0.707) {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, b0, b1, b2, a1, a2;
  const coef = (f) => {
    f = Math.min(Math.max(f, 20), SR * 0.45);
    const w = TAU * f / SR, c = Math.cos(w), a = Math.sin(w) / (2 * q);
    let n0, n1, n2; const d0 = 1 + a;
    if (tipo === 'lp') { n0 = (1 - c) / 2; n1 = 1 - c; n2 = (1 - c) / 2; }
    else if (tipo === 'hp') { n0 = (1 + c) / 2; n1 = -(1 + c); n2 = (1 + c) / 2; }
    else { n0 = a; n1 = 0; n2 = -a; }
    b0 = n0 / d0; b1 = n1 / d0; b2 = n2 / d0; a1 = -2 * c / d0; a2 = (1 - a) / d0;
  };
  const fixo = typeof fFn === 'number';
  coef(fixo ? fFn : fFn(0));
  for (let i = 0; i < x.length; i++) {
    if (!fixo && i % 32 === 0) coef(fFn(i / SR));
    const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}
const env = (t, ataque, queda) => (t < ataque ? t / ataque : Math.exp(-(t - ataque) / queda));
const sino = (t, dur) => Math.sin(Math.PI * Math.min(1, Math.max(0, t / dur)));
function gerar(seg, fn) { const s = vazio(seg); for (let i = 0; i < s.length; i++) s[i] = fn(i / SR, i); return s; }

// ---------------- efeitos ----------------
const efeito = {
  pop() { // objeto entrando
    let fase = 0;
    const s = gerar(0.16, (t) => { const f = 260 + 900 * (1 - Math.exp(-t / 0.018)); fase += TAU * f / SR; return Math.sin(fase) * env(t, 0.002, 0.04); });
    const clique = filtro(gerar(0.01, () => ruido()), 'hp', 2500);
    somar(s, 0, clique, 0.35);
    return s;
  },
  saida() { // objeto saindo: assobio curto descendo
    let fase = 0;
    return gerar(0.18, (t) => { const f = 900 - 2400 * t; fase += TAU * f / SR; return Math.sin(fase) * sino(t, 0.18) * 0.35; });
  },
  whoosh(dur = 0.45, f0 = 350, f1 = 2600) {
    const r = gerar(dur, () => ruido());
    const y = filtro(r, 'bp', (t) => f0 + (f1 - f0) * (t / dur), 1.4);
    for (let i = 0; i < y.length; i++) y[i] *= sino(i / SR, dur) * 1.6;
    return y;
  },
  tranca() { // trinco de metal + porta de enrolar
    const s = gerar(1.1, (t) => {
      let v = 0;
      [[523, 0.12], [1307, 0.09], [2213, 0.06], [3510, 0.04], [4870, 0.03]].forEach(([f, d], k) => { v += Math.sin(TAU * f * t + k) * env(t, 0.001, d) * (0.5 / (k + 1)); });
      v += Math.sin(TAU * (90 - 30 * t) * t) * env(t, 0.002, 0.12) * 0.8;
      return v;
    });
    const rolo = filtro(gerar(0.9, (t) => ruido() * (0.5 + 0.5 * Math.sin(TAU * 38 * t)) * sino(t, 0.9)), 'bp', 900, 0.9);
    somar(s, 0.06, rolo, 0.35);
    return s;
  },
  tique(alto) { return filtro(gerar(0.03, (t) => ruido() * env(t, 0.0005, 0.004)), 'bp', alto ? 3200 : 2000, 3); },
  dong() { // badalada da meia-noite
    const p = [[0.5, 0.5, 2.6], [1, 1, 2.0], [1.19, 0.5, 1.2], [1.56, 0.35, 1.0], [2, 0.4, 0.9], [2.51, 0.25, 0.6], [2.66, 0.2, 0.5], [3.01, 0.15, 0.4], [4.1, 0.1, 0.25]];
    return gerar(3.0, (t) => p.reduce((v, [r, a, d]) => v + Math.sin(TAU * 196 * r * t) * a * env(t, 0.003, d), 0) * 0.45);
  },
  zumbido(dur = 2.2) { // geladeira ligada
    return gerar(dur, (t) => {
      const am = 0.8 + 0.2 * Math.sin(TAU * 3 * t);
      return (Math.sin(TAU * 60 * t) + 0.5 * Math.sin(TAU * 120 * t) + 0.25 * Math.sin(TAU * 180 * t) + 0.12 * Math.sin(TAU * 240 * t)) * am * Math.min(1, t / 0.15) * Math.min(1, (dur - t) / 0.5) * 0.35;
    });
  },
  ding() {
    return gerar(1.0, (t) => [1568, 2093, 2637].reduce((v, f, k) => v + (t > k * 0.05 ? Math.sin(TAU * f * (t - k * 0.05)) * env(t - k * 0.05, 0.002, 0.25) : 0), 0) * 0.3);
  },
  rangido(dur = 1.15) { // porta rangendo: impulsos de atrito em ressonância
    const imp = vazio(dur);
    let t = 0;
    while (t < dur) {
      const per = 0.0045 + 0.004 * (0.5 + 0.5 * Math.sin(TAU * 1.3 * t)) + rnd() * 0.0012;
      const i = Math.round(t * SR); if (i < imp.length) imp[i] = (0.6 + rnd() * 0.4) * sino(t, dur);
      t += per;
    }
    const a = filtro(imp, 'bp', (tt) => 620 + 260 * Math.sin(TAU * 0.9 * tt), 9);
    const b = filtro(imp, 'bp', (tt) => 1450 + 400 * Math.sin(TAU * 0.7 * tt + 1), 7);
    const y = new Float32Array(a.length);
    for (let i = 0; i < y.length; i++) y[i] = (a[i] * 1.0 + b[i] * 0.6) * 6;
    return y;
  },
  sustoForte() { // "!" : pancada de orquestra + tímpano
    let f1 = 0;
    const s = gerar(1.6, (t) => {
      let v = 0;
      [33, 45, 52, 57, 60].forEach((n) => { const f = hz(n); v += ((t * f) % 1 - 0.5) * 0.35; });
      f1 += TAU * (110 * Math.exp(-t * 2.2) + 50) / SR;
      return v * env(t, 0.004, 0.32) + Math.sin(f1) * env(t, 0.002, 0.5) * 1.1;
    });
    const y = filtro(s, 'lp', (t) => 4000 * Math.exp(-t * 3) + 300, 0.8);
    somar(y, 0, filtro(gerar(0.2, (t) => ruido() * env(t, 0.001, 0.05)), 'lp', 3000), 0.5);
    return y;
  },
  passo() {
    let fase = 0;
    const s = gerar(0.22, (t) => { fase += TAU * (85 * Math.exp(-t * 9) + 45) / SR; return Math.sin(fase) * env(t, 0.002, 0.06); });
    somar(s, 0, filtro(gerar(0.04, (t) => ruido() * env(t, 0.0008, 0.012)), 'bp', 1300, 1.2), 0.6);
    return s;
  },
  clique() {
    const s = vazio(0.12);
    [0, 0.05].forEach((d, k) => somar(s, d, filtro(gerar(0.012, (t) => ruido() * env(t, 0.0004, 0.003)), 'bp', k ? 2600 : 3400, 2), 1));
    return s;
  },
  plim() { return gerar(0.5, (t) => Math.sin(TAU * 2349 * t) * env(t, 0.002, 0.12) * 0.25 + Math.sin(TAU * 3136 * t) * env(t, 0.002, 0.08) * 0.15); },
  boing() {
    let fase = 0;
    return gerar(0.5, (t) => { const f = 180 + 140 * Math.exp(-t * 6) * Math.cos(TAU * 9 * t); fase += TAU * f / SR; return Math.sin(fase) * env(t, 0.004, 0.18) * 0.7; });
  },
};

// ---------------- trilha (lá menor, 100 bpm) ----------------
const BPM = CFG.trilha.bpm || 100, BEAT = 60 / BPM, BAR = BEAT * 4;
const ACORDES = CFG.trilha.acordes;
function nota(f, dur, tipo) {
  if (tipo === 'pluck') return gerar(dur, (t) => (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * 2 * f * t) + 0.12 * Math.sin(TAU * 3 * f * t)) * env(t, 0.003, 0.13));
  if (tipo === 'baixo') {
    const s = gerar(dur, (t) => (Math.sin(TAU * f * t) * 0.9 + (((t * f) % 1) - 0.5) * 0.25) * env(t, 0.006, 0.38));
    return filtro(s, 'lp', 600);
  }
  // pad: três dentes de serra levemente desafinados, ataque lento
  const s = gerar(dur, (t) => {
    let v = 0;
    [-0.004, 0, 0.0045].forEach((d) => { v += ((t * f * (1 + d)) % 1) - 0.5; });
    return v * Math.min(1, t / 0.9) * Math.min(1, (dur - t) / 1.0) * 0.3;
  });
  return filtro(s, 'lp', 1100, 0.6);
}
const musica = new Float32Array(N);
const TEN = CFG.trilha.tensao;
const T_TENSAO = TEN ? W(...TEN.de) : DUR + 1, T_SEG = TEN ? W(...TEN.ate) : DUR + 1, T_FIM = DUR - 0.6;
const tocando = (t) => t < T_TENSAO - 0.05 || (t > T_SEG + 0.5 && t < T_FIM);
for (let c = 0; c * BAR * 2 < DUR; c++) {
  const t0 = c * BAR * 2, acorde = ACORDES[c % 4];
  // pad (fica também na tensão, mais escuro)
  acorde.forEach((n) => somar(musica, t0, nota(hz(n - 12), BAR * 2 + 1.0, 'pad'), 0.18));
  for (let k = 0; k < 16; k++) { // colcheias de pizzicato
    const t = t0 + k * BEAT / 2;
    if (!tocando(t)) continue;
    const ordem = [0, 1, 2, 1, 2, 0, 1, 2][k % 8];
    const oit = k % 8 === 4 ? 12 : 0;
    somar(musica, t, nota(hz(acorde[ordem] + 12 + oit), 0.5, 'pluck'), k % 4 === 0 ? 0.22 : 0.14);
  }
  for (let k = 0; k < 4; k++) { // baixo nos tempos 1 e 3
    const t = t0 + k * BEAT * 2;
    if (!tocando(t)) continue;
    somar(musica, t, nota(hz(acorde[0] - 24), 0.9, 'baixo'), 0.45);
  }
}
// tensão: coração acelerando + subida até o fim do suspense
if (TEN) for (let t = T_TENSAO + 0.3, bpm = 74; t < T_SEG - 0.1; t += 60 / bpm, bpm += 6) {
  [0, 0.16].forEach((d, k) => { let fase = 0; somar(musica, t + d, gerar(0.25, (tt) => { fase += TAU * (62 - 15 * tt) / SR; return Math.sin(fase) * env(tt, 0.004, 0.07); }), k ? 0.55 : 0.8); });
}
if (TEN) {
  const dur = T_SEG - T_TENSAO;
  const sub = filtro(gerar(dur, (t) => ruido() * Math.pow(t / dur, 2.2)), 'bp', (t) => 300 + 2500 * Math.pow(t / dur, 2), 1.2);
  somar(musica, T_TENSAO, sub, 0.5);
}
// acorde final
(CFG.trilha.acordeFinal || ACORDES[0]).forEach((n) => somar(musica, T_FIM - 1.2, nota(hz(n - 12), 2.4, 'pad'), 0.22));

// ---------------- efeitos nas palavras (o som do objeto começa na palavra) ----------------
const fx = new Float32Array(N);
const marcas = [];
const poe = (nome, t, ganho, sinal) => { somar(fx, t, sinal, ganho); marcas.push([t, nome]); };
VIDEO.deixas({ W, B, poe, efeito, DUR });

// ---------------- narração ----------------
const bruto = execFileSync('ffmpeg', ['-v', 'error', '-i', CFG.narracao, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
const voz = new Float32Array(N);
const lida = new Float32Array(bruto.buffer, bruto.byteOffset, Math.floor(bruto.length / 4));
voz.set(lida.subarray(0, Math.min(N, lida.length)));

// abaixa a trilha enquanto a voz fala
const janela = Math.round(0.02 * SR);
let nivel = 0;
const duck = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const ini = Math.max(0, i - janela);
  if (i % 64 === 0) { let s = 0; for (let k = ini; k < i; k += 4) s += voz[k] * voz[k]; nivel = Math.sqrt(s / Math.max(1, (i - ini) / 4)); }
  duck[i] = nivel;
}
let g = 1;
for (let i = 0; i < N; i++) {
  const alvo = duck[i] > 0.02 ? 0.45 : 1;
  g += (alvo - g) * (alvo < g ? 1 / (0.03 * SR) : 1 / (0.35 * SR));
  musica[i] *= g;
}

// ---------------- mixagem ----------------
const rms = (x) => { let s = 0, n = 0; for (let i = 0; i < x.length; i += 8) { if (Math.abs(x[i]) > 1e-4) { s += x[i] * x[i]; n++; } } return Math.sqrt(s / Math.max(1, n)); };
const rVoz = rms(voz), rMus = rms(musica);
const gMus = (rVoz / rMus) * Math.pow(10, (CFG.trilha.volume ?? -16) / 20);
const pico = fx.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const vozPico = voz.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const gFx = (vozPico / pico) * 0.6;
const mix = new Float32Array(N);
for (let i = 0; i < N; i++) mix[i] = voz[i] + musica[i] * gMus + fx[i] * gFx;
// fade final
for (let i = 0; i < N; i++) { const t = i / SR; if (t > DUR - 0.5) mix[i] *= Math.max(0, (DUR - t) / 0.5); }

function wav(caminho, x) {
  const b = Buffer.alloc(44 + x.length * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + x.length * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(3, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(32, 34); b.write('data', 36); b.writeUInt32LE(x.length * 4, 40);
  for (let i = 0; i < x.length; i++) b.writeFloatLE(x[i], 44 + i * 4);
  fs.writeFileSync(caminho, b);
}
fs.mkdirSync('audio/partes', { recursive: true });
wav('audio/partes/mix-bruto.wav', mix);
wav('audio/partes/trilha.wav', musica.map((v) => v * gMus));
wav('audio/partes/efeitos.wav', fx.map((v) => v * gFx));

// volume final: mede a loudness integrada e ajusta para -14 LUFS (sem limitador; o pico fica com folga)
const medir = (arq) => {
  // sem 'sh -c' (não existe no Windows): o ebur128 escreve no stderr
  const out = spawnSync('ffmpeg', ['-hide_banner', '-i', arq, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }).stderr;
  const resumo = out.slice(out.lastIndexOf('Summary'));
  return { I: parseFloat(resumo.match(/I:\s+(-?[\d.]+)/)[1]), pico: parseFloat(resumo.match(/Peak:\s+(-?[\d.]+)/)[1]) };
};
// ganho até -14 LUFS e limitador em -1,5 dBTP; repete uma vez porque o limitador tira um pouquinho
let ganho = -14 - medir('audio/partes/mix-bruto.wav').I, depois;
for (let k = 0; k < 3; k++) {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', 'audio/partes/mix-bruto.wav', '-af',
    `volume=${ganho.toFixed(2)}dB,alimiter=limit=0.83:attack=3:release=60:level=false`, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', 'audio/mix.wav']);
  depois = medir('audio/mix.wav');
  if (Math.abs(depois.I + 14) < 0.15) break;
  ganho += -14 - depois.I;
}
console.log(`mix final: ${depois.I} LUFS, pico ${depois.pico} dBTP`);
fs.writeFileSync('audio/partes/marcas.json', JSON.stringify(marcas.map(([t, n]) => ({ t: +t.toFixed(3), som: n })), null, 1));
console.log('efeitos colocados:', marcas.length, '| arquivo: audio/mix.wav');
