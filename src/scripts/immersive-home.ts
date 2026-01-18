/**
 * Immersive Home (100% animated stage)
 * - Scroll drives scene morph + camera drift
 * - Pointer (and optional device orientation) drives parallax
 * - Canvas particle field uses lightweight spring-physics to morph between shapes
 *
 * No visible informational text is required by design.
 */

type Vec3 = { x: number; y: number; z: number };

type Particle = {
  p: Vec3;
  v: Vec3;
  seed: number;
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function fract(x: number): number {
  return x - Math.floor(x);
}

function hash11(n: number): number {
  // Deterministic pseudo-random in [0,1)
  return fract(Math.sin(n * 127.1) * 43758.5453123);
}

class SpringValue {
  private value: number;
  private velocity: number;
  private readonly stiffness: number;
  private readonly damping: number;

  constructor(initial: number, stiffness = 120, damping = 18) {
    this.value = initial;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  public step(target: number, dt: number): number {
    // Critically damped-ish spring
    const k = this.stiffness;
    const c = this.damping;
    const x = this.value;
    const v = this.velocity;
    const a = k * (target - x) - c * v;

    const nextV = v + a * dt;
    const nextX = x + nextV * dt;

    this.velocity = nextV;
    this.value = nextX;

    return this.value;
  }

  public get(): number {
    return this.value;
  }
}

const SCENES = [
  'ignite',
  'prism',
  'swarm',
  'rift',
  'singularity',
  'afterglow',
] as const;

function targetFor(sceneIdx: number, i: number, u: number, v: number): Vec3 {
  // u,v are deterministic in [0,1)
  // Shapes are normalized roughly in [-1,1] then scaled later.
  switch (sceneIdx) {
    case 0: {
      // ignite: sphere
      const theta = u * Math.PI * 2;
      const phi = Math.acos(lerp(1, -1, v));
      const r = 1;
      return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.cos(phi),
        z: r * Math.sin(phi) * Math.sin(theta),
      };
    }
    case 1: {
      // prism: helix
      const theta = u * Math.PI * 6;
      const y = lerp(-1, 1, v);
      const r = 0.65 + 0.25 * Math.sin(theta * 0.5);
      return {
        x: Math.cos(theta) * r,
        y,
        z: Math.sin(theta) * r,
      };
    }
    case 2: {
      // swarm: noisy orbit cloud
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI * 2;
      const r = 0.55 + 0.45 * hash11(i * 91.73);
      return {
        x: Math.cos(theta) * r,
        y: Math.sin(phi) * r,
        z: Math.sin(theta) * r,
      };
    }
    case 3: {
      // rift: torus
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI * 2;
      const R = 0.85;
      const r = 0.25;
      return {
        x: (R + r * Math.cos(phi)) * Math.cos(theta),
        y: r * Math.sin(phi),
        z: (R + r * Math.cos(phi)) * Math.sin(theta),
      };
    }
    case 4: {
      // singularity: grid wall
      const gx = lerp(-1, 1, u);
      const gy = lerp(-1, 1, v);
      const gz = (hash11(i * 11.17) - 0.5) * 0.4;
      return { x: gx, y: gy, z: gz };
    }
    default: {
      // afterglow: ring burst
      const theta = u * Math.PI * 2;
      const r = lerp(0.2, 1.0, smoothstep(v));
      return {
        x: Math.cos(theta) * r,
        y: (hash11(i * 3.33) - 0.5) * 0.25,
        z: Math.sin(theta) * r,
      };
    }
  }
}

class ParticleField {
  private particles: Particle[] = [];
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private dpr = 1;
  private w = 1;
  private h = 1;

  private pointerTargetX = 0;
  private pointerTargetY = 0;
  private pointerX = new SpringValue(0);
  private pointerY = new SpringValue(0);

  private lastNow = performance.now();

  public mount(canvas: HTMLCanvasElement, count: number): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

    this.particles = Array.from({ length: count }).map((_, i) => {
      const s = hash11(i * 17.3) * 9999;
      return {
        p: {
          x: (hash11(s + 1) - 0.5) * 2,
          y: (hash11(s + 2) - 0.5) * 2,
          z: (hash11(s + 3) - 0.5) * 2,
        },
        v: { x: 0, y: 0, z: 0 },
        seed: s,
      };
    });

    this.resize();
  }

  public resize(): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2);

    this.dpr = dpr;
    this.w = Math.max(1, Math.floor(rect.width));
    this.h = Math.max(1, Math.floor(rect.height));

    this.canvas.width = Math.floor(this.w * dpr);
    this.canvas.height = Math.floor(this.h * dpr);

    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  public setPointer(nx: number, ny: number): void {
    this.pointerTargetX = clamp(nx, -1, 1);
    this.pointerTargetY = clamp(ny, -1, 1);
  }

  public tick(opts: {
    sceneA: number;
    sceneB: number;
    blend: number;
    scroll: number;
    velocity: number;
  }): void {
    if (!this.ctx || !this.canvas) return;

    const now = performance.now();
    const dt = clamp((now - this.lastNow) / 1000, 1 / 240, 1 / 20);
    this.lastNow = now;

    const ctx = this.ctx;

    // Trail clear (keeps motion feeling alive)
    ctx.fillStyle = 'rgba(2, 6, 23, 0.18)';
    ctx.fillRect(0, 0, this.w, this.h);

    const cx = this.w * 0.5;
    const cy = this.h * 0.5;

    // Camera
    const px = this.pointerX.step(this.pointerTargetX, dt);
    const py = this.pointerY.step(this.pointerTargetY, dt);
    const yaw = px * 0.45 + (opts.scroll - 0.5) * 0.35;
    const pitch = py * -0.35;

    // Physics tuning adapts with scroll velocity ("changing physics")
    const velBoost = clamp(opts.velocity * 1.8, 0, 1);
    const stiffness = lerp(10, 42, velBoost);
    const damping = lerp(0.86, 0.78, velBoost);

    // Scene scale changes subtly with scroll
    const scale = lerp(
      Math.min(this.w, this.h) * 0.18,
      Math.min(this.w, this.h) * 0.26,
      smoothstep(opts.scroll)
    );

    // Swirl amount
    const swirl = 0.35 + velBoost * 1.2;

    for (let i = 0; i < this.particles.length; i++) {
      const part = this.particles[i];

      const u = hash11(part.seed + 5);
      const v = hash11(part.seed + 6);

      const ta = targetFor(opts.sceneA, i, u, v);
      const tb = targetFor(opts.sceneB, i, u, v);

      const t = smoothstep(opts.blend);
      const tx = lerp(ta.x, tb.x, t);
      const ty = lerp(ta.y, tb.y, t);
      const tz = lerp(ta.z, tb.z, t);

      // Spring toward morph target
      const ax = (tx - part.p.x) * stiffness;
      const ay = (ty - part.p.y) * stiffness;
      const az = (tz - part.p.z) * stiffness;

      // Add scroll + pointer driven curl
      const curl = (hash11(part.seed + 7) - 0.5) * 2;
      part.v.x += (ax + -part.p.z * swirl + curl * 0.12) * dt;
      part.v.y += (ay + curl * 0.08 + py * 0.45) * dt;
      part.v.z += (az + part.p.x * swirl + px * 0.35) * dt;

      part.v.x *= damping;
      part.v.y *= damping;
      part.v.z *= damping;

      part.p.x += part.v.x * dt;
      part.p.y += part.v.y * dt;
      part.p.z += part.v.z * dt;

      // Rotate by camera yaw/pitch
      let x = part.p.x;
      let y = part.p.y;
      let z = part.p.z;

      // yaw (Y axis)
      const cyaw = Math.cos(yaw);
      const syaw = Math.sin(yaw);
      const x1 = x * cyaw - z * syaw;
      const z1 = x * syaw + z * cyaw;
      x = x1;
      z = z1;

      // pitch (X axis)
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const y1 = y * cp - z * sp;
      const z2 = y * sp + z * cp;
      y = y1;
      z = z2;

      // Perspective projection
      const depth = 2.8; // camera distance
      const inv = 1 / (depth + z);
      const sx = cx + x * scale * inv;
      const sy = cy + y * scale * inv;

      // Depth fades
      const alpha = clamp(lerp(0.05, 0.8, 1 - (z + 1.2) / 2.4), 0.04, 0.85);
      const size = lerp(0.6, 2.6, inv);

      // Color responds to scroll/scene
      const hue = (opts.scroll * 280 + u * 120) % 360;

      ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // A tiny vignette / glow pass
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(cx, cy));
    g.addColorStop(0, `rgba(255,255,255,${0.03 + velBoost * 0.05})`);
    g.addColorStop(1, 'rgba(2,6,23,0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
  }
}

class ImmersiveHomeController {
  private root: HTMLElement;
  private chapters: HTMLElement[];
  private canvas: HTMLCanvasElement | null;
  private field = new ParticleField();

  private lastScrollY = window.scrollY;
  private lastTime = performance.now();
  private velocityLP = 0;

  private pointerTarget = { x: 0, y: 0 };
  private pointerX = new SpringValue(0, 90, 16);
  private pointerY = new SpringValue(0, 90, 16);

  private raf = 0;
  private reducedMotion = false;

  private abortController = new AbortController();

  constructor(root: HTMLElement) {
    this.root = root;
    this.chapters = Array.from(
      root.querySelectorAll<HTMLElement>('[data-ih-chapter]')
    );
    this.canvas = root.querySelector<HTMLCanvasElement>('[data-ih-canvas]');

    this.reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    this.init();
  }

  private init(): void {
    const { signal } = this.abortController;

    // Canvas particle field (adaptive)
    if (this.canvas) {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      const small = window.matchMedia('(max-width: 820px)').matches;
      const count = this.reducedMotion ? 0 : isCoarse || small ? 220 : 420;

      if (count > 0) {
        this.field.mount(this.canvas, count);
      }
    }

    // Input
    window.addEventListener(
      'pointermove',
      e => {
        const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
        const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
        this.pointerTarget.x = clamp(nx, -1, 1);
        this.pointerTarget.y = clamp(ny, -1, 1);
      },
      { passive: true, signal }
    );

    // Optional device orientation (best-effort, no UI)
    window.addEventListener(
      'deviceorientation',
      evt => {
        if (this.reducedMotion) return;
        // gamma: left-right tilt (-90..90), beta: front-back (-180..180)
        const gx = typeof evt.gamma === 'number' ? evt.gamma / 45 : 0;
        const by = typeof evt.beta === 'number' ? evt.beta / 45 : 0;
        // Blend slightly with pointer target so it feels stable
        this.pointerTarget.x = clamp(this.pointerTarget.x + gx * 0.25, -1, 1);
        this.pointerTarget.y = clamp(this.pointerTarget.y + by * 0.18, -1, 1);
      },
      { passive: true, signal }
    );

    const onResize = () => {
      if (this.canvas) this.field.resize();
      this.update();
    };

    window.addEventListener('resize', onResize, { passive: true, signal });

    this.update();
    this.loop();
  }

  private computeScroll(): { progress: number; velocity: number } {
    const rect = this.root.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const progress = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;

    const now = performance.now();
    const delta = Math.abs(window.scrollY - this.lastScrollY);
    const dt = Math.max(16, now - this.lastTime);
    const v = clamp(delta / dt, 0, 1.5);

    this.velocityLP = lerp(this.velocityLP, v, 0.12);
    this.lastScrollY = window.scrollY;
    this.lastTime = now;

    return { progress, velocity: clamp(this.velocityLP, 0, 1) };
  }

  private chapterFromProgress(progress: number): {
    scene: string;
    idx: number;
    localT: number;
  } {
    const n = Math.max(1, this.chapters.length);
    const x = progress * n;
    const idx = clamp(Math.floor(x), 0, n - 1);
    const localT = x - idx;
    const scene = this.chapters[idx]?.dataset.scene ?? SCENES[0];
    return { scene, idx, localT };
  }

  private update(): void {
    const { progress, velocity } = this.computeScroll();
    const { scene, idx, localT } = this.chapterFromProgress(progress);

    // Smooth pointer
    const dt = 1 / 60;
    const px = this.pointerX.step(this.pointerTarget.x, dt);
    const py = this.pointerY.step(this.pointerTarget.y, dt);

    this.field.setPointer(px, py);

    this.root.style.setProperty('--ih-scroll', progress.toFixed(4));
    this.root.style.setProperty('--ih-vel', velocity.toFixed(4));
    this.root.style.setProperty('--ih-parallax-x', px.toFixed(4));
    this.root.style.setProperty('--ih-parallax-y', py.toFixed(4));
    this.root.style.setProperty('--ih-local', localT.toFixed(4));
    this.root.dataset.ihScene = scene;

    // Canvas tick
    if (!this.reducedMotion && this.canvas && this.canvas.width > 0) {
      const a = idx;
      const b = Math.min(idx + 1, SCENES.length - 1);
      this.field.tick({
        sceneA: a,
        sceneB: b,
        blend: localT,
        scroll: progress,
        velocity,
      });
    }
  }

  private loop(): void {
    const tick = () => {
      this.update();
      this.raf = window.requestAnimationFrame(tick);
    };

    this.raf = window.requestAnimationFrame(tick);
  }

  public destroy(): void {
    window.cancelAnimationFrame(this.raf);
    this.abortController.abort();
  }
}

function mount(): void {
  const root = document.querySelector<HTMLElement>('[data-ih]');
  if (!root) return;

  // Replace any existing instance (Astro transitions / hot reload)
  const w = window as unknown as {
    __ihController?: ImmersiveHomeController;
  };
  if (w.__ihController) {
    w.__ihController.destroy();
    w.__ihController = undefined;
  }

  w.__ihController = new ImmersiveHomeController(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}

document.addEventListener('astro:page-load', mount);

document.addEventListener('astro:before-swap', () => {
  const w = window as unknown as {
    __ihController?: ImmersiveHomeController;
  };
  if (w.__ihController) {
    w.__ihController.destroy();
    w.__ihController = undefined;
  }
});
