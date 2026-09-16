/* Estado do scroll compartilhado com a cena 3D.
   Fica fora do React de proposito: a cena le no loop de render,
   entao mudar isso nao pode re-renderizar arvore nenhuma.
   p: progresso da pagina, 0 a 1.
   stage: em qual prancha a peca esta, continuo. 2.0 e parado no centro
   da terceira secao; 2.5 e no meio da virada para a quarta. Vem da
   posicao real das secoes, nao de uma divisao igual do scroll. */
export const scrollState = {
  p: 0,
  stage: 0,
  /** Unidade do rack (0, 1, 2) cuja linha da lista de projetos esta sob
      o cursor; -1 quando nenhuma. Acende a unidade na peca 3D. */
  focus: -1,
}
