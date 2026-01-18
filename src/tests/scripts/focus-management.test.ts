import { describe, it, expect, beforeEach, vi } from 'vitest';
import { maybeFocusMainContentOnPageLoad } from '../../scripts/focus-management';

describe('focus-management', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    document.body.className = '';
    // JSDOM defaults activeElement to body; keep it consistent.
  });

  it('does nothing for pointer users', () => {
    const main = document.createElement('main');
    main.id = 'main-content';
    document.body.appendChild(main);

    maybeFocusMainContentOnPageLoad();

    expect(document.activeElement).not.toBe(main);
  });

  it('focuses #main-content for keyboard users', () => {
    document.body.classList.add('keyboard-navigation');

    const main = document.createElement('main');
    main.id = 'main-content';
    document.body.appendChild(main);

    maybeFocusMainContentOnPageLoad();

    expect(document.activeElement).toBe(main);
    expect(main.getAttribute('tabindex')).toBe('-1');
  });

  it('does not override an existing focused element', () => {
    document.body.classList.add('keyboard-navigation');

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const main = document.createElement('main');
    main.id = 'main-content';
    document.body.appendChild(main);

    maybeFocusMainContentOnPageLoad();

    expect(document.activeElement).toBe(input);
  });

  it('respects location.hash', () => {
    document.body.classList.add('keyboard-navigation');

    const main = document.createElement('main');
    main.id = 'main-content';
    document.body.appendChild(main);

    const originalUrl = window.location.href;

    // JSDOM allows redefining location on URL change via history.
    window.history.pushState({}, '', '#section');

    maybeFocusMainContentOnPageLoad();

    expect(document.activeElement).not.toBe(main);

    window.history.pushState({}, '', originalUrl);
  });
});
