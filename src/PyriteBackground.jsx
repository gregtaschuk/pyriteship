import { useEffect, useRef } from 'react'

const COS30 = Math.cos(Math.PI / 6)
const SIN30 = 0.5

const SHADE_TOP = 'rgba(150, 112, 32, 0.78)'
const SHADE_RIGHT = 'rgba(92, 66, 14, 0.78)'
const SHADE_FRONT = 'rgba(44, 30, 6, 0.82)'
const EDGE = 'rgba(168, 124, 40, 0.7)'

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
  ctx.fillStyle = face.shade
  ctx.fill()
  ctx.strokeStyle = EDGE
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.lineCap = 'round'
  const seed = Math.abs(Math.sin(s0.x * 0.013 + s0.y * 0.027))
  const N = 10 + Math.floor(seed * 11)
  for (let i = 1; i < N; i++) {
    const jitter = Math.sin(i * 12.9898) * 0.35
    const t = (i + jitter) / N
    const inset = 0.08 + (Math.sin(i * 7.3) + 1) * 0.08
    let ax, ay, bx, by
    if (face.stri === 0) {
      ax = s0.x + (s3.x - s0.x) * t + (s1.x - s0.x) * inset
      ay = s0.y + (s3.y - s0.y) * t + (s1.y - s0.y) * inset
      bx = s1.x + (s2.x - s1.x) * t - (s1.x - s0.x) * inset
      by = s1.y + (s2.y - s1.y) * t - (s1.y - s0.y) * inset
    } else {
      ax = s0.x + (s1.x - s0.x) * t + (s3.x - s0.x) * inset
      ay = s0.y + (s1.y - s0.y) * t + (s3.y - s0.y) * inset
      bx = s3.x + (s2.x - s3.x) * t - (s3.x - s0.x) * inset
      by = s3.y + (s2.y - s3.y) * t - (s3.y - s0.y) * inset
    }
    const alpha = 0.18 + (Math.sin(i * 4.7) + 1) * 0.1
    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha.toFixed(3)})`
    ctx.lineWidth = 0.5 + (Math.sin(i * 2.1) + 1) * 0.35
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()
  }
}

const FACES = [
  { idx: [4, 5, 6, 7], shade: SHADE_TOP,   stri: 0 }, // +Y top
  { idx: [1, 5, 6, 2], shade: SHADE_RIGHT, stri: 1 }, // +X right
  { idx: [3, 7, 6, 2], shade: SHADE_FRONT, stri: 0 }, // +Z front
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
    out.push({ screen, depth, shade: f.shade, stri: f.stri })
  }
}

function drawCrystal(ctx, crystal) {
  const { x, y, size, twin } = crystal
  const faces = []
  collectCubeFaces(x, y, size, faces)
  if (twin) {
    collectCubeFaces(x + twin.dx * size, y + twin.dy * size, size * twin.sizeRatio, faces)
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
    age: 0,
    lifespan: 45 + Math.random() * 30,
    twin: Math.random() < 0.2 ? {
      dx: (Math.random() - 0.5) * 0.9,
      dy: (Math.random() - 0.5) * 0.6,
      sizeRatio: 0.6 + Math.random() * 0.45,
    } : null,
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
