import * as THREE from 'three';
import { SceneBase } from './SceneBase';
import type { SceneRuntime } from './types';
import { damp } from './SceneUtils';

/**
 * Scene 13: Bioluminescent Abyss
 * Replaces the old broken scene with a procedural "Deep Sea Core"
 * A deforming, iridescent sphere that reacts to sound/motion, surrounded by floating organic particles.
 */
export class BioluminescentScene extends SceneBase {
  private core: THREE.Mesh;
  private particles: THREE.InstancedMesh;
  private count = 2000;
  private dummy = new THREE.Object3D();

  constructor() {
    super();
    this.id = 'scene13';
    this.contentRadius = 6.0;
    this.baseDistance = 14.0;

    // 1. Central "Living" Core
    const coreGeo = new THREE.IcosahedronGeometry(3.0, 60); // High poly for displacement
    const coreMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHover: { value: 0 }, // Pointer interaction
      },
      wireframe: false,
      vertexShader: `
        uniform float uTime;
        uniform float uHover;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying float vDisp;

         // Simplex 3D Noise
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

        float snoise(vec3 v){
            const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
            const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i  = floor(v + dot(v, C.yyy) );
            vec3 x0 = v - i + dot(i, C.xxx) ;
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min( g.xyz, l.zxy );
            vec3 i2 = max( g.xyz, l.zxy );
            vec3 x1 = x0 - i1 + 1.0 * C.xxx;
            vec3 x2 = x0 - i2 + 2.0 * C.xxx;
            vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
            i = mod(i, 289.0 );
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
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
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
            vUv = uv;
            vNormal = normal;

            // Organic Pulse
            float t = uTime * 0.5;
            float noise = snoise(position + t);
            float pulse = snoise(position * 0.5 - t * 0.2);

            float interaction = uHover * sin(position.x * 10.0 + uTime * 10.0) * 0.5;

            float displacement = noise * 0.5 + pulse * 1.0 + interaction;
            vDisp = displacement;

            vec3 pos = position + normal * displacement;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying float vDisp;
        uniform float uTime;

        void main() {
            // Bio-luminescent colors
            vec3 deepBlue = vec3(0.0, 0.1, 0.4);
            vec3 cyan = vec3(0.0, 0.8, 0.9);
            vec3 hotPink = vec3(1.0, 0.1, 0.6);

            // Color mix based on displacement
            float mixVal = smoothstep(-0.5, 1.0, vDisp);
            vec3 col = mix(deepBlue, cyan, mixVal);

            // Highlights on "peaks"
            col = mix(col, hotPink, smoothstep(0.8, 1.2, vDisp));

            // Rim light
            vec3 n = normalize(vNormal);
            // Simple view dir approx (assuming camera at z)
            float rim = 1.0 - abs(n.z);
            rim = pow(rim, 3.0);

            col += rim * vec3(0.5, 0.8, 1.0);

            gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    // 2. Floating Plankton (Particles)
    const pGeo = new THREE.DodecahedronGeometry(0.05, 0);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xccffaa,
      transparent: true,
      opacity: 0.6,
    });
    this.particles = new THREE.InstancedMesh(pGeo, pMat, this.count);

    // Distribute in a shell
    for (let i = 0; i < this.count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 5.0 + Math.random() * 5.0; // Outside core

      this.dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      this.dummy.scale.setScalar(0.5 + Math.random());
      this.dummy.updateMatrix();
      this.particles.setMatrixAt(i, this.dummy.matrix);
    }
    this.group.add(this.particles);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const mat = this.core.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = ctx.time;
    // Map pointer distance to hover intensity
    const dist = ctx.pointer.length();
    mat.uniforms.uHover.value = damp(
      mat.uniforms.uHover.value,
      (1.0 - Math.min(dist, 1.0)) * ctx.press,
      5,
      ctx.dt
    );

    // Gentle rotation
    this.group.rotation.y = ctx.time * 0.1;
    this.particles.rotation.y = -ctx.time * 0.05;

    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      2,
      ctx.dt
    );
    this.camera.lookAt(0, 0, 0);
  }
}
