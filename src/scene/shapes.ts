import * as THREE from 'three'

/* Os objetos por onde a peca passa, na ordem do scroll.

   Cada um vem em tres versoes: a malha solida, as arestas dela (e o que
   deixa a peca desenhada em vez de borrada) e uma nuvem de N pontos com
   a normal de cada ponto. A malha e o que aparece parado numa secao; a
   nuvem so entra durante a virada, quando a peca se despedaca no ar e se
   remonta na forma seguinte. Como todas as nuvens tem o mesmo N, o caco
   numero k sabe onde fica em qualquer objeto.

   O amostrador e escrito aqui na mao de proposito: o MeshSurfaceSampler
   mora em three/examples/jsm, e importar de la traz uma segunda copia do
   three para o bundle, o que quebra o reconhecimento de objetos do R3F. */

export type Cloud = { pos: Float32Array; nor: Float32Array }
export type Shape = {
  geo: THREE.BufferGeometry
  edges: THREE.BufferGeometry
  cloud: Cloud
  /** Faixa de vertices de cada primitiva dentro da malha unica, para
      descobrir em que parte o cursor esta a partir do triangulo acertado. */
  ranges: { start: number; count: number }[]
  /** Arestas de cada primitiva sozinha: e o que acende no hover. */
  partEdges: THREE.BufferGeometry[]
}

/** Qual objeto aparece em cada secao. O robo abre, reaparece no sobre e
    fecha no contato. */
export const ORDER = [0, 0, 1, 2, 3, 4, 5, 0]

/** Junta as primitivas numa malha so, mantendo posicao e normal, e
    anota onde cada uma comecou. */
function merge(parts: THREE.BufferGeometry[]): {
  geo: THREE.BufferGeometry
  ranges: { start: number; count: number }[]
} {
  const flats = parts.map((p) => (p.index ? p.toNonIndexed() : p))
  let total = 0
  for (const f of flats) total += f.getAttribute('position').count
  const pos = new Float32Array(total * 3)
  const nor = new Float32Array(total * 3)
  const ranges: { start: number; count: number }[] = []
  let at = 0
  for (const f of flats) {
    const count = f.getAttribute('position').count
    ranges.push({ start: at / 3, count })
    pos.set(f.getAttribute('position').array as Float32Array, at)
    nor.set(f.getAttribute('normal').array as Float32Array, at)
    at += count * 3
  }
  flats.forEach((f, i) => {
    if (f !== parts[i]) f.dispose()
    parts[i].dispose()
  })
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  return { geo, ranges }
}

/** Areas acumuladas, para sortear triangulo grande com mais frequencia
    que triangulo pequeno e a nuvem sair uniforme. */
function cumulativeAreas(tris: Float32Array): Float32Array {
  const n = tris.length / 9
  const acc = new Float32Array(n)
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  let sum = 0
  for (let i = 0; i < n; i++) {
    const o = i * 9
    ab.set(tris[o + 3] - tris[o], tris[o + 4] - tris[o + 1], tris[o + 5] - tris[o + 2])
    ac.set(tris[o + 6] - tris[o], tris[o + 7] - tris[o + 1], tris[o + 8] - tris[o + 2])
    sum += ab.cross(ac).length() * 0.5
    acc[i] = sum
  }
  return acc
}

function pickTriangle(acc: Float32Array): number {
  const target = Math.random() * acc[acc.length - 1]
  let lo = 0
  let hi = acc.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (acc[mid] < target) lo = mid + 1
    else hi = mid
  }
  return lo
}

/** n pontos pela superficie da malha, cada um com a normal do triangulo
    de onde saiu: e ela que deita o caco sobre a casca. */
function sample(geo: THREE.BufferGeometry, n: number): Cloud {
  const tris = geo.getAttribute('position').array as Float32Array
  const acc = cumulativeAreas(tris)
  const pos = new Float32Array(n * 3)
  const nor = new Float32Array(n * 3)
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  for (let k = 0; k < n; k++) {
    const o = pickTriangle(acc) * 9
    let u = Math.random()
    let v = Math.random()
    if (u + v > 1) {
      u = 1 - u
      v = 1 - v
    }
    const w = 1 - u - v
    for (let d = 0; d < 3; d++) {
      pos[k * 3 + d] = tris[o + d] * w + tris[o + 3 + d] * u + tris[o + 6 + d] * v
    }
    ab.set(tris[o + 3] - tris[o], tris[o + 4] - tris[o + 1], tris[o + 5] - tris[o + 2])
    ac.set(tris[o + 6] - tris[o], tris[o + 7] - tris[o + 1], tris[o + 8] - tris[o + 2])
    ab.cross(ac).normalize()
    nor[k * 3] = ab.x
    nor[k * 3 + 1] = ab.y
    nor[k * 3 + 2] = ab.z
  }
  return { pos, nor }
}

const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0) =>
  new THREE.BoxGeometry(w, h, d).translate(x, y, z)

/** Robozinho: antena, cabeca com visor e orelhas, tronco com painel,
    bracos, maos, pernas e pes. */
function robot(): THREE.BufferGeometry[] {
  return [
    new THREE.CylinderGeometry(0.03, 0.03, 0.22, 10).translate(0, 1.08, 0),
    new THREE.IcosahedronGeometry(0.09, 1).translate(0, 1.24, 0),
    box(0.72, 0.56, 0.54, 0, 0.8, 0),
    box(0.5, 0.2, 0.06, 0, 0.82, 0.28),
    new THREE.CylinderGeometry(0.09, 0.09, 0.12, 12).rotateZ(Math.PI / 2).translate(0.4, 0.8, 0),
    new THREE.CylinderGeometry(0.09, 0.09, 0.12, 12).rotateZ(Math.PI / 2).translate(-0.4, 0.8, 0),
    new THREE.CylinderGeometry(0.13, 0.13, 0.14, 12).translate(0, 0.46, 0),
    box(0.84, 0.76, 0.5, 0, 0.02, 0),
    box(0.34, 0.24, 0.04, 0, 0.06, 0.27),
    box(0.18, 0.6, 0.18, 0.56, 0.04, 0),
    box(0.18, 0.6, 0.18, -0.56, 0.04, 0),
    box(0.23, 0.19, 0.23, 0.56, -0.34, 0),
    box(0.23, 0.19, 0.23, -0.56, -0.34, 0),
    box(0.24, 0.5, 0.24, 0.23, -0.64, 0),
    box(0.24, 0.5, 0.24, -0.23, -0.64, 0),
    box(0.32, 0.15, 0.42, 0.23, -0.96, 0.07),
    box(0.32, 0.15, 0.42, -0.23, -0.96, 0.07),
  ]
}

/** Tres unidades empilhadas: um sistema por placa. */
function stack(): THREE.BufferGeometry[] {
  const parts: THREE.BufferGeometry[] = []
  ;[0.62, 0, -0.62].forEach((y, i) => {
    const w = 1.7 - i * 0.12
    parts.push(box(w, 0.3, 1.15 - i * 0.08, 0, y, 0))
    // um friso na frente de cada unidade, para nao virar tres caixas lisas
    parts.push(box(w * 0.55, 0.06, 0.04, -w * 0.16, y + 0.07, (1.15 - i * 0.08) / 2))
  })
  return parts
}

/** Chip: corpo quadrado, marca no topo e as pernas dos quatro lados. */
function chip(): THREE.BufferGeometry[] {
  const parts = [box(1.02, 0.22, 1.02), box(0.36, 0.05, 0.36, 0, 0.135, 0)]
  for (let i = 0; i < 7; i++) {
    const z = -0.42 + (i / 6) * 0.84
    parts.push(box(0.3, 0.07, 0.09, 0.63, 0, z), box(0.3, 0.07, 0.09, -0.63, 0, z))
    parts.push(box(0.09, 0.07, 0.3, z, 0, 0.63), box(0.09, 0.07, 0.3, z, 0, -0.63))
  }
  return parts
}

/** Engrenagem: aro, oito dentes, quatro raios e o cubo central. */
function gear(): THREE.BufferGeometry[] {
  const parts: THREE.BufferGeometry[] = [
    new THREE.CylinderGeometry(0.8, 0.8, 0.3, 40, 1, true).rotateX(Math.PI / 2),
    new THREE.CylinderGeometry(0.62, 0.62, 0.3, 36, 1, true).rotateX(Math.PI / 2),
    new THREE.CylinderGeometry(0.26, 0.26, 0.3, 20, 1, true).rotateX(Math.PI / 2),
  ]
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2
    parts.push(
      new THREE.BoxGeometry(0.3, 0.32, 0.3)
        .rotateZ(ang)
        .translate(Math.cos(ang) * 0.94, Math.sin(ang) * 0.94, 0),
    )
  }
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.PI / 8
    parts.push(
      new THREE.BoxGeometry(0.42, 0.14, 0.3)
        .rotateZ(ang)
        .translate(Math.cos(ang) * 0.44, Math.sin(ang) * 0.44, 0),
    )
  }
  return parts
}

/** Foguete: bico, corpo com faixa, tres aletas e o bocal. */
function rocket(): THREE.BufferGeometry[] {
  const parts: THREE.BufferGeometry[] = [
    new THREE.ConeGeometry(0.32, 0.62, 24).translate(0, 0.98, 0),
    new THREE.CylinderGeometry(0.32, 0.36, 1.26, 24).translate(0, 0.04, 0),
    new THREE.CylinderGeometry(0.345, 0.345, 0.1, 24).translate(0, 0.44, 0),
    new THREE.CylinderGeometry(0.23, 0.35, 0.26, 24).translate(0, -0.72, 0),
  ]
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2
    parts.push(
      new THREE.BoxGeometry(0.07, 0.46, 0.38)
        .rotateY(ang)
        .translate(Math.cos(ang) * 0.36, -0.44, Math.sin(ang) * 0.36),
    )
  }
  return parts
}

/** Cristal: dois octaedros, um dentro do outro. */
function crystal(): THREE.BufferGeometry[] {
  return [
    new THREE.OctahedronGeometry(1.15, 0),
    new THREE.OctahedronGeometry(0.6, 0).rotateY(Math.PI / 4),
  ]
}

/* Peca chata vista de perfil vira uma barra: as inclinacoes abaixo sao
   o angulo em que cada objeto se le melhor de frente para a camera. */
const PIECES: { parts: () => THREE.BufferGeometry[]; tiltX?: number; tiltY?: number }[] = [
  { parts: robot },
  { parts: stack, tiltY: 0.5 },
  { parts: chip, tiltX: 0.5, tiltY: 0.4 },
  { parts: gear },
  { parts: rocket },
  { parts: crystal, tiltY: 0.3 },
]

export function buildShapes(count: number): Shape[] {
  return PIECES.map(({ parts, tiltX, tiltY }) => {
    const raw = parts()
    const tilt = (g: THREE.BufferGeometry) => {
      if (tiltX) g.rotateX(tiltX)
      if (tiltY) g.rotateY(tiltY)
      return g
    }
    // as arestas de cada parte saem antes da fusao, que descarta as
    // primitivas
    const partEdges = raw.map((g) => tilt(new THREE.EdgesGeometry(g, 22)))
    const { geo, ranges } = merge(raw)
    tilt(geo)
    return {
      geo,
      // 22 graus: guarda a silhueta e as quinas, sem desenhar cada
      // triangulo da malha
      edges: new THREE.EdgesGeometry(geo, 22),
      cloud: sample(geo, count),
      ranges,
      partEdges,
    }
  })
}

/** Em que primitiva cai o triangulo `face` da malha fundida. */
export function partAt(shape: Shape, face: number): number {
  const v = face * 3
  for (let i = 0; i < shape.ranges.length; i++) {
    const r = shape.ranges[i]
    if (v >= r.start && v < r.start + r.count) return i
  }
  return -1
}
