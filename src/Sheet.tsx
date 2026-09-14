import { useEffect, useRef } from 'react'
import { useMedia } from './ui'

/* Folha quadriculada de papel tecnico, desenhada num canvas para as
   linhas poderem entortar: perto do cursor elas afundam para dentro,
   como a malha de espaco-tempo dos desenhos de relatividade. A cor de
   fundo fica no div de fora, que e quem faz a transicao tinta/papel. */

/** Passo da malha, raio do poco e o quanto a linha afunda no centro. */
const STEP = 72
const RADIUS = 260
const DEPTH = 34

export function Sheet() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const still = useMedia('(prefers-reduced-motion: reduce)')

  useEffect(() => {
    const cv = canvas.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    // posicao do poco: alvo e a real, amortecida, para a malha nao
    // pular junto com o cursor
    const m = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 }
    let raf = 0
    let dpr = 1

    const warp = (x: number, y: number): [number, number] => {
      const dx = m.x - x
      const dy = m.y - y
      const d = Math.hypot(dx, dy) || 1
      const k = DEPTH * Math.exp(-(d * d) / (RADIUS * RADIUS))
      return [x + (dx / d) * k, y + (dy / d) * k]
    }

    const lines = (w: number, h: number, near: boolean) => {
      // `near` limita as linhas as que passam perto do poco, para a
      // passada de brilho nao redesenhar a folha inteira
      const x0 = (w / 2) % STEP
      const y0 = (h / 2) % STEP
      const seg = 16
      for (let x = x0; x <= w; x += STEP) {
        if (near && Math.abs(x - m.x) > RADIUS) continue
        ctx.beginPath()
        for (let y = -seg; y <= h + seg; y += seg) {
          const [px, py] = warp(x, y)
          if (y < 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }
      for (let y = y0; y <= h; y += STEP) {
        if (near && Math.abs(y - m.y) > RADIUS) continue
        ctx.beginPath()
        for (let x = -seg; x <= w + seg; x += seg) {
          const [px, py] = warp(x, y)
          if (x < 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }
    }

    const draw = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const cs = getComputedStyle(document.documentElement)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 1
      ctx.strokeStyle = cs.getPropertyValue('--tone-grid').trim()
      lines(w, h, false)
      // lanterna: as linhas perto do cursor acendem na cor de acento
      if (m.x > -1e3) {
        const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, RADIUS)
        const hot = cs.getPropertyValue('--tone-accent').trim()
        glow.addColorStop(0, hot)
        glow.addColorStop(1, 'transparent')
        ctx.globalAlpha = 0.4
        ctx.strokeStyle = glow
        lines(w, h, true)
        ctx.globalAlpha = 1
      }
    }

    const tick = () => {
      m.x += (m.tx - m.x) * 0.14
      m.y += (m.ty - m.y) * 0.14
      draw()
      raf =
        Math.abs(m.tx - m.x) + Math.abs(m.ty - m.y) > 0.3 ? requestAnimationFrame(tick) : 0
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const move = (e: PointerEvent) => {
      m.tx = e.clientX
      m.ty = e.clientY
      wake()
    }
    const leave = () => {
      m.tx = -1e4
      m.ty = -1e4
      // sem amortecer a saida: senao a malha atravessa a tela inteira
      m.x = m.tx
      m.y = m.ty
      wake()
    }
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = window.innerWidth * dpr
      cv.height = window.innerHeight * dpr
      draw()
    }

    resize()
    window.addEventListener('resize', resize)
    // a troca de folha muda as cores das variaveis: redesenha
    const tone = new MutationObserver(draw)
    tone.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tone'] })
    if (!still) {
      window.addEventListener('pointermove', move)
      document.addEventListener('pointerleave', leave)
    }
    return () => {
      cancelAnimationFrame(raf)
      tone.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
    }
  }, [still])

  return (
    <div className="sheet" aria-hidden="true">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
