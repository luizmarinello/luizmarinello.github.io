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
  spin: number
  x: number
  y: number
}

const STAGES: Stage[] = [
  // hero: a bola, a direita
  { scale: 1.0, glow: 0.2, color: '#8a8a99', camZ: 4.8, spin: 0.1, x: 2.0, y: 0.0 },
  // sobre: bloco, atravessa para a esquerda
  { scale: 0.92, glow: 0.3, color: '#9a8f8a', camZ: 4.5, spin: 0.14, x: -2.1, y: 0.2 },
  // projetos: tres placas, volta para a direita
  { scale: 0.96, glow: 0.45, color: '#c9793f', camZ: 4.2, spin: 0.16, x: 2.4, y: -0.1 },
  // ia aplicada: malha de nos em brasa, atras do painel a esquerda
  { scale: 0.9, glow: 1.0, color: '#e8622f', camZ: 3.9, spin: 0.22, x: -2.4, y: 0.1 },
  // ferramentas: engrenagem, a direita
  { scale: 0.95, glow: 0.5, color: '#b98a5e', camZ: 4.3, spin: 0.3, x: 2.3, y: -0.15 },
  // trajetoria: helice, a esquerda
  { scale: 0.9, glow: 0.4, color: '#9a8f8a', camZ: 4.4, spin: 0.18, x: -2.2, y: 0.05 },
  // certificacoes: cristal, a direita
  { scale: 0.88, glow: 0.6, color: '#d8a05a', camZ: 4.4, spin: 0.2, x: 2.2, y: 0.1 },
  // contato: a bola de novo, centralizada e recuada
  { scale: 1.05, glow: 0.7, color: '#e8622f', camZ: 6.0, spin: 0.08, x: 0.0, y: 0.0 },
]

const lerp = (a: number, b: number, f: number) => a + (b - a) * f
const ease = (f: number) => f * f * (3 - 2 * f)

function Shards({ count, still }: { count: number; still: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const group = useRef<THREE.Group>(null)
  const key = useRef<THREE.PointLight>(null)

  const shapes = useMemo(() => buildShapes(count), [count])
  // um jeito e uma fase por caco, para nenhum girar igual ao vizinho
  const seed = useMemo(() => {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) a[i] = Math.random()
    return a
  }, [count])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorA = useMemo(() => new THREE.Color(), [])
  const colorB = useMemo(() => new THREE.Color(), [])
  const live = useRef({ ...STAGES[0] })

  useFrame((state, dt) => {
    const m = mesh.current
    const g = group.current
    const k = key.current
    if (!m || !g || !k) return

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
    cur.spin = damp(cur.spin, lerp(a.spin, b.spin, f))
    cur.x = damp(cur.x, lerp(a.x, b.x, f))
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
    const A = shapes[i]
    const B = shapes[i + 1]
    const e = ease(f)
    // no meio da travessia os cacos abrem para fora: e a peca se desmontando
    const burst = Math.sin(Math.PI * f) * 0.85
    const shard = 0.052 * cur.scale

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
      if (still) {
        dummy.rotation.set(seed[j] * 6.283, seed[j + 1] * 6.283, 0)
      } else {
        const spin = t * (0.4 + seed[j + 1] * 1.6) + burst * 6
        dummy.rotation.set(spin, spin * 0.7 + seed[j + 2] * 6.283, spin * 0.3)
      }
      dummy.scale.setScalar(shard)
      dummy.updateMatrix()
      m.setMatrixAt(n, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true

    const idleX = still ? 0 : Math.sin(t * 0.23) * 0.2
    const idleY = still ? 0 : Math.cos(t * 0.17) * 0.16
    g.position.x = cur.x + idleX
    g.position.y = cur.y + idleY
    if (!still) {
      g.rotation.y += cur.spin * dt
      g.rotation.x = Math.sin(t * 0.18) * 0.14
    }

    state.camera.position.z = cur.camZ
    state.camera.position.x = -cur.x * 0.16
    state.camera.lookAt(0, 0, 0)
  })

  return (
    <group ref={group}>
      {/* a luz fica fora do grupo que gira, senao o brilho viaja junto */}
      <pointLight ref={key} position={[1.5, 1.2, 2.1]} distance={13} color="#ff7a3d" />
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
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

  useFrame((state, dt) => {
    if (still || !ref.current) return
    ref.current.rotation.y += dt * 0.03
    ref.current.position.x =
      -scrollState.p * 1.2 + Math.sin(state.clock.elapsedTime * 0.1) * 0.2
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#8d8d98" transparent opacity={0.5} sizeAttenuation />
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
      className="pointer-events-none fixed inset-0 z-0 opacity-60 md:opacity-100"
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, small ? 1.4 : 1.8]}
        camera={{ position: [0, 0, 4.8], fov: 42 }}
        gl={{ antialias: !small, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.34} />
        <pointLight position={[-5, -2, -4]} intensity={26} color="#5f7fbf" distance={24} />
        <Shards count={small ? 380 : 1100} still={still} />
        <Dust count={small ? 300 : 800} still={still} />
      </Canvas>
    </div>
  )
}
