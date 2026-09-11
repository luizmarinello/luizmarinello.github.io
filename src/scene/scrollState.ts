/* Estado do scroll compartilhado com a cena 3D.
   Fica fora do React de proposito: a cena le no loop de render,
   entao mudar isso nao pode re-renderizar arvore nenhuma.
   p: progresso da pagina, 0 a 1.
   stage: em qual prancha a peca esta, continuo. 2.0 e parado no centro
   da terceira secao; 2.5 e no meio da virada para a quarta. Vem da
   posicao real das secoes, nao de uma divisao igual do scroll.
   tone: 0 na folha de tinta, 1 na de papel. */
export const scrollState = { p: 0, stage: 0, tone: 0 }
