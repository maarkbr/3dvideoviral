// OS TEXTOS DAS PLACAS DA CIDADE: troque a cada vídeo (a regra muda, o nome da vila pode mudar).
// Cada linha cabe sozinha: o texto diminui a letra se passar da largura da placa.
export const PLACAS = {
  // placa de "bem-vindo" na entrada
  bemVindo: "BEM-VINDO À",
  cidade: "VILA DO SOSSEGO",
  habitantes: "318 HABITANTES",
  // a placa vermelha embaixo dela: a regra em poucas palavras
  regraCurta: "100 PALAVRAS POR DIA",
  // a placa de bronze da lei, na praça (de cima para baixo)
  lei: {
    titulo: "LEI Nº 1",
    texto: ["CADA MORADOR SÓ PODE", "FALAR"],          // linhas pequenas
    destaque: ["100 PALAVRAS", "POR DIA"],              // linhas grandes
    rodape: "VILA DO SOSSEGO · 1958",
    autor: "AUTOR: ____________",
  },
  // o rabisco de giz no muro (2 linhas; vazio = sem rabisco)
  giz: ["QUEM INVENTOU?", "= 1.000.000"],
};
