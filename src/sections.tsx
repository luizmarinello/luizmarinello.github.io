import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { ArrowUpRight, Play, ArrowClockwise } from '@phosphor-icons/react'
import {
  aboutSpecs,
  aiDemo,
  aiSteps,
  certs,
  contact,
  pick,
  projects,
  stack,
  t,
  timeline,
  type Lang,
} from './data'
import { Button, Frame, Reveal, SectionTitle } from './ui'

const wrap = 'mx-auto w-full max-w-[1280px] px-5 md:px-8'

export function About({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section id="sobre" className={`${wrap} py-28 md:py-40`}>
      <div className="grid items-start gap-12 md:grid-cols-12 md:gap-16">
        <Reveal className="md:col-span-5" drift={-24}>
          <Frame
            src={contact.photo}
            alt="Luiz Henrique Marinello da Rosa"
            label={`${c.photoSlot} 900 × 1125`}
            ratio="4 / 5"
          />
        </Reveal>
        <div className="md:col-span-7">
          <SectionTitle fig="02" drift={24}>
            {c.aboutTitle}
          </SectionTitle>
          <Reveal delay={0.05} drift={24}>
            <p className="mt-8 max-w-[60ch] text-lg leading-relaxed text-ink/85 md:text-xl">
              {c.aboutBody}
            </p>
            <dl className="mt-10 grid grid-cols-3 border-t border-line">
              {pick(aboutSpecs, lang).map(([k, v]) => (
                <div key={k} className="border-r border-line py-4 pr-4 last:border-r-0">
                  <dt className="tag text-muted">{k}</dt>
                  <dd className="mt-2 text-sm text-ink md:text-base">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* Lista de pecas. Cada projeto e uma linha da prancha: numero vazado,
   especificacao, itens numerados e o campo do print. Sem card: os fios
   horizontais sao a unica separacao. */
export function Projects({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section id="projetos" className={`${wrap} py-24 md:py-32`}>
      <SectionTitle fig="03" lead={c.projectsLead} drift={-22}>
        {c.projectsTitle}
      </SectionTitle>

      <div className="mt-16 md:mt-24">
        {projects.map((p, i) => (
          <Reveal key={p.id} drift={i % 2 ? 18 : -18}>
            <article className="grid gap-8 border-t border-line py-12 md:grid-cols-12 md:gap-10 md:py-16">
              <div className="md:col-span-2">
                <span className="outline-num display block text-[clamp(4rem,9vw,8.5rem)]">
                  0{i + 1}
                </span>
              </div>
              <div className="md:col-span-6">
                <div className="tag flex flex-wrap gap-x-5 gap-y-1 text-muted">
                  <span className="text-accent">{p.year}</span>
                  <span>{pick(p.client, lang)}</span>
                </div>
                <h3 className="display mt-4 text-[clamp(2rem,4.2vw,3.8rem)] text-ink">
                  {pick(p.name, lang)}
                </h3>
                <p className="mt-5 max-w-[50ch] font-serif text-xl leading-snug text-muted italic md:text-2xl">
                  {pick(p.summary, lang)}
                </p>
                <ol className="mt-8 border-t border-line">
                  {pick(p.points, lang).map((point, k) => (
                    <li
                      key={point}
                      className="grid grid-cols-[3.2rem_1fr] gap-3 border-b border-line py-3.5 text-sm leading-relaxed text-ink/85"
                    >
                      <span className="tag pt-1 text-accent">
                        {i + 1}.{k + 1}
                      </span>
                      {point}
                    </li>
                  ))}
                </ol>
                <p className="tag mt-6 text-muted">{p.tech.join(' / ')}</p>
              </div>
              <div className="md:col-span-4">
                <Frame
                  src={p.shot}
                  alt={String(pick(p.name, lang))}
                  label={`${c.shotSlot} 1200 × 900`}
                  ratio="4 / 3"
                />
              </div>
            </article>
          </Reveal>
        ))}
        <div className="border-t border-line" aria-hidden="true" />
      </div>
    </section>
  )
}

function Replay({ lang }: { lang: Lang }) {
  const c = t[lang]
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? aiDemo.response.length : 0)
  const timer = useRef<number | null>(null)

  const run = () => {
    if (timer.current) window.clearInterval(timer.current)
    setN(0)
    timer.current = window.setInterval(() => {
      setN((v) => {
        if (v >= aiDemo.response.length) {
          if (timer.current) window.clearInterval(timer.current)
          return v
        }
        return v + 3
      })
    }, 16)
  }

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current)
  }, [])

  const done = n >= aiDemo.response.length

  return (
    <div className="border border-line bg-bg/80">
      <div className="tag flex items-center gap-3 border-b border-line px-5 py-3 text-muted">
        <span className="h-1.5 w-1.5 bg-signal" aria-hidden="true" />
        {c.aiDemoLabel}
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[11.5px] leading-relaxed text-muted md:text-xs">
        {aiDemo.request}
      </pre>
      <pre className="min-h-[19rem] overflow-x-auto border-t border-line px-5 py-4 font-mono text-[11.5px] leading-relaxed text-ink/90 md:text-xs">
        {aiDemo.response.slice(0, n)}
        {!done && <span className="text-signal">▌</span>}
      </pre>
      <div className="border-t border-line p-3">
        <button
          type="button"
          onPointerDown={run}
          className="tag inline-flex items-center gap-2 border border-ink/40 px-4 py-2.5 text-ink transition duration-150 hover:border-accent hover:text-accent active:scale-[0.97]"
        >
          {done && n > 0 ? <ArrowClockwise size={14} /> : <Play size={14} weight="fill" />}
          {done && n > 0 ? c.aiDemoReplay : c.aiDemoPlay}
        </button>
      </div>
    </div>
  )
}

export function Ai({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section id="ia" className={`${wrap} py-28 md:py-40`}>
      <SectionTitle fig="04" lead={c.aiLead} drift={22}>
        {c.aiTitle}
      </SectionTitle>
      <div className="mt-16 grid gap-12 md:grid-cols-12 md:gap-16">
        <ol className="order-1 bg-bg/70 md:order-2 md:col-span-6">
          {aiSteps.map((s, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <li className="grid grid-cols-[3.5rem_1fr] gap-4 border-t border-line py-6 last:border-b">
                <span className="tag pt-1.5 text-accent">0{i + 1}</span>
                <div>
                  <h3 className="text-xl font-medium tracking-[-0.01em] text-ink">
                    {pick(s.title, lang)}
                  </h3>
                  <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted">
                    {pick(s.body, lang)}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal className="order-2 md:order-1 md:col-span-6" delay={0.1} drift={24}>
          <Replay lang={lang} />
        </Reveal>
      </div>
    </section>
  )
}

export function Stack({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section id="ferramentas" className={`${wrap} py-20 md:py-28`}>
      <SectionTitle fig="05" drift={18}>
        {c.stackTitle}
      </SectionTitle>
      <div className="mt-12">
        {stack.map((group, i) => (
          <Reveal key={group.label.pt} delay={i * 0.05} drift={i % 2 ? 16 : -16}>
            <div className="grid gap-3 border-t border-line py-6 md:grid-cols-12 md:gap-8">
              <h3 className="tag pt-2 text-muted md:col-span-3">{pick(group.label, lang)}</h3>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xl font-medium tracking-[-0.02em] text-ink md:col-span-7 md:text-2xl">
                {group.items.map((item, k) => (
                  <li key={item.name} className="flex gap-3">
                    {item.name}
                    {k < group.items.length - 1 && (
                      <span className="text-muted/50" aria-hidden="true">
                        /
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
        <div className="border-t border-line" aria-hidden="true" />
      </div>
    </section>
  )
}

export function Path({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section id="trajetoria" className={`${wrap} py-24 md:py-32`}>
      <SectionTitle fig="06" drift={-18}>
        {c.pathTitle}
      </SectionTitle>
      <div className="mt-12">
        {timeline.map((item, i) => (
          <Reveal key={i} delay={i * 0.04}>
            <div className="grid gap-3 border-t border-line py-7 md:grid-cols-12 md:gap-8">
              <div className="tag pt-1.5 text-accent md:col-span-3">{pick(item.period, lang)}</div>
              <div className="md:col-span-9">
                <h3 className="text-2xl font-medium tracking-[-0.02em] text-ink md:text-3xl">
                  {pick(item.role, lang)}
                </h3>
                <p className="mt-1 font-serif text-lg text-muted italic">{pick(item.org, lang)}</p>
                <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-ink/80 md:text-base">
                  {pick(item.body, lang)}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
        <div className="border-t border-line" aria-hidden="true" />
      </div>
    </section>
  )
}

export function Certs({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section id="certificacoes" className={`${wrap} py-20 md:py-28`}>
      <SectionTitle fig="07" drift={18}>
        {c.certsTitle}
      </SectionTitle>
      <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
        {certs.map((cert, i) => (
          <Reveal key={i} delay={i * 0.05} drift={(i - 1) * 20}>
            <div className="flex h-full flex-col justify-between gap-10 border-t border-line pt-6">
              <span className="display text-4xl text-accent md:text-5xl">{cert.mark}</span>
              <div>
                <h3 className="text-lg leading-snug font-medium text-ink">{pick(cert.name, lang)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{pick(cert.note, lang)}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Contact({ lang }: { lang: Lang }) {
  const c = t[lang]
  const links = [
    contact.github && { label: 'GitHub', href: contact.github },
    contact.linkedin && { label: 'LinkedIn', href: contact.linkedin },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <section id="contato" className={`${wrap} py-32 md:py-44`}>
      <Reveal drift={14}>
        <div className="flex items-center gap-4 text-accent">
          <span className="tag">Fig. 08</span>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </div>
        <h2 className="display mt-8 text-[clamp(3.2rem,12vw,11rem)] text-ink uppercase">
          {c.contactTitle}
        </h2>
        <div className="mt-10 grid gap-10 md:grid-cols-12">
          <p className="max-w-[34ch] font-serif text-2xl leading-[1.2] text-muted italic md:col-span-6 md:text-3xl">
            {c.contactBody}
          </p>
          <div className="flex flex-wrap items-start gap-3 md:col-span-6 md:justify-end">
            {contact.email && (
              <Button href={`mailto:${contact.email}`} solid>
                {c.contactCta}
                <ArrowUpRight size={14} weight="bold" />
              </Button>
            )}
            {links.map((l) => (
              <Button key={l.label} href={l.href} external>
                {l.label}
                <ArrowUpRight size={14} />
              </Button>
            ))}
          </div>
        </div>
      </Reveal>
      <div className="tag mt-28 flex flex-wrap justify-between gap-4 border-t border-line pt-5 text-muted">
        <span>{c.footerNote}</span>
        <span>Cascavel, PR · UTC-3</span>
      </div>
    </section>
  )
}
