import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from './scrollState'
import { ORDER, buildShapes } from './shapes'

/* Parado numa secao, o que aparece e a malha solida do objeto com as
   arestas desenhadas por cima. Na virada entre duas secoes a malha some,
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
}

const STAGES: Stage[] = [
  // hero: o robo, a direita
  { scale: 0.95, exposure: 1.0, glow: 0.25, color: '#6e6e7c', camZ: 4.6, spinZ: 0, x: 2.0, y: 0.1 },
  // sobre: o mesmo robo, atravessa para a esquerda
  { scale: 0.88, exposure: 1.0, glow: 0.3, color: '#7b7168', camZ: 4.4, spinZ: 0, x: -2.1, y: 0.2 },
  // projetos: tres unidades empilhadas, volta para a direita
  { scale: 0.9, exposure: 1.06, glow: 0.4, color: '#9a5c30', camZ: 4.2, spinZ: 0, x: 2.3, y: -0.05 },
  // ia aplicada: o chip em brasa. A pagina inteira clareia aqui, que e a
  // secao que mais vende ele
  { scale: 0.95, exposure: 1.14, glow: 0.68, color: '#b84d26', camZ: 4.0, spinZ: 0, x: -2.3, y: 0.1 },
  // ferramentas: a engrenagem, a unica peca que gira de verdade
  { scale: 0.88, exposure: 1.06, glow: 0.42, color: '#96714c', camZ: 4.2, spinZ: 0.42, x: 2.2, y: -0.05 },
  // trajetoria: o foguete, a esquerda
  { scale: 0.85, exposure: 1.0, glow: 0.4, color: '#7b7168', camZ: 4.4, spinZ: 0, x: -2.2, y: 0.1 },
  // certificacoes: o cristal, a direita
  { scale: 0.8, exposure: 1.1, glow: 0.5, color: '#a07846', camZ: 4.4, spinZ: 0.1, x: 2.2, y: 0.15 },
  // contato: o robo de novo, centralizado e recuado
  { scale: 1.0, exposure: 1.14, glow: 0.55, color: '#c9552a', camZ: 5.6, spinZ: 0, x: 0.0, y: 0.1 },
]

const lerp = (a: number, b: number, f: number) => a + (b - a) * f
const ease = (f: number) => f * f * (3 - 2 * f)
const UP = new THREE.Vector3(0, 1, 0)

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

    panel('#ff8a4c', 7, 7, [5, 3.5, 4], [0, -Math.PI / 3.4, 0]) // brasa, a chave
    panel('#3f5f9e', 8, 9, [-6, 0, 2], [0, Math.PI / 3, 0]) // frio, o preenchimento
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
}: {
  count: number
  still: boolean
  narrow: boolean
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

  const seed = useMemo(() => {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) a[i] = Math.random()
    return a
  }, [count])

  const halo = useRef<THREE.Mesh>(null)
  const haloTex = useHalo()

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const normal = useMemo(() => new THREE.Vector3(), [])
  const tilt = useMemo(() => new THREE.Vector3(), [])
  const spinQ = useMemo(() => new THREE.Quaternion(), [])
  const colorA = useMemo(() => new THREE.Color(), [])
  const colorB = useMemo(() => new THREE.Color(), [])
  const live = useRef({ ...STAGES[0] })
  const spinAngle = useRef(0)

  useFrame((state, dt) => {
    const g = group.current
    const sp = spinner.current
    const sh = shards.current
    const k = key.current
    const h = halo.current
    if (!g || !sp || !sh || !k || !h) return

    const last = STAGES.length - 1
    const p = THREE.MathUtils.clamp(scrollState.p, 0, 1) * last
    const i = Math.min(Math.floor(p), last - 1)
    const f = p - i
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

    // quem esta em cena: a malha inteira nas pontas, os cacos no meio
    const broken = from === to ? 0 : Math.sin(Math.PI * f)
    const shown = Math.sqrt(broken)
    const fadeOut = 1 - ramp(f, 0.06, 0.34)
    const fadeIn = ramp(f, 0.66, 0.94)

    solids.current.forEach((solid, s) => {
      if (!solid) return
      let o = 0
      if (from === to) o = s === from ? 1 : 0
      else if (s === from) o = fadeOut
      else if (s === to) o = fadeIn
      solid.visible = o > 0.01
      if (!solid.visible) return
      solid.scale.setScalar(cur.scale)
      for (const child of solid.children) {
        const mat = (child as THREE.Mesh).material as THREE.Material & {
          opacity: number
          color: THREE.Color
          emissive?: THREE.Color
          emissiveIntensity?: number
        }
        // as arestas ficam claras de proposito: sao elas que desenham a
        // peca. So a malha acompanha a cor da secao.
        if (mat.emissive) {
          mat.opacity = o
          mat.color.lerp(colorA, 1 - Math.exp(-l * dt))
          mat.emissive.lerp(colorA, 1 - Math.exp(-l * dt))
          mat.emissiveIntensity = 0.05 + cur.glow * 0.28
        } else {
          mat.opacity = o * 0.45
        }
      }
    })

    sh.visible = shown > 0.01
    if (sh.visible) {
      const A = shapes[from].cloud
      const B = shapes[to].cloud
      const e = ease(f)
      const burst = broken * 0.5
      const size = 0.05 * cur.scale * shown
      const t = state.clock.elapsedTime

      for (let n = 0; n < count; n++) {
        const j = n * 3
        let x = lerp(A.pos[j], B.pos[j], e) * cur.scale
        let y = lerp(A.pos[j + 1], B.pos[j + 1], e) * cur.scale
        let z = lerp(A.pos[j + 2], B.pos[j + 2], e) * cur.scale

        const d = Math.hypot(x, y, z) || 1
        const push = burst * (0.35 + seed[j] * 1.2)
        x += (x / d) * push
        y += (y / d) * push
        z += (z / d) * push

        dummy.position.set(x, y, z)
        // o caco deita sobre a casca do objeto, seguindo a normal da
        // superficie: e assim que ele se encaixa de volta na malha
        normal
          .set(
            lerp(A.nor[j], B.nor[j], e),
            lerp(A.nor[j + 1], B.nor[j + 1], e),
            lerp(A.nor[j + 2], B.nor[j + 2], e),
          )
          .normalize()
        dummy.quaternion.setFromUnitVectors(UP, normal)
        if (!still) {
          tilt.set(seed[j] - 0.5, seed[j + 1] - 0.5, seed[j + 2] - 0.5).normalize()
          spinQ.setFromAxisAngle(tilt, burst * 5 + Math.sin(t + seed[j] * 6.3) * burst)
          dummy.quaternion.multiply(spinQ)
        }
        dummy.rotateY(seed[j + 2] * 6.283)
        dummy.scale.set(size, size * 0.35, size)
        dummy.updateMatrix()
        sh.setMatrixAt(n, dummy.matrix)
      }
      sh.instanceMatrix.needsUpdate = true
      const smat = sh.material as THREE.MeshStandardMaterial
      smat.color.lerp(colorA, 1 - Math.exp(-l * dt))
      smat.emissive.lerp(colorA, 1 - Math.exp(-l * dt))
      smat.emissiveIntensity = 0.05 + cur.glow * 0.35
    }

    const t = state.clock.elapsedTime
    g.position.x = cur.x + (still ? 0 : Math.sin(t * 0.21) * 0.07)
    // no celular o objeto nao tem para onde correr na horizontal, entao
    // ele desce um pouco e sai de tras do texto
    g.position.y = cur.y + (narrow ? -0.55 : 0) + (still ? 0 : Math.cos(t * 0.16) * 0.05)
    if (!still) {
      // o objeto olha de um lado para o outro em vez de rodopiar, senao
      // o robo passa metade do tempo de costas
      g.rotation.y = Math.sin(t * 0.2) * 0.34
      // so a engrenagem gira. Quando ela sai de cena o angulo volta a
      // zero pelo caminho mais curto, senao a forma seguinte herda a
      // sobra de rotacao e aparece deitada
      spinAngle.current += cur.spinZ * dt
      if (cur.spinZ < 0.05) {
        const wrapped = Math.atan2(Math.sin(spinAngle.current), Math.cos(spinAngle.current))
        spinAngle.current = THREE.MathUtils.damp(wrapped, 0, 2.2, dt)
      }
      sp.rotation.z = spinAngle.current
    }

    cam.position.z = cur.camZ
    cam.position.x = -cur.x * 0.1
    cam.lookAt(0, 0, 0)
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
          </group>
        ))}
        <instancedMesh
          ref={shards}
          args={[undefined, undefined, count]}
          frustumCulled={false}
          visible={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#9a9aa8"
            emissive="#9a9aa8"
            emissiveIntensity={0.1}
            roughness={0.32}
            metalness={0.72}
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
      <pointsMaterial size={0.013} color="#8d8d98" transparent opacity={0.25} sizeAttenuation />
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
        <Piece count={small ? 700 : 2200} still={still} narrow={small} />
        <Dust count={small ? 180 : 420} still={still} />
      </Canvas>
    </div>
  )
}
