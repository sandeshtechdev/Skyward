export class Background {
  private cloudOffset1 = 0
  private cloudOffset2 = 0
  private cloudOffset3 = 0
  private groundOffset = 0
  private hue = 15

  private clouds: { x: number; y: number; w: number; h: number; speed: number; alpha: number }[] = []

  constructor() {
    for (let i = 0; i < 12; i++) {
      this.clouds.push({
        x: Math.random() * 2000 - 200,
        y: 30 + Math.random() * 180,
        w: 80 + Math.random() * 200,
        h: 25 + Math.random() * 40,
        speed: 0.2 + Math.random() * 0.4,
        alpha: 0.3 + Math.random() * 0.4,
      })
    }
  }

  update(dt: number): void {
    this.hue += dt * 0.3
    if (this.hue > 360) this.hue -= 360

    this.cloudOffset1 += dt * 8
    this.cloudOffset2 += dt * 14
    this.cloudOffset3 += dt * 22
    this.groundOffset += dt * 120
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.drawSky(ctx, w, h)
    this.drawClouds(ctx, w, this.cloudOffset1, 0.25, 1.0)
    this.drawClouds(ctx, w, this.cloudOffset2, 0.5, 0.7)
    this.drawClouds(ctx, w, this.cloudOffset3, 0.8, 0.5)
    this.drawGround(ctx, w, h)
  }

  private drawSky(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    const h1 = this.hue
    const h2 = (this.hue + 40) % 360
    const h3 = (this.hue + 80) % 360
    grad.addColorStop(0, `hsl(${h1}, 60%, 12%)`)
    grad.addColorStop(0.4, `hsl(${h2}, 70%, 25%)`)
    grad.addColorStop(0.7, `hsl(${h3}, 80%, 45%)`)
    grad.addColorStop(1, `hsl(${(h3 + 20) % 360}, 90%, 60%)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    const starGrad = ctx.createRadialGradient(w * 0.8, h * 0.1, 0, w * 0.8, h * 0.1, 200)
    starGrad.addColorStop(0, 'hsla(40, 100%, 80%, 0.15)')
    starGrad.addColorStop(1, 'hsla(40, 100%, 80%, 0)')
    ctx.fillStyle = starGrad
    ctx.fillRect(0, 0, w, h * 0.4)
  }

  private drawClouds(
    ctx: CanvasRenderingContext2D,
    w: number,
    offset: number,
    scale: number,
    alpha: number,
  ): void {
    ctx.save()
    ctx.globalAlpha = alpha * 0.6
    for (const c of this.clouds) {
      const cx = ((c.x - offset * c.speed * scale) % (w + 400)) + 200
      const cy = c.y * scale + 20
      const cw = c.w * scale
      const ch = c.h * scale

      ctx.fillStyle = `hsla(0, 0%, 100%, ${0.3 + alpha * 0.3})`
      ctx.beginPath()
      ctx.ellipse(cx, cy, cw / 2, ch / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(cx - cw * 0.25, cy + ch * 0.1, cw * 0.35, ch * 0.4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(cx + cw * 0.3, cy + ch * 0.05, cw * 0.3, ch * 0.35, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  private drawGround(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const gh = 70
    const gy = h - gh

    const gGrad = ctx.createLinearGradient(0, gy, 0, h)
    gGrad.addColorStop(0, '#4a7c3f')
    gGrad.addColorStop(0.15, '#3d6b34')
    gGrad.addColorStop(1, '#2d1f0e')
    ctx.fillStyle = gGrad
    ctx.fillRect(0, gy, w, gh)

    const grassGrad = ctx.createLinearGradient(0, gy, 0, gy + 6)
    grassGrad.addColorStop(0, '#5a9a4f')
    grassGrad.addColorStop(1, '#4a7c3f')
    ctx.fillStyle = grassGrad
    ctx.fillRect(0, gy, w, 6)

    const stripCount = Math.ceil(w / 40) + 2
    const offset = -(this.groundOffset % 40)
    for (let i = 0; i < stripCount; i++) {
      const sx = offset + i * 40
      ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)'
      ctx.fillRect(sx, gy + 6, 40, gh - 6)
    }
  }

  getGroundY(h: number): number {
    return h - 70
  }
}
