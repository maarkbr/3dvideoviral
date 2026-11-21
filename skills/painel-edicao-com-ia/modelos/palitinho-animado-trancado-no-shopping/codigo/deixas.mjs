// Lista de sons deste vídeo: cada efeito começa na palavra que o chama.
// Rodar:  node <skill>/animado/scripts/som.mjs <pasta-do-video>

export const config = {
  duracao: 43.6,                                  // igual ao data-duration do index.html
  narracao: 'audio/narracao-shopping-v2.mp3',
  trilha: {
    bpm: 100,
    acordes: [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]], // Lá menor, Fá, Ré menor, Mi (notas MIDI)
    tensao: { de: ['passos'], ate: ['segurança', 6] },                  // trecho de suspense (sem pizzicato)
    acordeFinal: [57, 64, 69],
    volume: -16,                                                      // dB abaixo da voz
  },
};

// poe(nome, tempo, ganho, som)   W('palavra', bloco) = início da palavra   B(n) = início do bloco
export function deixas({ W, B, poe, efeito }) {
  poe('cama: pop', W('cama', 1), 0.55, efeito.pop());
  poe('acordou: boing', W('acordou'), 0.35, efeito.boing());
  poe('trancado: tranca', W('trancado'), 0.6, efeito.tranca());
  poe('cama sai', B(2) - 0.25, 0.25, efeito.saida());
  poe('relógio: pop', W('relógio'), 0.55, efeito.pop());
  for (let t = W('relógio') + 0.2, k = 0; t < W('meia-noite') + 0.1; t += 0.25, k++) poe('tique', t, 0.32, efeito.tique(k % 2 === 0));
  poe('meia-noite: badalada', W('meia-noite'), 0.55, efeito.dong());
  poe('café: whoosh', W('café'), 0.18, efeito.whoosh(0.6, 300, 1800));
  poe('lanchonete: whoosh', W('lanchonete'), 0.18, efeito.whoosh(0.6, 300, 1800));
  poe('relógio sai', B(3) - 0.3, 0.25, efeito.saida());
  poe('geladeira: pop', W('geladeira'), 0.55, efeito.pop());
  poe('ligada: zumbido', W('ligada'), 0.35, efeito.zumbido(1.6));
  poe('cheia: ding', W('cheia'), 0.5, efeito.ding());
  poe('geladeira sai', B(4) - 0.3, 0.25, efeito.saida());
  poe('rangido', W('rangido'), 0.5, efeito.rangido(1.2));
  poe('porta: pop', W('porta'), 0.55, efeito.pop());
  poe('aberta: rangido curto', W('aberta'), 0.45, efeito.rangido(0.7));
  poe('olhinhos: plim', W('aberta') + 0.35, 0.6, efeito.plim());
  poe('porta sai', B(5) - 0.2, 0.25, efeito.saida());
  poe('passos: susto', W('passos'), 0.6, efeito.sustoForte());
  for (let t = W('passos') + 0.75, k = 0; t < W('segurança', 6) - 0.2; t += 0.62, k++) {
    const perto = (t - W('passos')) / (W('segurança', 6) - W('passos'));
    poe('passo', t, 0.18 + 0.55 * perto * perto, efeito.passo());
  }
  poe('segurança: whoosh', W('segurança', 6), 0.55, efeito.whoosh(0.5, 500, 3000));
  for (let k = 0; k < 2; k++) poe('passo correndo', W('segurança', 6) + 0.15 + k * 0.28, 0.6, efeito.passo());
  poe('aponta: clique', W('aponta'), 0.7, efeito.clique());
  poe('tem: pop balão', W('tem', 6), 0.55, efeito.pop());
  poe('balão sai', B(7) - 0.05, 0.22, efeito.saida());
  poe('escondia: pop A', W('escondia'), 0.55, efeito.pop());
  poe('mãos: pop B', W('mãos'), 0.55, efeito.pop());
  poe('mãos: boing', W('mãos') + 0.05, 0.3, efeito.boing());
  poe('comenta: ding', W('comenta'), 0.5, efeito.ding());
}
