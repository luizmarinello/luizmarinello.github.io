# Sprint de interação

Estado no início da sprint: a página responde bem no desktop e quase nada no
celular. A peça 3D aceita arrasto, clique e cursor, a régua de baixo é
clicável, a malha do fundo afunda perto do mouse e a demonstração de IA tem um
replay. Tudo isso está atrás de uma condição só: `narrow || still` desliga o
bloco inteiro de ponteiro abaixo de 1024px. Quem abre o link no telefone —
que é como recrutador abre link — vê um site bonito e inerte.

**Critério de pronto da sprint:** o visitante consegue (1) abrir um projeto e
ver mais do que o resumo, sem sair da página; (2) mexer na peça 3D no
telefone; (3) mudar a entrada da demonstração de IA e ver a saída mudar; (4)
mandar para alguém o endereço de uma seção específica.

Esforço em horas de trabalho, não em dias de calendário.

---

## Bloco 0 — o que já interage hoje

Está aqui para não ser reinventado, e porque metade dessas coisas ninguém
descobre que existe.

| O quê | Onde | Descoberto por quem? |
|---|---|---|
| Arrastar a peça para girar | `Scene.tsx`, desktop | quase ninguém |
| Clicar na peça: ela estoura em cacos | `Scene.tsx`, desktop | quase ninguém |
| Clicar numa unidade do rack: rola até o projeto | `Scene.tsx`, seção 03 | ninguém |
| Etiqueta do nome da parte sob o cursor | `Scene.tsx`, desktop | quem passa o mouse |
| Passar o mouse na linha do projeto acende a unidade no rack | `sections.tsx` + `scrollState.focus` | quem repara |
| Malha do fundo afunda perto do cursor | `Sheet.tsx`, desktop | quem repara |
| Régua de baixo: clicar busca, marca por prancha com nome no hover | `App.tsx` | sim, tem afordância |
| Setas ← → trocam de prancha, `L` troca o idioma | `App.tsx` | só quem lê a dica |
| Replay da resposta da IA sendo digitada | `sections.tsx` | sim, tem botão |
| Hover e foco em navegação, botões e links | `ui.tsx` | sim |

O padrão salta aos olhos: **o que interage não se anuncia, e o que se anuncia
é o que já é botão.** Boa parte desta sprint é conserto de afordância, não
efeito novo.

---

## Bloco 1 — o que falta e dói

### 1.1 A peça no celular (4h) — o maior buraco da lista  ✅ feito em 17/09/2026
Hoje `if (narrow || still) return` mata ponteiro, arrasto, clique, etiqueta e
raycast em qualquer tela até 1023px, e a peça ainda fica a 35% de opacidade.
No telefone o site perde exatamente aquilo que o diferencia de um template.

O que entra: em toque, **um toque na peça estoura ela** (é o gesto que já
existe no clique, e não briga com a rolagem) e **arrastar na horizontal gira**,
com `touch-action: pan-y` na camada da cena para o dedo vertical continuar
rolando a página. O raycast por toque roda uma vez por `pointerdown`, não a
cada movimento: é o custo de um toque, não de um loop.

**Entregue com duas diferenças do plano.** A condição deixou de ser a largura
da tela e passou a ser `pointerType === 'touch'`: um notebook com tela de
toque a 1280px também não tem movimento antes do dedo descer, e um mouse num
tablet tem. E o `touch-action: pan-y pinch-zoom` foi para o `body`, não para
a camada da cena — a camada tem `pointer-events: none`, então o toque nunca
chega nela; quem recebe o gesto é a página embaixo. O `pinch-zoom` fica para
o zoom de acessibilidade continuar funcionando.

**O que faltava e não estava no plano:** `pointercancel`. Quando o navegador
decide que o gesto é rolagem, ele não manda `pointerup` — manda `cancel`. Sem
tratar isso, o primeiro dedo que descesse sobre a peça e rolasse deixaria o
arrasto ligado para sempre. Entrou como "soltar sem clicar".

Verificado no Playwright com eventos sintéticos de toque, contando frames em
vez de milissegundos (o estouro avança por frame): toque seco pega e estoura,
durante o estouro o toque não pega, depois volta a pegar; `cancel` solta sem
estourar; arrasto horizontal não vira clique. O caminho do mouse no desktop
foi conferido do mesmo jeito e não mudou de comportamento.

A opacidade de 35% ficou como estava: no telefone de verdade a peça está
visível e a rolagem está lisa (6.2).

### 1.2 Ficha do projeto que abre no lugar (4h)
Os três projetos são sistemas internos: não há link de demo nem repositório
público para onde mandar o visitante. Hoje a linha do projeto termina no
resumo e na lista de tópicos, e não há nada para fazer com ela.

Entra um `<details>` por projeto — elemento nativo, sem biblioteca, acessível
e indexável — abrindo a ficha técnica: arquitetura em uma frase, integrações,
o número que importa (quantos usuários, quantas requisições, quanto tempo em
produção) e a stack completa. O gatilho ganha a cara do resto: etiqueta mono,
fio de 1px, sem card.

Isso **depende de você**: o conteúdo da ficha não existe em `data.ts` ainda.

### 1.3 Ensinar que a peça responde (2h)
A dica `chromeHint` ("arrastar · L idioma · clique na peça") só aparece a
partir de 1024px, no canto inferior direito, em cinza 70%. É uma nota de
rodapé para a interação principal do site.

Entra: na primeira visita, quando a peça entra em cena parada, ela gira uns
15° sozinha e volta — o suficiente para o olho entender que aquilo é
manipulável — e a etiqueta de parte aparece uma vez sem o cursor precisar
estar em cima. Uma vez por sessão, `sessionStorage`, e nada disso acontece com
`prefers-reduced-motion`.

### 1.4 Endereço de seção na URL (1h)
O `IntersectionObserver` que decide a prancha atual já sabe qual seção está no
centro. Falta uma linha de `history.replaceState` para o endereço acompanhar,
e aí dá para mandar `#projetos` ou `#ia` para alguém. Custa quase nada e é a
diferença entre "olha meu portfólio" e "olha esta parte do meu portfólio".

Cuidado: `replaceState`, nunca `pushState` — senão o botão voltar do navegador
vira um inferno de oito paradas.

---

## Bloco 2 — a seção de IA vira demonstração de verdade

É a seção que mais vende você e a única com um botão de verdade. O botão hoje
redigita um texto fixo. O visitante não tem o que decidir.

### 2.1 Três pedidos para escolher (4h)
Em vez de um replay só, três entradas pré-definidas — por exemplo um pedido
limpo, um com dado faltando e um com texto ambíguo — e a resposta estruturada
correspondente de cada uma, todas escritas à mão em `data.ts`. Sem chamada de
rede, sem chave, sem custo. O visitante escolhe e vê a saída mudar.

### 2.2 Deixar a validação falhar na frente dele (3h) — o melhor item da lista
Sua tese, escrita na própria seção, é que o difícil não é chamar a API, é
fazer o sistema confiar na resposta. Hoje isso está dito em texto e demonstrado
em nada.

Entra uma quarta entrada: a que faz o modelo responder fora do contrato. A
tela mostra o JSON chegando, o validador recusando, o registro do erro e o
fallback assumindo. **Um recrutador técnico entende seu nível nessa animação
mais rápido do que em qualquer parágrafo do site.**

### 2.3 Copiar o JSON (0.5h)
Botão de copiar no bloco da resposta, com retorno visual de "copiado". Barato,
e quem é técnico vai querer colar em algum lugar.

---

## Bloco 3 — orientação e teclado

### 3.1 Régua no celular (2h)
A régua de rolagem é `hidden md:block`. No telefone não há contador de
prancha, não há marca, não há nada dizendo que a página tem oito seções. Uma
versão enxuta — só o fio de progresso e o número da prancha — resolve.

### 3.2 Folha de atalhos no `?` (2h)
As setas e o `L` existem e ninguém descobre. Um painel que abre com `?` e
lista os atalhos, fechando com `Esc`, é convenção de ferramenta de
desenvolvedor e combina com a linguagem de prancha técnica do site.

### 3.3 A régua acessível pelo teclado (1h) — é defeito, não melhoria
A faixa clicável é uma `<div>` com `onClick` e `aria-hidden="true"`, e dentro
dela há `<a>` reais com `aria-label`. Um link dentro de um contêiner
escondido de leitor de tela é contraditório: ou some do foco, ou é anunciado.
A correção é a faixa virar `role="presentation"` com os links de verdade
visíveis à navegação, ou trocar o `onClick` por botões. Uma hora, e tira uma
inconsistência de acessibilidade do caminho.

### 3.4 Idioma lembrado (0.5h)
A escolha de PT/EN se perde a cada recarga — volta para o que o navegador
disser. `localStorage`, uma linha, e quem voltar ao site continua onde estava.

---

## Bloco 4 — os ecos entre o texto e a peça

O mecanismo já existe e é ótimo: passar o mouse na linha do projeto acende a
unidade correspondente no rack 3D (`scrollState.focus`). Ele é usado em uma
seção só. Estender custa pouco porque a estrada está feita.

| # | Item | Esforço |
|---|---|---|
| 4.1 | Passar o mouse num grupo de ferramentas acende o dente correspondente da engrenagem | 1.5h |
| 4.2 | Passar o mouse num período da trajetória acende o estágio do foguete | 2h |
| 4.3 | A certificação AWS leva à verificação no Credly | 0.5h + seu link |

O 4.3 é o único item do site que transforma uma afirmação sua em prova
clicável. Se eu pudesse fazer um só deste bloco, seria ele — e ele depende de
você mandar a URL.

---

## Bloco 5 — contato

### 5.1 Copiar o e-mail com retorno (1h)
Hoje o único caminho é `mailto:`, que em máquina sem cliente de e-mail
configurado — a maioria dos desktops corporativos — não faz nada. Um botão de
copiar ao lado, com confirmação, conserta um caminho que hoje falha calado.

### 5.2 Formulário de contato — **não recomendo**
Exige backend ou serviço de terceiro, vira alvo de spam, e some no meio do
e-mail de trabalho de quem recebe. Para um portfólio, e-mail copiável e
LinkedIn ganham. Se você quiser mesmo, o caminho barato é um Cloudflare
Worker, e isso é uma sprint própria.

---

## Bloco 6 — medir antes de somar

Herdado da sprint anterior e **ainda aberto**. Cada item do Bloco 1 e do Bloco
4 soma trabalho por frame; somar no escuro é apostar na máquina de quem te
avalia.

| # | Item | Esforço | |
|---|---|---|---|
| 6.1 | FPS em três larguras, mais Lighthouse | 2h | |
| 6.2 | A peça 3D vista num celular de verdade — nunca foi | 1h | ✅ 17/09: visível e lisa |
| 6.3 | Orçamento de ponteiro: tudo que reage ao mouse passa por um `pointermove` só | 1h | |

O 6.3 vira obrigatório se o Bloco 4 entrar inteiro: hoje a malha do fundo, a
paralaxe da câmera e o raycast da etiqueta já leem o ponteiro por caminhos
separados.

---

## Bloco 7 — o item caro que talvez valha

### 7.1 "Pergunte ao portfólio" (8h, e tem conta no fim do mês)
Um campo onde o visitante pergunta sobre sua experiência e um modelo responde
com base no conteúdo do site. É o item que mais impressiona num portfólio de
alguém que vende IA em produção — e é o mais fácil de fazer errado.

O que ele exige, sem maquiagem: chave de API **nunca** no front (GitHub Pages
é estático, então precisa de um proxy — Cloudflare Worker resolve no plano
gratuito), limite de requisição por IP, teto de gasto, defesa contra injeção
de prompt (alguém vai colar "ignore as instruções") e uma regra de recusa para
o que não está no site, senão ele inventa emprego que você não teve.

Alternativa de graça, 3h, que entrega 70% disso: dez perguntas frequentes com
resposta escrita por você, busca local, zero rede. Não impressiona igual, mas
nunca mente a seu respeito.

---

## Ordem sugerida

1. **6.2 e 6.1** — saber em que terreno se pisa antes de somar interação.
2. **1.1** — a peça no celular. É o maior buraco e o mais visível.
3. **2.2 e 2.1** — a demonstração de IA, que é o que te vende.
4. **1.4, 3.4, 5.1, 2.3** — quatro itens pequenos, quatro horas somadas.
5. **1.3 e 3.2** — afordância: fazer o que já existe ser descoberto.
6. **1.2** — a ficha do projeto, assim que o conteúdo existir.
7. **Bloco 4**, conforme sobrar tempo. O 4.3 fura a fila se o link chegar.

Somando de 1 a 5: cerca de 20 horas. A sprint inteira sem o Bloco 7: 32.

---

## Fora de escopo, e por quê

- **Cursor customizado, trilha de partículas, rolagem sequestrada (Lenis).**
  Já descartados na sprint visual, pelos mesmos motivos, e continuam valendo.
- **Terminal falso que aceita comandos.** Tentador para um portfólio de
  backend, e é armadilha: promete um shell, entrega cinco comandos, e ninguém
  digita em site de portfólio. O 2.1 entrega a mesma ideia com clique.
- **Easter egg de Konami, som no hover.** Custam pouco e cobram caro: som sem
  pedir é o jeito mais rápido de fazer alguém fechar a aba.
- **Transição entre páginas / View Transitions.** O site é uma página só. Não
  há transição para fazer.
- **Trocar `motion` por GSAP para ganhar interatividade.** A biblioteca não é
  o limite aqui; a condição `narrow` é.
