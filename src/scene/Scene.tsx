import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { scrollState } from "./scrollState";

/* Um solido que atravessa a tela conforme a pagina desce. Cada parada
   abaixo e uma secao, e o x alterna de lado para o solido cruzar com o
   texto, que deriva no sentido contrario. O valor exibido nunca salta
   para o alvo: e amortecido a partir do valor atual na tela, entao
   dar scroll para tras no meio do movimento inverte sem emenda. */
type Stage = {
  distort: number;
  speed: number;
  scale: number;
  wire: number;
  rough: number;
  glow: number;
  color: string;
  camZ: number;
  spin: number;
  x: number;
  y: number;
};

const STAGES: Stage[] = [
  // hero: massa escura parada, a direita
  {
    distort: 0.22,
    speed: 0.8,
    scale: 1.02,
    wire: 0.2,
    rough: 0.55,
    glow: 0.15,
    color: "#2c2c36",
    camZ: 4.8,
    spin: 0.06,
    x: 2.0,
    y: 0.0,
  },
  // sobre: atravessa para a esquerda e respira
  {
    distort: 0.36,
    speed: 1.3,
    scale: 0.9,
    wire: 0.36,
    rough: 0.4,
    glow: 0.3,
    color: "#3b3542",
    camZ: 4.4,
    spin: 0.12,
    x: -2.1,
    y: 0.25,
  },
  // projetos: volta para a direita, gaiola aberta
  {
    distort: 0.5,
    speed: 1.7,
    scale: 0.84,
    wire: 0.85,
    rough: 0.3,
    glow: 0.45,
    color: "#6b4331",
    camZ: 4.0,
    spin: 0.2,
    x: 2.5,
    y: -0.15,
  },
  // ia aplicada: nucleo em brasa, atras do painel a esquerda
  {
    distort: 0.66,
    speed: 2.6,
    scale: 0.76,
    wire: 0.6,
    rough: 0.16,
    glow: 1.0,
    color: "#e8622f",
    camZ: 3.7,
    spin: 0.3,
    x: -2.5,
    y: 0.1,
  },
  // ferramentas e trajetoria: assenta a direita
  {
    distort: 0.32,
    speed: 1.1,
    scale: 0.72,
    wire: 0.4,
    rough: 0.35,
    glow: 0.35,
    color: "#4a3b3a",
    camZ: 4.6,
    spin: 0.12,
    x: 2.3,
    y: -0.2,
  },
  // certificacoes: passa pela esquerda
  {
    distort: 0.26,
    speed: 0.9,
    scale: 0.7,
    wire: 0.3,
    rough: 0.3,
    glow: 0.28,
    color: "#5a4038",
    camZ: 4.8,
    spin: 0.1,
    x: -2.2,
    y: 0.2,
  },
  // contato: centraliza, recua e acende
  {
    distort: 0.14,
    speed: 0.6,
    scale: 1.0,
    wire: 0.26,
    rough: 0.24,
    glow: 0.7,
    color: "#c9552a",
    camZ: 6.0,
    spin: 0.05,
    x: 0.0,
    y: 0.0,
  },
];

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

function Solid({ still, detail }: { still: boolean; detail: number }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const spinner = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const shard = useRef<THREE.Mesh>(null);
  const key = useRef<THREE.PointLight>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mat = useRef<any>(null);

  const colorA = useMemo(() => new THREE.Color(), []);
  const colorB = useMemo(() => new THREE.Color(), []);
  const live = useRef({ ...STAGES[0] });

  useFrame((state, dt) => {
    const g = group.current;
    const c = core.current;
    const s = shell.current;
    const sp = spinner.current;
    const o = orbit.current;
    const m = mat.current;
    const k = key.current;
    if (!g || !c || !s || !sp || !o || !m || !k) return;

    const last = STAGES.length - 1;
    const p = THREE.MathUtils.clamp(scrollState.p, 0, 1) * last;
    const i = Math.min(Math.floor(p), last - 1);
    const f = p - i;
    const a = STAGES[i];
    const b = STAGES[i + 1];

    const cur = live.current;
    const l = 3.2;
    const damp = (from: number, to: number) =>
      THREE.MathUtils.damp(from, to, l, dt);

    cur.distort = damp(cur.distort, lerp(a.distort, b.distort, f));
    cur.speed = damp(cur.speed, lerp(a.speed, b.speed, f));
    cur.scale = damp(cur.scale, lerp(a.scale, b.scale, f));
    cur.wire = damp(cur.wire, lerp(a.wire, b.wire, f));
    cur.rough = damp(cur.rough, lerp(a.rough, b.rough, f));
    cur.glow = damp(cur.glow, lerp(a.glow, b.glow, f));
    cur.camZ = damp(cur.camZ, lerp(a.camZ, b.camZ, f));
    cur.spin = damp(cur.spin, lerp(a.spin, b.spin, f));
    cur.x = damp(cur.x, lerp(a.x, b.x, f));
    cur.y = damp(cur.y, lerp(a.y, b.y, f));

    colorA.set(a.color);
    colorB.set(b.color);
    colorA.lerp(colorB, f);
    m.color.lerp(colorA, 1 - Math.exp(-l * dt));
    m.emissive.lerp(colorA, 1 - Math.exp(-l * dt));
    m.emissiveIntensity = 0.06 + cur.glow * 0.7;
    m.distort = still ? 0.24 : cur.distort;
    m.speed = still ? 0 : cur.speed;
    m.roughness = cur.rough;

    c.scale.setScalar(cur.scale);
    s.scale.setScalar(cur.scale * 1.24);
    o.scale.setScalar(cur.scale);
    (s.material as THREE.MeshBasicMaterial).opacity = cur.wire;
    (s.material as THREE.MeshBasicMaterial).color.copy(colorA);
    k.intensity = 95 + cur.glow * 130;
    k.color.copy(colorA);

    const t = state.clock.elapsedTime;
    // deriva continua por cima da posicao da secao, para nunca ficar parado
    const idleX = still ? 0 : Math.sin(t * 0.23) * 0.2;
    const idleY = still ? 0 : Math.cos(t * 0.17) * 0.16;
    g.position.x = cur.x + idleX;
    g.position.y = cur.y + idleY;

    if (!still) {
      sp.rotation.y += cur.spin * dt;
      sp.rotation.x = Math.sin(t * 0.18) * 0.16;
      s.rotation.y -= cur.spin * 1.7 * dt;
      s.rotation.z += cur.spin * 0.4 * dt;
      o.rotation.y += (0.35 + cur.spin) * dt;
      o.rotation.x = 0.42 + Math.sin(t * 0.31) * 0.12;
      if (shard.current) shard.current.rotation.x += dt * 1.2;
    }

    // a camera anda um pouco contra o solido: aumenta a sensacao de volume
    state.camera.position.z = cur.camZ;
    state.camera.position.x = -cur.x * 0.16;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <pointLight
        ref={key}
        position={[1.5, 1.2, 2.1]}
        distance={13}
        color="#ff7a3d"
      />
      <group ref={spinner}>
        <mesh ref={core}>
          <icosahedronGeometry args={[1, detail]} />
          <MeshDistortMaterial
            ref={mat}
            color="#2a2a33"
            emissive="#2a2a33"
            emissiveIntensity={0.1}
            roughness={0.5}
            metalness={0.7}
            distort={0.22}
            speed={0.8}
          />
        </mesh>
        <mesh ref={shell}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial
            wireframe
            transparent
            opacity={0.2}
            color="#e8622f"
          />
        </mesh>
      </group>
      <group ref={orbit}>
        <mesh ref={shard} position={[1.5, 0, 0]}>
          <octahedronGeometry args={[0.11, 0]} />
          <meshStandardMaterial
            color="#e8622f"
            emissive="#e8622f"
            emissiveIntensity={1.4}
            roughness={0.3}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.006, 6, 128]} />
          <meshBasicMaterial color="#e8622f" transparent opacity={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function Dust({ count, still }: { count: number; still: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 5.0 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((state, dt) => {
    if (still || !ref.current) return;
    ref.current.rotation.y += dt * 0.03;
    // a poeira anda ao contrario do solido, o que separa os dois planos
    ref.current.position.x =
      -scrollState.p * 1.2 + Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#8d8d98"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

export default function Scene() {
  const still =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-60 md:opacity-100"
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, small ? 1.4 : 1.8]}
        camera={{ position: [0, 0, 4.8], fov: 42 }}
        gl={{ antialias: !small, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.34} />
        <pointLight
          position={[-5, -2, -4]}
          intensity={26}
          color="#5f7fbf"
          distance={24}
        />
        <Solid still={still} detail={small ? 8 : 20} />
        <Dust count={small ? 420 : 1100} still={still} />
      </Canvas>
    </div>
  );
}
