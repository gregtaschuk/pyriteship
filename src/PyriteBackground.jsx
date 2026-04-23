import { useEffect, useRef } from 'react'

const COS30 = Math.cos(Math.PI / 6)
const SIN30 = 0.5

const SHADE_TOP   = { dark: 'rgba(64, 54, 22, 0.9)',  light: 'rgba(108, 92, 44, 0.9)',  spec: 'rgba(196, 176, 118, 0.13)', kind: 'top'   }
const SHADE_RIGHT = { dark: 'rgba(32, 26, 10, 0.9)',  light: 'rgba(60, 50, 20, 0.9)',   spec: 'rgba(160, 136, 82, 0.08)',  kind: 'right' }
const SHADE_FRONT = { dark: 'rgba(14, 10, 4, 0.95)',  light: 'rgba(26, 22, 8, 0.95)',   spec: 'rgba(128, 104, 60, 0.06)',  kind: 'front' }
const RIM = 'rgba(176, 152, 88, 0.75)'
const EDGE_DIM = 'rgba(0, 0, 0, 0.55)'

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

  const verts = [s0, s1, s2, s3]
  const order = [0, 1, 2, 3].sort((a, b) => verts[a].y - verts[b].y)
  const topA = order[0]
  const topB = order[1]

  const cx = (s0.x + s1.x + s2.x + s3.x) * 0.25
  const cy = (s0.y + s1.y + s2.y + s3.y) * 0.25
  if (face.shade.kind === 'top') {
    const radius = Math.hypot(s2.x - s0.x, s2.y - s0.y) * 0.7
    const spec = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    spec.addColorStop(0, face.shade.spec)
    spec.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = spec
    ctx.fill()
  } else {
    const mx = (verts[topA].x + verts[topB].x) * 0.5
    const my = (verts[topA].y + verts[topB].y) * 0.5
    const bx = (verts[order[2]].x + verts[order[3]].x) * 0.5
    const by = (verts[order[2]].y + verts[order[3]].y) * 0.5
    const sheen = ctx.createLinearGradient(mx, my, bx, by)
    sheen.addColorStop(0, face.shade.spec)
    sheen.addColorStop(0.65, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = sheen
    ctx.fill()
  }
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
  let volume = 1
  for (let i = 0; i < count - 1; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 0.7 + Math.random() * 1.1
    const sizeRatio = 0.45 + Math.random() * 0.6
    satellites.push({
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist * 0.65,
      sizeRatio,
    })
    volume += sizeRatio * sizeRatio
  }
  const s = targetSize / 40
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: 0,
    vy: 0,
    size: 0,
    targetSize,
    age: 0,
    lifespan: 45 + Math.random() * 30,
    satellites,
    baseMass: volume * s * s,
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

    const isMobile = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches
    const densityPerViewport = isMobile ? 6 : 14
    const maxCrystals = isMobile ? 20 : Infinity

    let width = 0, height = 0, worldHeight = 0, dpr = 1
    const crystals = []
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
      targetCount = Math.min(
        maxCrystals,
        Math.round(densityPerViewport * (worldHeight / height)),
      )
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const effectiveMass = (c) => {
      const scale = c.targetSize > 0 ? c.size / c.targetSize : 0
      return Math.max(0.08, c.baseMass * (0.25 + 0.75 * scale))
    }

    const applyTension = (dt, linksOut, viewport) => {
      const n = crystals.length
      const cullTop = viewport ? viewport.top - height : -Infinity
      const cullBot = viewport ? viewport.bot + height : Infinity
      for (let i = 0; i < n; i++) {
        const a = crystals[i]
        const aOff = a.y < cullTop || a.y > cullBot
        const mA = effectiveMass(a)
        for (let j = i + 1; j < n; j++) {
          const b = crystals[j]
          if (aOff && (b.y < cullTop || b.y > cullBot)) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const d2 = dx * dx + dy * dy + 1
          const mB = effectiveMass(b)
          const reach = 110 + 170 * Math.sqrt(mA + mB)
          if (d2 >= reach * reach) continue
          const d = Math.sqrt(d2)
          const t = 1 - d / reach
          const force = t * t * 110 * mA * mB
          const nx = dx / d
          const ny = dy / d
          a.vx -= (nx * force / mA) * dt
          a.vy -= (ny * force / mA) * dt
          b.vx += (nx * force / mB) * dt
          b.vy += (ny * force / mB) * dt
          if (linksOut) linksOut.push({ i, j, strength: t, mA, mB })
        }
      }
      const damp = Math.exp(-2.0 * dt)
      const margin = 50
      const wallK = 8
      for (let i = 0; i < n; i++) {
        const c = crystals[i]
        c.vx *= damp
        c.vy *= damp
        c.x += c.vx * dt
        c.y += c.vy * dt
        if (c.x < margin) c.vx += (margin - c.x) * wallK * dt
        else if (c.x > width - margin) c.vx -= (c.x - (width - margin)) * wallK * dt
        if (c.y < margin) c.vy += (margin - c.y) * wallK * dt
        else if (c.y > worldHeight - margin) c.vy -= (c.y - (worldHeight - margin)) * wallK * dt
      }
    }

    const relax = (iters = 60, step = 1 / 30) => {
      for (let k = 0; k < iters; k++) applyTension(step)
    }

    const rampDur = 30
    const startCount = Math.max(3, Math.round(targetCount * 0.1))
    for (let i = 0; i < startCount; i++) {
      const c = makeCrystal(width, worldHeight)
      c.size = c.targetSize * (0.3 + Math.random() * 0.7)
      c.age = Math.random() * c.lifespan * 0.6
      crystals.push(c)
    }
    relax()
    const activationTimes = []
    for (let i = 0; i < targetCount - startCount; i++) {
      activationTimes.push(Math.pow(Math.random(), 0.7) * rampDur)
    }
    activationTimes.sort((a, b) => a - b)

    const TIME_SCALE = 0.42
    const startTime = performance.now()
    let last = startTime
    let simTime = 0
    let raf = 0
    const links = []

    const drawLinks = (scrollY) => {
      if (!links.length) return
      ctx.save()
      for (const link of links) {
        const a = crystals[link.i]
        const b = crystals[link.j]
        if (!a || !b) continue
        const ay = a.y - scrollY
        const by = b.y - scrollY
        if ((ay < -160 && by < -160) || (ay > height + 160 && by > height + 160)) continue
        const dx = b.x - a.x
        const dy = by - ay
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len < 0.5) continue
        const px = -dy / len
        const py = dx / len
        const s = link.strength
        const taper = 0.55 + s * 0.7
        const hA = (2 + Math.sqrt(link.mA) * 9) * taper * 0.5
        const hB = (2 + Math.sqrt(link.mB) * 9) * taper * 0.5
        const cr = Math.round(90 + s * 140)
        const cg = Math.round(66 + s * 128)
        const cb = Math.round(28 + s * 76)
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${0.04 + s * 0.11})`
        ctx.beginPath()
        ctx.moveTo(a.x + px * hA, ay + py * hA)
        ctx.lineTo(b.x + px * hB, by + py * hB)
        ctx.lineTo(b.x - px * hB, by - py * hB)
        ctx.lineTo(a.x - px * hA, ay - py * hA)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
    }

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1) * TIME_SCALE
      last = now
      simTime += dt

      ctx.clearRect(0, 0, width, height)
      const scrollY = window.scrollY || window.pageYOffset || 0

      let activated = 0
      for (let i = 0; i < activationTimes.length; i++) {
        if (activationTimes[i] <= simTime) activated++
        else break
      }
      const currentTarget = startCount + activated
      while (crystals.length < currentTarget) crystals.push(makeCrystal(width, worldHeight))
      if (crystals.length > currentTarget) crystals.length = currentTarget

      links.length = 0
      applyTension(dt, links, { top: scrollY, bot: scrollY + height })
      drawLinks(scrollY)

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
      for (const c of crystals) c.size = c.targetSize
      relax()
      ctx.clearRect(0, 0, width, height)
      const scrollY = window.scrollY || window.pageYOffset || 0
      links.length = 0
      applyTension(1 / 60, links, { top: scrollY, bot: scrollY + height })
      drawLinks(scrollY)
      for (const c of crystals) {
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

    let bodyObserver = null
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      bodyObserver = new ResizeObserver(() => {
        const next = measureWorldHeight()
        if (Math.abs(next - worldHeight) > 24) onResize()
      })
      bodyObserver.observe(document.body)
    }

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      if (bodyObserver) bodyObserver.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [skip])

  if (skip) return null
  return <canvas ref={canvasRef} className="pyrite-bg" aria-hidden="true" />
}
