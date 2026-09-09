# Portfolio Luiz Henrique

Site de portfolio e curriculo. React + Vite + Tailwind v4, com uma cena
WebGL (React Three Fiber) que muda de estado conforme a pagina desce.

## Rodar

    npm install
    npm run dev

## O que falta preencher

Tudo em `src/data.ts`, no objeto `contact` do topo:

- `email`, `github`, `linkedin`: enquanto forem `null`, o botao nao aparece.
- `photo`: coloque a foto em `public/` (900x1125, retrato) e aponte aqui.
- Print de cada projeto: `shot` dentro de `projects`, arquivo em `public/`,
  1200x900. Enquanto for `null`, aparece um espaco tracejado com a medida.

O CV em PDF ja esta em `public/CV-Luiz-Henrique.pdf`.

## Publicar no GitHub Pages

1. Se o repositorio NAO se chamar `<usuario>.github.io`, abra `vite.config.ts`
   e troque `base: '/'` por `base: '/nome-do-repo/'`.
2. `npm run deploy`
3. No GitHub: Settings > Pages > Branch `gh-pages`.

## Onde mexer

- `src/data.ts`: todo o texto, em portugues e ingles. Nao ha texto solto nos componentes.
- `src/scene/Scene.tsx`: a cena 3D. O array `STAGES` tem uma linha por secao
  da pagina, na ordem do scroll. Mexer nos numeros de uma linha muda como o
  solido se comporta naquela secao.
- `src/sections.tsx`: as secoes. `src/App.tsx`: barra de navegacao e hero.
