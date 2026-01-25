import * as THREE from 'three';
import { SimplePhysics } from '../physics/simple-physics';
import type { TowerCaps } from '../../core/caps';

// --- Types & Interfaces ---

export interface SceneRuntime {
  renderer: THREE.WebGLRenderer;
  root: HTMLElement; // Added
  size: { width: number; height: number; dpr: number };
  pointer: THREE.Vector2; // -1 to 1
  pointerVelocity: THREE.Vector2;
  scrollVelocity: number;
  dt: number;
  time: number;
  progress: number; // Added
  localProgress: number; // Added
  caps: TowerCaps;
  gyro: THREE.Vector3; // -1 to 1 based on beta/gamma
  gyroActive: boolean; // Added
  bgTheme: string; // 'dark' | 'glass'
  press: number; // 0 to 1
  tap: number; // transient 0->1 signal
  sceneId: string; // Added
  sceneIndex: number; // Added
}

export interface TowerScene {
  id: string; // Added
  group: THREE.Group;
  camera: THREE.Camera;
  bg?: THREE.Color; // optional override
  init(ctx: SceneRuntime): void;
  resize(ctx: SceneRuntime): void;
  update(ctx: SceneRuntime): void;
  render?(ctx: SceneRuntime): void; // Added
  dispose(): void;
  cleanup?(): void;
}

export interface SceneMeta {
  id: string;
  title: string;
  subtitle: string;
  index: number;
}

const sceneMeta: SceneMeta[] = [
  {
    id: 'scene00',
    title: 'Origin Core',
    subtitle: 'Resonant Structures',
    index: 0,
  },
  {
    id: 'scene01',
    title: 'Liquid Metal',
    subtitle: 'Chaotic Systems',
    index: 1,
  },
  {
    id: 'scene02',
    title: 'Million Fireflies',
    subtitle: 'Vector Calculus',
    index: 2,
  },
  {
    id: 'scene03',
    title: 'Quantum Ribbons',
    subtitle: 'Data Flow',
    index: 3,
  },
  {
    id: 'scene04',
    title: 'Aurora Field',
    subtitle: 'Magnetic Force',
    index: 4,
  },
  {
    id: 'scene05',
    title: 'Event Horizon',
    subtitle: 'Singularity',
    index: 5,
  },
  {
    id: 'scene06',
    title: 'Fractal Glass',
    subtitle: 'Refraction',
    index: 6,
  },
  {
    id: 'scene07',
    title: 'Data Stream',
    subtitle: 'Information Vortex',
    index: 7,
  },
  {
    id: 'scene08',
    title: 'Orbital Mechanics',
    subtitle: 'Gravity',
    index: 8,
  },
  {
    id: 'scene09',
    title: 'Crystal Glitch',
    subtitle: 'Tessellation',
    index: 9,
  },
  {
    id: 'scene10',
    title: 'Quantum Moiré',
    subtitle: 'Interference',
    index: 10,
  },
  {
    id: 'scene11',
    title: 'Neural Net',
    subtitle: 'Deep Learning',
    index: 11,
  },
  { id: 'scene12', title: 'The Library', subtitle: 'Knowledge', index: 12 },
  {
    id: 'scene13',
    title: 'Deep Abyss',
    subtitle: 'Organic Light',
    index: 13,
  },
  {
    id: 'scene14',
    title: 'Cyber City',
    subtitle: 'Future State',
    index: 14,
  },
  { id: 'scene15', title: 'Entropy Void', subtitle: 'Collapse', index: 15 },
];

// --- Math Helpers ---

const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

// --- Base Class (The "Centering" Fix) ---

abstract class SceneBase implements TowerScene {
  id: string = 'unknown'; // Added default
  group: THREE.Group;
  camera: THREE.PerspectiveCamera;

  // Design resolution reference
  protected baseFov = 45;
  protected baseDistance = 14;
  // This radius represents the "safe zone" of the scene content.
  // We ensure this radius is always visible.
  protected contentRadius = 4.5;

  constructor() {
    this.group = new THREE.Group();
    // Start with a standard setup
    this.camera = new THREE.PerspectiveCamera(this.baseFov, 1, 0.1, 100);
    this.camera.position.set(0, 0, this.baseDistance);
  }

  abstract init(ctx: SceneRuntime): void;
  abstract update(ctx: SceneRuntime): void;

  render(ctx: SceneRuntime): void {
    ctx.renderer.render(this.group, this.camera);
  }

  resize(ctx: SceneRuntime): void {
    const aspect = ctx.size.width / ctx.size.height;
    this.camera.aspect = aspect;

    // Responsive Logic:
    // We want to ensure 'this.contentRadius' is visible both vertically and horizontally.
    // Vertical FOV is fixed in THREE.PerspectiveCamera.
    // Visible Height at distance D:  H = 2 * D * tan(FOV/2).
    // Visible Width: W = H * aspect.

    // If aspect < 1 (Portrait), width is the limiting factor.
    // We want Visible Width >= contentRadius * 2.
    // W = 2 * D * tan(FOV/2) * aspect >= 2 * R
    // D * tan(FOV/2) * aspect >= R
    // D >= R / (tan(FOV/2) * aspect)

    // If aspect >= 1 (Landscape), height is usually limiting (or width is plentiful).
    // We want Visible Height >= contentRadius * 2.
    // 2 * D * tan(FOV/2) >= 2 * R
    // D >= R / tan(FOV/2)

    const fovRad = (this.camera.fov * Math.PI) / 180;
    const tanHalf = Math.tan(fovRad / 2);

    let requiredDist = 0;
    if (aspect < 1.0) {
      // Portrait: Fit width
      requiredDist = (this.contentRadius * 1.05) / (tanHalf * aspect);
    } else {
      // Landscape: Fit height
      requiredDist = (this.contentRadius * 1.05) / tanHalf;
    }

    // Apply strict centering
    this.baseDistance = requiredDist;
    // Note: The update() loop typically interpolates camera.z to baseDistance.
    // If a scene overrides camera controls, it must respect this baseDistance.

    this.camera.updateProjectionMatrix();

    // Re-center any stray objects if needed (handled by scene implementations)
  }

  dispose(): void {
    // Basic cleanup traversal
    this.group.traverse(obj => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      // Materials might be shared, be careful.
      // For this project, we assume mostly unique materials or GC handles it.
    });
  }
}

// --- Scene 00: Feedback Forge (High Octane) ---

class FeedbackForgeScene extends SceneBase {
  private rings: THREE.Mesh[] = [];
  private core: THREE.Mesh;
  private particles: THREE.Points;
  private particleData: Float32Array;

  constructor() {
    super();
    this.id = 'scene00';
    this.contentRadius = 5.0; // Keeps the forge visible

    // 1. Core Energy Source (Volumetric Shader look via layers)
    const coreGeo = new THREE.IcosahedronGeometry(1.5, 30); // Higher poly for smooth noise
    const coreMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color('#ff2a00') },
        uColorB: { value: new THREE.Color('#ffaa00') },
        uPulse: { value: 0 },
      },
      vertexShader: `
        varying vec3 vN;
        varying vec3 vP;
        uniform float uTime;
        uniform float uPulse;

        // Curl noise approximation
        vec3 hash( vec3 p ) {
            p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
                      dot(p,vec3(269.5,183.3,246.1)),
                      dot(p,vec3(113.5,271.9,124.6)));
            return -1.0 + 2.0*fract(sin(p)*43758.5453123);
        }

        void main() {
          vN = normal;
          // Turbulent displacement
          float t = uTime * 1.5;
          vec3 n1 = hash(position * 2.0 + t);
          vec3 n2 = hash(position * 4.0 - t * 0.5);

          float displacement = (n1.x + n2.y * 0.5) * (0.2 + uPulse * 0.4);
          vec3 pos = position + normal * displacement;
          vP = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vN;
        varying vec3 vP;
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform float uPulse;

        // Simplex noise function for better lava texture
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec3 v){
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod(i, 289.0);
          vec4 p = permute( permute( permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = inversesqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
          vec3 viewDir = normalize(cameraPosition - vP);
          float fresnel = pow(1.0 - dot(vN, viewDir), 2.0);

          // Lava math
          float noiseVal = snoise(vP * 2.0 + uTime * 0.5);
          float heat = smoothstep(0.2, 0.8, noiseVal);

          // Dark crust
          vec3 crustColor = vec3(0.05, 0.02, 0.02);

          // Glowing magma
          vec3 magmaColor = mix(uColorA, uColorB, heat);
          magmaColor *= 2.0; // Overdrive for bloom

          // Mix based on heat threshold
          vec3 col = mix(crustColor, magmaColor, heat);

          // Add pulse
          col += vec3(1.0, 0.8, 0.2) * uPulse * heat * 5.0;

          // Rim light on crust
          col += vec3(0.2, 0.1, 0.1) * fresnel * (1.0-heat);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    // 2. Orbital Rings (Industrial)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xff4400,
      emissiveIntensity: 0.2,
    });

    // Add point light for the rings to catch
    const light = new THREE.PointLight(0xff6600, 5, 20);
    this.group.add(light);

    for (let i = 0; i < 4; i++) {
      const r = 2.8 + i * 1.5;
      // Hexagonal rings for more sci-fi look
      const geo = new THREE.TorusGeometry(r, 0.08 + i * 0.02, 6, 100);
      const mesh = new THREE.Mesh(geo, ringMat.clone());
      mesh.userData = {
        axis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        speed: (0.1 + Math.random() * 0.4) * (i % 2 == 0 ? 1 : -1),
      };
      this.rings.push(mesh);
      this.group.add(mesh);
    }

    // 3. Sparks / Embers
    const pCount = 1200;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    this.particleData = new Float32Array(pCount * 4); // x,y,z, speed

    for (let i = 0; i < pCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.0 + Math.random() * 6.0;
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);

      this.particleData[i * 4] = pPos[i * 3];
      this.particleData[i * 4 + 1] = pPos[i * 3 + 1];
      this.particleData[i * 4 + 2] = pPos[i * 3 + 2];
      this.particleData[i * 4 + 3] = 0.5 + Math.random();
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.12,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      map: this.createSparkTexture(), // Create procedural texture
    });
    this.particles = new THREE.Points(pGeo, pMat);
    this.group.add(this.particles);
  }

  // Helper for nice soft particles
  createSparkTexture() {
    const cvs = document.createElement('canvas');
    cvs.width = 32;
    cvs.height = 32;
    const ctx = cvs.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,200,100,0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const tex = new THREE.CanvasTexture(cvs);
    return tex;
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const t = ctx.time;

    // Core Pulse
    (this.core.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    (this.core.material as THREE.ShaderMaterial).uniforms.uPulse.value =
      ctx.press;

    // Rings
    this.rings.forEach((r, i) => {
      const u = r.userData;
      // Add gyro tilt to ring axis
      const axis = u.axis
        .clone()
        .applyAxisAngle(new THREE.Vector3(1, 0, 0), ctx.gyro.x)
        .normalize();
      r.rotateOnAxis(axis, u.speed * ctx.dt * (1 + ctx.press * 4));

      (r.material as THREE.MeshPhysicalMaterial).emissiveIntensity =
        0.5 + Math.sin(t * 3 + i) * 0.3 + ctx.press * 2;
    });

    // Particle orbit
    const pos = this.particles.geometry.attributes.position
      .array as Float32Array;
    for (
      let i = 0;
      i < this.particles.geometry.attributes.position.count;
      i++
    ) {
      const idx = i * 3;
      const speed = this.particleData[i * 4 + 3];
      // Vortex motion
      const x = pos[idx];
      const z = pos[idx + 2];
      const angle = speed * ctx.dt * (1 + ctx.press);

      pos[idx] = x * Math.cos(angle) - z * Math.sin(angle);
      pos[idx + 2] = x * Math.sin(angle) + z * Math.cos(angle);

      // Rise
      pos[idx + 1] += speed * ctx.dt;
      if (pos[idx + 1] > 6) pos[idx + 1] = -6;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;

    // Camera Orbit
    const mx = ctx.pointer.x * 0.5 + ctx.gyro.y * 0.5;
    const my = ctx.pointer.y * 0.5 + ctx.gyro.x * 0.5;

    this.camera.position.x = damp(this.camera.position.x, mx * 3, 4, ctx.dt);
    this.camera.position.y = damp(this.camera.position.y, my * 3, 4, ctx.dt);
    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      4,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);

    this.group.rotation.y = t * 0.05;
  }
}

// --- Scene 01: Liquid Metal (Chaotic Systems) ---

class LiquidMetalScene extends SceneBase {
  private mesh: THREE.Mesh;
  private material: THREE.MeshStandardMaterial;

  constructor() {
    super();
    this.id = 'scene01';
    this.contentRadius = 5.0;

    // High fidelity geometry
    const geo = new THREE.IcosahedronGeometry(2.5, 30); // High poly for smooth noise

    this.material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 1.0,
      roughness: 0.1,
      envMapIntensity: 1.0,
      flatShading: false,
    });

    // Custom Shader Injection for Vertex Displacement
    this.material.onBeforeCompile = shader => {
      shader.uniforms.uTime = { value: 0 };

      shader.vertexShader = `
        uniform float uTime;

        // Simplex Noise
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec3 v){
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod(i, 289.0);
          vec4 p = permute( permute( permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = inversesqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
          #include <begin_vertex>

          float time = uTime * 0.5;
          float noise = snoise(position * 0.8 + time);

          // Displace along normal
          // Sharp peaks for liquid tension look
          float displacement = noise * 1.5;

          transformed += normal * displacement;
        `
      );

      // Recalculate normal for correct lighting (approximate)
      // For high quality we need derivatives but flat shading or standard lighting might hide it
      // Let's rely on high poly count and built-in varyings

      // Keep reference to uniforms updating
      this.material.userData.shader = shader;
    };

    this.mesh = new THREE.Mesh(geo, this.material);
    this.group.add(this.mesh);

    // Dynamic Lights to make the metal shine
    const light1 = new THREE.PointLight(0xff0044, 5, 20);
    light1.position.set(5, 5, 5);
    this.group.add(light1);

    const light2 = new THREE.PointLight(0x0044ff, 5, 20);
    light2.position.set(-5, -5, 5);
    this.group.add(light2);

    // Animate lights to create moving reflections
    this.mesh.userData.lights = [light1, light2];
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    if (this.material.userData.shader) {
      this.material.userData.shader.uniforms.uTime.value = ctx.time;
    }

    // Rotate lights
    const l1 = this.mesh.userData.lights[0];
    const l2 = this.mesh.userData.lights[1];

    l1.position.x = Math.sin(ctx.time) * 6;
    l1.position.z = Math.cos(ctx.time) * 6;

    l2.position.x = Math.sin(ctx.time + 2) * 6;
    l2.position.y = Math.cos(ctx.time * 0.5) * 6;

    this.group.rotation.y = ctx.time * 0.1;
    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Scene 03: Quantum Ribbons (Data Flow) ---

class RibbonFieldScene extends SceneBase {
  private mesh: THREE.InstancedMesh;
  private count = 500;
  private dummy = new THREE.Object3D();

  constructor() {
    super();
    this.id = 'scene03';
    this.contentRadius = 6.0;

    // Long strip with high segmentation for smooth curves
    const geo = new THREE.PlaneGeometry(0.2, 20, 2, 100);

    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uPress: { value: 0 },
      },
      vertexShader: `
        attribute float aOffset;
        attribute float aSpeed;
        attribute vec3 aColor; // r,g,b

        varying vec2 vUv;
        varying vec3 vColor;
        varying float vAlpha;
        varying vec3 vNorm;

        uniform float uTime;
        uniform float uPress;

        void main() {
            vUv = uv;
            vColor = aColor;

            // Normalized position along the strip (0 to 1)
            // The plane is height 20, centered at 0. So y goes from -10 to 10
            float t = (position.y + 10.0) / 20.0; // 0..1 along length

            // Flow animation
            float flow = t + uTime * aSpeed * 0.2 + aOffset;

            // Define Trefoil Knot path
            // x = sin(t) + 2sin(2t)
            // y = cos(t) - 2cos(2t)
            // z = -sin(3t)

            float angle = flow * 6.28;

            // Knot Parameters
            float k = 3.0; // Scale
            float px = sin(angle) + 2.0 * sin(2.0 * angle);
            float py = cos(angle) - 2.0 * cos(2.0 * angle);
            float pz = -sin(3.0 * angle);

            vec3 curvePos = vec3(px, pz, py) * k * 0.5; // Swapping y/z for better camera view

            // Tangent (Derivative of position)
            float dAngle = 0.01;
            float angle2 = angle + dAngle;
             float px2 = sin(angle2) + 2.0 * sin(2.0 * angle2);
            float py2 = cos(angle2) - 2.0 * cos(2.0 * angle2);
            float pz2 = -sin(3.0 * angle2);
            vec3 curvePos2 = vec3(px2, pz2, py2) * k * 0.5;

            vec3 tangent = normalize(curvePos2 - curvePos);
            vec3 up = vec3(0.0, 1.0, 0.0);
            vec3 right = normalize(cross(tangent, up));
            vec3 normal = cross(right, tangent);

            vNorm = normal;

            // Offset based on X (width of ribbon)
            // position.x is -0.1 to 0.1
            vec3 finalPos = curvePos + right * position.x * (1.0 + uPress * 5.0); // Expand width on press

            // Add some "breathing" / spread based on offset
            finalPos += normal * sin(angle * 5.0 + uTime) * 0.5;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);

            // Alpha fade at ends
            vAlpha = smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.9, 1.0, t));
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vColor;
        varying float vAlpha;
        varying vec3 vNorm;

        void main() {
            // Iridescence
            vec3 viewDir = vec3(0.0, 0.0, 1.0); // Approx view dir in view space? adjust if needed
            float fresnel = pow(1.0 - abs(dot(vNorm, viewDir)), 2.0);

            vec3 col = vColor;

            // Add shiny streak
            float streak = step(0.95, fract(vUv.y * 10.0));
            col += vec3(1.0) * streak * 0.5;

            // Rim light
            col += vec3(0.5, 0.8, 1.0) * fresnel;

            gl_FragColor = vec4(col, vAlpha * 0.8);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false, // Transparency sort issue might occur but additive looks good
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, this.count);

    const offsets = new Float32Array(this.count);
    const speeds = new Float32Array(this.count);
    const colors = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      this.dummy.position.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);

      offsets[i] = Math.random() * 10.0;
      speeds[i] = 0.5 + Math.random() * 0.5;

      const c = new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 1.0, 0.6);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    this.mesh.geometry.setAttribute(
      'aOffset',
      new THREE.InstancedBufferAttribute(offsets, 1)
    );
    this.mesh.geometry.setAttribute(
      'aSpeed',
      new THREE.InstancedBufferAttribute(speeds, 1)
    );
    this.mesh.geometry.setAttribute(
      'aColor',
      new THREE.InstancedBufferAttribute(colors, 3)
    );

    this.group.add(this.mesh);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const mat = this.mesh.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = ctx.time;
    mat.uniforms.uPress.value = ctx.press;

    this.group.rotation.x = ctx.pointer.y * 0.2;
    this.group.rotation.y = ctx.pointer.x * 0.2 + ctx.time * 0.1;

    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Scene 02: Million Fireflies (Vector Calculus) ---

class MillionFirefliesScene extends SceneBase {
  private particles: THREE.Points;
  private count = 100000; // Massive particle count

  constructor() {
    super();
    this.id = 'scene02';
    this.contentRadius = 6.0;

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.count * 3);
    const data = new Float32Array(this.count * 4); // phase, speed, orbit_radius, y_offset

    for (let i = 0; i < this.count; i++) {
      // Initial random distribution sphere
      const r = 10.0 * Math.pow(Math.random(), 0.33);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      data[i * 4] = Math.random() * 100.0; // Phase
      data[i * 4 + 1] = 0.2 + Math.random() * 0.8; // Speed
      data[i * 4 + 2] = 2.0 + Math.random() * 5.0; // Orbit Radius
      data[i * 4 + 3] = (Math.random() - 0.5) * 4.0; // Y Offset
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aData', new THREE.BufferAttribute(data, 4));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPress: { value: 0 },
        uColorA: { value: new THREE.Color(0xffaa00) }, // Gold
        uColorB: { value: new THREE.Color(0x00ffff) }, // Cyan
      },
      vertexShader: `
            uniform float uTime;
            uniform float uPress;
            attribute vec4 aData;
            varying float vAlpha;
            varying float vSize;
            varying vec3 vCol;

            // Pseudo-random
            float rand(vec2 co){
                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
            }

            void main() {
                vec3 p = position;
                float t = uTime * aData.y * 0.5;
                float phase = aData.x;

                // Vector Field Simulation (Parametric Flow)
                // Combine rotation + sine wave verticality

                float r = aData.z;
                float yOff = aData.w;

                // Spiral variable
                float angle = t + phase;

                // Lissajous-like path
                float x = r * sin(angle) * cos(angle * 0.5);
                float z = r * cos(angle) * cos(angle * 0.5);
                float y = yOff + sin(angle * 3.0) * 1.0;

                // Targeted position
                vec3 target = vec3(x, y, z);

                // Lerp from initial to target based on time to create "forming" effect?
                // Or just use target as the position directly for smooth flow.
                p = target;

                // Interaction: Press to scatter
                vec3 dir = normalize(p);
                p += dir * uPress * 8.0 * (1.0 + sin(phase * 10.0));

                // Waving distortion
                p.y += sin(p.x * 0.5 + uTime) * 0.5;

                vec4 mv = modelViewMatrix * vec4(p, 1.0);
                gl_Position = projectionMatrix * mv;

                // Distance attenuation
                float dist = length(mv.xyz);
                gl_PointSize = (2.0 + sin(t*5.0 + phase)*1.0) * (30.0 / dist);

                // Vary size by press
                gl_PointSize *= (1.0 + uPress * 2.0);

                vAlpha = 0.6 + 0.4 * sin(t * 2.0 + phase);

                // Color ramp based on height
                // float h = normalize(p.y); // -1 to 1 approx
                // vCol = mix(uColorA, uColorB, smoothstep(-3.0, 3.0, p.y));
            }
        `,
      fragmentShader: `
            uniform vec3 uColorA;
            uniform vec3 uColorB;
            varying float vAlpha;

            void main() {
                vec2 uv = gl_PointCoord - 0.5;
                float d = length(uv);
                if (d > 0.5) discard;

                // Soft glow
                float glow = 1.0 - d * 2.0;
                glow = pow(glow, 2.0);

                // Sparkle core
                float core = smoothstep(0.1, 0.0, d);

                // Color variation by screen position slightly
                vec3 col = mix(uColorA, uColorB, gl_FragCoord.y / 1000.0);

                gl_FragColor = vec4(col + vec3(core), glow * vAlpha);
            }
        `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geo, mat);
    this.group.add(this.particles);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const mat = this.particles.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = ctx.time;
    mat.uniforms.uPress.value = ctx.press;

    this.group.rotation.y = ctx.time * 0.05;

    // Tilt with gyro
    this.group.rotation.x = ctx.gyro.x * 0.2;
    this.group.rotation.z = ctx.gyro.y * 0.2;

    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Scene 04: Aurora Borealis (Ethereal) ---

class AuroraCurtainScene extends SceneBase {
  private mesh: THREE.InstancedMesh;
  private count = 60;
  private dummy = new THREE.Object3D();

  constructor() {
    super();
    this.id = 'scene04';
    this.contentRadius = 8.0;

    // A single long, tall curtain strip
    // Width 5, Height 20, WidthSegs 40, HeightSegs 64
    const geo = new THREE.PlaneGeometry(8, 24, 40, 64);

    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0x00ffaa) }, // Green/Cyan
        uColor2: { value: new THREE.Color(0x8800ff) }, // Purple
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vAlpha;
        varying float vIndex;

        uniform float uTime;
        attribute float aIndex;
        attribute float aPhase;

        // Simplex noise function
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
           const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
           vec2 i  = floor(v + dot(v, C.yy) );
           vec2 x0 = v -   i + dot(i, C.xx);
           vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
           vec4 x12 = x0.xyxy + C.xxzz;
           x12.xy -= i1;
           i = mod(i, 289.0);
           vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
           vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
           m = m*m; m = m*m;
           vec3 x = 2.0 * fract(p * C.www) - 1.0;
           vec3 h = abs(x) - 0.5;
           vec3 ox = floor(x + 0.5);
           vec3 a0 = x - ox;
           m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
           vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
           return 130.0 * dot(m, g);
        }

        void main() {
           vUv = uv;
           vIndex = aIndex;

           vec3 pos = position;

           // Curving the curtain
           float t = uTime * 0.2 + aPhase;

           // Large sweeping wave
           float wave = snoise(vec2(pos.x * 0.1 + t, pos.y * 0.05 + aIndex * 0.1));

           pos.z += wave * 3.0;

           // Fine detail ripples
           float ripple = snoise(vec2(pos.x * 0.5 + t * 2.0, pos.y * 0.2));
           pos.z += ripple * 0.5;

           // Alpha fade at edges
           vAlpha = smoothstep(0.0, 0.2, uv.y) * (1.0 - smoothstep(0.8, 1.0, uv.y));
           vAlpha *= smoothstep(0.0, 0.1, uv.x) * (1.0 - smoothstep(0.9, 1.0, uv.x));

           gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vAlpha;
        varying float vIndex;
        uniform vec3 uColor1;
        uniform vec3 uColor2;

        void main() {
           // Color gradient vertical
           vec3 col = mix(uColor1, uColor2, vUv.y);

           // Add banding
           float bands = sin(vUv.y * 20.0 + vIndex) * 0.1;
           col += bands;

           float finalAlpha = vAlpha * 0.6; // ghost-like

           gl_FragColor = vec4(col * 2.0, finalAlpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false, // Important for transparency overlap
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, this.count);

    const indices = new Float32Array(this.count);
    const phases = new Float32Array(this.count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.count; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 10,
        0,
        (Math.random() - 0.5) * 5
      );
      dummy.rotation.y = (Math.random() - 0.5) * 1.0;
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);

      indices[i] = i;
      phases[i] = Math.random() * 100;
    }

    this.mesh.geometry.setAttribute(
      'aIndex',
      new THREE.InstancedBufferAttribute(indices, 1)
    );
    this.mesh.geometry.setAttribute(
      'aPhase',
      new THREE.InstancedBufferAttribute(phases, 1)
    );

    this.group.add(this.mesh);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const mat = this.mesh.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = ctx.time;

    this.group.rotation.y = ctx.time * 0.05;

    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Scene 05: Event Horizon (Cosmic Horror) ---

class EventHorizonScene extends SceneBase {
  private disk: THREE.Mesh;
  private glow: THREE.Mesh;
  private jets: THREE.Mesh;

  constructor() {
    super();
    this.id = 'scene05';
    this.contentRadius = 8.0;

    // 1. Accretion Disk (High Detail)
    const geo = new THREE.RingGeometry(1.5, 6.0, 128, 4);
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(0xff3300) }, // Deep Orange
        uColorB: { value: new THREE.Color(0xffddaa) }, // Hot White
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;

        // Simplex Noise (Self-contained)
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
           const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
           vec2 i  = floor(v + dot(v, C.yy) );
           vec2 x0 = v -   i + dot(i, C.xx);
           vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
           vec4 x12 = x0.xyxy + C.xxzz;
           x12.xy -= i1;
           i = mod(i, 289.0);
           vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
           vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
           m = m*m; m = m*m;
           vec3 x = 2.0 * fract(p * C.www) - 1.0;
           vec3 h = abs(x) - 0.5;
           vec3 ox = floor(x + 0.5);
           vec3 a0 = x - ox;
           m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
           vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
           return 130.0 * dot(m, g);
        }

        void main() {
            vec2 centered = vUv * 2.0 - 1.0;
            float angle = atan(centered.y, centered.x);
            float len = length(centered);

            // Rotating Swirl
            float spiral = angle * 2.0 + 10.0 / (len + 0.1);
            float turb = snoise(vec2(spiral - uTime * 4.0, len * 5.0));
            turb += snoise(vec2(angle * 10.0, len * 20.0 - uTime * 8.0)) * 0.5;

            float core = smoothstep(0.0, 0.8, turb);
            vec3 col = mix(uColorA, uColorB, core);

            // Hard inner edge, soft outer
            float alpha = smoothstep(0.2, 0.35, len) * (1.0 - smoothstep(0.9, 1.0, len));
            alpha *= (0.8 + turb * 0.2);

            if(alpha < 0.01) discard;
            gl_FragColor = vec4(col * 3.0, alpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.disk = new THREE.Mesh(geo, mat);
    this.disk.rotation.x = Math.PI * 0.4;
    this.group.add(this.disk);

    // 2. Black Hole Center
    const bhGeo = new THREE.SphereGeometry(1.45, 64, 64);
    const bhMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const bh = new THREE.Mesh(bhGeo, bhMat);
    this.group.add(bh);

    // 3. Relativistic Jets
    const jetGeo = new THREE.CylinderGeometry(0.2, 1.2, 12, 32, 20, true);
    jetGeo.translate(0, 6, 0);
    const jetMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        varying float vPosY;
        void main() {
          vUv = uv;
          vPosY = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vPosY;
        uniform float uTime;
        void main() {
            // Fade ends
            float alpha = smoothstep(0.0, 2.0, vPosY) * (1.0 - smoothstep(8.0, 12.0, vPosY));

            // Pulse pattern
            float pulse = sin(vPosY * 2.0 - uTime * 15.0); // Fast pulse
            alpha *= (0.3 + 0.7 * pulse);

            // Narrow core
            float beam = 1.0 - abs(vUv.x - 0.5) * 2.0;
            beam = pow(beam, 4.0);
            alpha *= beam;

            vec3 col = vec3(0.5, 0.7, 1.0);
            gl_FragColor = vec4(col * 3.0, alpha * 0.5);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.jets = new THREE.Mesh(jetGeo, jetMat);
    this.group.add(this.jets);

    const jetDown = this.jets.clone();
    jetDown.rotation.x = Math.PI;
    this.group.add(jetDown);

    // 4. Corona Glow
    const shineGeo = new THREE.PlaneGeometry(16, 16);
    const shineMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
      fragmentShader: `
            varying vec2 vUv;
            void main() {
                float d = distance(vUv, vec2(0.5));
                float a = 1.0 / (d * 8.0) - 0.2;
                a = clamp(a, 0.0, 1.0);
                gl_FragColor = vec4(1.0, 0.5, 0.2, a * 0.4);
            }
        `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.glow = new THREE.Mesh(shineGeo, shineMat);
    this.group.add(this.glow);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const t = ctx.time;
    (this.disk.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    (this.jets.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

    // Wobble disk only, keep jet vertical relative to BH?
    // Actually, jets should align with rotation axis.
    // Let's rotate the whole group slightly but keep jets mostly vertical for stability in view
    // or rotate jets with disk.

    // To keep it simple: Disk rotates around Y (group), but wobbles on local X
    // We want the group to rotate, so everything rotates together.
    this.group.rotation.z = Math.sin(t * 0.1) * 0.1;
    this.group.rotation.x = Math.sin(t * 0.15) * 0.1;

    // Pulse the glow
    const glowMat = this.glow.material as THREE.ShaderMaterial;
    glowMat.uniforms.uTime.value = t;

    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Scene 06: Kaleido Glass (Fractal Refraction) ---

class KaleidoGlassScene extends SceneBase {
  private shapes: THREE.InstancedMesh;
  private count = 300;
  private dummy = new THREE.Object3D();
  private physics: SimplePhysics;
  private pointerPos = new THREE.Vector3();

  constructor() {
    super();
    this.id = 'scene06';
    this.contentRadius = 5.0;

    // Prism Geometry
    const geo = new THREE.ConeGeometry(0.5, 1.5, 4);

    // High-end glass material
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x220033,
      metalness: 0.1,
      roughness: 0.0,
      transmission: 1.0,
      thickness: 2.0,
      ior: 1.6,
      clearcoat: 1.0,
      attenuationColor: new THREE.Color(0xff00aa),
      attenuationDistance: 1.0,
    });
    // @ts-expect-error Dispersion
    mat.dispersion = 0.08;

    this.shapes = new THREE.InstancedMesh(geo, mat, this.count);

    // Physics
    this.physics = new SimplePhysics(this.count);
    this.physics.bounds.set(6, 6, 6);
    this.physics.friction = 0.98;

    // Arrange in a Fractal Sphere pattern
    for (let i = 0; i < this.count; i++) {
      // Golden Angle distribution
      const phi = Math.acos(-1 + (2 * i) / this.count);
      const theta = Math.sqrt(this.count * Math.PI) * phi;

      const r = 3.5;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      this.physics.initParticle(i, new THREE.Vector3(x, y, z), 0.5);

      this.dummy.position.set(x, y, z);
      this.dummy.lookAt(0, 0, 0); // Point inward

      // Random scale variation
      const s = 0.5 + Math.random() * 1.0;
      this.dummy.scale.set(s, s * 2.0, s);

      this.dummy.updateMatrix();
      this.shapes.setMatrixAt(i, this.dummy.matrix);
    }

    // Store scale in userData
    const scales = new Float32Array(this.count);
    for (let i = 0; i < this.count; i++) scales[i] = 0.5 + Math.random();
    this.shapes.userData.scales = scales;

    this.group.add(this.shapes);

    // Inner Light to refract
    const light = new THREE.PointLight(0xffffff, 5, 10);
    this.group.add(light);

    // Add some ambient light/bg for refraction checks
    const wireGeo = new THREE.IcosahedronGeometry(6.0, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    this.group.add(new THREE.Mesh(wireGeo, wireMat));
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const t = ctx.time;
    const dt = Math.min(ctx.dt, 1 / 30);
    const scales = this.shapes.userData.scales;

    this.pointerPos.set(ctx.pointer.x * 10, ctx.pointer.y * 10, 0);
    this.physics.update(dt, this.pointerPos, 3.0);

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const x = this.physics.positions[idx];
      const y = this.physics.positions[idx + 1];
      const z = this.physics.positions[idx + 2];

      this.dummy.position.set(x, y, z);
      this.dummy.lookAt(0, 0, 0);
      this.dummy.rotateZ(t * 0.5 + i); // Spin

      const s = scales[i] * (1.0 + Math.sin(t * 2 + i) * 0.1);
      this.dummy.scale.set(s, s * 2, s);

      this.dummy.updateMatrix();
      this.shapes.setMatrixAt(i, this.dummy.matrix);
    }
    this.shapes.instanceMatrix.needsUpdate = true;

    // Interactive
    this.group.rotation.x = ctx.pointer.y * 0.1;
    this.group.rotation.y = ctx.pointer.x * 0.1;

    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Scene 07: Data Sculpture (Matrix Vortex) ---

class MatrixRainScene extends SceneBase {
  private mesh: THREE.InstancedMesh;
  private count = 2000;
  private dummy = new THREE.Object3D();

  constructor() {
    super();
    this.id = 'scene07';
    this.contentRadius = 8.0;

    // 1. Procedural Matrix Texture
    const size = 512;
    const cvs = document.createElement('canvas');
    cvs.width = size;
    cvs.height = size;
    const ctx = cvs.getContext('2d')!;

    // Black Bg
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    // Draw grid of characters
    const cols = 16;
    const rows = 16;
    const cell = size / cols;
    ctx.font = `bold ${cell * 0.8}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const chars = 'XYZ010101<>?#@&DATA';

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Varying green colors
        const hue = 120 + Math.random() * 20; // Matrix Green
        const lit = 40 + Math.random() * 60;
        ctx.fillStyle = `hsl(${hue}, 100%, ${lit}%)`;
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, x * cell + cell / 2, y * cell + cell / 2);
      }
    }

    const tex = new THREE.CanvasTexture(cvs);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;

    // 2. Geometry
    const geo = new THREE.PlaneGeometry(0.5, 0.5);

    // 3. Shader Material for Rain Effect
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMap: { value: tex },
        uPress: { value: 0 },
      },
      vertexShader: `
        attribute float aOffset;
        attribute float aSpeed;
        attribute float aRadius;

        varying vec2 vUv;
        varying float vAlpha;
        varying float vGlow;

        uniform float uTime;
        uniform float uPress;

        void main() {
            // Select random character from 16x16 grid based on time
            float t = uTime * 5.0 + aOffset * 10.0;
            float charIdx = floor(mod(t, 256.0));

            float cx = mod(charIdx, 16.0);
            float cy = floor(charIdx / 16.0);

            vUv = (uv + vec2(cx, cy)) / 16.0;

            // Waterfall motion
            float fall = uTime * aSpeed * 2.0;
            float y = 10.0 - mod(fall + aOffset * 20.0, 20.0);
            y -= 5.0; // range -5 to 5

            // Vortex twist
            float angle = aOffset * 6.28 + y * 0.5 * (1.0 + uPress * 2.0);
            float r = aRadius;

            // Expand on press
            r += smoothstep(0.0, 1.0, uPress) * 5.0 * sin(y * 2.0);

            vec3 pos = vec3(cos(angle)*r, y, sin(angle)*r);

            // Billboarding - face center
            vec3 center = vec3(0.0, y, 0.0);
            vec3 look = normalize(center - pos);
            vec3 right = cross(vec3(0.0, 1.0, 0.0), look);
            vec3 up = vec3(0.0, 1.0, 0.0);

            vec3 localPos = position.x * right + position.y * up;
            pos += localPos;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

            // Fade top/bottom
            vAlpha = smoothstep(5.0, 3.0, abs(y));

            // Glitch flash
            vGlow = step(0.95, fract(t * 0.1)) * 2.0;
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        varying vec2 vUv;
        varying float vAlpha;
        varying float vGlow;

        void main() {
            vec4 c = texture2D(uMap, vUv);
            if (c.r < 0.1 && c.g < 0.1 && c.b < 0.1) discard;
            vec3 color = c.rgb;
            color += vec3(1.0) * vGlow;
            gl_FragColor = vec4(color, vAlpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, this.count);

    const offsets = new Float32Array(this.count);
    const speeds = new Float32Array(this.count);
    const radii = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      offsets[i] = Math.random();
      speeds[i] = 1.0 + Math.random();
      radii[i] = 2.0 + Math.random() * 6.0;

      this.dummy.position.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.geometry.setAttribute(
      'aOffset',
      new THREE.InstancedBufferAttribute(offsets, 1)
    );
    this.mesh.geometry.setAttribute(
      'aSpeed',
      new THREE.InstancedBufferAttribute(speeds, 1)
    );
    this.mesh.geometry.setAttribute(
      'aRadius',
      new THREE.InstancedBufferAttribute(radii, 1)
    );

    this.group.add(this.mesh);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const t = ctx.time;
    const press = ctx.press;

    // Vortex Math
    // Since everything is in shader, we just need to update light rotation or camera ?
    // Actually the shader does the motion 'fall = uTime...'.

    // We update uniforms
    (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    (this.mesh.material as THREE.ShaderMaterial).uniforms.uPress.value = press;

    this.group.rotation.x = ctx.pointer.y * 0.2;
    this.group.rotation.z = ctx.pointer.x * 0.2;

    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Scene 08: Orbital Mechanics (Gravity) ---

class OrbitalMechanicsScene extends SceneBase {
  private debris: THREE.InstancedMesh;
  private planet: THREE.Mesh;
  private rings: THREE.Mesh;
  private count = 2000;
  private dummy = new THREE.Object3D();
  private physics: SimplePhysics;
  private pointerPos = new THREE.Vector3();

  constructor() {
    super();
    this.id = 'scene08';
    this.contentRadius = 8.0;

    // 1. Procedural Gas Giant
    const pGeo = new THREE.SphereGeometry(2.5, 64, 64);
    const pMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(0x884400) }, // Rust
        uColorB: { value: new THREE.Color(0xffcc88) }, // Sand
        uColorC: { value: new THREE.Color(0x442200) }, // Dark bands
        uSunDir: { value: new THREE.Vector3(1.0, 0.5, 1.0).normalize() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        uniform vec3 uSunDir;

        varying vec2 vUv;
        varying vec3 vNormal;

        // Noise
        float hash( float n ) { return fract(sin(n)*43758.5453123); }
        float noise( in vec2 x ) {
            vec2 p = floor(x);
            vec2 f = fract(x);
            f = f*f*(3.0-2.0*f);
            float n = p.x + p.y*57.0;
            return mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                       mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y);
        }

        float fbm( vec2 p ) {
            float f = 0.0;
            f += 0.50000*noise( p ); p = p*2.02;
            f += 0.25000*noise( p ); p = p*2.03;
            f += 0.12500*noise( p ); p = p*2.01;
            f += 0.06250*noise( p );
            return f;
        }

        void main() {
            // Turbulence pattern for storms
            vec2 p = vUv * vec2(10.0, 20.0); // Stretch horizontally
            float flow = uTime * 0.05;

            float n = fbm(p + vec2(flow, 0.0));
            // Banding
            float bands = sin(vUv.y * 20.0 + n * 2.0);

            vec3 col = mix(uColorA, uColorB, n);
            col = mix(col, uColorC, smoothstep(0.0, 1.0, abs(bands)));

            // Lighting
            float diff = max(dot(vNormal, uSunDir), 0.0);
            // Atmosphere rim
            float view = dot(vNormal, vec3(0.0, 0.0, 1.0));
            float rim = pow(1.0 - view, 4.0);

            vec3 final = col * (diff + 0.1) + vec3(0.5, 0.6, 1.0) * rim * 0.5;

            gl_FragColor = vec4(final, 1.0);
        }
      `,
    });
    this.planet = new THREE.Mesh(pGeo, pMat);
    this.group.add(this.planet);

    // 2. Main Ring
    const rGeo = new THREE.RingGeometry(3.5, 5.5, 128);
    const rMat = new THREE.MeshStandardMaterial({
      color: 0xaa8866,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      roughness: 0.8,
    });
    // Add texture noise manually or keep simple
    this.rings = new THREE.Mesh(rGeo, rMat);
    this.rings.rotation.x = Math.PI * 0.5;
    this.group.add(this.rings);

    // 3. Debris Field (Instanced)
    // Use low poly rocks
    const dGeo = new THREE.DodecahedronGeometry(0.1, 0);
    const dMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
    });
    this.debris = new THREE.InstancedMesh(dGeo, dMat, this.count);
    this.group.add(this.debris);

    // Init Physics
    this.physics = new SimplePhysics(this.count);
    this.physics.bounds.set(20, 20, 20); // Large bounds
    this.physics.friction = 0.999; // Low friction for space

    // Init positions data
    for (let i = 0; i < this.count; i++) {
      // Distribute in a thick belt
      const angle = Math.random() * Math.PI * 2;
      const dist = 3.5 + Math.random() * 4.5;
      const y = (Math.random() - 0.5) * 0.5 * (dist - 2.0); // Thicker at edges

      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      this.physics.initParticle(i, new THREE.Vector3(x, y, z), 0.1);

      // Orbital velocity calculation
      // v = sqrt(GM/r) direction tangent
      const GM = 0.01; // Fake gravity constant strength
      const speed = Math.sqrt(GM / dist) * 20.0; // Boosted for visual effect

      const tx = -z;
      const tz = x;
      const len = Math.sqrt(tx * tx + tz * tz);

      // Set previous pos to create velocity
      // p_prev = p - v * dt
      // assuming dt=1 approx for init
      this.physics.oldPositions[i * 3] = x - (tx / len) * speed * 0.5;
      this.physics.oldPositions[i * 3 + 1] = y;
      this.physics.oldPositions[i * 3 + 2] = z - (tz / len) * speed * 0.5;

      this.dummy.position.set(x, y, z);
      this.dummy.updateMatrix();
      this.debris.setMatrixAt(i, this.dummy.matrix);
    }

    // Sunlight
    const sun = new THREE.DirectionalLight(0xffffff, 2.0);
    sun.position.set(10, 5, 10);
    this.group.add(sun);

    const fill = new THREE.AmbientLight(0x222233, 0.5);
    this.group.add(fill);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const t = ctx.time;
    const dt = Math.min(ctx.dt, 1 / 30);

    // Planet Shader
    (this.planet.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

    // Pointer Gravity Well
    this.pointerPos.set(ctx.pointer.x * 12.0, ctx.pointer.y * 12.0, 0);

    // 1. Apply Central Gravity
    // F = G * m1 * m2 / r^2
    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const x = this.physics.positions[idx];
      const y = this.physics.positions[idx + 1];
      const z = this.physics.positions[idx + 2];

      // Distance to center
      const distSq = x * x + y * y + z * z + 0.1;
      const dist = Math.sqrt(distSq);

      // Gravity force
      const g = 0.005 / distSq;
      // Direction -normalized position
      const dx = -x / dist;
      const dy = -y / dist;
      const dz = -z / dist;

      this.physics.positions[idx] += dx * g;
      this.physics.positions[idx + 1] += dy * g;
      this.physics.positions[idx + 2] += dz * g;
    }

    // 2. Physics Step
    this.physics.update(dt, this.pointerPos, 5.0); // Repel radius 5.0

    // 3. Sync
    const sunDir = new THREE.Vector3(10, 5, 10).normalize();

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const x = this.physics.positions[idx];
      const y = this.physics.positions[idx + 1];
      const z = this.physics.positions[idx + 2];

      this.dummy.position.set(x, y, z);

      // Rotate rocks
      this.dummy.rotation.set(i + t, i * 2 + t, i * 3);

      this.dummy.scale.setScalar(0.8 + Math.sin(i) * 0.3);
      this.dummy.updateMatrix();
      this.debris.setMatrixAt(i, this.dummy.matrix);
    }
    this.debris.instanceMatrix.needsUpdate = true;

    // Interactive tilt
    this.group.rotation.x = 0.4 + ctx.pointer.y * 0.2;
    this.group.rotation.z = 0.2 + ctx.pointer.x * 0.2;

    // Planet rotates
    this.planet.rotation.y = t * 0.05;

    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Scene 09: Crystalline Shards (Ice/Glass) ---

class VoronoiShardsScene extends SceneBase {
  private shards: THREE.InstancedMesh;
  private count = 500;
  private dummy = new THREE.Object3D();

  constructor() {
    super();
    this.id = 'scene09';
    this.contentRadius = 6.0;

    // Diamond/Ice Shards
    const geo = new THREE.TetrahedronGeometry(0.5, 0); // Smaller base size, shards

    // High-fi glass material
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xaaccff,
      emissive: 0x001133,
      transmission: 1.0,
      opacity: 1.0,
      metalness: 0.1,
      roughness: 0.05,
      ior: 1.6,
      thickness: 1.5,
      envMapIntensity: 2.0,
      side: THREE.DoubleSide,
    });
    // @ts-expect-error - dispersion is new in r160+ but likely available in recent types
    mat.dispersion = 0.05;

    this.shards = new THREE.InstancedMesh(geo, mat, this.count);
    this.shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.shards);
  }

  updateShard(i: number, t: number, press: number) {
    const offset = i * 0.1352;

    // Fibonacci Spiral Sphere distribution
    const phi = Math.acos(1 - (2 * (i + 0.5)) / this.count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

    let r = 3.5;

    // "Breathing" radius
    r += Math.sin(t * 0.5 + phi * 4.0) * 0.5;

    // Explosion on press
    r += press * 5.0 * Math.random();

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    this.dummy.position.set(x, y, z);

    // Continuous tumbling
    this.dummy.rotation.set(t * 0.5 + offset, t * 0.3 + offset, 0);

    // Scale variation
    const s = 0.5 + Math.sin(offset * 10.0) * 0.2;
    this.dummy.scale.setScalar(s);
    // Stretch along one axis for "shard" look
    this.dummy.scale.y *= 2.0;

    this.dummy.updateMatrix();
    this.shards.setMatrixAt(i, this.dummy.matrix);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    for (let i = 0; i < this.count; i++) {
      this.updateShard(i, ctx.time, ctx.press);
    }
    this.shards.instanceMatrix.needsUpdate = true;

    this.group.rotation.y = ctx.time * 0.1;

    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Scene 10: Optical Moiré (Interference) ---

class MoireInterferenceScene extends SceneBase {
  private mesh: THREE.Mesh;

  constructor() {
    super();
    this.id = 'scene10';
    this.contentRadius = 6.0;

    const geo = new THREE.PlaneGeometry(12, 12);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPress: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uPress;
        varying vec2 vUv;

        float circle(vec2 uv, float scale, float offset) {
            float d = length(uv - 0.5);
            // Sharp rings
            return step(0.5, sin(d * scale - offset));
        }

        void main() {
            vec2 uv = vUv;

            float scaleBase = 150.0;

            // Layer 1
            float c1 = circle(uv, scaleBase, uTime * 5.0);

            // Layer 2 - Offset
            vec2 off = vec2(sin(uTime * 0.7) * 0.02, cos(uTime * 0.5) * 0.02);
            // Expansion on press
            float scale2 = scaleBase * (1.0 + uPress * 0.2);
            float c2 = circle(uv - off, scale2, uTime * 5.5);

            // Interference
            float i = abs(c1 - c2); // XOR pattern

            // Colorize
            vec3 col = vec3(0.0);
            col += vec3(0.0, 1.0, 1.0) * c1 * 0.5;
            col += vec3(1.0, 0.0, 1.0) * c2 * 0.5;
            col += vec3(1.0, 1.0, 1.0) * i; // White interference ridges

            // Vignette mask
            float d = length(uv - 0.5);
            float alpha = smoothstep(0.5, 0.3, d);

            gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.group.add(this.mesh);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const mat = this.mesh.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = ctx.time;
    mat.uniforms.uPress.value = ctx.press;

    // Tilt slightly
    this.group.rotation.x = Math.sin(ctx.time * 0.3) * 0.2;
    this.group.rotation.y = Math.cos(ctx.time * 0.2) * 0.2;

    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Scene 11: Neural Network (Deep Learning) ---

class NeuralNetworkScene extends SceneBase {
  private nodes: THREE.InstancedMesh;
  private connections: THREE.LineSegments;
  private nodeCount = 200;

  constructor() {
    super();
    this.id = 'scene11';
    this.contentRadius = 6.0;

    // 1. Nodes (Neurons)
    const nodeGeo = new THREE.IcosahedronGeometry(0.15, 1);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.8,
    });
    this.nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, this.nodeCount);

    // Position nodes in a 3D blob
    const positions = new Float32Array(this.nodeCount * 3);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.nodeCount; i++) {
      // Random spherical cloud
      const r = Math.pow(Math.random(), 0.33) * 5.0; // Uniform sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      this.nodes.setMatrixAt(i, dummy.matrix);
    }
    this.group.add(this.nodes);

    // 2. Connections (Synapses)
    const linePos = [];
    // Limit connections to avoid messy hairball
    for (let i = 0; i < this.nodeCount; i++) {
      const p1 = new THREE.Vector3(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      let connectionsFound = 0;

      for (let j = i + 1; j < this.nodeCount; j++) {
        const p2 = new THREE.Vector3(
          positions[j * 3],
          positions[j * 3 + 1],
          positions[j * 3 + 2]
        );
        const dist = p1.distanceTo(p2);

        if (dist < 1.8 && connectionsFound < 4) {
          linePos.push(p1.x, p1.y, p1.z);
          linePos.push(p2.x, p2.y, p2.z);
          connectionsFound++;
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePos, 3)
    );

    const lineMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x00aaff) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `
            varying vec3 vPos;
            void main() {
                vPos = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
      fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            varying vec3 vPos;

            void main() {
                // Signal pulses
                float pulse = sin(vPos.x * 2.0 + vPos.y * 3.0 + uTime * 4.0);
                pulse = smoothstep(0.8, 1.0, pulse);

                float alpha = 0.1 + pulse * 0.9;
                gl_FragColor = vec4(uColor, alpha);
            }
        `,
    });

    this.connections = new THREE.LineSegments(lineGeo, lineMat);
    this.group.add(this.connections);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    // Gentle rotation
    this.group.rotation.y = ctx.time * 0.05;

    const lMat = this.connections.material as THREE.ShaderMaterial;
    lMat.uniforms.uTime.value = ctx.time;

    // Pulse nodes randomly
    const t = ctx.time;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.nodeCount; i++) {
      this.nodes.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      // Breathing scale
      const noise = Math.sin(t * 2.0 + i);
      const s = 1.0 + noise * 0.2 + (noise > 0.8 ? 0.5 : 0.0);

      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      this.nodes.setMatrixAt(i, dummy.matrix);
    }
    this.nodes.instanceMatrix.needsUpdate = true;

    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Scene 12: Library (Knowledge) ---

class LibraryScene extends SceneBase {
  private books: THREE.InstancedMesh;
  private count = 400;
  private dummy = new THREE.Object3D();
  private physics: SimplePhysics;
  private pointerPos = new THREE.Vector3();

  constructor() {
    super();
    this.id = 'scene12';
    this.contentRadius = 6.0;

    const geo = new THREE.BoxGeometry(0.2, 1.0, 0.7);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.6,
    });
    this.books = new THREE.InstancedMesh(geo, mat, this.count);

    this.physics = new SimplePhysics(this.count);
    this.physics.bounds.set(8, 6, 8);
    this.physics.friction = 0.95; // Floaty

    for (let i = 0; i < this.count; i++) {
      // Spiral
      const angle = i * 0.1;
      const r = 2 + i * 0.01;
      const h = (i - this.count / 2) * 0.05;

      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      this.physics.initParticle(i, new THREE.Vector3(x, h, z), 0.5);

      this.dummy.position.set(x, h, z);
      this.dummy.lookAt(0, h, 0);
      this.dummy.updateMatrix();
      this.books.setMatrixAt(i, this.dummy.matrix);

      // Random color per book
      this.books.setColorAt(
        i,
        new THREE.Color().setHSL(Math.random(), 0.6, 0.5)
      );
    }
    this.group.add(this.books);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const dt = Math.min(ctx.dt, 1 / 30);
    this.pointerPos.set(ctx.pointer.x * 10, ctx.pointer.y * 10, 0);
    this.physics.update(dt, this.pointerPos, 3.0);

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const x = this.physics.positions[idx];
      const y = this.physics.positions[idx + 1];
      const z = this.physics.positions[idx + 2];

      this.dummy.position.set(x, y, z);
      // Slowly rotate
      this.dummy.rotation.set(0, (x + z) * 0.2, 0);

      this.dummy.updateMatrix();
      this.books.setMatrixAt(i, this.dummy.matrix);
    }
    this.books.instanceMatrix.needsUpdate = true;

    this.group.rotation.y = ctx.time * 0.05 + ctx.pointer.x; // Slow scroll
    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Scene 13: Deep Abyss (Underworld) ---

class BioluminescentScene extends SceneBase {
  private strands: THREE.Mesh;
  private count = 3000;

  constructor() {
    super();
    this.id = 'scene13';
    this.contentRadius = 6.0;
    this.baseDistance = 15.0; // Further back

    // "Anemone" Strands using GPU compute-style shader on a mesh
    // We use a long thin box/plane for each strand
    const segs = 20;
    const strandGeo = new THREE.PlaneGeometry(0.1, 5.0, 1, segs);
    strandGeo.translate(0, 2.5, 0); // Pivot at bottom

    const geo = new THREE.InstancedBufferGeometry();
    geo.index = strandGeo.index;
    geo.attributes.position = strandGeo.attributes.position;
    geo.attributes.uv = strandGeo.attributes.uv;

    // Instanced attributes
    const offsets = new Float32Array(this.count * 3);
    const data = new Float32Array(this.count * 3); // phase, length, bend

    for (let i = 0; i < this.count; i++) {
      // Base sphere
      const r = 2.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      offsets[i * 3] = x;
      offsets[i * 3 + 1] = y;
      offsets[i * 3 + 2] = z;

      data[i * 3] = Math.random(); // Phase
      data[i * 3 + 1] = 0.5 + Math.random(); // Length multiplier
      data[i * 3 + 2] = Math.random(); // Bend flexibility
    }

    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
    geo.setAttribute('aData', new THREE.InstancedBufferAttribute(data, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPress: { value: 0 },
        uColor: { value: new THREE.Color(0x00ff88) },
        uColorB: { value: new THREE.Color(0x0044ff) },
      },
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexShader: `
            uniform float uTime;
            uniform float uPress;
            attribute vec3 aOffset;
            attribute vec3 aData;

            varying float vProgress;
            varying float vAlpha;

            // Simplex-ish noise
            vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
            float snoise(vec2 v){
              const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
              vec2 i  = floor(v + dot(v, C.yy) );
              vec2 x0 = v - i + dot(i, C.xx);
              vec2 i1;
              i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
              vec4 x12 = x0.xyxy + C.xxzz;
              x12.xy -= i1;
              i = mod(i, 289.0);
              vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
              + i.x + vec3(0.0, i1.x, 1.0 ));
              vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
              m = m*m ;
              m = m*m ;
              vec3 x = 2.0 * fract(p * C.www) - 1.0;
              vec3 h = abs(x) - 0.5;
              vec3 ox = floor(x + 0.5);
              vec3 a0 = x - ox;
              m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
              vec3 g;
              g.x  = a0.x  * x0.x  + h.x  * x0.y;
              g.yz = a0.yz * x12.xz + h.yz * x12.yw;
              return 130.0 * dot(m, g);
            }

            void main() {
                vProgress = uv.y;

                // Base position on sphere
                vec3 basePos = aOffset;
                vec3 normal = normalize(basePos);

                // Rotate local position
                vec3 localPos = position;
                // Extend length
                localPos.y *= aData.y;

                // Apply curl noise movement to the tip
                float t = uTime * 0.5 + aData.x;

                // Bend amount increases with Y (tip moves more)
                float bend = smoothstep(0.0, 5.0, localPos.y) * aData.z * 2.0;

                // Add "Press" repulsion
                bend += uPress * 2.0 * vProgress;

                // Simplified rotation: just add normal * y + noise
                vec3 tip = basePos + normal * localPos.y;

                // Add noise offset to tip (curl)
                tip += vec3(
                    sin(t + basePos.y),
                    cos(t + basePos.z),
                    sin(t * 1.2 + basePos.x)
                ) * bend;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(tip, 1.0);

                vAlpha = smoothstep(0.0, 0.2, vProgress) * (1.0 - vProgress);
            }
        `,
      fragmentShader: `
            uniform vec3 uColor;
            uniform vec3 uColorB;
            varying float vProgress;
            varying float vAlpha;

            void main() {
                vec3 c = mix(uColor, uColorB, vProgress);
                gl_FragColor = vec4(c, vAlpha);
            }
        `,
    });

    this.strands = new THREE.Mesh(geo, mat);
    this.group.add(this.strands);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const mat = this.strands.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = ctx.time;
    mat.uniforms.uPress.value = ctx.press;

    this.group.rotation.y = ctx.time * 0.05;

    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Scene 14: Cyber City (Network) ---

class HolographicCityScene extends SceneBase {
  private city: THREE.Group;
  private traffic: THREE.InstancedMesh;
  private buildingsSolid: THREE.InstancedMesh;
  private buildingsWire: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private trafficCount = 4000;

  constructor() {
    super();
    this.id = 'scene14';
    this.contentRadius = 8.0;
    this.city = new THREE.Group();

    // 1. Buildings (Instanced Grid)
    const bGeo = new THREE.BoxGeometry(0.8, 1, 0.8);
    // Move pivot to bottom
    bGeo.translate(0, 0.5, 0);

    // Dark Glass Material
    const bMatSolid = new THREE.MeshPhysicalMaterial({
      color: 0x050510,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      transmission: 0.2, // Slight transparency
      transparent: true,
      opacity: 0.9,
    });

    // Neon Edges Material
    const bMatWire = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });

    this.buildingsSolid = new THREE.InstancedMesh(bGeo, bMatSolid, 1200);
    this.buildingsWire = new THREE.InstancedMesh(bGeo, bMatWire, 1200);

    let idx = 0;
    for (let x = -15; x <= 15; x++) {
      for (let z = -15; z <= 15; z++) {
        if (Math.abs(x) < 2 && Math.abs(z) < 2) continue; // Clear center for camera
        if (Math.random() > 0.35) continue; // Sparse
        if (idx >= 1200) break;

        const h = 2.0 + Math.pow(Math.random(), 3.0) * 18.0; // Exponential height dist
        this.dummy.position.set(x * 2.0, -5, z * 2.0);
        this.dummy.scale.set(1, h, 1);
        this.dummy.updateMatrix();

        this.buildingsSolid.setMatrixAt(idx, this.dummy.matrix);
        // Slightly scale up wireframe to avoid z-fighting
        this.dummy.scale.set(1.02, h, 1.02);
        this.dummy.updateMatrix();
        this.buildingsWire.setMatrixAt(idx, this.dummy.matrix);
        idx++;
      }
    }
    this.city.add(this.buildingsSolid);
    this.city.add(this.buildingsWire);

    // 2. Traffic (Flying cars / Data packets)
    const tGeo = new THREE.BoxGeometry(0.06, 0.06, 1.2);
    const tMat = new THREE.MeshBasicMaterial({
      color: 0xff0088,
      blending: THREE.AdditiveBlending,
    });
    this.traffic = new THREE.InstancedMesh(tGeo, tMat, this.trafficCount);

    const tData = new Float32Array(this.trafficCount * 4); // x, y, z, axis(0=x, 1=z)

    for (let i = 0; i < this.trafficCount; i++) {
      const axis = Math.random() > 0.5 ? 0 : 1;
      // Align to grid
      const lane = Math.floor((Math.random() - 0.5) * 30) * 2.0;
      const height = -4.0 + Math.random() * 12.0;
      const offset = (Math.random() - 0.5) * 60.0;

      tData[i * 4] = lane; // Fixed coordinate
      tData[i * 4 + 1] = height; // Y
      tData[i * 4 + 2] = offset; // Moving coordinate
      tData[i * 4 + 3] = axis; // Direction

      // Randomize color per car
      const col = new THREE.Color().setHSL(0.8 + Math.random() * 0.2, 1.0, 0.6);
      this.traffic.setColorAt(i, col);
    }
    this.traffic.geometry.setAttribute(
      'aDat',
      new THREE.InstancedBufferAttribute(tData, 4)
    );
    this.city.add(this.traffic);

    this.group.add(this.city);

    // Fog
    // Note: We can't easily add global fog to just one scene without affecting others if we used scene.fog
    // But we can approximate it with a large semi-transparent plane or just rely on the background color.
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    this.group.rotation.y = ctx.time * 0.05;

    // Traffic Flow
    const tData = (
      this.traffic.geometry.getAttribute(
        'aDat'
      ) as THREE.InstancedBufferAttribute
    ).array;

    for (let i = 0; i < this.trafficCount; i++) {
      const lane = tData[i * 4];
      const h = tData[i * 4 + 1];
      let pos = tData[i * 4 + 2];
      const axis = tData[i * 4 + 3];

      // Move
      const speed = 15.0 * ctx.dt * (1.0 + ctx.press * 4.0);
      pos += speed * (i % 2 == 0 ? 1 : -1);

      // Wrap
      if (pos > 30) pos -= 60;
      if (pos < -30) pos += 60;

      tData[i * 4 + 2] = pos;

      if (axis === 0) {
        this.dummy.position.set(pos, h, lane);
        this.dummy.rotation.set(0, Math.PI / 2, 0);
      } else {
        this.dummy.position.set(lane, h, pos);
        this.dummy.rotation.set(0, 0, 0);
      }
      this.dummy.updateMatrix();
      this.traffic.setMatrixAt(i, this.dummy.matrix);
    }
    this.traffic.instanceMatrix.needsUpdate = true;

    // Camera Flyover
    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.position.y = damp(
      this.camera.position.y,
      4 + ctx.press * 10,
      2,
      ctx.dt
    );
    this.camera.lookAt(0, -2, 0);
  }
}

// --- Scene 15: Reality Collapse (Entropy) ---

class RealityCollapseScene extends SceneBase {
  private points: THREE.Points;
  private count = 30000;

  constructor() {
    super();
    this.id = 'scene15';
    this.contentRadius = 6.0;

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.count * 3);
    const data = new Float32Array(this.count * 3); // initial_radius, theta, phi

    for (let i = 0; i < this.count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3.0; // Surface of sphere

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      data[i * 3] = r;
      data[i * 3 + 1] = theta;
      data[i * 3 + 2] = phi;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aData', new THREE.BufferAttribute(data, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPress: { value: 0 },
        uPointer: { value: new THREE.Vector2() },
      },
      vertexShader: `
            uniform float uTime;
            uniform float uPress;
            uniform vec2 uPointer;
            attribute vec3 aData;
            varying float vGlow;

            // Simplex noise
            vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
            float snoise(vec2 v){
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod(i, 289.0);
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m; m = m*m;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            void main() {
                float r = aData.x;
                float theta = aData.y;
                float phi = aData.z;

                // Base position
                vec3 p = position;

                // Chaos field
                float noise = snoise(vec2(theta * 5.0 + uTime, phi * 5.0));

                // Explode outwards
                float displacement = noise * 2.0 * (0.1 + uPress * 3.0);

                // Pointer interaction (Repel)
                float d = distance(p.xy, uPointer * 10.0);
                displacement += smoothstep(5.0, 0.0, d) * 3.0;

                p += normalize(p) * displacement;

                // Add some rotation turbulence
                float t = uTime * 0.5;
                float x = p.x; float z = p.z;
                p.x = x * cos(t) - z * sin(t);
                p.z = x * sin(t) + z * cos(t);

                vec4 mv = modelViewMatrix * vec4(p, 1.0);
                gl_Position = projectionMatrix * mv;
                gl_PointSize = (3.0 + displacement * 5.0) * (20.0 / -mv.z);

                vGlow = 0.5 + noise * 0.5;
            }
        `,
      fragmentShader: `
            varying float vGlow;
            void main() {
                if(length(gl_PointCoord - 0.5) > 0.5) discard;
                gl_FragColor = vec4(1.0, 0.2, 0.1, vGlow); // Red-Orange-Void
            }
        `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(geo, mat);
    this.group.add(this.points);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const mat = this.points.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = ctx.time;
    mat.uniforms.uPress.value = ctx.press;
    mat.uniforms.uPointer.value.set(ctx.pointer.x, ctx.pointer.y);

    this.group.rotation.y = ctx.time * 0.1;

    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      3,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}

// --- Factory ---

export const createScenes = (): TowerScene[] => [
  new FeedbackForgeScene(),
  new LiquidMetalScene(),
  new MillionFirefliesScene(),
  new RibbonFieldScene(),
  new AuroraCurtainScene(),
  new EventHorizonScene(),
  new KaleidoGlassScene(),
  new MatrixRainScene(),
  new OrbitalMechanicsScene(),
  new VoronoiShardsScene(),
  new MoireInterferenceScene(),
  new NeuralNetworkScene(),
  new LibraryScene(),
  new BioluminescentScene(),
  new HolographicCityScene(),
  new RealityCollapseScene(),
];

export const getSceneMeta = () => sceneMeta;
