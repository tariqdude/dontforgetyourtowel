import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAnnouncer,
  announce,
  announceAssertive,
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
} from './a11y';

describe('Accessibility Utilities', () => {
  describe('Announcer', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should create an announcer element', () => {
      const { destroy } = createAnnouncer();
      const announcer = document.querySelector('[aria-live="polite"]');
      expect(announcer).toBeTruthy();
      expect(announcer?.getAttribute('role')).toBe('status');
      expect(announcer?.getAttribute('aria-atomic')).toBe('true');
      destroy();
    });

    it('should announce messages', async () => {
      const { announce: announceMsg, destroy } = createAnnouncer();
      const announcer = document.querySelector('[aria-live="polite"]');

      // Mock requestAnimationFrame
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        cb(0);
        return 0;
      });

      announceMsg('Test message');

      expect(announcer?.textContent).toBe('Test message');
      destroy();
    });

    it('should use global announcer', () => {
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        cb(0);
        return 0;
      });

      announce('Global message');
      const announcer = document.querySelector(
        '[data-global-announcer="true"][aria-live="polite"]'
      );
      expect(announcer).toBeTruthy();
      expect(announcer?.textContent).toBe('Global message');
    });

    it('should not remove unrelated aria-live elements', () => {
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        cb(0);
        return 0;
      });

      const unrelated = document.createElement('div');
      unrelated.setAttribute('aria-live', 'polite');
      unrelated.id = 'unrelated-live-region';
      unrelated.textContent = 'Unrelated';
      document.body.appendChild(unrelated);

      announce('Global message');

      // The unrelated live region should still exist.
      expect(document.getElementById('unrelated-live-region')).toBeTruthy();
    });

    it('should announce assertively', () => {
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        cb(0);
        return 0;
      });

      announceAssertive('Urgent message');
      const announcer = document.querySelector(
        '[data-global-announcer="true"][aria-live="assertive"]'
      );
      expect(announcer).toBeTruthy();
      expect(announcer?.textContent).toBe('Urgent message');
    });
  });

  describe('Focus Management', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = `
        <button id="btn1">Button 1</button>
        <div id="div1">Not focusable</div>
        <a href="#" id="link1">Link 1</a>
        <input type="text" id="input1" />
        <input type="hidden" id="hidden1" />
        <button disabled id="disabled-btn">Disabled</button>
        <div tabindex="0" id="tabindex0">Tabindex 0</div>
        <div tabindex="-1" id="tabindex-1">Tabindex -1</div>
      `;
      document.body.appendChild(container);

      // Mock offsetWidth/offsetHeight for visibility check
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        value: 100,
      });
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        value: 100,
      });

      // Mock getComputedStyle
      vi.spyOn(window, 'getComputedStyle').mockImplementation(_el => {
        return {
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      });
    });

    afterEach(() => {
      document.body.removeChild(container);
      vi.restoreAllMocks();
    });

    it('should get all focusable elements', () => {
      const elements = getFocusableElements(container);
      const ids = elements.map(el => el.id);

      expect(ids).toContain('btn1');
      expect(ids).toContain('link1');
      expect(ids).toContain('input1');
      expect(ids).toContain('tabindex0');

      expect(ids).not.toContain('div1');
      expect(ids).not.toContain('hidden1');
      expect(ids).not.toContain('disabled-btn');
      expect(ids).not.toContain('tabindex-1');
    });

    it('should get first focusable element', () => {
      const first = getFirstFocusable(container);
      expect(first?.id).toBe('btn1');
    });

    it('should get last focusable element', () => {
      const last = getLastFocusable(container);
      expect(last?.id).toBe('tabindex0');
    });

    it('should filter out hidden elements', () => {
      const hiddenBtn = document.createElement('button');
      hiddenBtn.id = 'hidden-btn';
      container.appendChild(hiddenBtn);

      vi.spyOn(window, 'getComputedStyle').mockImplementation(el => {
        if (el.id === 'hidden-btn') {
          return {
            display: 'none',
            visibility: 'visible',
          } as CSSStyleDeclaration;
        }
        return {
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      });

      const elements = getFocusableElements(container);
      expect(elements.map(e => e.id)).not.toContain('hidden-btn');
    });
  });
});
