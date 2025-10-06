import * as THREE from 'three'
import { COLORS, GAME } from './constants'

export type GameApi = {
  mount: (root: HTMLElement) => void
  reset: () => void
  getScore: () => number
  start: () => void
}

export function createGame(): GameApi {
  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(COLORS.bg, 20, 140)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setClearColor(COLORS.bg, 1)

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200)
  camera.position.set(0, 2.5, 6)

  const key = new THREE.PointLight(COLORS.neonPink, 2.2, 40)
  key.position.set(6, 6, 8)
  const rim = new THREE.PointLight(COLORS.neonCyan, 1.6, 50)
  rim.position.set(-6, 4, 4)
  scene.add(key, rim)

  const neonPink = new THREE.MeshStandardMaterial({ color: COLORS.neonPink, emissive: 0xaa2299, metalness: 0.6, roughness: 0.2 })
  const neonCyan = new THREE.MeshStandardMaterial({ color: COLORS.neonCyan, emissive: 0x1188aa, metalness: 0.6, roughness: 0.25 })
  const neonYellow = new THREE.MeshStandardMaterial({ color: COLORS.neonYellow, emissive: 0xaa7711, metalness: 0.5, roughness: 0.3 })

  const grid = new THREE.Group()
  for (let i = 0; i < 6; i++) {
    const g = new THREE.GridHelper(100, 50, COLORS.grid, COLORS.grid)
    const mat = g.material as THREE.Material & { opacity: number; transparent: boolean }
    mat.opacity = 0.16
    mat.transparent = true
    g.position.set(0, -1.2, -i * 20)
    grid.add(g)
  }
  scene.add(grid)

  const body = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2, 12), neonCyan)
  body.rotation.x = Math.PI * 0.5
  const player = new THREE.Group()
  player.add(body)
  scene.add(player)

  const input = { left: false, right: false, shoot: false }
  addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true
    if (e.code === 'Space') input.shoot = true
  })
  addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false
    if (e.code === 'Space') input.shoot = false
  })

  const bullets: { m: THREE.Mesh; v: THREE.Vector3 }[] = []
  function shoot() {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), neonPink)
    m.rotation.z = Math.PI * 0.5
    m.position.copy(player.position).add(new THREE.Vector3(0, 0, -0.8))
    scene.add(m)
    bullets.push({ m, v: new THREE.Vector3(0, 0, -1).multiplyScalar(0.9) })
  }

  const enemies: { m: THREE.Mesh; v: THREE.Vector3 }[] = []
  function spawnEnemy(z: number) {
    const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.35, 0), neonYellow)
    m.position.set((Math.random() * 2 - 1) * 2.8, 0, z)
    scene.add(m)
    enemies.push({ m, v: new THREE.Vector3(0, 0, 0.22 + Math.random() * 0.12) })
  }

  const scoreEl = document.getElementById('score')!
  const livesEl = document.getElementById('lives')!
  let score = 0
  let lives = 3

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight)
  })

  let last = 0, shootCd = 0, enemyT = 0
  let running = false
  function frame(t: number) {
    const dt = Math.min((t - last) / 16.6667, 2)
    last = t

    if (!running) { requestAnimationFrame(frame); return }

    if (input.left) player.position.x = Math.max(GAME.leftBound, player.position.x - GAME.playerSpeed * dt)
    if (input.right) player.position.x = Math.min(GAME.rightBound, player.position.x + GAME.playerSpeed * dt)
    player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, (input.left ? 0.25 : 0) - (input.right ? 0.25 : 0), 0.2)

    grid.children.forEach((g) => {
      g.position.z += GAME.gridSpeed * dt
      if (g.position.z > 0) g.position.z -= 120
    })

    shootCd -= dt
    if (input.shoot && shootCd <= 0) { shoot(); shootCd = GAME.shootCooldownFrames }

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]
      b.m.position.addScaledVector(b.v, dt)
      if (b.m.position.z < -80) { scene.remove(b.m); bullets.splice(i, 1) }
    }

    enemyT -= dt
    if (enemyT <= 0) { spawnEnemy(GAME.enemyZStartMin - Math.random() * GAME.enemyZStartRnd); enemyT = GAME.enemySpawnFrames }
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]
      e.m.position.addScaledVector(e.v, dt)
      e.m.rotation.y += 0.02 * dt
      if (e.m.position.z > 8) { scene.remove(e.m); enemies.splice(i, 1); if (--lives <= 0) endRun(); livesEl.textContent = String(lives) }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j]
        if (Math.abs(e.m.position.x - b.m.position.x) < 0.35 && Math.abs(e.m.position.z - b.m.position.z) < 0.6) {
          scene.remove(e.m); enemies.splice(i, 1)
          scene.remove(b.m); bullets.splice(j, 1)
          score += 10; scoreEl.textContent = String(score)
          break
        }
      }
    }

    renderer.render(scene, camera)
    requestAnimationFrame(frame)
  }

  function endRun() {
    (document.getElementById('finalScore') as HTMLElement).textContent = String(score)
    const over = document.getElementById('gameover') as HTMLElement
    over.style.display = 'flex'
    running = false
  }

  function reset() {
    enemies.forEach(e => scene.remove(e.m))
    bullets.forEach(b => scene.remove(b.m))
    enemies.length = 0
    bullets.length = 0
    lives = 3
    score = 0
    scoreEl.textContent = '0'
    livesEl.textContent = '3'
  }

  return {
    mount(root) {
      root.appendChild(renderer.domElement)
      requestAnimationFrame(frame)
    },
    reset,
    getScore: () => score,
    start: () => { reset(); running = true }
  }
}


