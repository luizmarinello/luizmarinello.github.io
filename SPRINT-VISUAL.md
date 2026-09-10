# Sprint de efeitos visuais

Estado no início da sprint: cena WebGL com seis objetos sólidos e arestas
desenhadas, cacos só na virada entre seções, tema escuro travado, um acento,
Geist, painéis de vidro. Zero imagem no site.

**Critério de pronto da sprint:** o site abre e fecha sem nenhum espaço
tracejado, o link compartilhado mostra uma imagem, a peça 3D tem luz que
assenta ela no espaço, e a virada entre formas tem intenção em vez de ser
uma explosão radial genérica.

Esforço em horas de trabalho, não em dias de calendário.

---

## Bloco 0 — travado em você

Nada aqui depende de código. É o maior buraco visual que o site tem hoje:
são quatro retângulos tracejados no meio de uma página que, fora isso, está
pronta.

| # | Item | Esforço |
|---|---|---|
| 0.1 | Sua foto, 900x1125, enquadramento retrato | seu |
| 0.2 | Print do BellaDesk, 1200x900 | seu |
| 0.3 | Print do BellaBI, 1200x900 | seu |
| 0.4 | Print do sistema do DETEC, 1200x900 | seu |
| 0.5 | URL do LinkedIn | seu |

Se algum print não puder sair por restrição da empresa, o substituto é um
diagrama de arquitetura desenhado por mim, sem dado real na tela. Isso vira
um item de 2h.

---

## Bloco 1 — acabamento que está faltando  ✅ feito em 10/09/2026

Barato, e é o que separa "site pessoal" de "site inacabado".

### 1.1 Favicon (1h)
O `index.html` não tem `<link rel="icon">`. A aba mostra o ícone genérico do
navegador e o servidor responde 404 para `/favicon.ico`. Desenhar uma marca
simples, o mesmo robô de perfil ou um monograma, em SVG, e ligar.

### 1.2 Imagem de link, o og:image (2h)
Hoje o site tem `og:title` e `og:description`, mas não tem imagem. Quem
recebe o link no LinkedIn ou no WhatsApp vê um retângulo vazio. Como você vai
mandar esse link para recrutador, esse item paga sozinho.

Feito com uma rota de build que renderiza a cena com o robô e o título em
1200x630, ou uma captura estática da hero. A estática é mais barata e não
quebra depois.

### 1.3 Estados de interação (1h)
**Entregue diferente do planejado.** O plano dizia hover nos cards de projeto
e nos chips. Não foi feito, e de propósito: nenhum dos dois é clicável, e card
que acende sem levar a lugar nenhum é affordance falsa. Entrou hover e foco em
tudo que de fato interage (navegação, seletor de idioma, os dois botões do
hero, o botão do exemplo, os links de contato) e, no lugar do hover dos
painéis, a aresta clara no topo do vidro, que é acabamento de material e não
promessa de clique.

---

## Bloco 2 — luz e material da peça

É aqui que 3D passa de "tem um objeto girando" para "isso parece caro". A
cena hoje tem uma luz ambiente e duas pontuais, e o metal está chapado
porque não há nada para ele refletir.

### 2.1 Mapa de ambiente procedural (3h)
`metalness: 0.6` sem mapa de ambiente é metal sem reflexo, ou seja, plástico.
Gerar um ambiente pequeno em código (um gradiente escuro com duas manchas
quentes) e usar como `scene.environment`. **Sem baixar HDR de CDN**, que é o
caminho comum e que adicionaria 1 a 2 MB e uma dependência de rede.

### 2.2 Trio de luzes de verdade (2h)
Trocar as duas pontuais por key, fill e rim. O rim é o que separa a silhueta
do fundo preto, e é justamente a borda que faz a peça se ler.

### 2.3 Sombra de contato (2h)
A peça hoje flutua no vazio. Uma sombra suave embaixo dela assenta o objeto
no espaço. Feita com um plano e uma textura radial, não com sombra real, que
custaria caro por frame.

### 2.4 Brilho no núcleo da seção de IA (3h, tem custo)
A seção de IA é a que mais vende você, e o chip em brasa hoje só tem cor,
não tem brilho. Bloom seletivo faria a brasa ler como brasa.

**Custo honesto:** exige `@react-three/postprocessing`, que soma peso ao
pacote da cena, que já tem 240 KB comprimidos. Antes de entrar, medir. Se
passar de 300 KB, cai fora e o efeito vira um sprite de halo atrás da peça,
que é quase de graça.

### 2.5 Exposição por seção (1h)
O tonemapping já vem do padrão do R3F. O que dá para explorar é a exposição:
subir devagar até a seção de IA e descer depois. Faz a página respirar sem
mexer em cor nenhuma.

---

## Bloco 3 — a virada entre as formas

Hoje todos os cacos saem para fora ao mesmo tempo, na direção radial. É uma
explosão de fogos. Dá para fazer parecer uma peça sendo desmontada.

### 3.1 Explosão varrida em vez de simultânea (3h)
Escalonar a saída de cada caco pela altura dele no objeto. A peça se abre de
baixo para cima e se remonta de cima para baixo. Uma linha de atraso por
caco, e muda completamente a leitura do movimento.

### 3.2 Trajetória curva (2h)
Somar um desvio lateral à trajetória radial, para o caco descrever um arco
em vez de uma linha reta. Movimento reto é o que denuncia animação feita por
interpolação.

### 3.3 Estiramento na velocidade (2h)
Alongar o caco na direção em que ele está indo, proporcional à velocidade.
É borrão de movimento por um centésimo do custo de borrão de movimento.

### 3.4 As arestas entrando por último (2h)
Hoje a malha e as arestas aparecem juntas. Se as arestas desenharem sozinhas
por um instante antes da malha encher, a peça parece estar sendo construída,
não aparecendo pronta.

---

## Bloco 4 — página e tipografia

### 4.1 Entrada do hero em cascata (2h)
O bloco inteiro entra de uma vez. Entrar linha a linha, com uns 60 ms entre
elas, dá hierarquia à primeira dobra em vez de tratá-la como um retângulo só.

### 4.2 Fundo que acompanha a seção (2h)
Só a peça muda de cor hoje. Um deslocamento muito leve na cor de fundo por
seção, dentro do mesmo tema escuro, amarra a página inteira ao mesmo sistema.
**Risco:** exagerar aqui quebra a regra de tema único e o site passa a
parecer vários sites. O limite é uma diferença que só se percebe rolando.

### 4.3 Indicador de seção (2h)
Uma marcação fina lateral com a seção atual. Serve de orientação, que é
função de verdade, e de acabamento. Sem números de seção e sem contador
falso, que é a versão clichê disso.

---

## Bloco 5 — desempenho e verificação

Sem isso a sprint é um chute. Nenhum efeito acima vale a pena se derrubar o
site na máquina do recrutador.

### 5.1 Pausar a cena fora de vista (1h)
Quando a aba está oculta o loop continua rodando e queimando bateria.
`document.hidden` desliga.

### 5.2 Contagem de cacos por capacidade da máquina (2h)
Hoje é uma pergunta só: largura menor que 768. Passar a considerar
`devicePixelRatio` e o número de núcleos, e cair para uma contagem menor em
máquina fraca.

### 5.3 Medir de verdade (2h)
FPS em três larguras, e Lighthouse. Esse item existe porque **em nenhum
momento até aqui eu consegui medir FPS**: o painel de navegador deste
ambiente congela o loop de animação quando está escondido. Precisa ser medido
no seu navegador.

### 5.4 Conferir a cena no celular (1h)
Mesmo motivo: a peça 3D no celular nunca foi vista, só o layout foi. Pode
estar ótima, pode estar invisível.

---

## Ordem sugerida

1. Bloco 1 inteiro. É barato e tira o site do estado de inacabado.
2. 5.4 e 5.3, para saber em que terreno estamos pisando antes de somar efeito.
3. Bloco 2, itens 2.1, 2.2 e 2.3. É o maior salto de qualidade por hora gasta.
4. Bloco 3, itens 3.1 e 3.3.
5. O resto conforme sobrar tempo.

Soma de 1 a 4: cerca de 20 horas. A sprint inteira, 36.

---

## Fora de escopo, e por quê

- **Trocar de biblioteca de animação ou adicionar GSAP.** O que existe hoje
  dá conta, e misturar duas bibliotecas de animação na mesma árvore é briga
  por frame.
- **Cursor customizado e trilha de partículas no mouse.** Clichê, ruim de
  acessibilidade e não sobrevive no celular.
- **Rolagem suavizada por biblioteca, tipo Lenis.** Sequestra o scroll do
  usuário. O site já respeita `prefers-reduced-motion`, e isso ia na direção
  contrária.
- **Modelo 3D pesado em arquivo.** A cena inteira hoje é gerada por código.
  Um GLTF de qualidade traria megabytes e é o que faz site de portfólio
  demorar cinco segundos para abrir.
- **Modo claro.** O tema escuro é uma decisão, não uma limitação.
