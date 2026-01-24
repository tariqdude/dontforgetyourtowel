# Immersive Scene System

## Overview
The homepage uses a single fullscreen WebGL canvas with a `SceneDirector` that swaps between independent scenes as the user scrolls. Each scene is a self-contained module that owns its own `THREE.Scene` and `THREE.Camera`.

## Files
- `src/scripts/immersive/three/scene-director.ts`
- `src/scripts/immersive/three/scenes/index.ts`
- `src/components/immersive/ImmersiveHome.astro`

## Add a New Scene
1. Add a new `SceneMeta` entry in `src/scripts/immersive/three/scenes/index.ts`.
2. Create a new scene class that extends `SceneBase` or follows `ImmersiveScene`.
3. Add the scene to `createScenes()` in the desired order.
4. Add a matching chapter in `src/components/immersive/ImmersiveHome.astro`.

## Performance Tiers
- `caps.coarsePointer` drives lower DPR and lighter motion.
- Use fewer particles or lower geometry complexity on mobile-sized scenes.
- Prefer shader-based effects for big visuals; keep CPU loops minimal.

## Transition Tuning
Transition parameters live in `src/scripts/immersive/three/scene-director.ts`:
- `uNoiseScale` for mask granularity
- `uEdge` for blend softness
- `duration` when `beginTransition` is called
