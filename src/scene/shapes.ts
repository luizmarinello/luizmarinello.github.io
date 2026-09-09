import * as THREE from 'three'

/* As formas por onde a bola passa, uma por secao, na ordem do scroll.
   Cada uma vira uma nuvem de N pontos. Como todas tem o mesmo N, o caco
   numero k sabe onde fica em qualquer forma, e passar de uma para a
   outra e so interpolar entre duas posicoes.

   Sao objetos montados de primitivas, e nao formas abstratas: a silhueta
   precisa se ler de primeira, mesmo desenhada por mil cacos soltos.

   O amostrador e escrito aqui na mao de proposito: o MeshSurfaceSampler
   mora em three/examples/jsm, e importar de la traz uma segunda copia do
   three para o bundle, o que quebra o reconhecimento de objetos do R3F. */

/** Junta os triangulos de varias geometrias num unico array de vertices. */
function triangles(geos: THREE.BufferGeometry[]): Float32Array {
  const parts = geos.map((g) => {
    const flat = g.index ? g.toNonIndexed() : g
    const copy = new Float32Array(flat.getAttribute('position').array as Float32Array)
    if (flat !== g) flat.dispose()
    g.dispose()
    return copy
  })
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
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

export type Cloud = { pos: Float32Array; nor: Float32Array }

/** n pontos espalhados pela superficie do conjunto, cada um com a normal
    do triangulo de onde saiu: e ela que deita o caco sobre a casca do
    objeto, em vez de deixar cada um apontando para um lado. */
function surface(geos: THREE.BufferGeometry[], n: number): Cloud {
  const tris = triangles(geos)
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

/** Robozinho: antena, cabeca com visor, tronco, bracos, pernas e pes. */
function robot(): THREE.BufferGeometry[] {
  return [
    new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8).translate(0, 1.06, 0),
    new THREE.IcosahedronGeometry(0.08, 1).translate(0, 1.2, 0),
    box(0.66, 0.52, 0.5, 0, 0.78, 0),
    box(0.46, 0.18, 0.04, 0, 0.8, 0.26),
    new THREE.CylinderGeometry(0.11, 0.11, 0.12, 10).translate(0, 0.46, 0),
    box(0.78, 0.72, 0.48, 0, 0.04, 0),
    box(0.16, 0.58, 0.16, 0.52, 0.06, 0),
    box(0.16, 0.58, 0.16, -0.52, 0.06, 0),
    box(0.21, 0.17, 0.21, 0.52, -0.31, 0),
    box(0.21, 0.17, 0.21, -0.52, -0.31, 0),
    box(0.22, 0.5, 0.22, 0.22, -0.62, 0),
    box(0.22, 0.5, 0.22, -0.22, -0.62, 0),
    box(0.3, 0.14, 0.4, 0.22, -0.93, 0.06),
    box(0.3, 0.14, 0.4, -0.22, -0.93, 0.06),
  ]
}

/** Tres unidades empilhadas: um sistema por placa. */
function stack(): THREE.BufferGeometry[] {
  return [0.62, 0, -0.62].map((y, i) => box(1.8 - i * 0.14, 0.24, 1.2 - i * 0.1, 0, y, 0))
}

/** Chip: corpo quadrado, marca no topo e as pernas dos dois lados. */
function chip(): THREE.BufferGeometry[] {
  const parts = [box(1.0, 0.2, 1.0), box(0.34, 0.04, 0.34, 0, 0.12, 0)]
  for (let i = 0; i < 7; i++) {
    const z = -0.42 + (i / 6) * 0.84
    parts.push(box(0.28, 0.06, 0.08, 0.62, 0, z), box(0.28, 0.06, 0.08, -0.62, 0, z))
    parts.push(box(0.08, 0.06, 0.28, z, 0, 0.62), box(0.08, 0.06, 0.28, z, 0, -0.62))
  }
  return parts
}

/** Engrenagem: aro, oito dentes, quatro raios e o cubo central. O aro e
    o cubo sao cilindros abertos de proposito. Disco cheio espalha caco
    pela face inteira e a peca vira confete: o que faz ler engrenagem e
    o contorno. */
function gear(): THREE.BufferGeometry[] {
  const parts: THREE.BufferGeometry[] = [
    new THREE.CylinderGeometry(0.8, 0.8, 0.3, 48, 1, true).rotateX(Math.PI / 2),
    new THREE.CylinderGeometry(0.62, 0.62, 0.3, 40, 1, true).rotateX(Math.PI / 2),
    new THREE.CylinderGeometry(0.26, 0.26, 0.3, 24, 1, true).rotateX(Math.PI / 2),
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
      new THREE.BoxGeometry(0.4, 0.13, 0.3)
        .rotateZ(ang)
        .translate(Math.cos(ang) * 0.44, Math.sin(ang) * 0.44, 0),
    )
  }
  return parts
}

/** Foguete: bico, corpo, tres aletas e o bocal. */
function rocket(): THREE.BufferGeometry[] {
  const parts: THREE.BufferGeometry[] = [
    new THREE.ConeGeometry(0.3, 0.6, 20).translate(0, 0.96, 0),
    new THREE.CylinderGeometry(0.3, 0.34, 1.25, 20).translate(0, 0.03, 0),
    new THREE.CylinderGeometry(0.22, 0.33, 0.24, 20).translate(0, -0.72, 0),
  ]
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2
    parts.push(
      new THREE.BoxGeometry(0.06, 0.44, 0.36)
        .rotateY(ang)
        .translate(Math.cos(ang) * 0.34, -0.44, Math.sin(ang) * 0.34),
    )
  }
  return parts
}

export function buildShapes(count: number): Cloud[] {
  const bot = () => surface(robot(), count)
  return [
    // hero e sobre: o robozinho, parado do mesmo jeito nas duas
    bot(),
    bot(),
    // projetos: tres unidades empilhadas
    surface(stack(), count),
    // ia aplicada: um chip
    surface(chip(), count),
    // ferramentas: a engrenagem
    surface(gear(), count),
    // trajetoria: o foguete, que sobe
    surface(rocket(), count),
    // certificacoes: um cristal
    surface([new THREE.OctahedronGeometry(1.15, 0)], count),
    // contato: o robozinho de novo, fecha onde comecou
    bot(),
  ]
}
