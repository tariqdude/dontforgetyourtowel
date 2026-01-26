import * as THREE from 'three';
import { SceneBase } from './SceneBase';
import type { SceneRuntime } from './types';
import { damp } from './SceneUtils';

/**
 * Scene 17: Cyber Porsche GT3 Concept
 * A procedurally modeled high-performance race car.
 * Uses shaped extrusions to match the iconic 911 silhouette.
 */
export class PorscheScene extends SceneBase {
  private carGroup: THREE.Group;
  private wheels: THREE.Mesh[] = [];
  private grid: THREE.GridHelper;
  private speed = 0;

  constructor() {
    super();
    this.id = 'scene17';
    this.contentRadius = 8.0;
    this.baseDistance = 10.0;

    this.carGroup = new THREE.Group();
    this.group.add(this.carGroup);

    // --- Materials ---
    const paintMat = new THREE.MeshPhysicalMaterial({
      color: 0xcccccc, // GT Silver Metallic
      metalness: 0.6,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide,
    });

    // Carbon Fiber (Approx)
    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.8,
      metalness: 0.5,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      metalness: 0.9,
      roughness: 0.0,
      transmission: 0.5,
      transparent: true,
    });

    // --- 1. The Silhouette (Side Profile Extrusion) ---
    // Modeled around 4.5m length
    const shape = new THREE.Shape();
    // Start Bottom Front (Bumper)
    shape.moveTo(2.2, 0.2);
    // Nose
    shape.lineTo(2.3, 0.4);
    shape.lineTo(1.8, 0.75); // Hood start
    // Hood to Windshield Base
    shape.lineTo(0.8, 0.85);
    // Windshield to Roof
    shape.lineTo(0.2, 1.35); // Roof peak
    // Roof to Rear Deck (The "Flyline")
    shape.lineTo(-0.5, 1.32);
    // Fastback Slope
    shape.lineTo(-1.8, 0.8);
    // Ducktail / Rear End
    shape.lineTo(-2.2, 0.65);
    shape.lineTo(-2.25, 0.3); // Bumpers
    shape.lineTo(-2.1, 0.2); // Diffuser area
    // Underbody
    shape.lineTo(-0.9, 0.2); // Rear Wheel Well start
    // Rear Wheel Arch (Cutout)
    const rWheelR = 0.38;
    shape.absarc(-1.3, 0.35, rWheelR, 0, Math.PI, true);

    shape.lineTo(0.9, 0.2); // Side skirt
    // Front Wheel Arch
    const fWheelR = 0.36;
    shape.absarc(1.3, 0.35, fWheelR, 0, Math.PI, true);

    shape.lineTo(2.2, 0.2); // Close

    // Extrude Settings
    const extrudeSettings = {
      steps: 1,
      depth: 1.6, // Width (0.8 each side centered later)
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 4,
    };

    const bodyGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    bodyGeo.center(); // Center at origin

    const body = new THREE.Mesh(bodyGeo, paintMat);
    this.carGroup.add(body);

    // --- 2. Wide Hips (Rear Fenders) ---
    // Porsche hips are wider than the cabin
    // We add side pods to represent the wide rear track
    const hipShape = new THREE.Shape();
    hipShape.moveTo(-0.5, 0.2);
    hipShape.lineTo(0.8, 0.2);
    hipShape.lineTo(0.6, 0.7); // Top of fender line
    hipShape.quadraticCurveTo(0.0, 0.9, -0.8, 0.75);
    hipShape.lineTo(-0.8, 0.2);

    const hipGeo = new THREE.ExtrudeGeometry(hipShape, {
      depth: 0.4,
      bevelEnabled: true,
      bevelSize: 0.1,
      bevelThickness: 0.1,
    });
    const leftHip = new THREE.Mesh(hipGeo, paintMat);
    leftHip.rotation.y = Math.PI; // Flip for left
    leftHip.position.set(-0.8, 0.35, -0.6); // Adjust to rear wheel pos
    // this.carGroup.add(leftHip); // Shapes are hard to align perfectly without tools.

    // Alternative Fenders: Scaled Capsules/Spheres
    // Front Fenders
    const fFenderGeo = new THREE.CapsuleGeometry(0.35, 0.8, 4, 16);
    // Rotate to align along length
    fFenderGeo.rotateZ(Math.PI * 0.5);

    const flFender = new THREE.Mesh(fFenderGeo, paintMat);
    flFender.position.set(1.3, 0.6, 0.75);
    flFender.scale.set(1.0, 1.0, 0.6); // Flatten
    this.carGroup.add(flFender);

    const frFender = new THREE.Mesh(fFenderGeo, paintMat);
    frFender.position.set(1.3, 0.6, -0.75);
    frFender.scale.set(1.0, 1.0, 0.6);
    this.carGroup.add(frFender);

    // Rear Hips (Wider, Muscular)
    const rFenderGeo = new THREE.CapsuleGeometry(0.42, 1.2, 4, 16);
    rFenderGeo.rotateZ(Math.PI * 0.5);

    const rlFender = new THREE.Mesh(rFenderGeo, paintMat);
    rlFender.position.set(-1.3, 0.7, 0.85); // Wider stance
    rlFender.rotation.y = -0.1; // Taper in
    this.carGroup.add(rlFender);

    const rrFender = new THREE.Mesh(rFenderGeo, paintMat);
    rrFender.position.set(-1.3, 0.7, -0.85);
    rrFender.rotation.y = 0.1;
    this.carGroup.add(rrFender);

    // --- 3. The Swan Neck Wing ---
    // Uprights
    const uprightGeo = new THREE.BoxGeometry(0.4, 0.6, 0.05);
    uprightGeo.translate(-0.1, 0.3, 0);
    // Skew them back
    const skewMat = new THREE.Matrix4().makeShear(0, 0, 0.5, 0, 0, 0); // Shear X based on Y
    uprightGeo.applyMatrix4(skewMat);

    const lUpright = new THREE.Mesh(uprightGeo, carbonMat);
    lUpright.position.set(-1.8, 0.75, 0.3);
    this.carGroup.add(lUpright);

    const rUpright = new THREE.Mesh(uprightGeo, carbonMat);
    rUpright.position.set(-1.8, 0.75, -0.3);
    this.carGroup.add(rUpright);

    // Main Wing Foil (Airfoil shape approximation)
    const foilShape = new THREE.Shape();
    foilShape.moveTo(0, 0);
    foilShape.quadraticCurveTo(0.2, 0.05, 0.4, 0); // Top camber
    foilShape.lineTo(0.4, -0.02);
    foilShape.quadraticCurveTo(0.2, -0.05, 0, -0.02); // Bottom camber

    const foilGeo = new THREE.ExtrudeGeometry(foilShape, {
      depth: 1.8,
      bevelEnabled: false,
    });
    foilGeo.rotateY(Math.PI * 0.5); // Align across car
    foilGeo.translate(0, 0, -0.9); // Center

    const wing = new THREE.Mesh(foilGeo, carbonMat);
    wing.position.set(-1.95, 1.35, 0);
    wing.rotation.z = -0.1; // Angle of attack
    this.carGroup.add(wing);

    // Endplates
    const endGeo = new THREE.BoxGeometry(0.5, 0.25, 0.02);
    const lEnd = new THREE.Mesh(endGeo, carbonMat);
    lEnd.position.set(-1.95, 1.35, 0.9);
    this.carGroup.add(lEnd);

    const rEnd = new THREE.Mesh(endGeo, carbonMat);
    rEnd.position.set(-1.95, 1.35, -0.9);
    this.carGroup.add(rEnd);

    // --- 4. Lights & Details ---

    // Iconic Circular Headlights (Glass Dome + Emissive Ring)
    // Sunk into the front fenders
    const hlGeo = new THREE.SphereGeometry(
      0.18,
      32,
      16,
      0,
      Math.PI * 2,
      0,
      0.6
    );
    hlGeo.rotateX(-Math.PI * 0.5);
    const hlMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      roughness: 0,
      thickness: 0.1,
    });

    const lHL = new THREE.Mesh(hlGeo, hlMat);
    lHL.position.set(1.8, 0.65, 0.65);
    lHL.rotation.x = -0.3; // Tilt back
    this.carGroup.add(lHL);

    const rHL = new THREE.Mesh(hlGeo, hlMat);
    rHL.position.set(1.8, 0.65, -0.65);
    rHL.rotation.x = -0.3;
    this.carGroup.add(rHL);

    // DRLs (Emissive X or Ring inside)
    const drlGeo = new THREE.TorusGeometry(0.15, 0.02, 8, 32);
    const drlMat = new THREE.MeshBasicMaterial({ color: 0xaaddff });

    const lDRL = new THREE.Mesh(drlGeo, drlMat);
    lDRL.position.copy(lHL.position);
    lDRL.position.y -= 0.05; // Inside
    lDRL.rotation.x = Math.PI * 0.5 - 0.3;
    this.carGroup.add(lDRL);

    const rDRL = new THREE.Mesh(drlGeo, drlMat);
    rDRL.position.copy(rHL.position);
    rDRL.position.y -= 0.05;
    rDRL.rotation.x = Math.PI * 0.5 - 0.3;
    this.carGroup.add(rDRL);

    // Rear Light Bar (992 Style)
    const barGeo = new THREE.BoxGeometry(0.1, 0.05, 1.7);
    const barMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0011,
      emissiveIntensity: 10.0,
    });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(-2.22, 0.75, 0);
    // Curve it?
    // Bending geometry procedurally is expensive, let's keep it straight for "Cyber" look or use segments
    this.carGroup.add(bar);

    // --- 5. Wheels ---
    // Large Center-lock wheels
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.35, 32);
    wheelGeo.rotateZ(Math.PI * 0.5);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
    });

    // Rim
    const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.36, 16);
    rimGeo.rotateZ(Math.PI * 0.5);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2,
    });

    const wheelPos = [
      { x: 1.3, z: 0.85, s: 1.0 }, // FL
      { x: 1.3, z: -0.85, s: 1.0 }, // FR
      { x: -1.3, z: 0.88, s: 1.1 }, // RL (Staggered wider)
      { x: -1.3, z: -0.88, s: 1.1 }, // RR
    ];

    wheelPos.forEach(p => {
      const g = new THREE.Group();
      g.position.set(p.x, 0.36 * p.s, p.z);

      const t = new THREE.Mesh(wheelGeo, tireMat);
      t.scale.setScalar(p.s);

      const r = new THREE.Mesh(rimGeo, rimMat);
      r.scale.setScalar(p.s);

      // Face detail (Emissive spokes?)
      const spokeGeo = new THREE.BoxGeometry(0.4, 0.05, 0.05);
      const spokeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 }); // Red stripe rim
      const s1 = new THREE.Mesh(spokeGeo, spokeMat);
      s1.rotation.y = Math.PI * 0.5; // Flat on face
      s1.position.x = 0.18 * p.s * (p.z > 0 ? 1 : -1);
      // Actually rims face outward

      g.add(t);
      g.add(r);
      this.carGroup.add(g);
      this.wheels.push(t);
    });

    // --- Environment : "The Grid" ---
    this.grid = new THREE.GridHelper(60, 60, 0x555555, 0x111111);
    this.group.add(this.grid);
  }

  init(_ctx: SceneRuntime) {}

  update(ctx: SceneRuntime) {
    const t = ctx.time;

    // Interactive Drive
    const accel = ctx.press; // 0..1
    this.speed = 10.0 + accel * 50.0; // Cruise 10, Sprint 60

    // Grid Motion (Infinite road)
    this.grid.position.z = (t * this.speed) % 1.0;

    // Wheel Spin
    const spin = this.speed * ctx.dt * 2.0;
    this.wheels.forEach(w => {
      w.parent!.rotateX(spin);
      // Pivot steering?
      if (w.parent!.position.x > 0) {
        // Front wheels
        w.parent!.rotation.y = -ctx.pointer.x * 0.3; // Steer
      }
    });

    // Chassis Physics (Suspension/G-Force)
    const turn = -ctx.pointer.x;

    // Roll (Body leans outside turn)
    const roll = turn * 0.15; // rad
    // Pitch (Squat on accel)
    const pitch = accel * 0.05;

    this.carGroup.rotation.z = damp(this.carGroup.rotation.z, roll, 4, ctx.dt);
    this.carGroup.rotation.x = damp(
      this.carGroup.rotation.x,
      -pitch,
      2,
      ctx.dt
    );
    this.carGroup.rotation.y = damp(
      this.carGroup.rotation.y,
      turn * 0.2,
      4,
      ctx.dt
    ); // Yaw slightly

    // Camera Chase
    // Base Pos: (0, 2, 6)
    // Drift Pos: Opposite to turn
    const camX = turn * 3.0;
    const camY = 3.0 + accel * 0.5; // Lower when fast? No higher.
    const camZ = 8.0 - accel * 2.0; // Closer when fast (motion blur effect)

    this.camera.position.x = damp(this.camera.position.x, camX, 2, ctx.dt);
    this.camera.position.y = damp(this.camera.position.y, camY, 2, ctx.dt);
    this.camera.position.z = damp(this.camera.position.z, camZ, 1, ctx.dt);

    this.camera.lookAt(0, 0.8, 0); // Look at car
  }
}
