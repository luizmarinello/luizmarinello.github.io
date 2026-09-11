import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from './scrollState'
import { ORDER, buildShapes, partAt } from './shapes'
import { partNames, rackTargets } from '../data'
import { useMedia } from '../ui'

/* A peca e um desenho de engenharia: as arestas carregam a forma e a
   malha por baixo e so um fantasma, para dar volume. Na folha de tinta
   o traco e claro; na de papel, escuro. O tom vem de scrollState.tone
   e e amortecido aqui como todo o resto.

   Parado numa secao, o que aparece e o desenho do objeto com a malha
   fantasma por baixo. Na virada entre duas secoes a malha some,
   a nuvem de cacos cresce no lugar dela, cada caco viaja da casca de um
   objeto para a casca do proximo, e depois encolhe de volta ate a malha
   seguinte aparecer inteira. A travessia acompanha o scroll 1 para 1;
   cor, escala e posicao sao amortecidas a partir do valor que esta na
   tela, e por isso subir o scroll no meio da virada inverte sem emenda. */

type Stage = {
  scale: number
  exposure: number
  glow: number
  color: string
  camZ: number
  spinZ: number
  x: number
  y: number
  /** Camera: orbita em torno do eixo vertical, elevacao, distancia
      focal e um leve tombo lateral. E o "jogo de camera" de cada
      prancha: de topo nos projetos, macro no chip, de baixo no foguete. */
  az: number
  el: number
  fov: number
  roll: number
}

const STAGES: Stage[] = [
  // hero: o robo, a direita
  { scale: 0.86, exposure: 1.0, glow: 0.25, color: '#5b7cff', camZ: 4.6, spinZ: 0, x: 2.0, y: 0.15, az: 0.22, el: -0.08, fov: 42, roll: 0 },
  // sobre: o mesmo robo, cruza para a esquerda, por cima da moldura da foto
  { scale: 0.88, exposure: 1.0, glow: 0.3, color: '#2b4bff', camZ: 4.4, spinZ: 0, x: -2.3, y: 0.2, az: -0.5, el: 0.18, fov: 40, roll: 0 },
  // projetos: tres unidades empilhadas, a direita, por cima dos campos de print
  { scale: 0.58, exposure: 1.06, glow: 0.4, color: '#2b4bff', camZ: 4.6, spinZ: 0, x: 2.3, y: -0.05, az: 0.35, el: 0.8, fov: 40, roll: 0 },
  // ia aplicada: o chip em brasa. A pagina inteira clareia aqui, que e a
  // secao que mais vende ele
  { scale: 0.8, exposure: 1.14, glow: 0.68, color: '#ff5a1f', camZ: 4.4, spinZ: 0, x: -2.3, y: 0.1, az: -0.12, el: 0.22, fov: 36, roll: 0 },
  // ferramentas: a engrenagem, a unica peca que gira de verdade. Menor e
  // mais para a borda, para nao passar por cima da lista de nomes
  { scale: 0.62, exposure: 1.06, glow: 0.42, color: '#5b7cff', camZ: 4.2, spinZ: 0.42, x: 2.9, y: -0.05, az: 0, el: 0, fov: 42, roll: 0.05 },
  // trajetoria: o foguete, a esquerda
  { scale: 0.85, exposure: 1.0, glow: 0.4, color: '#2b4bff', camZ: 4.4, spinZ: 0, x: -2.2, y: 0.1, az: 0.3, el: -0.45, fov: 44, roll: 0 },
  // certificacoes: o cristal, a direita
  { scale: 0.8, exposure: 1.1, glow: 0.5, color: '#2b4bff', camZ: 4.4, spinZ: 0.1, x: 2.2, y: 0.15, az: 0.9, el: 0.25, fov: 40, roll: -0.04 },
  // contato: o robo de novo, a direita e recuado, fora do titulo gigante
  { scale: 1.0, exposure: 1.14, glow: 0.55, color: '#ff5a1f', camZ: 5.6, spinZ: 0, x: 2.2, y: 0.55, az: -0.2, el: 0.05, fov: 42, roll: 0 },
]

/* Cursor em coordenadas de tela normalizadas (-1 a 1) e em pixels, e o
   arrasto em andamento. Fora do React: quem le e o loop de render. */
const pointer = { x: 0, y: 0, px: 0, py: 0, moved: false, inside: false }
const drag = { on: false, x0: 0, lastX: 0, vel: 0, angle: 0, moved: false }

/* Traco na folha de tinta e na de papel. */
const LINE_INK = new THREE.Color('#dfe5ff')
const LINE_PAPER = new THREE.Color('#0b1020')

const lerp = (a: number, b: number, f: number) => a + (b - a) * f
const ease = (f: number) => f * f * (3 - 2 * f)
const UP = new THREE.Vector3(0, 1, 0)

/** Quanto da travessia e gasto escalonando a saida por altura. */
const SPREAD = 0.34

/** 0 antes de a, 1 depois de b, suave no meio. */
function ramp(v: number, a: number, b: number) {
  return ease(THREE.MathUtils.clamp((v - a) / (b - a), 0, 1))
}


/* Estudio de luz.

   O metal precisa de alguma coisa para refletir, senao vira plastico. Em
   vez de baixar um HDR de CDN, que custaria 1 a 2 MB e uma dependencia de
   rede, monto um estudio minusculo aqui: tres paineis coloridos numa cena
   auxiliar, passados pelo PMREM uma vez so. O resultado e o reflexo que
   aparece na casca das pecas. */
function Studio() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new THREE.Scene()
    room.background = new THREE.Color('#0a0a0e')

    const panel = (
      color: string,
      w: number,
      h: number,
      pos: [number, number, number],
      rot: [number, number, number],
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
      )
      mesh.position.set(...pos)
      mesh.rotation.set(...rot)
      room.add(mesh)
      return mesh
    }

    panel('#ff7a4c', 7, 7, [5, 3.5, 4], [0, -Math.PI / 3.4, 0]) // brasa, a chave
    panel('#3050d0', 8, 9, [-6, 0, 2], [0, Math.PI / 3, 0]) // cobalto, o preenchimento
    panel('#f2f2f6', 12, 2, [0, 6, -3], [-Math.PI / 2.2, 0, 0]) // faixa clara em cima
    panel('#101014', 20, 20, [0, -7, 0], [-Math.PI / 2, 0, 0]) // chao escuro

    const target = pmrem.fromScene(room, 0.03)
    scene.environment = target.texture

    return () => {
      scene.environment = null
      target.dispose()
      pmrem.dispose()
      room.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        if (m.material) (m.material as THREE.Material).dispose()
      })
    }
  }, [gl, scene])

  return null
}

/** Textura de halo: um borrao radial desenhado uma vez num canvas. E o
    brilho da brasa por um centesimo do custo de um passe de bloom. */
function useHalo() {
  return useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, 'rgba(255,255,255,0.85)')
    grad.addColorStop(0.3, 'rgba(255,255,255,0.28)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)
  }, [])
}

function Piece({
  count,
  still,
  narrow,
  shell,
  label,
}: {
  count: number
  still: boolean
  narrow: boolean
  shell: React.RefObject<HTMLDivElement | null>
  label: React.RefObject<HTMLDivElement | null>
}) {
  const shapes = useMemo(() => buildShapes(count), [count])
  const group = useRef<THREE.Group>(null)
  const spinner = useRef<THREE.Group>(null)
  const shards = useRef<THREE.InstancedMesh>(null)
  const key = useRef<THREE.PointLight>(null)
  const solids = useRef<(THREE.Group | null)[]>([])

  // meia largura de cada objeto, para nenhum encostar na borda da tela
  const halfWidths = useMemo(
    () =>
      shapes.map((s) => {
        const p = s.cloud.pos
        let w = 0
        for (let i = 0; i < p.length; i += 3) w = Math.max(w, Math.abs(p[i]))
        return w
      }),
    [shapes],
  )

  // altura de cada forma, usada para escalonar a saida dos cacos
  const heights = useMemo(
    () =>
      shapes.map((sp) => {
        let min = Infinity
        let max = -Infinity
        for (let i = 1; i < sp.cloud.pos.length; i += 3) {
          if (sp.cloud.pos[i] < min) min = sp.cloud.pos[i]
          if (sp.cloud.pos[i] > max) max = sp.cloud.pos[i]
        }
        return { min, inv: 1 / Math.max(max - min, 0.0001) }
      }),
    [shapes],
  )

  const seed = useMemo(() => {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) a[i] = Math.random()
    return a
  }, [count])

  const halo = useRef<THREE.Mesh>(null)
  const haloTex = useHalo()

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const normal = useMemo(() => new THREE.Vector3(), [])
  const flight = useMemo(() => new THREE.Vector3(), [])
  const spinQ = useMemo(() => new THREE.Quaternion(), [])
  const colorA = useMemo(() => new THREE.Color(), [])
  const colorB = useMemo(() => new THREE.Color(), [])
  const line = useMemo(() => new THREE.Color(), [])
  const live = useRef({ ...STAGES[0], tone: 0, pax: 0, pel: 0 })
  const spinAngle = useRef(0)
  const hls = useRef<(THREE.LineSegments | null)[]>([])
  const hover = useRef({ shape: -1, part: -1 })
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  /* Mouse: paralaxe de camera, etiqueta da parte sob o cursor e arrasto
     para girar. So no desktop; no toque arrastar e rolar a pagina. */
  useEffect(() => {
    if (narrow || still) return
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
      pointer.px = e.clientX
      pointer.py = e.clientY
      pointer.moved = true
      if (drag.on) {
        drag.vel = (e.clientX - drag.lastX) * 0.007
        drag.angle += drag.vel
        drag.lastX = e.clientX
        if (Math.abs(e.clientX - drag.x0) > 4) drag.moved = true
      }
    }
    const onDown = (e: PointerEvent) => {
      // so pega a peca se o cursor estiver sobre ela; texto continua
      // selecionavel no resto da pagina
      if (hover.current.part < 0 || e.button !== 0) return
      if ((e.target as Element).closest?.('a, button')) return
      drag.on = true
      drag.moved = false
      drag.x0 = drag.lastX = e.clientX
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    }
    const onUp = () => {
      if (!drag.on) return
      drag.on = false
      document.body.style.cursor = hover.current.part >= 0 ? 'grab' : ''
      document.body.style.userSelect = ''
      // clique seco numa unidade do rack leva ao projeto dela
      if (!drag.moved && hover.current.shape === 1) {
        const id = rackTargets[Math.floor(hover.current.part / 2)]
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    const onLeave = () => {
      pointer.inside = false
      pointer.moved = true
    }
    const onEnter = () => {
      pointer.inside = true
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerenter', onEnter)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [narrow, still])

  useFrame((state, dt) => {
    const g = group.current
    const sp = spinner.current
    const sh = shards.current
    const k = key.current
    const h = halo.current
    if (!g || !sp || !sh || !k || !h) return

    const last = STAGES.length - 1
    const p = THREE.MathUtils.clamp(scrollState.stage, 0, last)
    const i = Math.min(Math.floor(p), last - 1)
    // a peca fica parada nos 28% de cada lado do centro de uma secao e
    // so vira nos 44% do meio, entre uma secao e a proxima
    const f = THREE.MathUtils.clamp((p - i - 0.28) / 0.44, 0, 1)
    const a = STAGES[i]
    const b = STAGES[i + 1]
    const from = ORDER[i]
    const to = ORDER[i + 1]

    const cur = live.current
    const l = 3.2
    const damp = (v: number, target: number) => THREE.MathUtils.damp(v, target, l, dt)
    cur.scale = damp(cur.scale, lerp(a.scale, b.scale, f))
    cur.glow = damp(cur.glow, lerp(a.glow, b.glow, f))
    cur.camZ = damp(cur.camZ, lerp(a.camZ, b.camZ, f))
    cur.spinZ = damp(cur.spinZ, lerp(a.spinZ, b.spinZ, f))
    cur.y = damp(cur.y, lerp(a.y, b.y, f))
    cur.exposure = damp(cur.exposure, lerp(a.exposure, b.exposure, f))
    cur.tone = damp(cur.tone, scrollState.tone)
    cur.az = damp(cur.az, lerp(a.az, b.az, f))
    cur.el = damp(cur.el, lerp(a.el, b.el, f))
    cur.fov = damp(cur.fov, lerp(a.fov, b.fov, f))
    cur.roll = damp(cur.roll, lerp(a.roll, b.roll, f))
    // paralaxe: a camera acompanha o cursor um pouco, e volta ao centro
    // quando ele sai da janela
    const par = !still && !narrow && pointer.inside
    cur.pax = damp(cur.pax, par ? pointer.x * 0.14 : 0)
    cur.pel = damp(cur.pel, par ? pointer.y * 0.09 : 0)
    state.gl.toneMappingExposure = cur.exposure

    // o quanto o objeto pode andar para o lado depende da largura dele e
    // da largura da tela: numa janela estreita ele para mais para dentro,
    // e no celular acaba ficando no centro
    const cam = state.camera as THREE.PerspectiveCamera
    const halfScreen =
      Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * lerp(a.camZ, b.camZ, f) * cam.aspect
    const halfShape = lerp(halfWidths[from], halfWidths[to], f) * cur.scale
    const limit = Math.max(0, halfScreen - halfShape - 0.5)
    const wantX = lerp(a.x, b.x, f)
    cur.x = damp(cur.x, Math.sign(wantX) * Math.min(Math.abs(wantX), limit))

    colorA.set(a.color)
    colorB.set(b.color)
    colorA.lerp(colorB, f)
    k.intensity = 55 + cur.glow * 110
    k.color.copy(colorA)
    // o traco e o da folha, puxado para a cor da secao conforme a brasa
    line.copy(LINE_INK).lerp(LINE_PAPER, cur.tone).lerp(colorA, cur.glow * 0.55)

    // Quem esta em cena: a malha nas pontas, os cacos no meio. A malha sai
    // antes das arestas e entra depois delas, entao a peca aparece
    // desenhada primeiro e so depois enche, e ao sair deixa o desenho para
    // tras por um instante.
    const meshOut = 1 - ramp(f, 0.03, 0.26)
    const edgeOut = 1 - ramp(f, 0.1, 0.42)
    const edgeIn = ramp(f, 0.58, 0.84)
    const meshIn = ramp(f, 0.78, 0.98)

    solids.current.forEach((solid, s) => {
      if (!solid) return
      let o = 0
      let oEdge = 0
      if (from === to) o = oEdge = s === from ? 1 : 0
      else if (s === from) {
        o = meshOut
        oEdge = edgeOut
      } else if (s === to) {
        o = meshIn
        oEdge = edgeIn
      }
      solid.visible = o > 0.01 || oEdge > 0.01
      if (!solid.visible) return
      solid.scale.setScalar(cur.scale)
      for (const child of solid.children) {
        if (child.userData.hl) continue
        const mat = (child as THREE.Mesh).material as THREE.Material & {
          opacity: number
          color: THREE.Color
          emissive?: THREE.Color
          emissiveIntensity?: number
        }
        // sao as arestas que desenham a peca; a malha e so um fantasma
        // de volume por baixo, mais raso na folha de papel
        if (mat.emissive) {
          mat.opacity = o * (0.16 - cur.tone * 0.1)
          mat.color.lerp(colorA, 1 - Math.exp(-l * dt))
          mat.emissive.lerp(colorA, 1 - Math.exp(-l * dt))
          mat.emissiveIntensity = 0.05 + cur.glow * 0.28
        } else {
          mat.opacity = oEdge * 0.9
          mat.color.lerp(line, 1 - Math.exp(-l * dt))
        }
      }
    })

    sh.visible = from !== to && f > 0.002 && f < 0.998
    if (sh.visible) {
      const A = shapes[from].cloud
      const B = shapes[to].cloud
      const base = 0.042 * cur.scale
      const low = heights[from]

      for (let n = 0; n < count; n++) {
        const j = n * 3

        // Cada caco tem a sua propria hora de sair, dada pela altura dele
        // no objeto: a peca se abre de baixo para cima, como uma onda
        // subindo, em vez de estourar inteira de uma vez.
        const height = (A.pos[j + 1] - low.min) * low.inv
        const fk = THREE.MathUtils.clamp((f - SPREAD * height) / (1 - SPREAD), 0, 1)
        const ek = ease(fk)
        const bk = Math.sin(Math.PI * fk)

        let x = lerp(A.pos[j], B.pos[j], ek) * cur.scale
        let y = lerp(A.pos[j + 1], B.pos[j + 1], ek) * cur.scale
        let z = lerp(A.pos[j + 2], B.pos[j + 2], ek) * cur.scale

        // A saida nao e radial pura: soma um empurrao lateral em torno do
        // eixo vertical, e o caco descreve um arco. Trajetoria reta e o
        // que denuncia movimento feito por interpolacao.
        const d = Math.hypot(x, y, z) || 1
        const flat = Math.hypot(x, z) || 1
        const swirl = (seed[j + 1] - 0.5) * 0.95 * bk
        let vx = x / d + (-z / flat) * swirl
        const vy = y / d
        let vz = z / d + (x / flat) * swirl
        const vl = Math.hypot(vx, vy, vz) || 1
        vx /= vl
        vz /= vl
        const vyn = vy / vl

        const amp = bk * (0.16 + seed[j] * 0.5)
        dummy.position.set(x + vx * amp, y + vyn * amp, z + vz * amp)

        // Parado, o caco deita sobre a casca do objeto pela normal da
        // superficie. Voando, ele se alinha com a propria trajetoria e
        // estica: e borrao de movimento por um centesimo do custo.
        normal
          .set(
            lerp(A.nor[j], B.nor[j], ek),
            lerp(A.nor[j + 1], B.nor[j + 1], ek),
            lerp(A.nor[j + 2], B.nor[j + 2], ek),
          )
          .normalize()
        dummy.quaternion.setFromUnitVectors(UP, normal)
        if (bk > 0.01) {
          flight.set(vx, vyn, vz)
          spinQ.setFromUnitVectors(UP, flight)
          dummy.quaternion.slerp(spinQ, bk)
        }
        dummy.rotateY(seed[j + 2] * 6.283)

        const size = base * Math.min(1, bk * 3.2)
        const thin = 1 - bk * 0.45
        dummy.scale.set(size * thin, size * (0.35 + bk * 1.5), size * thin)
        dummy.updateMatrix()
        sh.setMatrixAt(n, dummy.matrix)
      }
      sh.instanceMatrix.needsUpdate = true
      const smat = sh.material as THREE.MeshStandardMaterial
      smat.color.lerp(line, 1 - Math.exp(-l * dt))
      smat.emissive.lerp(line, 1 - Math.exp(-l * dt))
      smat.emissiveIntensity = 0.15 + cur.glow * 0.3
    }

    // o halo aditivo nao desenha nada em cima de papel claro
    {
      const hm = h.material as THREE.MeshBasicMaterial
      hm.opacity = 0.15 * (1 - cur.tone)
      hm.color.copy(colorA)
    }

    const t = state.clock.elapsedTime
    g.position.x = cur.x + (still ? 0 : Math.sin(t * 0.21) * 0.07)
    // no celular o objeto nao tem para onde correr na horizontal, entao
    // ele sobe para a metade de cima da tela, onde o texto nao chega
    g.position.y = cur.y + (narrow ? 0.7 : 0) + (still ? 0 : Math.cos(t * 0.16) * 0.05)
    if (!still) {
      // solto, o giro do arrasto perde forca e a peca volta devagar para
      // a pose desenhada
      if (!drag.on) {
        drag.angle += drag.vel
        drag.vel *= Math.exp(-3 * dt)
        drag.angle = THREE.MathUtils.damp(drag.angle, 0, 0.6, dt)
      }
      // o objeto olha de um lado para o outro em vez de rodopiar, senao
      // o robo passa metade do tempo de costas
      g.rotation.y = Math.sin(t * 0.2) * 0.34 + drag.angle
      // so a engrenagem gira. Quando ela sai de cena o angulo volta a
      // zero pelo caminho mais curto, senao a forma seguinte herda a
      // sobra de rotacao e aparece deitada
      spinAngle.current += cur.spinZ * dt
      // desenrola enquanto a peca esta em cacos, que e quando ninguem ve.
      // Esperar o giro amortecer sozinho fazia a forma seguinte aterrissar
      // torta e so depois se endireitar.
      const shattered = from !== to && f > 0.15 && f < 0.995
      if (cur.spinZ < 0.05 || (shattered && b.spinZ < 0.05)) {
        const wrapped = Math.atan2(Math.sin(spinAngle.current), Math.cos(spinAngle.current))
        spinAngle.current = THREE.MathUtils.damp(wrapped, 0, 2.2, dt)
      }
      sp.rotation.z = spinAngle.current
    }

    // Quando a peca cruza o meio da tela ela passa por cima da copia, e
    // texto sempre ganha de enfeite. Entao ela recua ao chegar no centro
    // e volta ao cheio quando esta na margem.
    if (!narrow && shell.current) {
      const centered = 1 - Math.min(1, Math.abs(cur.x) / 1.5)
      shell.current.style.opacity = String(1 - 0.7 * centered)
    }

    // Camera em orbita em volta da origem: azimute e elevacao da parada
    // mais a paralaxe do cursor. O deslocamento lateral e o que mantem a
    // peca na margem em vez de no centro.
    const az = cur.az + cur.pax
    const el = cur.el + cur.pel
    const d = cur.camZ
    cam.position.set(
      Math.sin(az) * Math.cos(el) * d - cur.x * 0.1,
      Math.sin(el) * d,
      Math.cos(az) * Math.cos(el) * d,
    )
    cam.lookAt(0, 0, 0)
    cam.rotateZ(cur.roll)
    if (Math.abs(cam.fov - cur.fov) > 0.01) {
      cam.fov = cur.fov
      cam.updateProjectionMatrix()
    }

    // Etiqueta: qual parte da peca esta sob o cursor. So com a peca
    // parada (na virada ela e cacos), quando o cursor mexeu ou enquanto
    // ha uma parte acesa, para ela apagar se a peca mudar por baixo.
    if ((pointer.moved || hover.current.part >= 0) && !narrow && !still) {
      pointer.moved = false
      const parked = from === to || f < 0.05 || f > 0.95
      const which = f < 0.5 ? from : to
      const solid = solids.current[which]
      let part = -1
      if (parked && pointer.inside && solid?.visible) {
        const mesh = solid.children[0] as THREE.Mesh
        mesh.updateWorldMatrix(true, false)
        ndc.set(pointer.x, pointer.y)
        raycaster.setFromCamera(ndc, cam)
        const hit = raycaster.intersectObject(mesh, false)[0]
        if (hit && hit.faceIndex != null) part = partAt(shapes[which], hit.faceIndex)
      }
      const was = hover.current
      if (was.shape !== which || was.part !== part) {
        const old = hls.current[was.shape]
        if (old) old.visible = false
        hover.current = { shape: which, part }
        const hl = hls.current[which]
        if (hl && part >= 0) {
          hl.geometry = shapes[which].partEdges[part]
          hl.visible = true
        }
        if (!drag.on) document.body.style.cursor = part >= 0 ? 'grab' : ''
        if (label.current) {
          label.current.hidden = part < 0
          if (part >= 0) {
            const lang = document.documentElement.lang.startsWith('pt') ? 'pt' : 'en'
            label.current.textContent = partNames[which][part]?.[lang] ?? ''
          }
        }
      }
      if (label.current && part >= 0) {
        label.current.style.transform = `translate(${pointer.px + 18}px, ${pointer.py - 10}px)`
      }
    }
  })

  return (
    <group ref={group}>
      {/* a luz fica fora do grupo que gira, senao o brilho viaja junto */}
      <pointLight ref={key} position={[1.6, 1.4, 2.2]} distance={14} color="#ff7a3d" />
      <mesh ref={halo} position={[0, 0, -0.9]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={haloTex}
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <group ref={spinner}>
        {shapes.map((s, n) => (
          <group
            key={n}
            ref={(el) => {
              solids.current[n] = el
            }}
            visible={false}
          >
            <mesh geometry={s.geo}>
              <meshStandardMaterial
                color="#9a9aa8"
                emissive="#9a9aa8"
                emissiveIntensity={0.1}
                roughness={0.34}
                metalness={0.85}
                envMapIntensity={0.9}
                transparent
                flatShading
              />
            </mesh>
            <lineSegments geometry={s.edges}>
              <lineBasicMaterial color="#d6d6de" transparent opacity={0} />
            </lineSegments>
            {/* a parte sob o cursor, desenhada por cima na cor de acento */}
            <lineSegments
              ref={(el) => {
                hls.current[n] = el
              }}
              geometry={s.partEdges[0]}
              visible={false}
              userData={{ hl: true }}
            >
              <lineBasicMaterial color="#ff5a1f" />
            </lineSegments>
          </group>
        ))}
        <instancedMesh
          ref={shards}
          args={[undefined, undefined, count]}
          frustumCulled={false}
          visible={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          {/* fragmentos de traco, nao lascas de metal: cor chapada */}
          <meshStandardMaterial
            color="#dfe5ff"
            emissive="#dfe5ff"
            emissiveIntensity={0.3}
            roughness={1}
            metalness={0}
            envMapIntensity={0}
            transparent
            opacity={0.5}
            flatShading
          />
        </instancedMesh>
      </group>
    </group>
  )
}

function Dust({ count, still }: { count: number; still: boolean }) {
  const ref = useRef<THREE.Points>(null)
  const tone = useRef(0)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 5.0 + Math.random() * 4.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [count])

  useFrame((_, dt) => {
    if (!ref.current) return
    tone.current = THREE.MathUtils.damp(tone.current, scrollState.tone, 3.2, dt)
    const m = ref.current.material as THREE.PointsMaterial
    m.color.copy(LINE_INK).lerp(LINE_PAPER, tone.current)
    m.opacity = 0.25 + tone.current * 0.15
    if (!still) ref.current.rotation.y += dt * 0.02
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.016} transparent opacity={0.25} sizeAttenuation />
    </points>
  )
}

export default function Scene() {
  const shell = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLDivElement>(null)
  const still = useMedia('(prefers-reduced-motion: reduce)')
  // ate 1023px (celular, tablet e navegador em meia tela) a peca sobe
  // para a faixa livre do topo e fica mais transparente: nessa largura
  // nao ha margem lateral onde ela caiba sem passar por cima do texto
  const small = useMedia('(max-width: 1023px)')

  return (
    <>
      {/* etiqueta da parte sob o cursor; segue o mouse */}
      <div
        ref={label}
        hidden
        className="tag pointer-events-none fixed top-0 left-0 z-30 border border-signal bg-bg px-2.5 py-1.5 text-signal"
        aria-hidden="true"
      />
    <div
      ref={shell}
      className="pointer-events-none fixed inset-0 z-0 opacity-35 lg:opacity-100"
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, small ? 1.4 : 1.8]}
        camera={{ position: [0, 0, 4.6], fov: 42 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Studio />
        {/* o ambiente ja faz o papel da luz difusa, entao o ambiente
            aqui e so um piso para nada ficar preto puro */}
        <ambientLight intensity={0.12} />
        <directionalLight position={[4, 5, 6]} intensity={2.2} color="#ffd9c2" />
        <directionalLight position={[-6, -1, 3]} intensity={0.7} color="#7f9ad6" />
        {/* contraluz: e ela que separa a silhueta do fundo preto */}
        <directionalLight position={[-2, 3, -6]} intensity={2.6} color="#ffb489" />
        <Piece count={small ? 420 : 2200} still={still} narrow={small} shell={shell} label={label} />
        <Dust count={small ? 180 : 420} still={still} />
      </Canvas>
    </div>
    </>
  )
}
