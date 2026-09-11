export type Lang = 'pt' | 'en'
type L<T> = { pt: T; en: T }

/* PREENCHER: enquanto estiver null, o item nao aparece no site. */
export const contact = {
  email: 'luizhrosa2007@gmail.com' as string | null,
  github: 'https://github.com/luizmarinello' as string | null,
  linkedin: null as string | null,
  cv: 'CV-Luiz-Henrique.pdf',
  photo: null as string | null, // ex.: 'luiz.jpg', arquivo dentro de public/
}

export const stack: { label: L<string>; items: { name: string; slug: string | null }[] }[] = [
  {
    label: { pt: 'Backend', en: 'Backend' },
    items: [
      { name: 'Java 8 a 21', slug: 'openjdk' },
      { name: 'Spring Boot', slug: 'springboot' },
      { name: 'Spring Security', slug: 'springsecurity' },
      { name: 'Hibernate', slug: 'hibernate' },
      { name: 'PostgreSQL', slug: 'postgresql' },
      { name: 'Flyway', slug: 'flyway' },
      { name: 'Node.js', slug: 'nodedotjs' },
    ],
  },
  {
    label: { pt: 'Frontend', en: 'Frontend' },
    items: [
      { name: 'React 19', slug: 'react' },
      { name: 'TypeScript', slug: 'typescript' },
      { name: 'Angular', slug: 'angular' },
      { name: 'Tailwind', slug: 'tailwindcss' },
      { name: 'Vite', slug: 'vite' },
      { name: 'Electron', slug: 'electron' },
    ],
  },
  {
    label: { pt: 'Infra e dados', en: 'Infra and data' },
    items: [
      { name: 'AWS', slug: null },
      { name: 'Docker', slug: 'docker' },
      { name: 'GitHub Actions', slug: 'githubactions' },
      { name: 'Power BI', slug: null },
      { name: 'Claude API', slug: 'anthropic' },
    ],
  },
]

/* Ficha tecnica curta do "sobre": chave e valor, tres colunas. */
export const aboutSpecs: L<[string, string][]> = {
  pt: [
    ['Base', 'Cascavel, PR'],
    ['Fuso', 'UTC-3'],
    ['Idiomas', 'Português e inglês'],
  ],
  en: [
    ['Based in', 'Cascavel, Brazil'],
    ['Timezone', 'UTC-3'],
    ['Languages', 'Portuguese and English'],
  ],
}

/* Nome curto de cada prancha, na ordem do scroll. E o que aparece no
   contador fixo do rodape. */
export const figs: L<string>[] = [
  { pt: 'Abertura', en: 'Opening' },
  { pt: 'Quem escreve', en: 'Who writes' },
  { pt: 'Projetos', en: 'Work' },
  { pt: 'IA aplicada', en: 'Applied AI' },
  { pt: 'Ferramentas', en: 'Tools' },
  { pt: 'Trajetória', en: 'Path' },
  { pt: 'Certificações', en: 'Certifications' },
  { pt: 'Contato', en: 'Contact' },
]

/* Nome de cada primitiva das pecas 3D, na ordem em que shapes.ts as
   monta. E o que aparece na etiqueta quando o cursor passa por uma
   parte. No rack dos projetos cada unidade e um sistema. */
const rb = (pt: string, en: string): L<string> => ({ pt, en })
export const partNames: L<string>[][] = [
  // robo
  [
    rb('Antena', 'Antenna'), rb('Antena', 'Antenna'), rb('Cabeça', 'Head'), rb('Visor', 'Visor'),
    rb('Orelha', 'Ear'), rb('Orelha', 'Ear'), rb('Pescoço', 'Neck'), rb('Tronco', 'Torso'),
    rb('Painel', 'Panel'), rb('Braço', 'Arm'), rb('Braço', 'Arm'), rb('Mão', 'Hand'), rb('Mão', 'Hand'),
    rb('Perna', 'Leg'), rb('Perna', 'Leg'), rb('Pé', 'Foot'), rb('Pé', 'Foot'),
  ],
  // rack: tres unidades, duas primitivas cada
  [
    rb('BellaDesk', 'BellaDesk'), rb('BellaDesk', 'BellaDesk'),
    rb('BellaBI', 'BellaBI'), rb('BellaBI', 'BellaBI'),
    rb('Disparo da saúde', 'Health messaging'), rb('Disparo da saúde', 'Health messaging'),
  ],
  // chip: corpo, marca e 28 pinos
  [rb('Encapsulamento', 'Package'), rb('Marca', 'Mark'), ...Array.from({ length: 28 }, () => rb('Pino', 'Pin'))],
  // engrenagem: aro, coroa, cubo, 8 dentes, 4 raios
  [
    rb('Aro', 'Rim'), rb('Coroa', 'Ring'), rb('Cubo', 'Hub'),
    ...Array.from({ length: 8 }, () => rb('Dente', 'Tooth')),
    ...Array.from({ length: 4 }, () => rb('Raio', 'Spoke')),
  ],
  // foguete: bico, corpo, faixa, bocal, 3 aletas
  [
    rb('Bico', 'Nose cone'), rb('Corpo', 'Body'), rb('Faixa', 'Band'), rb('Bocal', 'Nozzle'),
    rb('Aleta', 'Fin'), rb('Aleta', 'Fin'), rb('Aleta', 'Fin'),
  ],
  // cristal
  [rb('Casca', 'Shell'), rb('Núcleo', 'Core')],
]

/** Unidade do rack -> id do projeto na pagina. */
export const rackTargets = ['belladesk', 'bellabi', 'sus']

export type Project = {
  id: string
  client: L<string>
  name: string | L<string>
  year: string
  shot: string | null
  summary: L<string>
  points: L<string[]>
  tech: string[]
}

export const projects: Project[] = [
  {
    id: 'belladesk',
    client: { pt: 'Bella Casa & Okada', en: 'Bella Casa & Okada' },
    name: 'BellaDesk',
    year: '2026',
    shot: null,
    summary: {
      pt: 'A plataforma interna que a empresa abre todo dia. Comecei pelo helpdesk e hoje ela cobre requisição de material, inventário de TI, comunicação entre setores e controle de acesso.',
      en: 'The internal platform the company opens every day. It started as a helpdesk and now covers material requests, IT inventory, cross department messaging and access control.',
    },
    points: {
      pt: [
        'Requisição de material como máquina de estados: cada papel vê e faz exatamente o que lhe cabe, do pedido até a entrega.',
        'Matriz de capacidades configurável por papel, aplicada no backend antes de qualquer tela existir.',
        'Chat interno em WebSocket, inventário com QR Code na ficha do equipamento e um mini BI de caixa para a presidência.',
        'Hardening de produção: limite de tentativa no login, revogação de token por versionamento, CSP e endpoints de diagnóstico fechados.',
      ],
      en: [
        'Material requests as a state machine: each role sees and does exactly what belongs to it, from request to delivery.',
        'A capability matrix configurable per role, enforced in the backend before any screen exists.',
        'Internal WebSocket chat, IT inventory with a QR code on each asset sheet, and a small cash flow BI for the board.',
        'Production hardening: login rate limiting, token revocation by version, CSP, and diagnostic endpoints locked down.',
      ],
    },
    tech: ['Java 21', 'Spring Boot', 'PostgreSQL', 'Flyway', 'React 19', 'TypeScript', 'WebSocket', 'Docker'],
  },
  {
    id: 'bellabi',
    client: { pt: 'Bella Casa & Okada', en: 'Bella Casa & Okada' },
    name: 'BellaBI',
    year: '2026',
    shot: null,
    summary: {
      pt: 'Integração entre o ERP Sienge e o Power BI. Uma API em Spring Boot puxa o dado do ERP e entrega um modelo pronto para o relatório, sem ninguém exportar planilha na mão.',
      en: 'An integration between the Sienge ERP and Power BI. A Spring Boot API pulls data out of the ERP and hands Power BI a ready model, with nobody exporting spreadsheets by hand.',
    },
    points: {
      pt: [
        'Consumo dos endpoints REST e bulk do Sienge respeitando paginação e limite de requisição, com retentativa quando a janela fecha.',
        'Carga incremental agendada, para o relatório abrir com o dado do dia e não com o da última exportação manual.',
        'Modelo de dados desenhado junto de quem lê o relatório, em vez de espelhar as tabelas do ERP.',
      ],
      en: [
        'Consumes the Sienge REST and bulk endpoints respecting pagination and rate limits, retrying when the window closes.',
        'Scheduled incremental loads, so the report opens with today data instead of the last manual export.',
        'A data model designed with the people who read the report, not a mirror of the ERP tables.',
      ],
    },
    tech: ['Java', 'Spring Boot', 'PostgreSQL', 'ETL', 'Power BI', 'Sienge API'],
  },
  {
    id: 'sus',
    client: {
      pt: 'DETEC, órgão público municipal, Cascavel PR',
      en: 'DETEC, municipal public agency, Cascavel, Brazil',
    },
    name: {
      pt: 'Disparo de avisos da saúde municipal',
      en: 'Municipal health messaging',
    },
    year: '2025',
    shot: null,
    summary: {
      pt: 'Sistema que lê a base de pacientes do município e manda o aviso certo para a pessoa certa: lembrete de consulta, convocação de campanha e aviso de resultado disponível.',
      en: 'A system that reads the municipal patient base and sends the right notice to the right person: appointment reminders, campaign calls and result notifications.',
    },
    points: {
      pt: [
        'A fila de disparo sai direto da base do município, com filtro por unidade, procedimento e faixa de data.',
        'Antes dele a lista saía de planilha e cada aviso era uma ligação, um por um.',
        'Fila com retentativa e registro de entrega, porque telefone trocado e número desligado são a regra, não a exceção.',
      ],
      en: [
        'The send queue is built straight from the municipal database, filtered by clinic, procedure and date range.',
        'Before it, the list came out of a spreadsheet and every notice was a phone call, one by one.',
        'A queue with retries and a delivery log, because wrong and disconnected numbers are the rule, not the exception.',
      ],
    },
    tech: ['Java', 'Spring Boot', 'PostgreSQL', 'Integração', 'Agendamento'],
  },
]

export const timeline = [
  {
    period: { pt: 'Abr 2026 até hoje', en: 'Apr 2026 to now' },
    role: { pt: 'Desenvolvedor e analista', en: 'Developer and analyst' },
    org: { pt: 'Bella Casa & Okada', en: 'Bella Casa & Okada' },
    body: {
      pt: 'Respondo pelas plataformas internas da empresa, do banco ao deploy. Levantei o BellaDesk e o BellaBI do zero e sigo com os dois em produção.',
      en: 'I own the company internal platforms end to end, from the database to the deploy. I built BellaDesk and BellaBI from scratch and keep both running in production.',
    },
  },
  {
    period: { pt: 'Fev 2025 a Abr 2026', en: 'Feb 2025 to Apr 2026' },
    role: { pt: 'Estágio em desenvolvimento', en: 'Software engineering intern' },
    org: { pt: 'DETEC, órgão público municipal', en: 'DETEC, municipal public agency' },
    body: {
      pt: 'Legado, integração e o sistema de disparo da saúde. Aprendi ali que dado público chega sujo e que o sistema tem que aguentar isso.',
      en: 'Legacy code, integrations, and the health messaging system. That is where I learned public data arrives dirty and the system has to take it.',
    },
  },
  {
    period: { pt: 'Mai a Dez 2025', en: 'May to Dec 2025' },
    role: { pt: 'Desenvolvedor freelance', en: 'Freelance developer' },
    org: { pt: 'SmartDev', en: 'SmartDev' },
    body: {
      pt: 'Projeto sob demanda, prazo curto, escopo fechado. Foi o que me ensinou a cortar escopo sem quebrar a entrega.',
      en: 'On demand projects, short deadlines, fixed scope. That is what taught me to cut scope without breaking the delivery.',
    },
  },
  {
    period: { pt: '2025 a 2028', en: '2025 to 2028' },
    role: { pt: 'Engenharia de Software', en: 'Software Engineering' },
    org: { pt: 'FAG, Cascavel PR', en: 'FAG, Cascavel, Brazil' },
    body: {
      pt: 'Graduação em andamento, cursando enquanto trabalho.',
      en: 'In progress, studying alongside full time work.',
    },
  },
]

export const certs = [
  {
    name: { pt: 'AWS Certified Developer, Associate', en: 'AWS Certified Developer, Associate' },
    mark: 'AWS',
    note: { pt: 'Certificação oficial, com badge verificável.', en: 'Official certification, verifiable badge.' },
  },
  {
    name: { pt: 'AWS Certified Cloud Practitioner', en: 'AWS Certified Cloud Practitioner' },
    mark: 'AWS',
    note: { pt: 'Certificação oficial, com badge verificável.', en: 'Official certification, verifiable badge.' },
  },
  {
    name: { pt: 'Inglês fluente', en: 'Fluent English' },
    mark: 'CCAA',
    note: {
      pt: 'Certificado CCAA. Trabalho e faço entrevista em inglês, no fuso UTC-3.',
      en: 'CCAA certificate. I work and interview in English, on UTC-3.',
    },
  },
]

export const aiSteps = [
  {
    title: { pt: 'Versionar o prompt', en: 'Version the prompt' },
    body: {
      pt: 'O prompt mora no repositório, ao lado do código que o usa. Mudou o texto, mudou o commit.',
      en: 'The prompt lives in the repository next to the code that uses it. Change the text, change the commit.',
    },
  },
  {
    title: { pt: 'Exigir JSON', en: 'Demand JSON' },
    body: {
      pt: 'A chamada pede saída estruturada. Texto solto do modelo não entra no sistema.',
      en: 'The call asks for structured output. Loose model prose never enters the system.',
    },
  },
  {
    title: { pt: 'Validar o esquema', en: 'Validate the schema' },
    body: {
      pt: 'A resposta vira um tipo antes de virar dado. Campo faltando derruba a chamada, não a tela do usuário.',
      en: 'The answer becomes a type before it becomes data. A missing field fails the call, not the user screen.',
    },
  },
  {
    title: { pt: 'Cair no fallback', en: 'Fall back' },
    body: {
      pt: 'Quando o modelo foge do formato ou a API falha, o serviço responde com o que já tem em mãos.',
      en: 'When the model breaks format or the API fails, the service answers with what it already holds.',
    },
  },
  {
    title: { pt: 'Medir a resposta', en: 'Measure the answer' },
    body: {
      pt: 'Guardo entrada, saída e tempo de resposta, para comparar prompt novo com prompt velho.',
      en: 'I keep input, output and latency, so a new prompt can be measured against the old one.',
    },
  },
]

export const aiDemo = {
  request: 'POST /api/relatorio\n{ "periodo": "semana", "time": "TI" }',
  response: `{
  "resumo": "A semana fechou com o inventário pronto para teste
             e a integração de estoque parada esperando credencial.",
  "riscos": [
    {
      "item": "Integração de estoque",
      "motivo": "sem credencial de homologação desde segunda",
      "severidade": "alta"
    }
  ],
  "proximos_passos": [
    "Liberar a credencial de homologação",
    "Subir o inventário para teste com o time de compras"
  ]
}`,
}

export const t: Record<Lang, Record<string, string>> = {
  pt: {
    navHome: 'Início',
    navProjects: 'Projetos',
    navAi: 'IA aplicada',
    navPath: 'Trajetória',
    navContact: 'Contato',
    heroTitleA: 'Backend em Java.',
    heroTitleB: 'IA em produção.',
    heroSub: 'Construo plataformas internas que empresas usam todo dia. Spring Boot embaixo, Claude ligado no fluxo de trabalho.',
    heroMeta: 'Dev full stack · Cascavel, PR · AWS Certified Developer',
    heroCtaWork: 'Ver projetos',
    heroCtaCv: 'Baixar CV',
    projectsTitle: 'Três sistemas rodando hoje',
    projectsLead: 'Um de empresa privada, um de integração com ERP e um de órgão público. Os três com usuário de verdade do outro lado.',
    shotSlot: 'Espaço reservado para o print da tela',
    aiTitle: 'Como eu coloco um modelo de linguagem dentro de um sistema',
    aiLead: 'Chamar a API não é a parte difícil. Difícil é fazer o resto do sistema confiar na resposta.',
    aiDemoLabel: 'Formato que o serviço exige do modelo',
    aiDemoPlay: 'Rodar exemplo',
    aiDemoReplay: 'Rodar de novo',
    stackTitle: 'Ferramentas',
    pathTitle: 'Trajetória',
    certsTitle: 'Certificações',
    contactTitle: 'Vamos conversar',
    contactBody: 'Aberto a vaga remota no Brasil ou no exterior. Respondo rápido, em português ou inglês.',
    contactCta: 'Falar comigo',
    footerNote: 'Feito com React, Three.js e Tailwind.',
    langLabel: 'EN',
    langSwitch: 'Ver o site em inglês',
    photoSlot: 'Foto',
    aboutTitle: 'Quem escreve isso',
    aboutBody: 'Sou o Luiz, dev full stack em Cascavel, no Paraná. Trabalho no que a empresa usa por dentro: o sistema chato, o que integra com ERP, o que tem papel e permissão. Aprendi Java em legado de órgão público e hoje escrevo o backend que sustenta três plataformas em produção. Quando um modelo de linguagem entra no fluxo, ele entra validado, com fallback e com registro, do mesmo jeito que qualquer outra dependência externa entraria.',
  },
  en: {
    navHome: 'Start',
    navProjects: 'Work',
    navAi: 'Applied AI',
    navPath: 'Path',
    navContact: 'Contact',
    heroTitleA: 'Java on the backend.',
    heroTitleB: 'AI in production.',
    heroSub: 'I build internal platforms companies open every day. Spring Boot underneath, Claude wired into the real workflow.',
    heroMeta: 'Full stack developer · Cascavel, Brazil · AWS Certified Developer',
    heroCtaWork: 'See the work',
    heroCtaCv: 'Download CV',
    projectsTitle: 'Three systems running today',
    projectsLead: 'One private company, one ERP integration, one public agency. All three with real users on the other side.',
    shotSlot: 'Reserved space for the screenshot',
    aiTitle: 'How I put a language model inside a system',
    aiLead: 'Calling the API is not the hard part. Making the rest of the system trust the answer is.',
    aiDemoLabel: 'The output shape the service demands from the model',
    aiDemoPlay: 'Run the example',
    aiDemoReplay: 'Run it again',
    stackTitle: 'Tools',
    pathTitle: 'Path',
    certsTitle: 'Certifications',
    contactTitle: 'Let us talk',
    contactBody: 'Open to remote roles in Brazil or abroad. I answer fast, in English or Portuguese.',
    contactCta: 'Email me',
    footerNote: 'Built with React, Three.js and Tailwind.',
    langLabel: 'PT',
    langSwitch: 'View this site in Portuguese',
    photoSlot: 'Photo',
    aboutTitle: 'Who writes this',
    aboutBody: 'I am Luiz, a full stack developer in Cascavel, Brazil. I work on what a company runs on the inside: the boring system, the one that talks to the ERP, the one with roles and permissions. I learned Java inside public sector legacy code, and today I write the backend behind three platforms in production. When a language model joins the flow, it joins validated, with a fallback and a log, the same way any other external dependency would.',
  },
}

export function pick<T>(v: T | L<T>, lang: Lang): T {
  return v !== null && typeof v === 'object' && 'pt' in (v as object)
    ? (v as L<T>)[lang]
    : (v as T)
}
