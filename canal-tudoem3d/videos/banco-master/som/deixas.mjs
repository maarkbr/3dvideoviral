// Sons do vídeo "Banco Master": efeitos do SFX Kit nas palavras, SEM trilha (a música entra pelo app).
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const KIT = path.resolve('../../_ferramentas/sfx-kit/sounds');
const DIR = { whoosh: 'whooshes', riser: 'risers-and-fallers', boom: 'booms-and-bass', impact: 'impacts', cinematic: 'cinematic-hits', pop: 'pops', money: 'money', time: 'time',
  notification: 'notifications', props: 'everyday-props', transform: 'shape-changes', move: 'bounce-spin-zoom', shimmer: 'shimmers', swipe: 'swipes', bass: 'booms-and-bass',
  appear: 'appear-and-vanish', mechanical: 'mechanical', sting: 'logo-stings', phone: 'phone', foley: 'foley', writing: 'writing-and-drawing', celebration: 'celebration', reverse: 'reverse-whooshes', faller: 'risers-and-fallers' };
const cache = {};
const kit = (nome) => cache[nome] || (cache[nome] = (() => { const b = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(KIT, DIR[nome.split('-')[0]], nome + '.wav'), '-f', 'f32le', '-ac', '1', '-ar', '44100', '-'], { maxBuffer: 1 << 26 }); return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4)).slice(); })());
export const config = { duracao: 112.1, narracao: 'audio/narracao.mp3', trilha: { bpm: 100, acordes: [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]], tensao: null, acordeFinal: [57, 60, 64], volume: -90 } };
export function deixas({ W, B, poe }) {
  const S = (n, t, g = 0.5, sync = 0) => poe(n, Math.max(0, t - sync), g, kit(n));
  const P = (txt, bl) => W(txt, bl);
  // cortes
  [P('banco', 1) + 0.38, B(2), B(4), B(6), B(7), B(8), P('vendeu', 8), 80.42, B(10), P('Na', 10), B(11), P('Vorcaro', 11), B(12)].forEach((t) => S('whoosh-fast-hard', t, 0.5, 0.09));
  // 1
  S('boom-hit-strong', 0.05, 0.6); S('riser-1s-soft', P('12', 1), 0.3, 0.98);
  S('pop-large-in', P('12', 1), 0.5); S('props-page-turn', P('empréstimos', 1), 0.5);
  [0, 0.1, 0.2, 0.3].forEach((d) => S('impact-medium-hard', P('nunca', 1) + d, 0.4));
  S('pop-large-in', 6.78, 0.45);
  // 2
  S('money-coins-pour', B(2), 0.5); S('pop-large-in', B(2), 0.45); S('pop-large-in', P('milhão', 2), 0.45);
  S('time-clock-fast', P('mil', 2), 0.45); S('pop-large-in', P('mil', 2), 0.45);
  // 3
  S('pop-large-in', P('fica', 3), 0.45); S('whoosh-medium-soft', P('celular', 3), 0.45, 0.2); S('phone-vibrate-hand', P('celular', 3) + 0.3, 0.45);
  S('pop-large-in', P('1', 3), 0.45); S('phone-vibrate-hand', P('Talvez', 3), 0.5);
  // 4
  S('swipe-medium-firm', P('Daniel', 4), 0.5); S('impact-heavy-hard', P('Daniel', 4) + 0.3, 0.5); S('money-notes', P('dinheiro', 4), 0.5); S('money-coin-drop', P('rendimento.', 4), 0.5);
  // 5
  S('whoosh-medium-medium', B(5), 0.4, 0.2); S('riser-1s-soft', P('100%', 5) + 0.98, 0.3, 0.98); S('impact-medium-hard', P('100%', 5) + 0.6, 0.45);
  S('writing-marker-draw', P('régua', 5), 0.4); S('riser-1s-strong', P('140.', 5), 0.35, 0.6); S('money-register', P('140.', 5) + 0.6, 0.55);
  // 6
  S('mechanical-lock-heavy', P('garantido', 6), 0.5); S('notification-success-chime', P('FGC.', 6), 0.45);
  S('pop-large-in', P('seguro.', 6), 0.45); S('impact-deep-hard', P('quebra,', 6), 0.6);
  S('mechanical-ratchet-heavy', P('até', 6) - 0.6, 0.5); S('cinematic-metal-big', P('até', 6) + 0.2, 0.45); S('money-coins-pour', P('250', 6), 0.5);
  // 7
  S('money-coins-pour', B(7), 0.55); S('money-notes', P('dinheiro', 7), 0.55); S('celebration-confetti', P('dinheiro', 7) + 0.3, 0.3);
  S('pop-large-in', P('promete', 7), 0.45); S('pop-large-in', P('ganhar', 7), 0.45); S('notification-failure-thud', P('Master', 7), 0.5);
  S('boom-drop-medium', P('parte', 7), 0.55);
  // 8
  S('impact-heavy-hard', B(8), 0.5);
  [0, 0.13, 0.26, 0.39, 0.52].forEach((d) => S('props-page-turn', P('fabricou', 8) + 0.5 + d, 0.3));
  [0, 0.1, 0.2, 0.3, 0.4].forEach((d) => S('impact-medium-hard', P('nunca', 8) + d, 0.38));
  S('bass-rumble-short', P('vendeu', 8), 0.45); [0, 0.4, 0.8].forEach((d) => S('impact-medium-soft', P('vendeu', 8) + 1.3 + d, 0.4));
  S('pop-large-in', P('BRB,', 8), 0.45); S('appear-flip-slow', P('caixa', 8), 0.45); S('reverse-whoosh-short-soft', P('existem.', 8), 0.45, 0.34);
  // 9
  S('money-register', P('12', 9), 0.5); S('pop-large-in', P('tentou', 9), 0.45); S('cinematic-slam-big', P('não.', 9), 0.6);
  // 10
  S('bass-rumble-medium', B(10), 0.45); S('time-alarm', P('Vorcaro', 10), 0.35); S('impact-deep-hard', P('preso', 10), 0.55);
  S('mechanical-shutter-heavy', P('fecha', 10), 0.55); S('impact-heavy-hard', P('fecha', 10) + 0.1, 0.5);
  // 11
  S('transform-empty', B(11), 0.5); S('faller-2s-strong', P('50', 11) - 0.2, 0.4); S('pop-large-in', P('50', 11), 0.45);
  S('cinematic-slam-massive', P('indiciado', 11), 0.5); S('notification-failure-wobble', P('nega', 11), 0.45);
  // 12
  S('riser-2s-soft', 102.06, 0.35, 1.99); S('phone-vibrate-hand', 102.06, 0.5);
  S('pop-large-in', P('presente.', 12), 0.5); S('appear-burst', 106.92, 0.55); S('time-alarm', 107.74, 0.35); S('boom-hit-strong', 107.74, 0.55);
  // cartão final
  S('whoosh-medium-hard', 110.1, 0.55, 0.2); S('sting-bright-short', 110.2, 0.6);
}
