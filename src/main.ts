import { FlappyGame } from './game/flappy'

const canvas = document.getElementById('game') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

function resize(): void {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
window.addEventListener('resize', resize)
resize()

const game = new FlappyGame(canvas, ctx)

let lastTime = performance.now()
function tick(now: number): void {
  const dt = Math.min((now - lastTime) / 1000, 0.05)
  lastTime = now

  game.update(dt)
  game.draw()

  requestAnimationFrame(tick)
}

requestAnimationFrame(tick)
