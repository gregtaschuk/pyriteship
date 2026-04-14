import { useEffect, useRef } from 'react'

const COS30 = Math.cos(Math.PI / 6)
const SIN30 = 0.5

const SHADE_TOP = 'rgba(110, 80, 28, 0.75)'
const SHADE_RIGHT = 'rgba(78, 56, 18, 0.75)'
const SHADE_LEFT = 'rgba(46, 32, 10, 0.75)'
const STRIATION = 'rgba(0, 0, 0, 0.55)'
const EDGE = 'rgba(150, 108, 38, 0.75)'

function project(x, y, z) {
  return {
    x: (x - z) * COS30,
    y: (x + z) * SIN30 - y,
  }
}

function rotateY(v, c, s) {
  return { x: v.x * c - v.z * s, y: v.y, z: v.x * s + v.z * c }
}

function cubeVerts(h, rot) {
  const c = Math.cos(rot), s = Math.sin(rot)
  const raw = [
    { x: -h, y: -h, z: -h },
    { x:  h, y: -h, z: -h },
    { x:  h, y: -h, z:  h },
    { x: -h, y: -h, z:  h },
    { x: -h, y:  h, z: -h },
    { x:  h, y:  h, z: -h },
    { x:  h, y:  h, z:  h },
    { x: -h, y:  h, z:  h },
  ]
  return raw.map(v => rotateY(v, c, s))
}

function drawFace(ctx, face) {
  const [s0, s1, s2, s3] = face.screen
  ctx.beginPath()
  ctx.moveTo(s0.x, s0.y)
  ctx.lineTo(s1.x, s1.y)
  ctx.lineTo(s2.x, s2.y)
  ctx.lineTo(s3.x, s3.y)
  ctx.closePath()
  ctx.fillStyle = face.shade
  ctx.fill()
  ctx.strokeStyle = EDGE
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.strokeStyle = STRIATION
  ctx.lineWidth = 1.5
  ctx.lineCap = 'butt'
  ctx.setLineDash([3, 2])
  const N = 7
  for (let i = 1; i < N; i++) {
    const t = i / N
    let ax, ay, bx, by
    if (face.stri === 0) {
      ax = s0.x + (s3.x - s0.x) * t
      ay = s0.y + (s3.y - s0.y) * t
      bx = s1.x + (s2.x - s1.x) * t
      by = s1.y + (s2.y - s1.y) * t
    } else {
      ax = s0.x + (s1.x - s0.x) * t
      ay = s0.y + (s1.y - s0.y) * t
      bx = s3.x + (s2.x - s3.x) * t
      by = s3.y + (s2.y - s3.y) * t
    }
    ctx.beginPath()
    ctx.moveTo(Math.round(ax), Math.round(ay))
    ctx.lineTo(Math.round(bx), Math.round(by))
    ctx.stroke()
  }
  ctx.setLineDash([])
}

const FACES = [
  { idx: [4, 5, 6, 7], n: [0,  1, 0], shade: SHADE_TOP,   stri: 0 }, // +Y top
  { idx: [0, 3, 2, 1], n: [0, -1, 0], shade: SHADE_LEFT,  stri: 0 }, // -Y bottom
  { idx: [1, 5, 6, 2], n: [1,  0, 0], shade: SHADE_RIGHT, stri: 1 }, // +X
  { idx: [0, 4, 7, 3], n: [-1, 0, 0], shade: SHADE_LEFT,  stri: 1 }, // -X
  { idx: [3, 7, 6, 2], n: [0,  0, 1], shade: SHADE_RIGHT, stri: 1 }, // +Z
  { idx: [0, 1, 5, 4], n: [0,  0,-1], shade: SHADE_LEFT,  stri: 1 }, // -Z
]

function collectCubeFaces(cx, cy, size, rot, out) {
  if (size < 0.5) return
  const v = cubeVerts(size, rot)
  const c = Math.cos(rot), s = Math.sin(rot)
  for (const f of FACES) {
    const nx = f.n[0] * c - f.n[2] * s
    const ny = f.n[1]
    const nz = f.n[0] * s + f.n[2] * c
    if (nx + ny + nz <= 0) continue
    const verts = f.idx.map(i => v[i])
    const screen = verts.map(q => {
      const p = project(q.x, q.y, q.z)
      return { x: cx + p.x, y: cy + p.y }
    })
    const depth = verts.reduce((a, q) => a + q.x + q.y + q.z, 0) / 4
    out.push({ screen, depth, shade: f.shade, stri: f.stri })
  }
}

function drawCrystal(ctx, crystal) {
  const { x, y, size, rot, twin } = crystal
  const faces = []
  collectCubeFaces(x, y, size, rot, faces)
  if (twin) {
    collectCubeFaces(
      x + twin.dx * size,
      y + twin.dy * size,
      size * twin.sizeRatio,
      rot + twin.drot,
      faces,
    )
  }
  faces.sort((a, b) => a.depth - b.depth)
  for (const f of faces) drawFace(ctx, f)
}

function makeCrystal(w, h) {
  const targetSize = 22 + Math.random() * 48
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: 0,
    targetSize,
    rot: Math.random() * Math.PI * 2,
    age: 0,
    lifespan: 45 + Math.random() * 30,
    twin: Math.random() < 0.2 ? {
      dx: (Math.random() - 0.5) * 0.9,
      dy: (Math.random() - 0.5) * 0.6,
      drot: (Math.random() - 0.5) * Math.PI,
      sizeRatio: 0.6 + Math.random() * 0.45,
    } : null,
  }
}

function shouldSkip() {
  if (typeof window === 'undefined') return true
  if (window.innerWidth < 720) return true
  const conn = navigator.connection
  if (conn && conn.saveData) return true
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return true
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return true
  return false
}

export default function PyriteBackground() {
  const canvasRef = useRef(null)
  const skip = typeof window !== 'undefined' ? shouldSkip() : true

  useEffect(() => {
    if (skip) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0, height = 0, worldHeight = 0, dpr = 1
    const crystals = []
    const densityPerViewport = 14
    let targetCount = densityPerViewport

    const measureWorldHeight = () =>
      Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0,
        window.innerHeight,
      )

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      worldHeight = measureWorldHeight()
      targetCount = Math.round(densityPerViewport * (worldHeight / height))
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    while (crystals.length < targetCount) {
      const c = makeCrystal(width, worldHeight)
      c.size = c.targetSize * (0.3 + Math.random() * 0.7)
      c.age = Math.random() * c.lifespan * 0.6
      crystals.push(c)
    }

    let last = performance.now()
    let raf = 0

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      ctx.clearRect(0, 0, width, height)
      const scrollY = window.scrollY || window.pageYOffset || 0

      while (crystals.length < targetCount) crystals.push(makeCrystal(width, worldHeight))
      if (crystals.length > targetCount) crystals.length = targetCount

      for (let i = crystals.length - 1; i >= 0; i--) {
        const c = crystals[i]
        c.age += dt

        const growDur = 9
        const fadeDur = 6
        const growT = Math.min(c.age / growDur, 1)
        const deathT = Math.max(0, (c.age - (c.lifespan - fadeDur)) / fadeDur)
        const scale = Math.sin(growT * Math.PI * 0.5) * (1 - Math.sin(deathT * Math.PI * 0.5))
        c.size = c.targetSize * scale

        if (c.age >= c.lifespan) {
          crystals[i] = makeCrystal(width, worldHeight)
          continue
        }
        const screenY = c.y - scrollY
        if (screenY < -120 || screenY > height + 120) continue
        drawCrystal(ctx, { ...c, y: screenY })
      }

      if (!reduceMotion && !document.hidden) {
        raf = requestAnimationFrame(frame)
      }
    }

    const staticFrame = () => {
      ctx.clearRect(0, 0, width, height)
      const scrollY = window.scrollY || window.pageYOffset || 0
      for (const c of crystals) {
        c.size = c.targetSize
        const screenY = c.y - scrollY
        if (screenY < -120 || screenY > height + 120) continue
        drawCrystal(ctx, { ...c, y: screenY })
      }
    }

    if (reduceMotion) {
      staticFrame()
    } else {
      raf = requestAnimationFrame(frame)
    }

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
      } else if (!reduceMotion) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    const onScroll = () => {
      if (reduceMotion) staticFrame()
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    let resizeTimer = 0
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        resize()
        if (reduceMotion) staticFrame()
      }, 120)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [skip])

  if (skip) return null
  return <canvas ref={canvasRef} className="pyrite-bg" aria-hidden="true" />
}
