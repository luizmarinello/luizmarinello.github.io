import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { scrollState } from './scrollState'

/* Um solido central que muda de estado conforme a pagina desce.
   Cada parada abaixo corresponde a uma secao. O valor exibido nunca
   salta para o alvo: ele e amortecido a partir do valor atual na tela,
   entao dar scroll para tras no meio do movimento inverte sem emenda. */
type Stage = {
  distort: number
  speed: number
  scale: number
  wire: number
  rough: number
  color: string
  camZ: number
  spin: number
}

const STAGES: Stage[] = [
  // hero: massa escura, quase parada
  { distort: 0.22, speed: 0.8, scale: 1.05, wire: 0.18, rough: 0.55, color: '#2c2c36', camZ: 4.8, spin: 0.06 },
  // sobre: respira
  { distort: 0.34, speed: 1.2, scale: 0.92, wire: 0.32, rough: 0.4, color: '#3b3542', camZ: 4.4, spin: 0.1 },
  // projetos: abre a gaiola
  { distort: 0.48, speed: 1.6, scale: 0.86, wire: 0.8, rough: 0.3, color: '#6b4331', camZ: 4.0, spin: 0.16 },
  // ia aplicada: nucleo em brasa
  { distort: 0.62, speed: 2.4, scale: 0.78, wire: 0.55, rough: 0.18, color: '#e8622f', camZ: 3.6, spin: 0.24 },
  // trajetoria e certificacoes: assenta
  { distort: 0.3, speed: 1.0, scale: 0.74, wire: 0.36, rough: 0.35, color: '#4a3b3a', camZ: 4.6, spin: 0.1 },
  // contato: volta inteiro e claro
  { distort: 0.16, speed: 0.7, scale: 0.95, wire: 0.24, rough: 0.25, color: '#c9552a', camZ: 5.0, spin: 0.05 },
]

function lerp(a: number, b: number, f: number) {
  return a + (b - a) * f
}

function Solid({ still, detail }: { still: boolean; detail: number }) {
  const group = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const shell = useRef<THREE.Mesh>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mat = useRef<any>(null)

  const colorA = useMemo(() => new THREE.Color(), [])
  const colorB = useMemo(() => new THREE.Color(), [])
  const live = useRef({ ...STAGES[0] })

  useFrame((state, dt) => {
    const g = group.current
    const c = core.current
    const s = shell.current
    const m = mat.current
    if (!g || !c || !s || !m) return

    const last = STAGES.length - 1
    const p = THREE.MathUtils.clamp(scrollState.p, 0, 1) * last
    const i = Math.min(Math.floor(p), last - 1)
    const f = p - i
    const a = STAGES[i]
    const b = STAGES[i + 1]

    const target = {
      distort: lerp(a.distort, b.distort, f),
      speed: lerp(a.speed, b.speed, f),
      scale: lerp(a.scale, b.scale, f),
      wire: lerp(a.wire, b.wire, f),
      rough: lerp(a.rough, b.rough, f),
      camZ: lerp(a.camZ, b.camZ, f),
      spin: lerp(a.spin, b.spin, f),
    }

    // amortecimento critico: parte sempre do valor que esta na tela
    const l = 3.2
    const cur = live.current
    cur.distort = THREE.MathUtils.damp(cur.distort, target.distort, l, dt)
    cur.speed = THREE.MathUtils.damp(cur.speed, target.speed, l, dt)
    cur.scale = THREE.MathUtils.damp(cur.scale, target.scale, l, dt)
    cur.wire = THREE.MathUtils.damp(cur.wire, target.wire, l, dt)
    cur.rough = THREE.MathUtils.damp(cur.rough, target.rough, l, dt)
    cur.camZ = THREE.MathUtils.damp(cur.camZ, target.camZ, l, dt)
    cur.spin = THREE.MathUtils.damp(cur.spin, target.spin, l, dt)

    colorA.set(a.color)
    colorB.set(b.color)
    colorA.lerp(colorB, f)
    m.color.lerp(colorA, 1 - Math.exp(-l * dt))
    m.distort = still ? 0.24 : cur.distort
    m.speed = still ? 0 : cur.speed
    m.roughness = cur.rough

    c.scale.setScalar(cur.scale)
    s.scale.setScalar(cur.scale * 1.22)
    ;(s.material as THREE.MeshBasicMaterial).opacity = cur.wire
    ;(s.material as THREE.MeshBasicMaterial).color.copy(colorA)

    if (!still) {
      g.rotation.y += cur.spin * dt
      g.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.14
      s.rotation.y -= cur.spin * 1.6 * dt
    }
    state.camera.position.z = cur.camZ
  })

  return (
    <group ref={group}>
      <mesh ref={core}>
        <icosahedronGeometry args={[1, detail]} />
        <MeshDistortMaterial
          ref={mat}
          color="#2a2a33"
          roughness={0.5}
          metalness={0.72}
          distort={0.22}
          speed={0.8}
        />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial wireframe transparent opacity={0.16} color="#e8622f" />
      </mesh>
    </group>
  )
}

function Dust({ count, still }: { count: number; still: boolean }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 2.6 + Math.random() * 4.2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [count])

  useFrame((_, dt) => {
    if (!still && ref.current) ref.current.rotation.y += dt * 0.02
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.014} color="#8d8d98" transparent opacity={0.55} sizeAttenuation />
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
      className="pointer-events-none fixed inset-0 z-0 opacity-55 md:left-[36%] md:opacity-100"
      aria-hidden="true"
      // o solido divide a tela com o texto em vez de ficar atras dele
      style={{ maskImage: 'radial-gradient(closest-side at 50% 48%, #000 62%, transparent 100%)' }}
    >
      <Canvas
        dpr={[1, small ? 1.4 : 1.8]}
        camera={{ position: [0, 0, 4.4], fov: 42 }}
        gl={{ antialias: !small, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[4, 3, 5]} intensity={55} color="#ff7a3d" distance={22} />
        <pointLight position={[-5, -2, -3]} intensity={35} color="#5f7fbf" distance={22} />
        <Solid still={still} detail={small ? 8 : 20} />
        <Dust count={small ? 420 : 1100} still={still} />
      </Canvas>
    </div>
  )
}
