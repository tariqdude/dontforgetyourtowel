import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnhancedContactForm } from '../../scripts/contact-form';

// Mock dependencies
vi.mock('../../utils/a11y', () => ({
  announce: vi.fn(),
  setAriaAttributes: vi.fn(),
}));

vi.mock('../../utils/validation', () => ({
  emailSchema: { safeParse: vi.fn().mockReturnValue({ success: true }) },
  phoneSchema: { safeParse: vi.fn().mockReturnValue({ success: true }) },
}));

vi.mock('../../store/index', () => ({
  addNotification: vi.fn(),
  notify: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EnhancedContactForm', () => {
  let form: HTMLFormElement;
  let submitButton: HTMLButtonElement;
  let statusDiv: HTMLDivElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    form = document.createElement('form');
    form.id = 'contact-form';

    // Helper to create fields
    const createField = (name: string, type = 'text', required = false) => {
      const input = document.createElement('input');
      input.name = name;
      input.type = type;
      if (required) input.required = true;
      form.appendChild(input);
      return input;
    };

    createField('firstName', 'text', true);
    createField('lastName', 'text', true);
    createField('email', 'email', true);
    createField('company');
    createField('phone', 'tel');
    createField('subject', 'text', true);
    createField('budget');
    createField('timeline');
    createField('message', 'text', true); // Should be textarea but input works for basic test
    createField('terms', 'checkbox', true);

    submitButton = document.createElement('button');
    submitButton.type = 'submit';
    form.appendChild(submitButton);

    statusDiv = document.createElement('div');
    statusDiv.className = 'form-status';
    form.appendChild(statusDiv);

    document.body.appendChild(form);

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('should initialize correctly', () => {
    const contactForm = new EnhancedContactForm();
    expect(contactForm).toBeDefined();
  });

  it('should validate required fields on submit', async () => {
    new EnhancedContactForm();

    // Submit empty form
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    // Should not redirect
    expect(window.location.href).toBe('');

    // Should show errors (implementation detail: adds .error class or similar)
    // We can check if announce was called with error message
    const { announce } = await import('../../utils/a11y');
    expect(announce).toHaveBeenCalledWith(
      expect.stringContaining('Form has'),
      'assertive'
    );
  });

  it('should submit successfully when valid', async () => {
    new EnhancedContactForm();

    let clickedHref = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      clickedHref = this.href;
    });

    // Fill form
    const setVal = (name: string, val: string) => {
      const el = form.querySelector(`[name="${name}"]`) as HTMLInputElement;
      el.value = val;
    };

    setVal('firstName', 'John');
    setVal('lastName', 'Doe');
    setVal('email', 'john@example.com');
    setVal('subject', 'Test Subject');
    setVal('message', 'This is a long enough message for validation.');

    const terms = form.querySelector('[name="terms"]') as HTMLInputElement;
    terms.checked = true;

    // Submit
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    // Should trigger a mailto link
    expect(clickedHref).toContain('mailto:');
    expect(clickedHref).toContain('john%40example.com');
  });
});
