/// <reference types="astro/client" />

// Add any global type augmentations here.

declare global {
  interface Window {
    __galleryAutoPlay?: {
      start: () => void;
      stop: () => void;
      toggle: () => void;
    };
    __goToSceneOriginal?: (index: number) => void;
    __goToSceneImmediate?: (index: number) => void;
    __galleryGetTargetProgress?: () => number;
    __galleryGetCurrentScene?: () => number;
  }
}

export {};
