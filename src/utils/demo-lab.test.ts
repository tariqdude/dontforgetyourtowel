/**
 * Tests for Demo Lab utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  applyDemoLabStateToDOM,
  readDemoLabStateFromDOM,
  isDemoPaused,
  isDemoPerfMode,
  getEffectiveDemoFlags,
  observeDemoLabFlags,
} from './demo-lab';

describe('demo-lab utilities', () => {
  it('should write and read dataset state', () => {
    applyDemoLabStateToDOM({ paused: true, reduced: false, perf: true });

    expect(readDemoLabStateFromDOM()).toEqual({
      paused: true,
      reduced: false,
      perf: true,
    });

    expect(document.documentElement.getAttribute('data-demo-paused')).toBe(
      'true'
    );
    expect(
      document.documentElement.getAttribute('data-demo-reduced-motion')
    ).toBe('false');
    expect(document.documentElement.getAttribute('data-demo-perf')).toBe(
      'true'
    );
  });

  it('isDemoPaused should account for html and module root', () => {
    const moduleRoot = document.createElement('div');

    document.documentElement.dataset.demoPaused = 'false';
    document.documentElement.dataset.demoReducedMotion = 'false';
    moduleRoot.dataset.demoPaused = 'false';
    moduleRoot.dataset.demoReducedMotion = 'false';

    expect(isDemoPaused(moduleRoot)).toBe(false);

    moduleRoot.dataset.demoReducedMotion = 'true';
    expect(isDemoPaused(moduleRoot)).toBe(true);

    moduleRoot.dataset.demoReducedMotion = 'false';
    document.documentElement.dataset.demoPaused = 'true';
    expect(isDemoPaused(moduleRoot)).toBe(true);
  });

  it('isDemoPerfMode should account for html and module root', () => {
    const moduleRoot = document.createElement('div');
    document.documentElement.dataset.demoPerf = 'false';
    moduleRoot.dataset.demoPerf = 'false';

    expect(isDemoPerfMode(moduleRoot)).toBe(false);

    moduleRoot.dataset.demoPerf = 'true';
    expect(isDemoPerfMode(moduleRoot)).toBe(true);

    moduleRoot.dataset.demoPerf = 'false';
    document.documentElement.dataset.demoPerf = 'true';
    expect(isDemoPerfMode(moduleRoot)).toBe(true);
  });

  it('getEffectiveDemoFlags should honor prefers-reduced-motion', () => {
    // Override matchMedia for this test.
    const mm = vi
      .spyOn(window, 'matchMedia')
      .mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

    document.documentElement.dataset.demoReducedMotion = 'false';

    const flags = getEffectiveDemoFlags(null);
    expect(flags.reducedMotion).toBe(true);

    mm.mockRestore();
  });

  it('observeDemoLabFlags should fire on html dataset changes', async () => {
    const cb = vi.fn();
    const stop = observeDemoLabFlags(cb);

    document.documentElement.dataset.demoPaused = 'true';

    // Allow MutationObserver microtask to run.
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(cb).toHaveBeenCalled();

    stop();
  });
});
