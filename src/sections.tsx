import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { ArrowUpRight, Play, ArrowClockwise } from '@phosphor-icons/react'
import {
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
import { LogoChip, Panel, Reveal, SectionTitle } from './ui'

const wrap = 'mx-auto w-full max-w-[1180px] px-5 md:px-8'

/* Espaco reservado para imagem que ainda nao existe. Some sozinho
   assim que o arquivo for apontado em data.ts. */
function Slot({ label, ratio }: { label: string; ratio: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-[14px] border border-dashed border-line bg-white/[0.02]"
      style={{ aspectRatio: ratio }}
    >
      <span className="px-4 text-center font-mono text-xs tracking-wide text-muted">
        {label}
      </span>
    </div>
  )
}

export function About({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section id="sobre" className={`${wrap} py-28 md:py-40`}>
      <div className="grid items-center gap-10 md:grid-cols-12 md:gap-16">
        <Reveal className="md:col-span-5" drift={-70}>
          {contact.photo ? (
            <img
              src={contact.photo}
              alt="Luiz Henrique Marinello da Rosa"
              className="w-full rounded-[14px] border border-line object-cover"
              style={{ aspectRatio: '4 / 5' }}
            />
          ) : (
            <Slot label={`${c.photoSlot} 900 x 1125`} ratio="4 / 5" />
          )}
        </Reveal>
        <div className="md:col-span-7">
          <SectionTitle drift={70}>{c.aboutTitle}</SectionTitle>
          <Reveal delay={0.05} drift={70}>
            <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-muted md:text-lg">
              {c.aboutBody}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* Pilha grudenta: cada projeto para no topo e o proximo sobe por cima.
   Feito so com position sticky, sem ouvir scroll. */
export function Projects({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section id="projetos" className="py-24 md:py-32">
      <div className={wrap}>
        <SectionTitle lead={c.projectsLead} drift={-60}>{c.projectsTitle}</SectionTitle>
      </div>

      <div className={`${wrap} mt-14 md:mt-20`}>
        {projects.map((p, i) => (
          <div key={p.id} className="sticky top-24 pb-6" style={{ zIndex: 10 + i }}>
            <Panel className="overflow-hidden p-6 md:p-10">
              <div className="grid gap-8 md:grid-cols-12 md:gap-12">
                <div className="md:col-span-7">
                  <div className="flex items-baseline gap-3 font-mono text-xs text-muted">
                    <span className="text-accent">{p.year}</span>
                    <span>{pick(p.client, lang)}</span>
                  </div>
                  <h3 className="mt-3 text-2xl leading-tight font-medium tracking-[-0.02em] text-ink md:text-4xl">
                    {pick(p.name, lang)}
                  </h3>
                  <p className="mt-4 max-w-[54ch] leading-relaxed text-muted">
                    {pick(p.summary, lang)}
                  </p>
                  <ul className="mt-6 grid gap-3">
                    {pick(p.points, lang).map((point) => (
                      <li key={point} className="flex gap-3 text-sm leading-relaxed text-ink/80">
                        <span className="mt-2 h-px w-4 shrink-0 bg-accent/70" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 flex flex-wrap gap-2">
                    {p.tech.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-muted"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-5">
                  {p.shot ? (
                    <img
                      src={p.shot}
                      alt={String(pick(p.name, lang))}
                      className="w-full rounded-[14px] border border-line object-cover"
                      style={{ aspectRatio: '4 / 3' }}
                    />
                  ) : (
                    <Slot label={`${c.shotSlot} 1200 x 900`} ratio="4 / 3" />
                  )}
                </div>
              </div>
            </Panel>
          </div>
        ))}
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
    <Panel className="overflow-hidden">
      <div className="border-b border-line px-5 py-3 font-mono text-[11px] tracking-wide text-muted">
        {c.aiDemoLabel}
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[11.5px] leading-relaxed text-muted md:text-xs">
        {aiDemo.request}
      </pre>
      <pre className="min-h-[19rem] overflow-x-auto border-t border-line px-5 py-4 font-mono text-[11.5px] leading-relaxed text-ink/90 md:text-xs">
        {aiDemo.response.slice(0, n)}
        {!done && <span className="text-accent">|</span>}
      </pre>
      <div className="border-t border-line p-3">
        <button
          type="button"
          onPointerDown={run}
          className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-sm text-ink transition-transform duration-100 active:scale-[0.97]"
        >
          {done && n > 0 ? <ArrowClockwise size={15} /> : <Play size={15} weight="fill" />}
          {done && n > 0 ? c.aiDemoReplay : c.aiDemoPlay}
        </button>
      </div>
    </Panel>
  )
}

export function Ai({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section id="ia" className={`${wrap} py-28 md:py-40`}>
      <SectionTitle lead={c.aiLead} drift={60}>{c.aiTitle}</SectionTitle>
      <div className="mt-14 grid gap-12 md:grid-cols-12 md:gap-16">
        <ol className="order-1 md:order-2 md:col-span-6">
          {aiSteps.map((s, i) => (
            <Reveal key={i} delay={i * 0.05} drift={-70}>
              <li className="relative flex gap-5 pb-9 last:pb-0">
                <span
                  className="absolute top-6 bottom-0 left-[7px] w-px bg-line"
                  aria-hidden="true"
                />
                <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border border-accent bg-bg" />
                <div>
                  <h3 className="text-lg font-medium text-ink">{pick(s.title, lang)}</h3>
                  <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-muted">
                    {pick(s.body, lang)}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal className="order-2 md:order-1 md:col-span-6" delay={0.1} drift={70}>
          <Replay lang={lang} />
        </Reveal>
      </div>
    </section>
  )
}

export function Stack({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section className={`${wrap} py-20 md:py-28`}>
      <SectionTitle drift={50}>{c.stackTitle}</SectionTitle>
      <div className="mt-10 grid gap-8">
        {stack.map((group, i) => (
          <Reveal key={group.label.pt} delay={i * 0.05} drift={i % 2 ? 45 : -45}>
            <div className="grid gap-4 border-t border-line pt-6 md:grid-cols-12">
              <h3 className="font-mono text-xs tracking-wide text-muted md:col-span-3">
                {pick(group.label, lang)}
              </h3>
              <div className="flex flex-wrap gap-2 md:col-span-9">
                {group.items.map((item) => (
                  <LogoChip key={item.name} name={item.name} slug={item.slug} />
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Path({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section id="trajetoria" className={`${wrap} py-24 md:py-32`}>
      <SectionTitle drift={-50}>{c.pathTitle}</SectionTitle>
      <div className="mt-12 grid gap-px overflow-hidden rounded-[14px] border border-line bg-line">
        {timeline.map((item, i) => (
          <Reveal key={i} delay={i * 0.04}>
            <div className="grid gap-3 bg-bg p-6 md:grid-cols-12 md:gap-8 md:p-8">
              <div className="font-mono text-xs text-accent md:col-span-3">
                {pick(item.period, lang)}
              </div>
              <div className="md:col-span-9">
                <h3 className="text-lg font-medium text-ink">
                  {pick(item.role, lang)}
                </h3>
                <p className="mt-0.5 text-sm text-muted">{pick(item.org, lang)}</p>
                <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-ink/75">
                  {pick(item.body, lang)}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function Certs({ lang }: { lang: Lang }) {
  const c = t[lang]
  return (
    <section className={`${wrap} py-20 md:py-28`}>
      <SectionTitle drift={50}>{c.certsTitle}</SectionTitle>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {certs.map((cert, i) => (
          <Reveal key={i} delay={i * 0.05} drift={(i - 1) * 55}>
            <Panel className="flex h-full flex-col justify-between gap-8 p-6">
              <span className="font-mono text-sm tracking-wide text-accent">{cert.mark}</span>
              <div>
                <h3 className="text-base leading-snug font-medium text-ink">
                  {pick(cert.name, lang)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {pick(cert.note, lang)}
                </p>
              </div>
            </Panel>
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
    <section id="contato" className={`${wrap} py-32 text-center md:py-44`}>
      <Reveal drift={40}>
        <h2 className="mx-auto max-w-[14ch] text-4xl leading-[1.02] font-medium tracking-[-0.03em] text-ink md:text-7xl">
          {c.contactTitle}
        </h2>
        <p className="mx-auto mt-6 max-w-[48ch] leading-relaxed text-muted">
          {c.contactBody}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-[#0a0a0b] transition-transform duration-100 active:scale-[0.97]"
            >
              {c.contactCta}
              <ArrowUpRight size={16} weight="bold" />
            </a>
          )}
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-6 py-3 text-ink transition-transform duration-100 active:scale-[0.97]"
            >
              {l.label}
              <ArrowUpRight size={16} />
            </a>
          ))}
        </div>
      </Reveal>
      <p className="mt-24 font-mono text-xs text-muted">{c.footerNote}</p>
    </section>
  )
}
