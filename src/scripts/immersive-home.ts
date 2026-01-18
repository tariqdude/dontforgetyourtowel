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

function ramp(t: number, start: number, end: number): number {
  if (end === start) return 0;
  return smoothstep((t - start) / (end - start));
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

const SCENE_INDEX = new Map<string, number>(SCENES.map((s, i) => [s, i]));

function sceneIndexFromId(id: string | undefined): number {
  if (!id) return 0;
  return SCENE_INDEX.get(id) ?? 0;
}

// Per-scene physics personality (blended between chapters)
// - twist: swirl direction/strength
// - gravity: subtle y acceleration
const SCENE_TWIST: number[] = [
  1.0, // ignite
  0.7, // prism
  -0.9, // swarm
  -0.55, // rift
  0.2, // singularity
  1.0, // afterglow
];

const SCENE_GRAVITY: number[] = [
  -0.06, // ignite
  0.05, // prism
  -0.02, // swarm
  0.08, // rift
  0.0, // singularity
  -0.04, // afterglow
];

// Scene grading (keeps palette coherent and modern)
const SCENE_HUE: number[] = [
  205, // ignite
  235, // prism
  260, // swarm
  285, // rift
  310, // singularity
  28, // afterglow
];

const SCENE_HUE_2: number[] = [
  265, // ignite
  285, // prism
  300, // swarm
  330, // rift
  350, // singularity
  45, // afterglow
];

const SCENE_GRADE: number[] = [
  0.15, // ignite
  0.22, // prism
  0.28, // swarm
  0.32, // rift
  0.4, // singularity
  0.25, // afterglow
];

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

  private spriteDpr = 0;
  private sprites: HTMLCanvasElement[] = [];

  private bloomCanvas: HTMLCanvasElement | null = null;
  private bloomCtx: CanvasRenderingContext2D | null = null;
  private bloomScale = 0.35;

  private pointerTargetX = 0;
  private pointerTargetY = 0;
  private pointerX = new SpringValue(0);
  private pointerY = new SpringValue(0);

  private lastNow = performance.now();

  public mount(canvas: HTMLCanvasElement, count: number): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

    this.bloomCanvas = document.createElement('canvas');
    this.bloomCtx = this.bloomCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
    });

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

  private rebuildSprites(): void {
    if (this.spriteDpr === this.dpr && this.sprites.length > 0) return;

    this.spriteDpr = this.dpr;

    const make = (rgb: [number, number, number]): HTMLCanvasElement => {
      const base = 44;
      const size = Math.max(24, Math.floor(base * this.dpr));
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;

      const ctx = c.getContext('2d');
      if (!ctx) return c;

      const [r, g, b] = rgb;
      const cx = size * 0.5;
      const cy = size * 0.5;
      const rad = size * 0.5;

      ctx.clearRect(0, 0, size, size);

      // Core white-hot bloom
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      core.addColorStop(0, 'rgba(255,255,255,0.98)');
      core.addColorStop(0.14, 'rgba(255,255,255,0.75)');
      core.addColorStop(0.36, `rgba(${r},${g},${b},0.28)`);
      core.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, size, size);

      // Chromatic fringe (subtle, keeps it modern without becoming noisy)
      ctx.globalCompositeOperation = 'screen';
      const fringe = ctx.createRadialGradient(
        cx - 0.6 * this.dpr,
        cy + 0.2 * this.dpr,
        0,
        cx,
        cy,
        rad
      );
      fringe.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
      fringe.addColorStop(0.6, `rgba(${r},${g},${b},0.08)`);
      fringe.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fringe;
      ctx.fillRect(0, 0, size, size);

      ctx.globalCompositeOperation = 'source-over';
      return c;
    };

    // A controlled, professional palette (avoid rainbow noise).
    this.sprites = [
      make([56, 189, 248]), // cyan
      make([99, 102, 241]), // indigo
      make([236, 72, 153]), // magenta
      make([251, 146, 60]), // amber
      make([255, 255, 255]), // white
    ];
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

    if (this.bloomCanvas && this.bloomCtx) {
      const bw = Math.max(1, Math.floor(this.w * this.bloomScale * dpr));
      const bh = Math.max(1, Math.floor(this.h * this.bloomScale * dpr));
      this.bloomCanvas.width = bw;
      this.bloomCanvas.height = bh;
      this.bloomCtx.setTransform(
        this.bloomScale * dpr,
        0,
        0,
        this.bloomScale * dpr,
        0,
        0
      );
      this.bloomCtx.imageSmoothingEnabled = true;
    }

    this.rebuildSprites();
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
    quality: number;
    burst: number;
    pinch: number;
    event: number;
    collapse: number;
    flip: number;
    shear: number;
  }): void {
    if (!this.ctx || !this.canvas) return;

    const now = performance.now();
    const dt = clamp((now - this.lastNow) / 1000, 1 / 240, 1 / 20);
    this.lastNow = now;

    const ctx = this.ctx;

    const blendT = smoothstep(opts.blend);

    // Trail clear (keeps motion feeling alive). Higher quality => less ghosting.
    // Event pulses momentarily reduce clearing to create a luminous smear.
    const trail = lerp(0.22, 0.12, opts.quality) * (1 - opts.event * 0.25);
    ctx.fillStyle = `rgba(2, 6, 23, ${trail})`;
    ctx.fillRect(0, 0, this.w, this.h);

    // Low-res bloom buffer (subtle, modern glow without heavy GPU)
    const doBloom = opts.quality > 0.72 && this.bloomCtx && this.bloomCanvas;
    if (doBloom && this.bloomCtx) {
      const bloomTrail = lerp(0.4, 0.18, opts.quality);
      this.bloomCtx.fillStyle = `rgba(2, 6, 23, ${bloomTrail})`;
      this.bloomCtx.fillRect(0, 0, this.w, this.h);
    }

    const cx = this.w * 0.5;
    const cy = this.h * 0.5;

    // Camera
    const px = this.pointerX.step(this.pointerTargetX, dt);
    const py = this.pointerY.step(this.pointerTargetY, dt);
    const yaw = px * 0.45 + (opts.scroll - 0.5) * 0.35;
    const pitch = py * -0.35;

    // Physics tuning adapts with scroll velocity ("changing physics")
    const velBoost = clamp(opts.velocity * 1.8, 0, 1);
    const pinchBoost = clamp(opts.pinch, 0, 1);
    const stiffness = lerp(10, 42, velBoost) * (1 + pinchBoost * 0.55);
    const damping = lerp(0.86, 0.78, velBoost);

    // Scene scale changes subtly with scroll and pinch
    const scale =
      lerp(
        Math.min(this.w, this.h) * 0.18,
        Math.min(this.w, this.h) * 0.26,
        smoothstep(opts.scroll)
      ) *
      (1 + pinchBoost * 0.12);

    // Swirl amount (blended per scene), with event pulse kick.
    const sceneTwist = lerp(
      SCENE_TWIST[opts.sceneA] ?? 1,
      SCENE_TWIST[opts.sceneB] ?? 1,
      blendT
    );
    const swirl = (0.35 + velBoost * 1.2 + opts.event * 0.5) * sceneTwist;

    const sceneGravity = lerp(
      SCENE_GRAVITY[opts.sceneA] ?? 0,
      SCENE_GRAVITY[opts.sceneB] ?? 0,
      blendT
    );
    const gravitySign = lerp(1, -1, opts.flip);
    const gravity =
      sceneGravity * gravitySign * (0.8 + velBoost * 0.9 + pinchBoost * 0.6);

    // Adaptive draw stride when quality drops.
    const stride = opts.quality > 0.82 ? 1 : opts.quality > 0.6 ? 2 : 3;

    const sprites = this.sprites;
    const spriteCount = Math.max(1, sprites.length);

    // Additive blend for a "4K" glow look.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.particles.length; i += stride) {
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

      // Add scroll + pointer driven curl + burst impulse
      const curl = (hash11(part.seed + 7) - 0.5) * 2;
      const impulse = opts.burst * (0.18 + hash11(part.seed + 8) * 0.22);
      part.v.x += (ax + -part.p.z * swirl + curl * 0.12) * dt;
      part.v.y += (ay + curl * 0.08 + py * 0.45 + gravity) * dt;
      part.v.z += (az + part.p.x * swirl + px * 0.35) * dt;

      // Pinch introduces a "vortex pull" feeling.
      if (pinchBoost > 0) {
        const pull = pinchBoost * (0.12 + velBoost * 0.18);
        part.v.x += -part.p.x * pull * dt;
        part.v.y += -part.p.y * pull * dt;
        part.v.z += -part.p.z * pull * dt;
      }

      // Collapse event (singularity feel)
      if (opts.collapse > 0) {
        const pull = opts.collapse * (0.28 + velBoost * 0.25);
        part.v.x += -part.p.x * pull * dt;
        part.v.y += -part.p.y * pull * dt;
        part.v.z += -part.p.z * pull * dt;
      }

      // Shear event (rift feel)
      if (opts.shear > 0) {
        const shear = opts.shear * (0.25 + velBoost * 0.3);
        part.v.x += part.p.y * shear * dt;
        part.v.z += part.p.x * shear * dt * 0.6;
      }

      part.v.x += part.p.x * impulse;
      part.v.y += part.p.y * impulse;
      part.v.z += part.p.z * impulse;

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
      const alpha = clamp(
        lerp(0.05, 0.8, 1 - (z + 1.2) / 2.4) + opts.burst * 0.25,
        0.04,
        0.92
      );
      const size =
        lerp(0.6, 2.6, inv) *
        (1 + opts.burst * 0.25 + pinchBoost * 0.08 + opts.event * 0.08);

      // Controlled palette selection (avoids noisy rainbow)
      const sIdx = Math.min(spriteCount - 1, Math.floor(u * spriteCount));
      const sprite = sprites[sIdx] ?? sprites[0];

      // Sprite size in CSS pixels (ctx is already scaled by DPR via setTransform)
      const draw = size * (6.5 + velBoost * 1.2 + opts.event * 1.2);
      ctx.globalAlpha = clamp(alpha * (0.55 + opts.quality * 0.25), 0.02, 0.85);
      ctx.drawImage(sprite, sx - draw * 0.5, sy - draw * 0.5, draw, draw);

      if (doBloom && this.bloomCtx && this.bloomCanvas) {
        const bloomDraw = draw * (1.8 + opts.event * 0.6);
        this.bloomCtx.globalAlpha = clamp(alpha * 0.16, 0.01, 0.25);
        this.bloomCtx.drawImage(
          sprite,
          sx - bloomDraw * 0.5,
          sy - bloomDraw * 0.5,
          bloomDraw,
          bloomDraw
        );
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    // Composite bloom (single blurred blit, cheap but effective)
    if (doBloom && this.bloomCtx && this.bloomCanvas) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.65 + opts.event * 0.2 + opts.burst * 0.15;
      ctx.filter = `blur(${8 + opts.event * 6}px)`;
      ctx.drawImage(this.bloomCanvas, 0, 0, this.w, this.h);
      ctx.restore();
    }

    // A tiny vignette / glow pass
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(cx, cy));
    g.addColorStop(
      0,
      `rgba(255,255,255,${0.02 + velBoost * 0.05 + opts.burst * 0.07})`
    );
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
  private lastScrollTime = performance.now();
  private lastFrameTime = performance.now();
  private velocityLP = 0;

  private pointerTarget = { x: 0, y: 0 };
  private tilt = { x: 0, y: 0 };
  private kick = { x: 0, y: 0 };

  private activeTouches = new Map<
    number,
    { sx: number; sy: number; st: number; lx: number; ly: number; lt: number }
  >();
  private pinchBaseDist = 0;
  private pinchTarget = 0;
  private pinch = new SpringValue(0, 80, 14);

  private pointerX = new SpringValue(0, 90, 16);
  private pointerY = new SpringValue(0, 90, 16);

  private burst = 0;
  private event = 0;
  private quality = 1;
  private perfLP = 16.7;

  private lastChapterIdx = -1;
  private stingerChapterIdx = -1;
  private stingerFired = false;

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
      'pointerdown',
      e => {
        // Tap/click energizes the scene (no UI, just cinematic impact)
        this.burst = Math.min(1, this.burst + 0.75);

        if (e.pointerType === 'touch') {
          const t = performance.now();
          this.activeTouches.set(e.pointerId, {
            sx: e.clientX,
            sy: e.clientY,
            st: t,
            lx: e.clientX,
            ly: e.clientY,
            lt: t,
          });
        }
      },
      { passive: true, signal }
    );

    window.addEventListener(
      'pointermove',
      e => {
        const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
        const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
        this.pointerTarget.x = clamp(nx, -1, 1);
        this.pointerTarget.y = clamp(ny, -1, 1);

        if (e.pointerType === 'touch') {
          const rec = this.activeTouches.get(e.pointerId);
          if (rec) {
            const t = performance.now();
            rec.lx = e.clientX;
            rec.ly = e.clientY;
            rec.lt = t;
          }

          // Pinch detection from first two touches
          if (this.activeTouches.size >= 2) {
            const vals = Array.from(this.activeTouches.values());
            const a = vals[0];
            const b = vals[1];
            const dx = a.lx - b.lx;
            const dy = a.ly - b.ly;
            const dist = Math.hypot(dx, dy);
            if (this.pinchBaseDist <= 0) this.pinchBaseDist = Math.max(1, dist);
            const ratio = dist / Math.max(1, this.pinchBaseDist);
            this.pinchTarget = clamp((ratio - 1) * 1.25, 0, 1);
          } else {
            this.pinchBaseDist = 0;
            this.pinchTarget = 0;
          }
        }
      },
      { passive: true, signal }
    );

    const endTouch = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      const rec = this.activeTouches.get(e.pointerId);
      if (rec) {
        const dx = rec.lx - rec.sx;
        const dy = rec.ly - rec.sy;
        const dt = Math.max(1, rec.lt - rec.st);
        const speed = Math.hypot(dx, dy) / dt; // px per ms

        // Swipe adds a directional camera kick + burst.
        const nx = clamp(dx / Math.max(1, window.innerWidth), -1, 1);
        const ny = clamp(dy / Math.max(1, window.innerHeight), -1, 1);
        const s = clamp(speed / 1.2, 0, 1);

        if (s > 0.25) {
          this.kick.x = clamp(this.kick.x + nx * 0.8 * s, -0.85, 0.85);
          this.kick.y = clamp(this.kick.y + ny * 0.7 * s, -0.85, 0.85);
          this.burst = Math.min(1, this.burst + 0.35 * s);
        }
      }

      this.activeTouches.delete(e.pointerId);
      if (this.activeTouches.size < 2) {
        this.pinchBaseDist = 0;
        this.pinchTarget = 0;
      }
    };

    window.addEventListener('pointerup', endTouch, { passive: true, signal });
    window.addEventListener('pointercancel', endTouch, {
      passive: true,
      signal,
    });

    // Optional device orientation (best-effort, no UI)
    window.addEventListener(
      'deviceorientation',
      evt => {
        if (this.reducedMotion) return;
        // gamma: left-right tilt (-90..90), beta: front-back (-180..180)
        const gx = typeof evt.gamma === 'number' ? evt.gamma / 45 : 0;
        const by = typeof evt.beta === 'number' ? evt.beta / 45 : 0;
        // Store as a separate contribution (prevents drift from accumulating)
        this.tilt.x = clamp(gx * 0.25, -0.35, 0.35);
        this.tilt.y = clamp(by * 0.18, -0.35, 0.35);
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
    const dt = Math.max(16, now - this.lastScrollTime);
    const v = clamp(delta / dt, 0, 1.5);

    this.velocityLP = lerp(this.velocityLP, v, 0.12);
    this.lastScrollY = window.scrollY;
    this.lastScrollTime = now;

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

    const nextScene =
      this.chapters[Math.min(idx + 1, this.chapters.length - 1)]?.dataset
        .scene ?? scene;

    const blendT = smoothstep(localT);
    const sceneIdx = sceneIndexFromId(scene);
    const nextSceneIdx = sceneIndexFromId(nextScene);

    const hue = lerp(
      SCENE_HUE[sceneIdx] ?? 210,
      SCENE_HUE[nextSceneIdx] ?? 210,
      blendT
    );
    const hue2 = lerp(
      SCENE_HUE_2[sceneIdx] ?? 280,
      SCENE_HUE_2[nextSceneIdx] ?? 280,
      blendT
    );
    const grade = lerp(
      SCENE_GRADE[sceneIdx] ?? 0.2,
      SCENE_GRADE[nextSceneIdx] ?? 0.2,
      blendT
    );

    const now = performance.now();

    // Measure frame time for adaptive quality.
    const frameDtMs = clamp(now - this.lastFrameTime, 8, 50);
    this.lastFrameTime = now;
    this.perfLP = lerp(this.perfLP, frameDtMs, 0.06);

    // Adaptive quality: degrade slightly if we see sustained > ~24ms frames.
    const targetQuality = this.perfLP < 18 ? 1 : this.perfLP < 24 ? 0.85 : 0.7;
    this.quality = lerp(this.quality, targetQuality, 0.04);

    const dt = 1 / 60;
    // Decay camera kick and combine inputs.
    this.kick.x *= 0.9;
    this.kick.y *= 0.9;

    const targetX = clamp(
      this.pointerTarget.x + this.tilt.x + this.kick.x,
      -1,
      1
    );
    const targetY = clamp(
      this.pointerTarget.y + this.tilt.y + this.kick.y,
      -1,
      1
    );

    const px = this.pointerX.step(targetX, dt);
    const py = this.pointerY.step(targetY, dt);

    const pinch = this.pinch.step(this.pinchTarget, dt);

    this.field.setPointer(px, py);

    // Burst decays over time; scroll velocity also injects energy.
    this.burst = clamp(this.burst * 0.92 + velocity * 0.22, 0, 1);

    // Chapter transitions trigger a cinematic event pulse.
    if (idx !== this.lastChapterIdx) {
      this.lastChapterIdx = idx;
      this.event = 1;
      this.burst = Math.min(1, this.burst + 0.55);

      // Arm a mid-chapter stinger.
      this.stingerChapterIdx = idx;
      this.stingerFired = false;
    }

    // Mid-chapter "stinger" (one per chapter): a deliberate moment that feels authored.
    // Keep it subtle; avoid noisy spam on fast scroll.
    if (
      !this.stingerFired &&
      idx === this.stingerChapterIdx &&
      localT > 0.68 &&
      velocity < 0.45
    ) {
      this.stingerFired = true;
      this.event = 1;
      this.burst = Math.min(1, this.burst + 0.35);
      // Small camera kick for punch (decays naturally)
      const jx = (hash11(idx * 97.13 + now * 0.001) - 0.5) * 0.22;
      const jy = (hash11(idx * 31.77 + now * 0.001 + 4.2) - 0.5) * 0.18;
      this.kick.x = clamp(this.kick.x + jx, -0.85, 0.85);
      this.kick.y = clamp(this.kick.y + jy, -0.85, 0.85);
    }

    this.event = clamp(this.event * 0.9, 0, 1);

    // Scene-specific advanced scroll effects
    const collapse =
      scene === 'singularity'
        ? ramp(localT, 0.18, 0.85)
        : scene === 'afterglow'
          ? ramp(1 - localT, 0.15, 0.75) * 0.6
          : 0;
    const flip = scene === 'rift' ? ramp(localT, 0.35, 0.7) : 0;
    const shear = scene === 'prism' ? ramp(localT, 0.2, 0.8) * 0.45 : 0;

    this.root.style.setProperty('--ih-scroll', progress.toFixed(4));
    this.root.style.setProperty('--ih-vel', velocity.toFixed(4));
    this.root.style.setProperty('--ih-parallax-x', px.toFixed(4));
    this.root.style.setProperty('--ih-parallax-y', py.toFixed(4));
    this.root.style.setProperty('--ih-local', localT.toFixed(4));
    this.root.style.setProperty('--ih-burst', this.burst.toFixed(4));
    this.root.style.setProperty('--ih-quality', this.quality.toFixed(4));
    this.root.style.setProperty('--ih-event', this.event.toFixed(4));
    this.root.style.setProperty('--ih-pinch', pinch.toFixed(4));
    this.root.style.setProperty('--ih-hue', hue.toFixed(2));
    this.root.style.setProperty('--ih-hue-2', hue2.toFixed(2));
    this.root.style.setProperty('--ih-grade', grade.toFixed(3));
    this.root.dataset.ihScene = scene;

    // Canvas tick
    if (!this.reducedMotion && this.canvas && this.canvas.width > 0) {
      const a = sceneIdx;
      const b = nextSceneIdx;
      this.field.tick({
        sceneA: a,
        sceneB: b,
        blend: localT,
        scroll: progress,
        velocity,
        quality: this.quality,
        burst: this.burst,
        pinch,
        event: this.event,
        collapse,
        flip,
        shear,
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
