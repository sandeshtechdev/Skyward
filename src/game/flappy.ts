import { Background } from './background'

const GRAVITY = 1400
const FLAP_VEL = -380
const PIPE_SPEED = 160
const PIPE_GAP = 160
const PIPE_INTERVAL = 1.6
const PIPE_W = 52
const BIRD_X = 100

export type GameState = 'ready' | 'playing' | 'gameOver'

interface Pipe {
  x: number
  gapY: number
  scored: boolean
  coinCollected: boolean
}

interface Coin {
  x: number
  y: number
  collected: boolean
  bobOffset: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export class FlappyGame {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement
  private bg: Background

  state: GameState = 'ready'
  score = 0
  highScore = 0
  coinScore = 0

  private birdY = 200
  private birdVel = 0
  private birdFrame = 0
  private wingTimer = 0
  private readyBobTimer = 0

  private pipes: Pipe[] = []
  private pipeTimer = 0
  private coins: Coin[] = []

  private particles: Particle[] = []

  private groundY = 0
  private deathTimer = 0
  private screenShake = 0
  private scorePopTimer = 0

  private readonly flapBound = (): void => {
    if (this.state === 'ready') {
      this.state = 'playing'
      this.birdVel = FLAP_VEL
      this.spawnFeatherParticles(8)
    } else if (this.state === 'playing') {
      this.birdVel = FLAP_VEL
      this.spawnFeatherParticles(8)
    } else if (this.state === 'gameOver' && this.deathTimer > 0.6) {
      this.reset()
    }
  }

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas
    this.ctx = ctx
    this.bg = new Background()
    this.groundY = ctx.canvas.height - 70

    canvas.addEventListener('pointerdown', this.flapBound)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        this.flapBound()
      }
    })

    this.reset()
  }

  private reset(): void {
    this.state = 'ready'
    this.score = 0
    this.coinScore = 0
    this.birdY = 200
    this.birdVel = 0
    this.pipes = []
    this.coins = []
    this.particles = []
    this.pipeTimer = 0
    this.deathTimer = 0
    this.screenShake = 0
    this.scorePopTimer = 0
    this.birdFrame = 0
    this.wingTimer = 0
  }

  private spawnFeatherParticles(count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: BIRD_X,
        y: this.birdY,
        vx: -30 + Math.random() * 60,
        vy: -60 + Math.random() * 30,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 0.6 + Math.random() * 0.4,
        color: `hsl(${40 + Math.random() * 20}, 80%, ${70 + Math.random() * 20}%)`,
        size: 3 + Math.random() * 4,
      })
    }
  }

  private spawnCoinParticles(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * (60 + Math.random() * 40),
        vy: Math.sin(angle) * (60 + Math.random() * 40) - 30,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 0.5 + Math.random() * 0.5,
        color: `hsl(${45 + Math.random() * 20}, 100%, ${60 + Math.random() * 30}%)`,
        size: 2 + Math.random() * 3,
      })
    }
  }

  private spawnDeathParticles(): void {
    const colors = ['#ff6b6b', '#ffd93d', '#ff8a5c', '#ffffff', '#ff4757']
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 80 + Math.random() * 200
      this.particles.push({
        x: BIRD_X,
        y: this.birdY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0.8 + Math.random() * 0.7,
        maxLife: 0.8 + Math.random() * 0.7,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
      })
    }
  }

  update(dt: number): void {
    this.bg.update(dt)

    if (this.screenShake > 0) this.screenShake -= dt
    if (this.scorePopTimer > 0) this.scorePopTimer -= dt

    this.updateParticles(dt)

    if (this.state === 'ready') {
      this.readyBobTimer += dt
      this.birdY = 200 + Math.sin(this.readyBobTimer * 3) * 8
      this.birdFrame = Math.floor(this.readyBobTimer * 8) % 2
      return
    }

    if (this.state === 'playing') {
      this.birdVel += GRAVITY * dt
      this.birdY += this.birdVel * dt

      this.wingTimer += dt
      this.birdFrame = Math.floor(this.wingTimer * 10) % 2

      this.pipeTimer -= dt
      if (this.pipeTimer <= 0) {
        this.pipeTimer = PIPE_INTERVAL
        const gapY = 80 + Math.random() * (this.groundY - PIPE_GAP - 160)
        this.pipes.push({ x: this.canvas.width + 50, gapY, scored: false, coinCollected: false })
        this.coins.push({
          x: this.canvas.width + 50,
          y: gapY + PIPE_GAP / 2,
          collected: false,
          bobOffset: Math.random() * Math.PI * 2,
        })
      }

      for (const p of this.pipes) {
        p.x -= PIPE_SPEED * dt
      }
      for (const c of this.coins) {
        c.x -= PIPE_SPEED * dt
      }

      this.pipes = this.pipes.filter(p => p.x > -PIPE_W - 20)
      this.coins = this.coins.filter(c => c.x > -30 && !c.collected)

      this.checkCollisions()
      this.checkCoinPickups()
    }

    if (this.state === 'gameOver') {
      this.deathTimer += dt
      this.birdVel += GRAVITY * dt
      this.birdY += this.birdVel * dt
      if (this.birdY > this.groundY - 15) {
        this.birdY = this.groundY - 15
        this.birdVel = 0
      }
    }
  }

  private checkCollisions(): void {
    const birdRadius = 12

    if (this.birdY < -10 || this.birdY > this.groundY - 5) {
      this.die()
      return
    }

    for (const p of this.pipes) {
      const topRect = { x: p.x, y: 0, w: PIPE_W, h: p.gapY }
      const botRect = { x: p.x, y: p.gapY + PIPE_GAP, w: PIPE_W, h: this.groundY - (p.gapY + PIPE_GAP) }

      if (this.rectCircleCollide(topRect, BIRD_X - birdRadius, this.birdY - birdRadius, birdRadius * 2, birdRadius * 2) ||
          this.rectCircleCollide(botRect, BIRD_X - birdRadius, this.birdY - birdRadius, birdRadius * 2, birdRadius * 2)) {
        this.die()
        return
      }

      if (!p.scored && p.x + PIPE_W / 2 < BIRD_X) {
        p.scored = true
        this.score++
        this.scorePopTimer = 0.4
      }
    }
  }

  private rectCircleCollide(rect: { x: number; y: number; w: number; h: number }, cx: number, cy: number, cw: number, ch: number): boolean {
    const nearestX = Math.max(rect.x, Math.min(cx + cw / 2, rect.x + rect.w))
    const nearestY = Math.max(rect.y, Math.min(cy + ch / 2, rect.y + rect.h))
    const dx = cx + cw / 2 - nearestX
    const dy = cy + ch / 2 - nearestY
    return dx * dx + dy * dy < (cw / 2) * (cw / 2)
  }

  private checkCoinPickups(): void {
    for (const c of this.coins) {
      if (c.collected) continue
      const dx = BIRD_X - c.x
      const dy = this.birdY - c.y
      if (dx * dx + dy * dy < 25 * 25) {
        c.collected = true
        this.coinScore++
        this.spawnCoinParticles(c.x, c.y)
      }
    }
  }

  private die(): void {
    if (this.state !== 'playing') return
    this.state = 'gameOver'
    this.screenShake = 0.3
    this.deathTimer = 0
    this.spawnDeathParticles()
    this.highScore = Math.max(this.highScore, this.score)
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 200 * dt
      p.life -= dt
    }
    this.particles = this.particles.filter(p => p.life > 0)
  }

  draw(): void {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height
    this.groundY = h - 70

    ctx.save()
    if (this.screenShake > 0) {
      const intensity = this.screenShake * 15
      ctx.translate(Math.random() * intensity - intensity / 2, Math.random() * intensity - intensity / 2)
    }

    this.bg.draw(ctx, w, h)

    for (const p of this.pipes) {
      this.drawPipe(ctx, p)
    }
    for (const c of this.coins) {
      if (!c.collected) this.drawCoin(ctx, c)
    }

    if (this.state !== 'gameOver' || this.deathTimer > 0.1) {
      this.drawBird(ctx)
    }

    this.drawParticles(ctx)

    this.drawScore(ctx, w)
    this.drawCoinScore(ctx, w)

    if (this.state === 'ready') {
      this.drawReadyText(ctx, w, h)
    }
    if (this.state === 'gameOver') {
      this.drawGameOver(ctx, w, h)
    }

    ctx.restore()
  }

  private drawBird(ctx: CanvasRenderingContext2D): void {
    const x = BIRD_X
    const y = this.birdY
    const rotation = Math.max(-0.5, Math.min(1.2, this.birdVel / 300))

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)

    ctx.shadowColor = 'rgba(0,0,0,0.2)'
    ctx.shadowBlur = 8

    ctx.fillStyle = '#f8f4e3'
    ctx.beginPath()
    ctx.ellipse(0, 0, 18, 13, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#e8dcc8'
    ctx.beginPath()
    ctx.ellipse(-4, 0, 10, 10, 0, 0, Math.PI * 2)
    ctx.fill()

    const wingY = this.birdFrame === 0 ? -4 : -9
    ctx.fillStyle = '#d4c5a9'
    ctx.beginPath()
    ctx.moveTo(-2, wingY)
    ctx.quadraticCurveTo(-12, wingY - 8, -16, wingY + 2)
    ctx.quadraticCurveTo(-10, wingY + 2, -2, wingY)
    ctx.fill()

    ctx.shadowBlur = 0

    ctx.fillStyle = '#ff8c42'
    ctx.beginPath()
    ctx.moveTo(14, -1)
    ctx.lineTo(24, 2)
    ctx.lineTo(14, 5)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#2d2d2d'
    ctx.beginPath()
    ctx.arc(6, -3, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(6.5, -3.5, 1.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  private drawPipe(ctx: CanvasRenderingContext2D, p: Pipe): void {
    const topH = p.gapY
    const botY = p.gapY + PIPE_GAP
    const botH = this.groundY - botY

    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 10

    const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0)
    grad.addColorStop(0, '#2d6a4f')
    grad.addColorStop(0.3, '#40916c')
    grad.addColorStop(0.7, '#40916c')
    grad.addColorStop(1, '#1b4332')

    ctx.fillStyle = grad
    ctx.fillRect(p.x, 0, PIPE_W, topH)
    ctx.fillRect(p.x, botY, PIPE_W, botH)

    ctx.shadowBlur = 0

    ctx.fillStyle = '#ffd700'
    ctx.fillRect(p.x - 4, topH - 25, PIPE_W + 8, 25)
    ctx.fillRect(p.x - 4, botY, PIPE_W + 8, 25)

    ctx.fillStyle = '#e6c200'
    ctx.fillRect(p.x - 4, topH - 4, PIPE_W + 8, 4)
    ctx.fillRect(p.x - 4, botY, PIPE_W + 8, 4)

    ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.strokeRect(p.x, 0, PIPE_W, topH)
    ctx.strokeRect(p.x, botY, PIPE_W, botH)
  }

  private drawCoin(ctx: CanvasRenderingContext2D, c: Coin): void {
    const bobY = Math.sin(Date.now() / 300 + c.bobOffset) * 4
    const y = c.y + bobY

    ctx.shadowColor = '#ffd700'
    ctx.shadowBlur = 12

    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(c.x, y, 10, 0, Math.PI * 2)
    ctx.fill()

    ctx.shadowBlur = 0

    ctx.fillStyle = '#ffed4a'
    ctx.beginPath()
    ctx.arc(c.x, y, 7, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#b8860b'
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('★', c.x, y + 1)
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  private drawScore(ctx: CanvasRenderingContext2D, w: number): void {
    if (this.state === 'ready' || this.state === 'playing') {
      const scale = this.scorePopTimer > 0 ? 1 + 0.3 * (this.scorePopTimer / 0.4) : 1
      ctx.save()
      ctx.translate(w / 2, 60)
      ctx.scale(scale, scale)

      ctx.shadowColor = this.scorePopTimer > 0 ? '#ffd700' : 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = this.scorePopTimer > 0 ? 20 : 4
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 52px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${this.score}`, 0, 0)
      ctx.restore()
    }
  }

  private drawCoinScore(ctx: CanvasRenderingContext2D, w: number): void {
    if (this.state === 'ready' || this.state === 'playing') {
      ctx.fillStyle = '#ffd700'
      ctx.font = '16px monospace'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      ctx.fillText(`★ ${this.coinScore}`, w - 20, 20)
    }
  }

  private drawReadyText(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 10
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Tap to Fly', w / 2, h / 2 + 40)

    ctx.font = '16px monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText('Collect ★ coins for bonus', w / 2, h / 2 + 80)

    ctx.shadowBlur = 0
  }

  private drawGameOver(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(0, 0, w, h)

    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 10
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 36px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Game Over', w / 2, h / 2 - 60)

    ctx.font = '24px monospace'
    ctx.fillStyle = '#ffd700'
    ctx.fillText(`Score: ${this.score}`, w / 2, h / 2 - 10)

    ctx.font = '18px monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillText(`Best: ${this.highScore}`, w / 2, h / 2 + 30)

    ctx.fillStyle = '#ffd700'
    ctx.font = '16px monospace'
    ctx.fillText(`★ ${this.coinScore}`, w / 2, h / 2 + 65)

    if (this.deathTimer > 0.6) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.font = '18px monospace'
      ctx.fillText('Tap to Restart', w / 2, h / 2 + 110)
    }

    ctx.shadowBlur = 0
  }
}
