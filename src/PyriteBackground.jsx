import { useEffect, useRef } from 'react'

const COS30 = Math.cos(Math.PI / 6)
const SIN30 = 0.5

const SHADE_TOP   = { dark: 'rgba(64, 54, 22, 0.9)', light: 'rgba(108, 92, 44, 0.9)' }
const SHADE_RIGHT = { dark: 'rgba(32, 26, 10, 0.9)', light: 'rgba(58, 48, 20, 0.9)' }
const SHADE_FRONT = { dark: 'rgba(14, 10, 4, 0.95)', light: 'rgba(26, 22, 8, 0.95)' }
const RIM = 'rgba(168, 144, 76, 0.8)'
const EDGE_DIM = 'rgba(0, 0, 0, 0.6)'

function project(x, y, z) {
  return {
    x: (x - z) * COS30,
    y: (x + z) * SIN30 - y,
  }
}

const CUBE = [
  { x: -1, y: -1, z: -1 },
  { x:  1, y: -1, z: -1 },
  { x:  1, y: -1, z:  1 },
  { x: -1, y: -1, z:  1 },
  { x: -1, y:  1, z: -1 },
  { x:  1, y:  1, z: -1 },
  { x:  1, y:  1, z:  1 },
  { x: -1, y:  1, z:  1 },
]

function drawFace(ctx, face) {
  const [s0, s1, s2, s3] = face.screen
  ctx.beginPath()
  ctx.moveTo(s0.x, s0.y)
  ctx.lineTo(s1.x, s1.y)
  ctx.lineTo(s2.x, s2.y)
  ctx.lineTo(s3.x, s3.y)
  ctx.closePath()
  const grad = ctx.createLinearGradient(s0.x, s0.y, s2.x, s2.y)
  grad.addColorStop(0, face.shade.dark)
  grad.addColorStop(1, face.shade.light)
  ctx.fillStyle = grad
  ctx.fill()

  // Find the top-most edge (two vertices with smallest y) and highlight it.
  const verts = [s0, s1, s2, s3]
  const order = [0, 1, 2, 3].sort((a, b) => verts[a].y - verts[b].y)
  const topA = order[0]
  const topB = order[1]
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0]]
  ctx.lineWidth = 0.75
  ctx.strokeStyle = EDGE_DIM
  for (const [a, b] of edges) {
    const isRim = (a === topA && b === topB) || (a === topB && b === topA)
    if (isRim) continue
    ctx.beginPath()
    ctx.moveTo(verts[a].x, verts[a].y)
    ctx.lineTo(verts[b].x, verts[b].y)
    ctx.stroke()
  }
  for (const [a, b] of edges) {
    const isRim = (a === topA && b === topB) || (a === topB && b === topA)
    if (!isRim) continue
    ctx.strokeStyle = RIM
    ctx.lineWidth = 1.25
    ctx.beginPath()
    ctx.moveTo(verts[a].x, verts[a].y)
    ctx.lineTo(verts[b].x, verts[b].y)
    ctx.stroke()
  }
}

const FACES = [
  { idx: [4, 5, 6, 7], shade: SHADE_TOP   }, // +Y top
  { idx: [1, 5, 6, 2], shade: SHADE_RIGHT }, // +X right
  { idx: [3, 7, 6, 2], shade: SHADE_FRONT }, // +Z front
]

function collectCubeFaces(cx, cy, size, out) {
  if (size < 0.5) return
  for (const f of FACES) {
    const verts = f.idx.map(i => CUBE[i])
    const screen = verts.map(q => {
      const p = project(q.x * size, q.y * size, q.z * size)
      return { x: cx + p.x, y: cy + p.y }
    })
    const depth = verts.reduce((a, q) => a + q.x + q.y + q.z, 0) / 4
    out.push({ screen, depth, shade: f.shade })
  }
}

function drawCrystal(ctx, crystal) {
  const { x, y, size, satellites } = crystal
  const faces = []
  collectCubeFaces(x, y, size, faces)
  for (const s of satellites) {
    collectCubeFaces(x + s.dx * size, y + s.dy * size, size * s.sizeRatio, faces)
  }
  faces.sort((a, b) => a.depth - b.depth)
  for (const f of faces) drawFace(ctx, f)
}

function makeCrystal(w, h) {
  const targetSize = 22 + Math.random() * 48
  const count = 2 + Math.floor(Math.random() * 4) // 2–5 cubes per cluster
  const satellites = []
  for (let i = 0; i < count - 1; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 0.7 + Math.random() * 1.1
    satellites.push({
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist * 0.65,
      sizeRatio: 0.45 + Math.random() * 0.6,
    })
  }
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: 0,
    targetSize,
    age: 0,
    lifespan: 45 + Math.random() * 30,
    satellites,
  }
}

function shouldSkip() {
  if (typeof window === 'undefined') return true
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

    const rampDur = 30
    const startCount = Math.max(3, Math.round(targetCount * 0.1))
    for (let i = 0; i < startCount; i++) {
      const c = makeCrystal(width, worldHeight)
      c.size = c.targetSize * (0.3 + Math.random() * 0.7)
      c.age = Math.random() * c.lifespan * 0.6
      crystals.push(c)
    }
    const activationTimes = []
    for (let i = 0; i < targetCount - startCount; i++) {
      activationTimes.push(Math.pow(Math.random(), 0.7) * rampDur)
    }
    activationTimes.sort((a, b) => a - b)

    const startTime = performance.now()
    let last = startTime
    let raf = 0

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      ctx.clearRect(0, 0, width, height)
      const scrollY = window.scrollY || window.pageYOffset || 0

      const elapsed = (now - startTime) / 1000
      let activated = 0
      for (let i = 0; i < activationTimes.length; i++) {
        if (activationTimes[i] <= elapsed) activated++
        else break
      }
      const currentTarget = startCount + activated
      while (crystals.length < currentTarget) crystals.push(makeCrystal(width, worldHeight))
      if (crystals.length > currentTarget) crystals.length = currentTarget

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
