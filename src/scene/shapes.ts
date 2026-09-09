import * as THREE from 'three'

/* As formas por onde a bola passa, uma por secao, na ordem do scroll.
   Cada uma vira uma nuvem de N pontos. Como todas tem o mesmo N, o caco
   numero k sabe onde fica em qualquer forma, e passar de uma para a
   outra e so interpolar entre duas posicoes.

   O amostrador e escrito aqui na mao de proposito: o MeshSurfaceSampler
   mora em three/examples/jsm, e importar de la traz uma segunda copia do
   three para o bundle, o que quebra o reconhecimento de objetos do R3F. */

/** Junta os triangulos de varias geometrias num unico array de vertices. */
function triangles(geos: THREE.BufferGeometry[]): Float32Array {
  const parts = geos.map((g) => {
    const flat = g.index ? g.toNonIndexed() : g
    const arr = flat.getAttribute('position').array as Float32Array
    const copy = new Float32Array(arr)
    g.dispose()
    if (flat !== g) flat.dispose()
    return copy
  })
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Float32Array(total)
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

/** n pontos espalhados pela superficie. */
function onSurface(geos: THREE.BufferGeometry[], n: number): Float32Array {
  const tris = triangles(geos)
  const acc = cumulativeAreas(tris)
  const out = new Float32Array(n * 3)
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
      out[k * 3 + d] = tris[o + d] * w + tris[o + 3 + d] * u + tris[o + 6 + d] * v
    }
  }
  return out
}

/** n pontos espalhados pelas arestas: le como malha de nos ligados,
    e nao como solido. */
function onEdges(geo: THREE.BufferGeometry, n: number): Float32Array {
  const tris = triangles([geo])
  const count = tris.length / 9
  const out = new Float32Array(n * 3)
  for (let k = 0; k < n; k++) {
    const o = Math.floor(Math.random() * count) * 9
    const e = Math.floor(Math.random() * 3)
    const p = o + e * 3
    const q = o + ((e + 1) % 3) * 3
    const t = Math.random()
    for (let d = 0; d < 3; d++) {
      out[k * 3 + d] = tris[p + d] + (tris[q + d] - tris[p + d]) * t
    }
  }
  return out
}

function gear(): THREE.BufferGeometry[] {
  const parts: THREE.BufferGeometry[] = [
    new THREE.CylinderGeometry(0.92, 0.92, 0.32, 44, 1, true).rotateX(Math.PI / 2),
    new THREE.TorusGeometry(0.4, 0.11, 8, 30),
  ]
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2
    parts.push(
      new THREE.BoxGeometry(0.26, 0.26, 0.32)
        .rotateZ(ang)
        .translate(Math.cos(ang) * 1.04, Math.sin(ang) * 1.04, 0),
    )
  }
  return parts
}

/** Tres placas empilhadas, uma por sistema. */
function plates(): THREE.BufferGeometry[] {
  return [0.62, 0, -0.62].map((y, i) =>
    new THREE.BoxGeometry(1.85 - i * 0.14, 0.15, 1.28 - i * 0.1).translate(y * 0.18, y, 0),
  )
}

/** Helice que sobe: a trajetoria, um degrau por vez. */
function helix(n: number): Float32Array {
  const out = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const ang = t * Math.PI * 5.5
    const r = 0.55 + t * 0.5
    out[i * 3] = Math.cos(ang) * r + (Math.random() - 0.5) * 0.07
    out[i * 3 + 1] = -1.15 + t * 2.3
    out[i * 3 + 2] = Math.sin(ang) * r + (Math.random() - 0.5) * 0.07
  }
  return out
}

export function buildShapes(count: number): Float32Array[] {
  const ball = () => onSurface([new THREE.IcosahedronGeometry(1.16, 3)], count)
  return [
    // hero: a bola, materia bruta
    ball(),
    // sobre: um bloco, a base chata que sustenta o resto
    onSurface([new THREE.BoxGeometry(1.5, 1.5, 1.5, 7, 7, 7)], count),
    // projetos: tres placas empilhadas
    onSurface(plates(), count),
    // ia aplicada: malha de nos ligados
    onEdges(new THREE.IcosahedronGeometry(1.3, 2), count),
    // ferramentas: uma engrenagem
    onSurface(gear(), count),
    // trajetoria: uma helice que sobe
    helix(count),
    // certificacoes: um cristal facetado
    onSurface([new THREE.OctahedronGeometry(1.34, 0)], count),
    // contato: volta a ser a bola, fecha onde comecou
    ball(),
  ]
}
