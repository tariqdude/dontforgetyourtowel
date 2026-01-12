import { isBrowser, observeMutations } from './dom';
import { prefersReducedMotion } from './a11y';

export type DemoLabState = {
  paused: boolean;
  reduced: boolean;
  perf: boolean;
};

export type DemoFlags = {
  paused: boolean;
  reducedMotion: boolean;
  perfMode: boolean;
};

export const DEMO_LAB_STORAGE_KEY = 'demo-lab:state';

export function parseStoredDemoLabState(
  storageKey = DEMO_LAB_STORAGE_KEY
): DemoLabState {
  if (!isBrowser()) return { paused: false, reduced: false, perf: false };

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { paused: false, reduced: false, perf: false };

    const parsed = JSON.parse(raw) as Partial<DemoLabState>;
    return {
      paused: Boolean(parsed.paused),
      reduced: Boolean(parsed.reduced),
      perf: Boolean(parsed.perf),
    };
  } catch {
    return { paused: false, reduced: false, perf: false };
  }
}

export function persistDemoLabState(
  state: DemoLabState,
  storageKey = DEMO_LAB_STORAGE_KEY
): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Ignore storage errors (private mode, disabled storage, etc.)
  }
}

export function applyDemoLabStateToDOM(
  state: DemoLabState,
  root: HTMLElement = document.documentElement
): void {
  if (!isBrowser()) return;

  root.dataset.demoPaused = state.paused ? 'true' : 'false';
  root.dataset.demoReducedMotion = state.reduced ? 'true' : 'false';
  root.dataset.demoPerf = state.perf ? 'true' : 'false';

  // Helpful body class for scoping any future CSS overrides.
  document.body.classList.add('demo-lab');
}

export function readDemoLabStateFromDOM(
  root: HTMLElement = document.documentElement
): DemoLabState {
  if (!isBrowser()) return { paused: false, reduced: false, perf: false };

  return {
    paused: root.dataset.demoPaused === 'true',
    reduced: root.dataset.demoReducedMotion === 'true',
    perf: root.dataset.demoPerf === 'true',
  };
}

export function getDemoModuleRoot(target: Element): HTMLElement | null {
  if (!isBrowser()) return null;
  return (target.closest('[data-demo-module]') ||
    target.closest('.demo-module')) as HTMLElement | null;
}

export function isDemoPaused(moduleRoot: HTMLElement | null = null): boolean {
  if (!isBrowser()) return false;

  const html = document.documentElement;
  const htmlPaused = html.dataset.demoPaused === 'true';
  const htmlReduced = html.dataset.demoReducedMotion === 'true';

  const modPaused = moduleRoot?.dataset.demoPaused === 'true';
  const modReduced = moduleRoot?.dataset.demoReducedMotion === 'true';

  return htmlPaused || htmlReduced || modPaused || modReduced;
}

export function isDemoPerfMode(moduleRoot: HTMLElement | null = null): boolean {
  if (!isBrowser()) return false;

  const html = document.documentElement;
  return (
    html.dataset.demoPerf === 'true' || moduleRoot?.dataset.demoPerf === 'true'
  );
}

export function getEffectiveDemoFlags(
  moduleRoot: HTMLElement | null = null
): DemoFlags {
  return {
    paused: isDemoPaused(moduleRoot),
    reducedMotion:
      prefersReducedMotion() ||
      document.documentElement.dataset.demoReducedMotion === 'true' ||
      moduleRoot?.dataset.demoReducedMotion === 'true',
    perfMode: isDemoPerfMode(moduleRoot),
  };
}

export function observeDemoLabFlags(
  callback: () => void,
  options: {
    moduleRoot?: HTMLElement | null;
    includePerf?: boolean;
  } = {}
): () => void {
  if (!isBrowser()) return () => {};

  const { moduleRoot = null, includePerf = true } = options;

  const attributeFilter = includePerf
    ? ['data-demo-paused', 'data-demo-reduced-motion', 'data-demo-perf']
    : ['data-demo-paused', 'data-demo-reduced-motion'];

  const stopHtml = observeMutations(
    document.documentElement,
    () => callback(),
    { attributes: true, attributeFilter }
  );

  const stopModule = moduleRoot
    ? observeMutations(moduleRoot, () => callback(), {
        attributes: true,
        attributeFilter,
      })
    : () => {};

  return () => {
    stopHtml();
    stopModule();
  };
}
