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
import { contact, t, type Lang } from './data'
import { Reveal } from './ui'
import type { ReactNode } from 'react'
import { About, Ai, Certs, Contact, Path, Projects, Stack } from './sections'
import { scrollState } from './scene/scrollState'

// A cena WebGL nao bloqueia o primeiro paint do texto.
const Scene = lazy(() => import('./scene/Scene'))

const wrap = 'mx-auto w-full max-w-[1180px] px-5 md:px-8'

function Nav({
  lang,
  setLang,
  active,
  progress,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  active: string
  progress: MotionValue<number>
}) {
  const c = t[lang]
  const items = [
    { href: '#projetos', label: c.navProjects },
    { href: '#ia', label: c.navAi },
    { href: '#trajetoria', label: c.navPath },
    { href: '#contato', label: c.navContact },
  ]
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16">
      <div className="h-full bg-bg/60 backdrop-blur-xl supports-[not(backdrop-filter:blur(0))]:bg-bg">
        <nav className={`${wrap} flex h-16 items-center justify-between gap-6`}>
          <a href="#top" className="text-sm font-medium tracking-[-0.01em] text-ink">
            Luiz Henrique
          </a>
          <div className="flex items-center gap-1 md:gap-2">
            <ul className="hidden items-center gap-1 md:flex">
              {items.map((i) => (
                <li key={i.href}>
                  <a
                    href={i.href}
                    aria-current={active === i.href.slice(1) ? 'true' : undefined}
                    className={`rounded-full px-3 py-2 text-sm transition duration-150 hover:bg-white/[0.05] hover:text-ink ${
                      active === i.href.slice(1) ? 'text-ink' : 'text-muted'
                    }`}
                  >
                    {i.label}
                  </a>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
              aria-label={c.langSwitch}
              className="rounded-full border border-line px-3 py-1.5 font-mono text-xs text-ink transition duration-150 hover:border-accent/60 hover:text-accent active:scale-[0.96]"
            >
              {c.langLabel}
            </button>
          </div>
        </nav>
      </div>
      {/* o quanto da pagina ja passou, no fio de cima da barra */}
      <motion.div
        className="absolute inset-x-0 top-0 h-px origin-left bg-accent"
        style={{ scaleX: progress }}
        aria-hidden="true"
      />
      {/* borda macia onde o conteudo passa por baixo da barra */}
      <div className="h-8 bg-gradient-to-b from-bg/60 to-transparent" aria-hidden="true" />
    </header>
  )
}

/* Uma linha do hero. Entra sozinha, com o atraso da sua vez: a primeira
   dobra ganha hierarquia em vez de ser um retangulo unico que aparece. */
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
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduce ? { duration: 0.2 } : { type: 'spring', bounce: 0, duration: 0.5, delay }
      }
    >
      {children}
    </motion.span>
  )
}

function Hero({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section id="top" className="relative flex min-h-[100dvh] items-center pt-24">
      <div className={`${wrap} grid gap-10 md:grid-cols-12`}>
        <div className="md:col-span-7">
          <Reveal drift={20} entrance={false}>
            <h1 className="text-[clamp(2.2rem,4.6vw,3.8rem)] leading-[1.02] font-medium tracking-[-0.035em] text-ink">
              <Line delay={0}>{c.heroTitleA}</Line>
              <Line delay={0.06} className="text-accent">
                {c.heroTitleB}
              </Line>
            </h1>
          </Reveal>
          <Reveal delay={0.14} drift={20}>
            <p className="mt-7 max-w-[46ch] text-base leading-relaxed text-muted md:text-lg">
              {c.heroSub}
            </p>
          </Reveal>
          <Reveal delay={0.22} drift={20}>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#projetos"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-[#0a0a0b] transition duration-150 hover:brightness-110 active:scale-[0.97]"
              >
                {c.heroCtaWork}
                <ArrowDown size={16} weight="bold" />
              </a>
              <a
                href={contact.cv}
                download
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-6 py-3 text-ink transition duration-150 hover:border-accent/50 hover:bg-white/[0.07] active:scale-[0.97]"
              >
                {c.heroCtaCv}
                <DownloadSimple size={16} />
              </a>
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
  const [active, setActive] = useState('')
  const { scrollYProgress } = useScroll()

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    scrollState.p = v
  })

  // A diferenca aqui e de dois a quatro pontos por canal, de proposito: e
  // para amarrar a pagina ao mesmo sistema, nao para virar outro tema.
  const bg = useTransform(
    scrollYProgress,
    [0, 0.42, 0.6, 1],
    ['#08080a', '#0a0908', '#0c0907', '#09080a'],
  )

  useEffect(() => {
    const ids = ['projetos', 'ia', 'trajetoria', 'contato']
    const seen = new Map<string, boolean>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting)
        // o ultimo da lista que estiver na tela e a secao atual
        setActive(ids.filter((id) => seen.get(id)).pop() ?? '')
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  }, [lang])

  return (
    <>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <motion.div className="fixed inset-0 -z-10" style={{ background: bg }} aria-hidden="true" />
      <div className="grain" />
      <Nav lang={lang} setLang={setLang} active={active} progress={scrollYProgress} />
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
