import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnhancedHeader } from '../../scripts/header';
import * as eventsUtils from '../../utils/events';

// Mock dependencies
vi.mock('../../utils/events', () => ({
  onKeyboardShortcut: vi.fn(),
  onMediaQueryChange: vi.fn(),
  onScroll: vi.fn(),
}));

vi.mock('../../utils/a11y', () => ({
  createFocusTrap: vi.fn().mockReturnValue({
    activate: vi.fn(),
    deactivate: vi.fn(),
  }),
  announce: vi.fn(),
}));

vi.mock('../../utils/media', () => ({
  breakpoints: { md: 768 },
  getCurrentBreakpoint: vi.fn().mockReturnValue('sm'),
}));

describe('EnhancedHeader', () => {
  let header: HTMLElement;
  let toggle: HTMLButtonElement;
  let menu: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';

    header = document.createElement('header');
    document.body.appendChild(header);

    toggle = document.createElement('button');
    toggle.id = 'mobile-menu-button';
    toggle.setAttribute('aria-expanded', 'false');
    document.body.appendChild(toggle);

    menu = document.createElement('div');
    menu.id = 'mobile-menu';
    menu.setAttribute('hidden', '');
    document.body.appendChild(menu);

    // Mock getElementById
    vi.spyOn(document, 'getElementById').mockImplementation(id => {
      if (id === 'mobile-menu-button') return toggle;
      if (id === 'mobile-menu') return menu;
      return null;
    });

    vi.spyOn(document, 'querySelector').mockImplementation(sel => {
      if (sel === 'header') return header;
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize correctly', () => {
    new EnhancedHeader();
    expect(eventsUtils.onKeyboardShortcut).toHaveBeenCalled();
  });

  it('should toggle menu on click', () => {
    new EnhancedHeader();

    // Open
    toggle.click();
    expect(menu.hasAttribute('hidden')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.classList.contains('mobile-menu-open')).toBe(true);
    expect(document.body.style.position).toBe('fixed');

    // Close
    toggle.click();
    expect(menu.hasAttribute('hidden')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.classList.contains('mobile-menu-open')).toBe(false);
  });

  it('should close menu when clicking a link inside', () => {
    // Add link before initialization
    const link = document.createElement('a');
    link.href = '#';
    menu.appendChild(link);

    new EnhancedHeader();

    // Open menu first
    toggle.click();
    expect(menu.hasAttribute('hidden')).toBe(false);

    // Wait for timeout (100ms in implementation)
    vi.useFakeTimers();

    // Click link
    link.click();

    vi.advanceTimersByTime(100);

    expect(menu.hasAttribute('hidden')).toBe(true);
    vi.useRealTimers();
  });
});
