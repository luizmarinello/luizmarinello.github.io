/* Progresso do scroll compartilhado com a cena 3D.
   Fica fora do React de proposito: a cena le no loop de render,
   entao mudar isso nao pode re-renderizar arvore nenhuma. */
export const scrollState = { p: 0 }
