// Sons do vídeo "Binance": efeitos do SFX Kit nas palavras, com trilha própria baixa (feita em código).
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const KIT = path.resolve('../../_ferramentas/sfx-kit/sounds');
const DIR = { whoosh: 'whooshes', riser: 'risers-and-fallers', boom: 'booms-and-bass', impact: 'impacts', cinematic: 'cinematic-hits', pop: 'pops', money: 'money', time: 'time',
  notification: 'notifications', props: 'everyday-props', transform: 'shape-changes', move: 'bounce-spin-zoom', shimmer: 'shimmers', swipe: 'swipes', bass: 'booms-and-bass',
  appear: 'appear-and-vanish', mechanical: 'mechanical', sting: 'logo-stings', phone: 'phone', foley: 'foley', writing: 'writing-and-drawing', celebration: 'celebration', reverse: 'reverse-whooshes', faller: 'risers-and-fallers' };
const cache = {};
const kit = (nome) => cache[nome] || (cache[nome] = (() => { const b = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(KIT, DIR[nome.split('-')[0]], nome + '.wav'), '-f', 'f32le', '-ac', '1', '-ar', '44100', '-'], { maxBuffer: 1 << 26 }); return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4)).slice(); })());
export const config = { duracao: 63.8, narracao: 'audio/narracao.mp3', trilha: { bpm: 104, acordes: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]], tensao: { de: ['relaxa', 9], ate: ['congelam', 10] }, acordeFinal: [57, 60, 64], volume: -21 } };
export function deixas({ W, B, poe }) {
  const S = (n, t, g = 0.5, sync = 0) => poe(n, Math.max(0, t - sync), g, kit(n));
  const P = (txt, bl) => W(txt, bl);
  // cortes de lugar
  [B(2), B(3), B(6), B(7), B(8), B(9), B(10), B(11), B(12)].forEach((t) => S('whoosh-fast-hard', t, 0.45, 0.09));
  // cortes internos de ângulo (mais leves)
  [1.75, P('hackers', 2), P('cofre', 2), P('rh', 3), P('ceo', 3), P('emprego', 4) + 0.6, P('roda', 6), P('luzinha', 6), P('computador', 7) + 1.2, P('maquina', 7), P('seis', 8), P('dez', 8), P('relaxa', 9), P('congela', 9), P('cofre', 11), P('gelo', 12)]
    .forEach((t) => S('swipe-medium-firm', t, 0.22, 0.05));
  // 1 — gancho
  S('boom-hit-strong', 0.04, 0.5); S('props-page-turn', P('teste', 1), 0.35);
  S('mechanical-ratchet-heavy', P('abre', 1) - 0.5, 0.45); S('mechanical-latch-heavy', P('abre', 1) + 0.1, 0.5);
  S('shimmer-medium-bright', P('abre', 1) + 0.3, 0.4); S('pop-large-in', P('seis', 1), 0.5); S('money-register', P('bilhoes', 1), 0.5);
  // 2 — a maior corretora
  S('riser-1s-soft', P('hackers', 2), 0.25, 0.98); S('impact-medium-hard', P('hackers', 2), 0.4);
  S('mechanical-lock-heavy', P('cofre', 2), 0.45); S('pop-large-in', P('cofre', 2), 0.45); S('notification-alert-soft', P('internet', 2), 0.3);
  // 3 — a empresa falsa
  S('pop-large-in', P('falsa', 3), 0.45); S('props-shop-bell', P('rh', 3), 0.35); S('appear-poof', P('ceo', 3), 0.5); S('pop-large-in', P('ceo', 3), 0.45);
  // 4 — a piada do comparsa
  S('foley-paper-touch', P('ri', 4), 0.4); S('notification-failure-wobble', P('estagiario', 4) + 0.1, 0.45); S('impact-medium-soft', P('estagiario', 4) + 0.4, 0.45);
  // 5 — o chefe só sorri (respiro curto)
  S('shimmer-short-soft', P('sorri', 5), 0.35);
  // 6 — a tarefa
  S('notification-message-in-clear', P('tarefa', 6), 0.45); S('phone-keypad', P('roda', 6), 0.3); S('foley-card-touch', P('roda', 6), 0.4);
  S('notification-error-soft', P('luzinha', 6), 0.45); S('bass-808-short', P('luzinha', 6), 0.4);
  // 7 — de computador em computador
  [0, 0.65, 1.3, 1.95, 2.6, 3.25].forEach((d, i) => S('pop-large-in', B(7) + 0.3 + d, 0.22 + i * 0.03));
  S('riser-2s-soft', P('maquina', 7), 0.3, 1.99); S('cinematic-metal-big', P('maquina', 7), 0.4);
  [0, 0.52, 1.04].forEach((d) => S('mechanical-shutter-heavy', P('assina', 7) + d, 0.35));
  // 8 — o roubo: 20 minutos, 10 blockchains
  S('bass-rumble-medium', B(8), 0.45); S('time-clock-fast', B(8) + 0.2, 0.35); S('time-alarm', P('noite', 8), 0.22);
  S('pop-large-in', P('vinte', 8), 0.45); S('cinematic-slam-big', P('seis', 8), 0.5); S('money-coins-pour', P('seis', 8), 0.55);
  S('money-coins-pour', P('saem', 8), 0.45); S('pop-large-in', P('dez', 8), 0.45); S('boom-drop-medium', P('blockchains', 8), 0.45);
  // 9 — o deboche
  S('money-coin-stack', B(9), 0.45); S('money-coins-pour', B(9) + 0.2, 0.35); S('foley-fabric-slide', P('relaxa', 9), 0.3);
  // 10 — o congelamento (virada)
  S('reverse-whoosh-short-soft', P('congelam', 10), 0.45, 0.34); S('transform-morph', P('congelam', 10), 0.45);
  S('cinematic-thunder-big', P('congelam', 10), 0.45); S('shimmer-long-sparkle', P('congelam', 10) + 0.2, 0.35);
  S('transform-shrink', P('congelam', 10) + 1.8, 0.4); S('pop-large-in', P('quase', 10), 0.4);
  // 11 — a revelação
  S('bass-sub-drop-medium', B(11), 0.4); S('mechanical-lock-heavy', P('arrombaram', 11), 0.4); S('pop-large-in', P('arrombaram', 11), 0.4);
  [0, 0.52, 1.04].forEach((d) => S('mechanical-shutter-heavy', P('assinar', 11) - 0.4 + d, 0.35)); S('foley-paper-slide', P('assinar', 11), 0.35);
  // 12 — o fecho: vira gelo
  S('foley-fabric-touch', B(12), 0.3); S('pop-large-in', P('dois', 12), 0.45); S('transform-fill', P('dois', 12), 0.35);
  S('cinematic-slam-massive', P('gelo', 12), 0.5); S('foley-glass-touch', P('gelo', 12) + 0.1, 0.45); S('notification-failure-knock', P('riu', 12) + 0.4, 0.35);
  // cartão final
  S('whoosh-medium-hard', 62.1, 0.5, 0.2); S('sting-bright-short', 62.3, 0.55);
}
