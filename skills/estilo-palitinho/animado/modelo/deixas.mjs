// Lista de sons deste vídeo: cada efeito começa na palavra que o chama.
// Gerar o som (na pasta palitinho):
//   node <skill>/animado/scripts/som.mjs <pasta-do-video>

export const config = {
  duracao: 30,                         // igual ao data-duration do index.html
  narracao: 'audio/NOME-DA-NARRACAO.mp3',
  trilha: {
    bpm: 100,
    acordes: [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]], // Lá menor, Fá, Ré menor, Mi (notas MIDI)
    tensao: null,                      // ex.: { de: ['passos'], ate: ['segurança', 6] } = trecho de suspense
    acordeFinal: [57, 64, 69],
    volume: -16,                       // dB abaixo da voz
  },
};

// poe(nome, tempo, ganho, som)
//   W('palavra', bloco) = segundo em que a palavra começa   B(n) = início do bloco n
// Sons prontos: pop, saida, whoosh(dur, f0, f1), tranca, tique(alto), dong, zumbido(dur), ding,
//               rangido(dur), sustoForte, passo, clique, plim, boing
export function deixas({ W, B, poe, efeito }) {
  // exemplo: objeto entrando na palavra "cama"
  // poe('cama: pop', W('cama'), 0.55, efeito.pop());
  // poe('cama sai', B(2) - 0.25, 0.25, efeito.saida());
}
