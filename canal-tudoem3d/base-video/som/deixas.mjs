// Lista de sons do vídeo "Lavagem de dinheiro": cada efeito começa na palavra que o chama.
// Efeitos do SFX Kit (CC0) da pasta de trabalho + pops do motor.  Gerar: node <skill>/animado/scripts/som.mjs <pasta>
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const KIT = path.resolve('../../_ferramentas/sfx-kit/sounds');
const cache = {};
const kit = (nome) => {
  if (cache[nome]) return cache[nome];
  const dir = { whoosh: 'whooshes', riser: 'risers-and-fallers', boom: 'booms-and-bass', impact: 'impacts', cinematic: 'cinematic-hits', pop: 'pops', money: 'money', time: 'time',
    notification: 'notifications', props: 'everyday-props', transform: 'shape-changes', move: 'bounce-spin-zoom', shimmer: 'shimmers', swipe: 'swipes', bass: 'booms-and-bass', appear: 'appear-and-vanish', mechanical: 'mechanical', sting: 'logo-stings' }[nome.split('-')[0]];
  const b = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(KIT, dir, nome + '.wav'), '-f', 'f32le', '-ac', '1', '-ar', '44100', '-'], { maxBuffer: 1 << 26 });
  return (cache[nome] = new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4)).slice());
};

export const config = {
  duracao: 82.8,
  narracao: 'audio/narracao.mp3',
  trilha: {
    bpm: 108,
    acordes: [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]],
    tensao: { de: ['sensor.', 6], ate: ['Coaf.', 6] },
    acordeFinal: [57, 60, 64],
    volume: -19,
  },
};

export function deixas({ W, B, poe, efeito }) {
  const S = (nome, t, g = 0.5, sync = 0) => poe(nome, Math.max(0, t - sync), g, kit(nome));
  const n = (txt, bloco, k = 0) => { // k-ésima ocorrência da palavra no bloco
    let t = W(txt, bloco); if (k === 0) return t;
    return t; };
  // 1 — voo e LAVA JATO
  S('whoosh-slow-hard', 0.05, 0.55);
  S('riser-2s-soft', W('Lava', 1), 0.35, 1.98);
  S('boom-hit-medium', W('Lava', 1), 0.7);
  S('pop-large-in', W('Lava', 1), 0.5);
  // cortes
  for (const tc of [B(2), B(3), B(4), B(5), W('banco', 6), B(7), B(8)]) S('whoosh-fast-hard', tc, 0.55, 0.09);
  // 2 — banco
  S('pop-medium-in', W('banco', 2), 0.45);
  S('money-notes', W('dinheiro', 2), 0.6);
  S('pop-large-bubble', W('proibido', 2), 0.5);
  S('notification-attention-soft', W('proibido', 2) + 0.1, 0.35);
  // 3 — Al Capone
  S('impact-heavy-hard', W('mito.', 3), 0.75);
  S('pop-medium-in', W('Al', 3), 0.45);
  S('props-page-turn', W('jornais', 3), 0.6);
  S('pop-large-in', W('1973,', 3), 0.5);
  S('cinematic-slam-big', W('preso', 3), 0.6);
  S('pop-large-in', W('sonegar', 3), 0.45);
  // 4 — a máquina e o molho
  S('boom-hit-soft', B(4) + 0.05, 0.6);
  S('pop-large-in', W('três', 4), 0.5);
  S('transform-fill', W('Molho.', 4), 0.6);
  S('pop-large-in', W('Molho.', 4), 0.45);
  [0.5, 1.1, 1.9, 2.6, 3.4, 4.3].forEach((d, i) => S(i % 2 ? 'pop-small-bubble' : 'pop-medium-bubble', W('Molho.', 4) + d, 0.3));
  S('props-splash', W('sujo', 4), 0.5);
  S('props-splash', W('limpo,', 4), 0.4);
  S('money-register', W('vivo.', 4), 0.55);
  // 5 — centrifugação, secagem
  S('move-spin', B(5), 0.6);
  S('bass-rumble-medium', B(5) + 0.4, 0.55);
  S('pop-large-in', B(5), 0.4);
  S('swipe-fast-firm', W('conta', 5), 0.5);
  S('swipe-fast-firm', W('empresa', 5), 0.5);
  S('notification-failure-wobble', W('ninguém', 5), 0.45);
  S('transform-empty', W('Secagem.', 5), 0.6);
  S('pop-large-in', W('Secagem.', 5), 0.4);
  S('shimmer-medium-sparkle', W('limpinho.', 5), 0.55);
  S('pop-medium-in', W('imóvel,', 5), 0.5);
  S('pop-medium-in', W('carro,', 5), 0.5);
  S('money-coin-drop', 49.58, 0.5);
  S('pop-medium-in', 49.58, 0.5);
  // 6 — sensor, 24 horas, COAF
  S('impact-deep-hard', W('sensor.', 6), 0.6);
  S('time-alarm', W('sensor.', 6) + 0.05, 0.45);
  S('bass-rumble-short', W('estranho,', 6), 0.55);
  S('time-clock-fast', W('24', 6), 0.5);
  S('pop-large-in', W('24', 6), 0.45);
  S('notification-alert-clear', W('Coaf.', 6), 0.45);
  S('pop-large-bubble', W('proíbe', 6), 0.5);
  // 7 — 2014, posto, lava jato
  S('boom-hit-medium', W('2014,', 7), 0.6);
  S('pop-large-in', W('2014,', 7), 0.45);
  S('whoosh-medium-medium', W('investigação', 7), 0.5, 0.2);
  S('money-coins-pour', W('doleiros', 7), 0.5);
  S('pop-large-in', W('Brasília.', 7), 0.45);
  S('props-splash', W('lava', 7), 0.5);
  [0.3, 0.8, 1.4, 2.0].forEach((d) => S('pop-small-bubble', W('lava', 7) + d, 0.3));
  S('money-notes', W('dinheiro', 7), 0.55);
  S('boom-hit-strong', 71.74, 0.6);
  S('pop-large-in', 71.74, 0.5);
  // 8 — pena e a mancha
  S('cinematic-slam-massive', B(8), 0.55);
  S('impact-heavy-hard', W('três', 8), 0.6);
  S('props-drip', W('mancha,', 8), 0.6);
  S('impact-deep-soft', W('mancha,', 8), 0.55);
  S('move-spin', W('nenhum', 8), 0.5);
  S('notification-error-clear', W('tira.', 8), 0.45);
  S('boom-drop-soft', W('tira.', 8) + 0.3, 0.6);
  // cartão final
  S('whoosh-medium-hard', 80.8, 0.55, 0.2);
  S('sting-bright-short', 80.9, 0.6);
}
