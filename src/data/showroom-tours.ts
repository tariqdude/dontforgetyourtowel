export type TourCameraState = {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
};

export type TourHighlight = {
  meshNameIncludes?: string;
  materialNameIncludes?: string;
};

export type ShowroomTourStep = {
  id: string;
  label: string;
  message?: string;
  durationMs?: number;
  camera: TourCameraState;
  highlight?: TourHighlight;
};

export type ShowroomTour = {
  id: string;
  name: string;
  steps: ShowroomTourStep[];
};

export const SHOWROOM_TOURS: ShowroomTour[] = [
  {
    id: 'porsche',
    name: 'Porsche Product Walkthrough',
    steps: [
      {
        id: 'hero',
        label: 'Hero 3/4',
        message: 'Start with a clean hero angle and studio reflections.',
        durationMs: 2400,
        camera: {
          position: [5.2, 1.55, 5.1],
          target: [0, 0.45, 0],
          fov: 45,
        },
      },
      {
        id: 'front',
        label: 'Front Fascia',
        message: 'Inspect leading surfaces and clearcoat response.',
        durationMs: 2600,
        camera: {
          position: [3.6, 1.25, 4.3],
          target: [0, 0.55, 0.9],
          fov: 48,
        },
      },
      {
        id: 'wheels',
        label: 'Wheels + Brakes',
        message: 'Check wheel finish and brake details.',
        durationMs: 3200,
        camera: {
          position: [2.2, 0.65, 1.9],
          target: [1.05, 0.35, 1.15],
          fov: 52,
        },
        highlight: {
          meshNameIncludes: 'wheel',
        },
      },
      {
        id: 'interior',
        label: 'Interior',
        message: 'Switch to an interior framing for cabin materials.',
        durationMs: 3200,
        camera: {
          position: [0.15, 0.75, 0.2],
          target: [0, 0.7, 0.65],
          fov: 58,
        },
      },
    ],
  },
  {
    id: 'studio',
    name: 'Studio Basics',
    steps: [
      {
        id: 'hero',
        label: 'Hero Angle',
        message: 'A solid starting angle for screenshots and sharing.',
        durationMs: 2200,
        camera: {
          position: [4.9, 1.45, 4.9],
          target: [0, 0.55, 0],
          fov: 46,
        },
      },
      {
        id: 'profile',
        label: 'Side Profile',
        message: 'Use a profile view to judge stance and proportions.',
        durationMs: 2400,
        camera: {
          position: [6.3, 1.05, 0.0],
          target: [0, 0.6, 0],
          fov: 48,
        },
      },
      {
        id: 'rear',
        label: 'Rear 3/4',
        message: 'Walk around to validate silhouettes and lighting.',
        durationMs: 2400,
        camera: {
          position: [-4.8, 1.35, -4.7],
          target: [0, 0.55, 0],
          fov: 47,
        },
      },
      {
        id: 'detail',
        label: 'Detail Zoom',
        message: 'Move closer to check materials and edge highlights.',
        durationMs: 2600,
        camera: {
          position: [2.2, 1.05, 2.1],
          target: [0, 0.75, 0.35],
          fov: 55,
        },
      },
    ],
  },
  {
    id: 'surfaces',
    name: 'Design + Surfaces',
    steps: [
      {
        id: 'paint',
        label: 'Paint Response',
        message: 'Watch how clearcoat and sparkle respond to the lights.',
        durationMs: 2600,
        camera: {
          position: [3.9, 1.35, 4.0],
          target: [0, 0.7, 0.35],
          fov: 50,
        },
      },
      {
        id: 'crease',
        label: 'Crease Lines',
        message: 'Edge highlights reveal surface continuity and form.',
        durationMs: 2600,
        camera: {
          position: [5.9, 1.2, 1.2],
          target: [0.15, 0.7, 0.05],
          fov: 52,
        },
      },
      {
        id: 'roofline',
        label: 'Roofline',
        message: 'Check roof curvature and reflections for realism.',
        durationMs: 2600,
        camera: {
          position: [0.0, 2.25, 4.4],
          target: [0, 0.85, 0],
          fov: 52,
        },
      },
    ],
  },
  {
    id: 'details',
    name: 'Details + Hardware',
    steps: [
      {
        id: 'wheels',
        label: 'Wheels',
        message: 'Great place to spot roughness/metalness mismatches.',
        durationMs: 2800,
        camera: {
          position: [2.15, 0.7, 1.9],
          target: [1.0, 0.35, 1.05],
          fov: 54,
        },
        highlight: {
          meshNameIncludes: 'wheel',
        },
      },
      {
        id: 'lights',
        label: 'Lights',
        message: 'Inspect lenses and glassy materials up close.',
        durationMs: 2800,
        camera: {
          position: [2.7, 1.15, 3.1],
          target: [0.35, 0.7, 1.05],
          fov: 56,
        },
        highlight: {
          meshNameIncludes: 'light',
        },
      },
      {
        id: 'interior',
        label: 'Interior Check',
        message: 'A quick interior view for fabrics, leather, and trims.',
        durationMs: 3000,
        camera: {
          position: [0.2, 0.78, 0.2],
          target: [0, 0.72, 0.7],
          fov: 58,
        },
      },
    ],
  },
];
