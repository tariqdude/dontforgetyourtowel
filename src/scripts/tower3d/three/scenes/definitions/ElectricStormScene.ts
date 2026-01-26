import * as THREE from 'three';
import { SceneBase } from './SceneBase';
import type { SceneRuntime } from './types';
import { damp } from './SceneUtils';

/**
 * Scene 16: Ethereal Storm
 * Replaces old lightning scene with interactive moving "smoke/fabric".
 * High-density plane displaced by noise that reacts to pointer.
 */
export class ElectricStormScene extends SceneBase {
  private fabric: THREE.Mesh;
  private pointerTarget: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    super();
    this.id = 'scene16';
    this.contentRadius = 10.0;
    this.baseDistance = 12.0;

    // High density plane for vertex displacement
    const geo = new THREE.PlaneGeometry(25, 25, 128, 128);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uColorA: { value: new THREE.Color(0x8800ff) }, // Purple
        uColorB: { value: new THREE.Color(0x00ccff) }, // Cyan
        uColorC: { value: new THREE.Color(0xffffff) }, // White core
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false, // Smoke-like
      vertexShader: `
        uniform float uTime;
        uniform vec2 uPointer;
        varying vec2 vUv;
        varying float vElev;
        varying float vProx;

        // Simplex Noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
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
            vUv = uv;

            // Flowing wind
            float t = uTime * 0.5;
            float noise = snoise(uv * 3.0 + vec2(t * 0.2, t * 0.1));
            
            // Pointer Interaction
            // Map uPointer (-1..1) to Plane Space (-12.5..12.5)
            vec2 ptrPos = uPointer * 12.0; 
            float dist = distance(position.xy, ptrPos);
            
            // Ripple / Bubble up at mouse
            float proximity = smoothstep(5.0, 0.0, dist);
            vProx = proximity; // Pass to frag

            float height = noise * 2.0;
            
            // Add interaction swell
            height += proximity * 4.0 * sin(uTime * 3.0 - dist * 2.0);

            vec3 pos = position;
            pos.z += height;

            vElev = height;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        uniform float uTime;
        varying vec2 vUv;
        varying float vElev;
        varying float vProx;

        void main() {
            // Smoke texture approx via noise (displacement)
            // Color ramp
            float mixVal = smoothstep(-2.0, 4.0, vElev);
            
            vec3 col = mix(uColorA, uColorB, mixVal);
            
            // White hot core where mouse is
            col = mix(col, uColorC, vProx * 0.8);

            // Cloud Mask
            // Fade edges
            float alpha = 1.0 - smoothstep(0.4, 0.5, abs(vUv.x - 0.5));
            alpha *= 1.0 - smoothstep(0.4, 0.5, abs(vUv.y - 0.5));

            // Internal transparency changes
            float internalAlpha = 0.4 + 0.4 * smoothstep(-1.0, 3.0, vElev);

            gl_FragColor = vec4(col, alpha * internalAlpha);
        }
      `,
    });

    this.fabric = new THREE.Mesh(geo, mat);
    // Rotate to face camera roughly? No, let's keep it flat on Z=0, camera defaults to Z look.
    // Actually our SceneBase defaults camera to +Z looking at 0,0,0.
    // So plane XY is perfect.
    this.group.add(this.fabric);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const mat = this.fabric.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = ctx.time;

    // Smooth pointer tracking
    // ctx.pointer is -1..1 normalized screen space
    // We pass it directly and handle mapping in shader
    mat.uniforms.uPointer.value.set(ctx.pointer.x, ctx.pointer.y);

    // Gently rock the camera
    this.camera.position.z = damp(
      this.camera.position.z,
      this.baseDistance,
      2,
      ctx.dt
    );
    this.camera.position.x = Math.sin(ctx.time * 0.2) * 2.0;
    this.camera.lookAt(0, 0, 0);
  }
}
