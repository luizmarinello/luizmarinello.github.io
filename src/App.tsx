import { Suspense, lazy, useEffect, useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { ArrowDown, DownloadSimple } from '@phosphor-icons/react'
import { contact, figs, pick, t, type Lang } from './data'
import { Button, Corners, Reveal } from './ui'
import type { ReactNode } from 'react'
import { About, Ai, Certs, Contact, Path, Projects, Stack } from './sections'
import { scrollState } from './scene/scrollState'

// A cena WebGL nao bloqueia o primeiro paint do texto.
const Scene = lazy(() => import('./scene/Scene'))

const wrap = 'mx-auto w-full max-w-[1280px] px-5 md:px-8'

/* As oito pranchas, na ordem do scroll, e em que folha cada uma vive.
   Tinta e papel se alternam para a pagina respirar; a de IA fica na
   tinta de proposito, e la que a brasa da peca precisa de fundo escuro. */
const SECTIONS: { id: string; paper: boolean }[] = [
  { id: 'top', paper: false },
  { id: 'sobre', paper: true },
  { id: 'projetos', paper: true },
  { id: 'ia', paper: false },
  { id: 'ferramentas', paper: false },
  { id: 'trajetoria', paper: true },
  { id: 'certificacoes', paper: true },
  { id: 'contato', paper: false },
]

function Nav({ lang, setLang, active }: { lang: Lang; setLang: (l: Lang) => void; active: string }) {
  const c = t[lang]
  const items = [
    { href: '#projetos', label: c.navProjects },
    { href: '#ia', label: c.navAi },
    { href: '#trajetoria', label: c.navPath },
    { href: '#contato', label: c.navContact },
  ]
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className={`${wrap} flex h-16 items-center justify-between gap-6`}>
        <a href="#top" className="tag text-ink">
          Luiz Henrique
        </a>
        <div className="flex items-center gap-5 md:gap-8">
          <ul className="hidden items-center gap-6 md:flex">
            {items.map((i) => (
              <li key={i.href}>
                <a
                  href={i.href}
                  aria-current={active === i.href.slice(1) ? 'true' : undefined}
                  className={`tag flex items-center gap-2 transition duration-150 hover:text-accent ${
                    active === i.href.slice(1) ? 'text-ink' : 'text-muted'
                  }`}
                >
                  <span
                    className={`h-1 w-1 bg-accent transition duration-150 ${
                      active === i.href.slice(1) ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-hidden="true"
                  />
                  {i.label}
                </a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            aria-label={c.langSwitch}
            className="tag border border-ink/40 px-2.5 py-1.5 text-ink transition duration-150 hover:border-accent hover:text-accent active:scale-[0.96]"
          >
            {c.langLabel}
          </button>
        </div>
      </nav>
    </header>
  )
}

/* Cromo de visor, fixo por cima de tudo: cantoneiras nos quatro cantos,
   contador de prancha embaixo a esquerda e a regua de rolagem embaixo no
   centro, com um marcador que anda com a pagina. E a orientacao da
   pagina inteira, sem mobilia nova no meio do conteudo. */
function Chrome({
  lang,
  index,
  progress,
}: {
  lang: Lang
  index: number
  progress: MotionValue<number>
}) {
  const n = String(index + 1).padStart(2, '0')
  return (
    <div className="chrome pointer-events-none fixed inset-0 z-40" aria-hidden="true">
      <div className="absolute inset-4 md:inset-6">
        <Corners size={18} />
      </div>
      <div className="tag absolute bottom-7 left-6 hidden items-baseline gap-3 text-muted md:flex md:left-10">
        <span className="text-ink">{n}</span>
        <span>/ {String(figs.length).padStart(2, '0')}</span>
        <span className="ml-3">{pick(figs[index], lang)}</span>
      </div>
      <div className="absolute inset-x-0 bottom-7 mx-auto hidden w-[min(42vw,420px)] md:block">
        <div className="flex h-3 items-end justify-between">
          {Array.from({ length: 41 }, (_, i) => (
            <span
              key={i}
              className={`w-px bg-ink ${i % 5 === 0 ? 'h-3' : 'h-1.5 opacity-50'}`}
            />
          ))}
        </div>
        {/* o marcador anda direto no estilo, sem passar pelo React */}
        <motion.span
          className="absolute -top-1.5 -ml-px h-6 w-0.5 bg-signal"
          style={{ left: useTransform(progress, (v) => `${v * 100}%`) }}
        />
      </div>
    </div>
  )
}

/* Uma linha do hero. Entra sozinha, com o atraso da sua vez. */
function Line({
  children,
  delay,
  className = '',
}: {
  children: ReactNode
  delay: number
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.span
      className={`block ${className}`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduce ? { duration: 0.2 } : { type: 'spring', bounce: 0, duration: 0.6, delay }
      }
    >
      {children}
    </motion.span>
  )
}

/* Abertura: titulo do tamanho da tela, em caixa alta, com a peca 3D
   ocupando a direita. A etiqueta de figura em cima e o texto de apoio
   em serifa embaixo fazem o resto da prancha. */
function Hero({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section id="top" className="relative flex min-h-[100dvh] flex-col justify-end pt-28 pb-24 md:pb-28">
      <div className={wrap}>
        <Reveal entrance={false}>
          <Line delay={0} className="tag text-accent">
            Fig. 01 — {c.heroMeta}
          </Line>
        </Reveal>
        <h1 className="display mt-6 text-[clamp(2.9rem,10.5vw,10.5rem)] text-ink uppercase">
          <Line delay={0.05}>{c.heroTitleA}</Line>
          <Line delay={0.12} className="text-accent">
            {c.heroTitleB}
          </Line>
        </h1>
        <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
          <Reveal delay={0.22} drift={16} className="md:col-span-6">
            <p className="max-w-[34ch] font-serif text-2xl leading-[1.15] text-muted italic md:text-[2rem]">
              {c.heroSub}
            </p>
          </Reveal>
          <Reveal delay={0.3} drift={16} className="md:col-span-6">
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button href="#projetos" solid>
                {c.heroCtaWork}
                <ArrowDown size={14} weight="bold" />
              </Button>
              <Button href={contact.cv} download>
                {c.heroCtaCv}
                <DownloadSimple size={14} />
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() =>
    typeof navigator !== 'undefined' && navigator.language.startsWith('pt') ? 'pt' : 'en',
  )
  const [index, setIndex] = useState(0)
  const { scrollY, scrollYProgress } = useScroll()

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    scrollState.p = v
  })

  // A peca 3D para no centro de cada secao e so vira entre um centro e
  // o proximo. Medir as secoes a cada scroll custa oito leituras de
  // retangulo, e dispensa recalcular em resize.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const view = y + window.innerHeight / 2
    const centers = SECTIONS.map((s) => {
      const el = document.getElementById(s.id)
      if (!el) return 0
      const r = el.getBoundingClientRect()
      return y + r.top + r.height / 2
    })
    let stage = 0
    for (let i = 0; i < centers.length - 1; i++) {
      if (view >= centers[i]) {
        stage = i + Math.min(1, Math.max(0, (view - centers[i]) / (centers[i + 1] - centers[i])))
      }
    }
    scrollState.stage = stage
  })

  // A prancha atual e a ultima da lista que cruza a faixa central da
  // tela. Ela decide o contador, o link aceso na barra e em que folha
  // (tinta ou papel) a pagina esta.
  useEffect(() => {
    const seen = new Map<string, boolean>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting)
        let at = 0
        SECTIONS.forEach((s, i) => {
          if (seen.get(s.id)) at = i
        })
        setIndex(at)
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const paper = SECTIONS[index].paper
    document.documentElement.dataset.tone = paper ? 'paper' : 'ink'
    scrollState.tone = paper ? 1 : 0
  }, [index])

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  }, [lang])

  const active = SECTIONS[index].id

  return (
    <>
      <div className="sheet" aria-hidden="true" />
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <div className="grain" />
      <Nav lang={lang} setLang={setLang} active={active} />
      <Chrome lang={lang} index={index} progress={scrollYProgress} />
      <main className="relative z-10">
        <Hero lang={lang} />
        <About lang={lang} />
        <Projects lang={lang} />
        <Ai lang={lang} />
        <Stack lang={lang} />
        <Path lang={lang} />
        <Certs lang={lang} />
        <Contact lang={lang} />
      </main>
    </>
  )
}
