import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from './scrollState'
import { buildShapes } from './shapes'

/* A bola nao muda de forma por deformacao: ela e feita de cacos, e cada
   caco viaja da posicao que ocupava numa forma para a que ocupa na
   seguinte. No meio do caminho todos sao empurrados para fora, entao a
   peca se desmonta no ar antes de se montar de novo na forma da proxima
   secao. A travessia acompanha o scroll 1 para 1; cor, escala e posicao
   sao amortecidas a partir do valor que esta na tela, e por isso subir
   o scroll no meio da montagem inverte sem emenda. */

type Stage = {
  scale: number
  glow: number
  color: string
  camZ: number
  spinZ: number
  x: number
  y: number
}

const STAGES: Stage[] = [
  // hero: o robo, a direita
  { scale: 1.18, glow: 0.22, color: '#8a8a99', camZ: 4.6, spinZ: 0, x: 2.0, y: 0.0 },
  // sobre: o mesmo robo, atravessa para a esquerda
  { scale: 1.08, glow: 0.28, color: '#9a8f8a', camZ: 4.4, spinZ: 0, x: -2.1, y: 0.15 },
  // projetos: tres unidades empilhadas, volta para a direita
  { scale: 0.98, glow: 0.4, color: '#c9793f', camZ: 4.2, spinZ: 0, x: 2.3, y: -0.1 },
  // ia aplicada: o chip em brasa, atras do painel a esquerda
  { scale: 1.0, glow: 0.95, color: '#e8622f', camZ: 4.0, spinZ: 0, x: -2.3, y: 0.1 },
  // ferramentas: a engrenagem, e a unica que gira de verdade
  { scale: 1.0, glow: 0.45, color: '#b98a5e', camZ: 4.2, spinZ: 0.5, x: 2.2, y: -0.1 },
  // trajetoria: o foguete, a esquerda
  { scale: 0.95, glow: 0.4, color: '#9a8f8a', camZ: 4.4, spinZ: 0, x: -2.2, y: 0.05 },
  // certificacoes: o cristal, a direita
  { scale: 0.9, glow: 0.55, color: '#d8a05a', camZ: 4.4, spinZ: 0.12, x: 2.2, y: 0.1 },
  // contato: o robo de novo, centralizado e recuado
  { scale: 1.2, glow: 0.6, color: '#e8622f', camZ: 5.6, spinZ: 0, x: 0.0, y: 0.0 },
]

const lerp = (a: number, b: number, f: number) => a + (b - a) * f
const ease = (f: number) => f * f * (3 - 2 * f)
const UP = new THREE.Vector3(0, 1, 0)

function Shards({ count, still, narrow }: { count: number; still: boolean; narrow: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const group = useRef<THREE.Group>(null)
  const spinner = useRef<THREE.Group>(null)
  const key = useRef<THREE.PointLight>(null)

  const shapes = useMemo(() => buildShapes(count), [count])
  // um jeito e uma fase por caco, para nenhum girar igual ao vizinho
  const seed = useMemo(() => {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) a[i] = Math.random()
    return a
  }, [count])

  // meia largura de cada forma, para nenhuma encostar na borda da tela
  const halfWidths = useMemo(
    () =>
      shapes.map((c) => {
        let w = 0
        for (let i = 0; i < c.pos.length; i += 3) w = Math.max(w, Math.abs(c.pos[i]))
        return w
      }),
    [shapes],
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const normal = useMemo(() => new THREE.Vector3(), [])
  const tilt = useMemo(() => new THREE.Vector3(), [])
  const spinQ = useMemo(() => new THREE.Quaternion(), [])
  const colorA = useMemo(() => new THREE.Color(), [])
  const colorB = useMemo(() => new THREE.Color(), [])
  const live = useRef({ ...STAGES[0] })
  const spinAngle = useRef(0)

  useFrame((state, dt) => {
    const m = mesh.current
    const g = group.current
    const sp = spinner.current
    const k = key.current
    if (!m || !g || !sp || !k) return

    const last = STAGES.length - 1
    const p = THREE.MathUtils.clamp(scrollState.p, 0, 1) * last
    const i = Math.min(Math.floor(p), last - 1)
    const f = p - i
    const a = STAGES[i]
    const b = STAGES[i + 1]

    const cur = live.current
    const l = 3.2
    const damp = (from: number, to: number) => THREE.MathUtils.damp(from, to, l, dt)
    cur.scale = damp(cur.scale, lerp(a.scale, b.scale, f))
    cur.glow = damp(cur.glow, lerp(a.glow, b.glow, f))
    cur.camZ = damp(cur.camZ, lerp(a.camZ, b.camZ, f))
    cur.spinZ = damp(cur.spinZ, lerp(a.spinZ, b.spinZ, f))
    // o quanto o objeto pode andar para o lado depende da largura dele e
    // da largura da tela: numa janela estreita ele para mais para dentro,
    // e no celular acaba ficando no centro
    const cam = state.camera as THREE.PerspectiveCamera
    const halfScreen =
      Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * lerp(a.camZ, b.camZ, f) * cam.aspect
    const halfShape = lerp(halfWidths[i], halfWidths[i + 1], f) * cur.scale
    const limit = Math.max(0, halfScreen - halfShape - 0.5)
    const wantX = lerp(a.x, b.x, f)
    cur.x = damp(cur.x, Math.sign(wantX) * Math.min(Math.abs(wantX), limit))
    cur.y = damp(cur.y, lerp(a.y, b.y, f))

    colorA.set(a.color)
    colorB.set(b.color)
    colorA.lerp(colorB, f)
    const mat = m.material as THREE.MeshStandardMaterial
    mat.color.lerp(colorA, 1 - Math.exp(-l * dt))
    mat.emissive.lerp(colorA, 1 - Math.exp(-l * dt))
    mat.emissiveIntensity = 0.12 + cur.glow * 0.85
    k.intensity = 80 + cur.glow * 140
    k.color.copy(colorA)

    const t = state.clock.elapsedTime
    const A = shapes[i].pos
    const B = shapes[i + 1].pos
    const NA = shapes[i].nor
    const NB = shapes[i + 1].nor
    const e = ease(f)
    // no meio da travessia os cacos abrem para fora: e a peca se desmontando
    const burst = Math.sin(Math.PI * f) * 0.42
    const shard = 0.055 * cur.scale

    for (let n = 0; n < count; n++) {
      const j = n * 3
      let x = lerp(A[j], B[j], e) * cur.scale
      let y = lerp(A[j + 1], B[j + 1], e) * cur.scale
      let z = lerp(A[j + 2], B[j + 2], e) * cur.scale

      if (burst > 0.001) {
        const d = Math.hypot(x, y, z) || 1
        const push = burst * (0.35 + seed[j] * 1.15)
        x += (x / d) * push
        y += (y / d) * push
        z += (z / d) * push
      }

      dummy.position.set(x, y, z)
      // o caco deita sobre a casca do objeto, seguindo a normal da
      // superficie: e isso que faz a silhueta se ler em vez de virar
      // poeira. So na virada ele tomba, e so enquanto ela dura.
      normal
        .set(lerp(NA[j], NB[j], e), lerp(NA[j + 1], NB[j + 1], e), lerp(NA[j + 2], NB[j + 2], e))
        .normalize()
      dummy.quaternion.setFromUnitVectors(UP, normal)
      if (!still && burst > 0.001) {
        tilt.set(seed[j] - 0.5, seed[j + 1] - 0.5, seed[j + 2] - 0.5).normalize()
        spinQ.setFromAxisAngle(tilt, burst * 4)
        dummy.quaternion.multiply(spinQ)
      }
      dummy.rotateY(seed[j + 2] * 6.283)
      dummy.scale.set(shard, shard, shard)
      dummy.updateMatrix()
      m.setMatrixAt(n, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true

    g.position.x = cur.x + (still ? 0 : Math.sin(t * 0.21) * 0.07)
    // no celular o objeto nao tem para onde correr na horizontal, entao
    // ele desce um pouco e sai de tras do texto
    g.position.y = cur.y + (narrow ? -0.55 : 0) + (still ? 0 : Math.cos(t * 0.16) * 0.05)
    if (!still) {
      // o objeto olha de um lado para o outro em vez de rodopiar, senao
      // o robo passa metade do tempo de costas
      g.rotation.y = Math.sin(t * 0.2) * 0.36
      // so a engrenagem gira. Quando ela sai de cena o angulo volta ao
      // zero pelo caminho mais curto, senao a forma seguinte herda a
      // sobra de rotacao e aparece deitada
      spinAngle.current += cur.spinZ * dt
      if (cur.spinZ < 0.05) {
        const wrapped = Math.atan2(Math.sin(spinAngle.current), Math.cos(spinAngle.current))
        spinAngle.current = THREE.MathUtils.damp(wrapped, 0, 2.2, dt)
      }
      sp.rotation.z = spinAngle.current
    }

    state.camera.position.z = cur.camZ
    state.camera.position.x = -cur.x * 0.1
    state.camera.lookAt(0, 0, 0)
  })

  return (
    <group ref={group}>
      {/* a luz fica fora do grupo que gira, senao o brilho viaja junto */}
      <pointLight ref={key} position={[1.5, 1.2, 2.1]} distance={13} color="#ff7a3d" />
      <group ref={spinner}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1, 0.16, 1]} />
        <meshStandardMaterial
          color="#8a8a99"
          emissive="#8a8a99"
          emissiveIntensity={0.12}
          roughness={0.35}
          metalness={0.6}
          flatShading
        />
      </instancedMesh>
      </group>
    </group>
  )
}

function Dust({ count, still }: { count: number; still: boolean }) {
  const ref = useRef<THREE.Points>(null)
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
    if (still || !ref.current) return
    ref.current.rotation.y += dt * 0.02
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.013} color="#8d8d98" transparent opacity={0.28} sizeAttenuation />
    </points>
  )
}

export default function Scene() {
  const still =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const small = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-45 md:opacity-100"
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, small ? 1.4 : 1.8]}
        camera={{ position: [0, 0, 4.8], fov: 42 }}
        gl={{ antialias: !small, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.34} />
        <pointLight position={[-5, -2, -4]} intensity={26} color="#5f7fbf" distance={24} />
        <Shards count={small ? 620 : 2600} still={still} narrow={small} />
        <Dust count={small ? 180 : 420} still={still} />
      </Canvas>
    </div>
  )
}
