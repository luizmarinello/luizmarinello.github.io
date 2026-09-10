import { Suspense, lazy, useEffect, useState } from 'react'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { ArrowDown, DownloadSimple } from '@phosphor-icons/react'
import { contact, t, type Lang } from './data'
import { Reveal } from './ui'
import { About, Ai, Certs, Contact, Path, Projects, Stack } from './sections'
import { scrollState } from './scene/scrollState'

// A cena WebGL nao bloqueia o primeiro paint do texto.
const Scene = lazy(() => import('./scene/Scene'))

const wrap = 'mx-auto w-full max-w-[1180px] px-5 md:px-8'

function Nav({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
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
                    className="rounded-full px-3 py-2 text-sm text-muted transition duration-150 hover:bg-white/[0.05] hover:text-ink"
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
      {/* borda macia onde o conteudo passa por baixo da barra */}
      <div className="h-8 bg-gradient-to-b from-bg/60 to-transparent" aria-hidden="true" />
    </header>
  )
}

function Hero({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section id="top" className="relative flex min-h-[100dvh] items-center pt-24">
      <div className={`${wrap} grid gap-10 md:grid-cols-12`}>
        <div className="md:col-span-7">
          <Reveal drift={20}>
            <h1 className="text-[clamp(2.2rem,4.6vw,3.8rem)] leading-[1.02] font-medium tracking-[-0.035em] text-ink">
              {c.heroTitleA}
              <br />
              <span className="text-accent">{c.heroTitleB}</span>
            </h1>
          </Reveal>
          <Reveal delay={0.07} drift={20}>
            <p className="mt-7 max-w-[46ch] text-base leading-relaxed text-muted md:text-lg">
              {c.heroSub}
            </p>
          </Reveal>
          <Reveal delay={0.14} drift={20}>
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
  const { scrollYProgress } = useScroll()

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    scrollState.p = v
  })

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  }, [lang])

  return (
    <>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <div className="grain" />
      <Nav lang={lang} setLang={setLang} />
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
