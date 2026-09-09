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
}: {
  children: ReactNode
  delay?: number
  className?: string
  drift?: number
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
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={
        reduce ? { duration: 0.2 } : { type: 'spring', bounce: 0, duration: 0.55, delay }
      }
    >
      {children}
    </motion.div>
  )
}

export function SectionTitle({
  children,
  lead,
  drift = 0,
}: {
  children: ReactNode
  lead?: string
  drift?: number
}) {
  return (
    <Reveal drift={drift}>
      <h2 className="max-w-[22ch] text-3xl leading-[1.08] font-medium tracking-[-0.025em] text-ink md:text-5xl">
        {children}
      </h2>
      {lead && (
        <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-muted md:text-lg">
          {lead}
        </p>
      )}
    </Reveal>
  )
}

/* Painel de vidro. Escurece o suficiente para o texto ficar legivel
   por cima da cena 3D, e cai para fundo solido quando o sistema pede
   menos transparencia. */
export function Panel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[14px] border border-line bg-surface/70 backdrop-blur-xl supports-[not(backdrop-filter:blur(0))]:bg-surface ${className}`}
    >
      {children}
    </div>
  )
}

export function LogoChip({ name, slug }: { name: string; slug: string | null }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3.5 py-1.5 text-sm text-ink/90">
      {slug && (
        <img
          src={`https://cdn.simpleicons.org/${slug}/8d8d98`}
          alt=""
          width={14}
          height={14}
          loading="lazy"
          className="h-3.5 w-3.5 opacity-80"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
      {name}
    </span>
  )
}
