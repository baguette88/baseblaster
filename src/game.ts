import * as THREE from 'three'
import { COLORS, GAME } from './constants'
import { basicVertex, neonSkyFragment } from './shaders/neonSky'
import { hologramFragment } from './shaders/hologram'

export type GameApi = { mount: (root: HTMLElement) => void; reset: () => void; getScore: () => number; start: () => void }

function createRenderer() {
  const r = new THREE.WebGLRenderer({ antialias: true })
  r.setSize(window.innerWidth, window.innerHeight)
  r.setPixelRatio(Math.min(devicePixelRatio, 2))
  r.setClearColor(COLORS.bg, 1)
  return r
}

function createCamera() {
  const c = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200)
  c.position.set(0, 2.5, 6)
  return c
}

function addLights(scene: THREE.Scene) {
  const a = new THREE.PointLight(COLORS.neonPink, 2.2, 40)
  a.position.set(6, 6, 8)
  const b = new THREE.PointLight(COLORS.neonCyan, 1.6, 50)
  b.position.set(-6, 4, 4)
  scene.add(a, b)
}

function addGrid(scene: THREE.Scene) {
  const g = new THREE.Group()
  for (let i = 0; i < 6; i++) {
    const h = new THREE.GridHelper(100, 50, COLORS.grid, COLORS.grid)
    const m = h.material as THREE.Material & { opacity: number; transparent: boolean }
    m.opacity = 0.16; m.transparent = true
    h.position.set(0, -1.2, -i * 20)
    g.add(h)
  }
  scene.add(g)
  return g
}

function addSky(scene: THREE.Scene) {
  const uniforms = { uTime: { value: 0 } }
  const mat = new THREE.ShaderMaterial({ vertexShader: basicVertex, fragmentShader: neonSkyFragment, uniforms, side: THREE.BackSide })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(120, 32, 32), mat)
  scene.add(mesh)
  return uniforms
}

function makeEnemyMaterial() {
  return new THREE.ShaderMaterial({ vertexShader: basicVertex, fragmentShader: hologramFragment, uniforms: { uTime: { value: 0 } } })
}

export function createGame(): GameApi {
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(COLORS.bg, 20, 140)
  const renderer = createRenderer()
  const camera = createCamera()
  addLights(scene)
  const grid = addGrid(scene)
  const skyUniforms = addSky(scene)

  const playerMat = new THREE.MeshStandardMaterial({ color: COLORS.neonCyan, emissive: 0x1188aa, metalness: 0.6, roughness: 0.25 })
  const bulletMat = new THREE.MeshStandardMaterial({ color: COLORS.neonPink, emissive: 0xaa2299, metalness: 0.6, roughness: 0.2 })
  const enemyMat = makeEnemyMaterial()

  const body = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2, 12), playerMat)
  body.rotation.x = Math.PI * 0.5
  const player = new THREE.Group(); player.add(body); scene.add(player)

  const input = { left: false, right: false, shoot: false }
  addEventListener('keydown', (e) => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true; if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true; if (e.code === 'Space') input.shoot = true })
  addEventListener('keyup', (e) => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false; if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false; if (e.code === 'Space') input.shoot = false })

  const bullets: { m: THREE.Mesh; v: THREE.Vector3 }[] = []
  const enemies: { m: THREE.Mesh; v: THREE.Vector3 }[] = []
  const powerups: THREE.Mesh[] = []

  const scoreEl = document.getElementById('score')!
  const livesEl = document.getElementById('lives')!
  const powerEl = document.getElementById('power')!
  let score = 0, lives = 3
  let powerUntil = 0

  function shootNow() {
    const add = (offset: number, angle: number) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), bulletMat)
      m.rotation.z = Math.PI * 0.5; m.position.copy(player.position).add(new THREE.Vector3(offset, 0, -0.8))
      scene.add(m); const v = new THREE.Vector3(Math.sin(angle), 0, -Math.cos(angle)).multiplyScalar(0.9); bullets.push({ m, v })
    }
    const p = performance.now()
    if (p < powerUntil) { add(-0.15, -0.08); add(0, 0); add(0.15, 0.08) } else { add(0, 0) }
  }

  function spawnEnemy(z: number) {
    const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.35, 0), enemyMat)
    m.position.set((Math.random() * 2 - 1) * 2.8, 0, z); scene.add(m)
    enemies.push({ m, v: new THREE.Vector3(0, 0, 0.22 + Math.random() * 0.12) })
  }

  function spawnPowerup(z: number) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), new THREE.MeshStandardMaterial({ color: COLORS.neonYellow, emissive: 0xaa7711 }))
    m.position.set((Math.random() * 2 - 1) * 2.6, 0.3, z); scene.add(m); powerups.push(m)
  }

  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight) })

  let last = 0, shootCd = 0, enemyT = 0, powerT = 180
  let running = false

  function movePlayer(dt: number) {
    if (input.left) player.position.x = Math.max(GAME.leftBound, player.position.x - GAME.playerSpeed * dt)
    if (input.right) player.position.x = Math.min(GAME.rightBound, player.position.x + GAME.playerSpeed * dt)
    player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, (input.left ? 0.25 : 0) - (input.right ? 0.25 : 0), 0.2)
  }

  function moveGrid(dt: number) {
    grid.children.forEach((g) => { g.position.z += GAME.gridSpeed * dt; if (g.position.z > 0) g.position.z -= 120 })
  }

  function updateBullets(dt: number) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]; b.m.position.addScaledVector(b.v, dt)
      if (b.m.position.z < -80) { scene.remove(b.m); bullets.splice(i, 1) }
    }
  }

  function updateEnemies(dt: number) {
    enemyT -= dt; if (enemyT <= 0) { spawnEnemy(GAME.enemyZStartMin - Math.random() * GAME.enemyZStartRnd); enemyT = GAME.enemySpawnFrames }
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]; e.m.position.addScaledVector(e.v, dt); e.m.rotation.y += 0.02 * dt
      if (e.m.position.z > 8) { scene.remove(e.m); enemies.splice(i, 1); if (--lives <= 0) endRun(); livesEl.textContent = String(lives) }
    }
  }

  function updatePowerups(dt: number) {
    powerT -= dt; if (powerT <= 0) { spawnPowerup(-18 - Math.random() * 8); powerT = 240 }
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i]; p.position.z += 0.18 * dt; p.rotation.y += 0.03 * dt
      if (Math.abs(p.position.x - player.position.x) < 0.4 && Math.abs(p.position.z - -0.4) < 1.0 && p.position.z > -1.2) {
        scene.remove(p); powerups.splice(i, 1); powerUntil = performance.now() + 12000
      }
      if (p.position.z > 6) { scene.remove(p); powerups.splice(i, 1) }
    }
    powerEl.textContent = performance.now() < powerUntil ? 'TRI' : '-'
  }

  function handleShooting(dt: number) {
    shootCd -= dt; if (input.shoot && shootCd <= 0) { shootNow(); shootCd = GAME.shootCooldownFrames }
  }

  function handleCollisions() {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j]
        if (Math.abs(e.m.position.x - b.m.position.x) < 0.35 && Math.abs(e.m.position.z - b.m.position.z) < 0.6) {
          scene.remove(e.m); enemies.splice(i, 1); scene.remove(b.m); bullets.splice(j, 1); score += 10; scoreEl.textContent = String(score); break
        }
      }
    }
  }

  function frame(t: number) {
    const dt = Math.min((t - last) / 16.6667, 2); last = t
    if (!running) { requestAnimationFrame(frame); return }
    skyUniforms.uTime.value = t / 1000; (enemyMat.uniforms as any).uTime.value = t / 1000
    movePlayer(dt); moveGrid(dt); handleShooting(dt); updateBullets(dt); updateEnemies(dt); updatePowerups(dt); handleCollisions()
    renderer.render(scene, camera); requestAnimationFrame(frame)
  }

  function endRun() {
    (document.getElementById('finalScore') as HTMLElement).textContent = String(score)
    const over = document.getElementById('gameover') as HTMLElement; over.style.display = 'flex'; running = false
  }

  function reset() {
    enemies.forEach(e => scene.remove(e.m)); bullets.forEach(b => scene.remove(b.m)); powerups.forEach(p => scene.remove(p))
    enemies.length = 0; bullets.length = 0; powerups.length = 0; lives = 3; score = 0; powerUntil = 0
    scoreEl.textContent = '0'; livesEl.textContent = '3'; powerEl.textContent = '-'
  }

  return { mount(root) { root.appendChild(renderer.domElement); requestAnimationFrame(frame) }, reset, getScore: () => score, start: () => { reset(); running = true } }
}


