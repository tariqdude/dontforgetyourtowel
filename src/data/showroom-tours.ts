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
        message: 'Baseline hero framing with studio reflections.',
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
        message: 'Inspect the leading surfaces + clearcoat highlight.',
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
        message: 'Wheel finish + brake heat behavior under load.',
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
        message: 'Eye-level interior framing for cabin materials.',
        durationMs: 3200,
        camera: {
          position: [0.15, 0.75, 0.2],
          target: [0, 0.7, 0.65],
          fov: 58,
        },
      },
    ],
  },
];
