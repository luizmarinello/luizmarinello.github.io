import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef, type ReactNode } from 'react'

const narrow =
  typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

/* Entrada de secao mais a deriva horizontal.
   `drift` em pixels: o bloco entra deslocado para um lado e sai pelo outro,
   no sentido contrario ao do solido 3D daquela secao. Sinal alternado entre
   secoes vizinhas e o que faz os dois se cruzarem no meio do scroll.
   Com movimento reduzido nao ha deriva nem deslize, so um cross fade curto. */
export function Reveal({
  children,
  delay = 0,
  className,
  drift = 0,
  entrance = true,
}: {
  children: ReactNode
  delay?: number
  className?: string
  drift?: number
  /** Desligue quando quem entra sao os filhos, um a um, e este aqui e so
      o trilho da deriva horizontal: senao os dois fades se somam. */
  entrance?: boolean
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const amount = drift * (narrow ? 0.35 : 1)
  const x = useTransform(scrollYProgress, [0, 1], [amount, -amount])

  return (
    <motion.div
      ref={ref}
      className={className}
      style={reduce || !drift ? undefined : { x }}
      initial={entrance ? (reduce ? { opacity: 0 } : { opacity: 0, y: 22 }) : false}
      whileInView={entrance ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount: 0.25 }}
      transition={
        reduce ? { duration: 0.2 } : { type: 'spring', bounce: 0, duration: 0.55, delay }
      }
    >
      {children}
    </motion.div>
  )
}

/* Cabecalho de figura: numero da prancha, fio, titulo grande e, se
   houver, a legenda em serifa italica. */
export function SectionTitle({
  fig,
  children,
  lead,
  drift = 0,
}: {
  fig: string
  children: ReactNode
  lead?: string
  drift?: number
}) {
  return (
    <Reveal drift={drift}>
      <div className="flex items-center gap-4 text-accent">
        <span className="tag">Fig. {fig}</span>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>
      <h2 className="display mt-6 max-w-[18ch] text-[clamp(2.2rem,5vw,4.6rem)] text-ink uppercase">
        {children}
      </h2>
      {lead && (
        <p className="mt-6 max-w-[40ch] font-serif text-2xl leading-[1.2] text-muted italic md:text-[2rem]">
          {lead}
        </p>
      )}
    </Reveal>
  )
}

/* Cantoneiras de visor: quatro cantos de 1px. */
export function Corners({ className = '', size = 14 }: { className?: string; size?: number }) {
  const s = `${size}px`
  const c = 'absolute border-ink'
  return (
    <span className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      <span className={`${c} top-0 left-0 border-t border-l`} style={{ width: s, height: s }} />
      <span className={`${c} top-0 right-0 border-t border-r`} style={{ width: s, height: s }} />
      <span className={`${c} bottom-0 left-0 border-b border-l`} style={{ width: s, height: s }} />
      <span className={`${c} right-0 bottom-0 border-r border-b`} style={{ width: s, height: s }} />
    </span>
  )
}

/* Campo de imagem. Com arquivo, mostra a imagem com cantoneiras. Sem,
   mostra a hachura de "reservado" com a medida, como num desenho que
   ainda espera a foto. Some sozinho quando o arquivo for apontado em
   data.ts. */
export function Frame({
  src,
  alt,
  label,
  ratio,
}: {
  src: string | null
  alt: string
  label: string
  ratio: string
}) {
  return (
    <div className="relative p-3">
      <Corners />
      {src ? (
        <img src={src} alt={alt} className="w-full object-cover" style={{ aspectRatio: ratio }} />
      ) : (
        <div
          className="hatch flex items-center justify-center border border-line"
          style={{ aspectRatio: ratio }}
        >
          <span className="tag bg-bg px-3 py-1.5 text-muted">{label}</span>
        </div>
      )}
    </div>
  )
}

/* Botao de desenho tecnico: retangulo de 1px, etiqueta mono. `solid`
   e o unico cheio da tela. */
export function Button({
  href,
  children,
  solid = false,
  download = false,
  external = false,
}: {
  href: string
  children: ReactNode
  solid?: boolean
  download?: boolean
  external?: boolean
}) {
  const base =
    'tag inline-flex items-center gap-3 px-5 py-3.5 transition duration-150 active:scale-[0.97]'
  const look = solid
    ? 'bg-ink text-bg hover:bg-accent hover:text-white'
    : 'border border-ink/40 text-ink hover:border-accent hover:text-accent'
  return (
    <a
      href={href}
      download={download || undefined}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={`${base} ${look}`}
    >
      {children}
    </a>
  )
}
