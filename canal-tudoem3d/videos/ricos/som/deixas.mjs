// Sons do vídeo "Como os ricos ganham dinheiro": efeitos do SFX Kit nas palavras, com trilha própria baixa (feita em código).
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const KIT = path.resolve('../../_ferramentas/sfx-kit/sounds');
const DIR = { whoosh: 'whooshes', riser: 'risers-and-fallers', boom: 'booms-and-bass', impact: 'impacts', cinematic: 'cinematic-hits', pop: 'pops', money: 'money', time: 'time',
  notification: 'notifications', props: 'everyday-props', transform: 'shape-changes', move: 'bounce-spin-zoom', shimmer: 'shimmers', swipe: 'swipes', bass: 'booms-and-bass',
  appear: 'appear-and-vanish', mechanical: 'mechanical', sting: 'logo-stings', phone: 'phone', foley: 'foley', writing: 'writing-and-drawing', celebration: 'celebration', reverse: 'reverse-whooshes', faller: 'risers-and-fallers' };
const cache = {};
const kit = (nome) => cache[nome] || (cache[nome] = (() => { const b = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(KIT, DIR[nome.split('-')[0]], nome + '.wav'), '-f', 'f32le', '-ac', '1', '-ar', '44100', '-'], { maxBuffer: 1 << 26 }); return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4)).slice(); })());
export const config = { duracao: 63.4, narracao: 'audio/narracao.mp3', trilha: { bpm: 100, acordes: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], tensao: { de: ['empréstimo', 8], ate: ['três', 9] }, acordeFinal: [60, 64, 67], volume: -21 } };
export function deixas({ W, B, poe }) {
  const S = (n, t, g = 0.5, sync = 0) => poe(n, Math.max(0, t - sync), g, kit(n));
  const P = (txt, bl) => W(txt, bl);
  [B(3), B(4), B(5), B(6), B(7), B(9), B(10), B(11), B(12)].forEach((t) => S('whoosh-fast-hard', t, 0.45, 0.09));
  [2.2, B(2), P('dono', 2), P('ações', 2), P('um', 3), P('ganho', 3), P('sobem', 4), P('fortuna', 4), P('vende', 5), P('como', 6), P('banco', 7), P('ações', 7), B(8), P('sobe', 8), P('vendida', 8) + 0.4, P('três', 9), P('enriqueceram', 9), P('isento', 10), P('cinquenta', 10), P('mas', 11), P('dono', 11), P('ação', 12), P('sócio', 12)]
    .forEach((t) => S('swipe-medium-firm', t, 0.2, 0.05));
  // 1
  S('boom-hit-strong', 0.04, 0.5); S('props-page-turn', P('real', 1) - 0.1, 0.45); S('money-register', P('real', 1), 0.5); S('money-coin-spin', P('rico', 1), 0.4);
  // 2
  S('pop-large-in', P('dono', 2), 0.45); S('appear-flip-quick', P('empresas', 2), 0.35); S('pop-large-in', P('ações', 2), 0.45);
  // 3
  S('props-shop-bell', B(3) + 0.1, 0.3); S('pop-large-in', P('ganho', 3), 0.4); S('foley-paper-touch', P('ganho', 3), 0.4);
  // 4
  S('riser-2s-soft', P('bilhões', 4), 0.3, 1.99); S('money-coins-pour', P('bilhões', 4), 0.55); S('cinematic-slam-big', P('bilhões', 4), 0.45); S('celebration-confetti', P('bilhões', 4) + 0.2, 0.25);
  // 5
  S('mechanical-lock-heavy', P('vende', 5) + 0.5, 0.5); S('pop-large-in', P('nunca', 5), 0.4);
  // 6
  S('shimmer-medium-bright', P('como', 6), 0.4); S('boom-drop-soft', P('iate', 6), 0.4);
  // 7
  S('foley-paper-slide', P('empréstimo', 7), 0.45); S('money-notes', P('banco', 7) + 0.2, 0.5); S('money-coin-stack', P('ações', 7), 0.4); S('pop-large-in', P('garantia', 7), 0.45);
  // 8
  S('cinematic-metal-big', P('renda', 8), 0.45); S('impact-heavy-hard', P('renda', 8), 0.4); S('pop-large-in', P('imposto', 8), 0.45);
  // 9
  S('transform-grow', B(9), 0.4); S('pop-large-in', P('vinte', 9), 0.4); S('pop-large-in', P('ricos', 9), 0.4);
  S('cinematic-slam-massive', P('três', 9), 0.5); S('notification-failure-thud', P('três', 9) + 0.3, 0.4);
  // 10
  S('appear-burst', B(10), 0.35); S('pop-large-in', P('isento', 10), 0.4); S('appear-flip-slow', P('agora', 10), 0.5); S('impact-medium-hard', P('agora', 10) + 0.5, 0.4); S('pop-large-in', P('cinquenta', 10), 0.4);
  // 11
  S('riser-1s-soft', P('dono', 11), 0.3, 0.98); S('cinematic-drum-big', P('dono', 11), 0.5); S('shimmer-short-bright', P('dono', 11) + 0.1, 0.4);
  // 12
  S('foley-fabric-touch', B(12), 0.3); S('notification-success-chime', P('ação', 12), 0.45); S('celebration-confetti', P('sócio', 12), 0.4);
  S('pop-large-in', P('sócio', 12), 0.45); S('foley-glass-touch', P('sócio', 12) + 0.6, 0.45); S('props-splash', P('sócio', 12) + 0.7, 0.4);
  S('whoosh-medium-hard', 61.7, 0.5, 0.2); S('sting-bright-short', 61.9, 0.55);
}
