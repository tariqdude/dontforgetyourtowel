import { onReducedMotionChange, prefersReducedMotion } from '@/utils/a11y';

type HeroOptions = {
  interactive: boolean;
};

class Hero3DController {
  private container: HTMLElement;
  private scene: HTMLElement | null;
  private rafId = 0;
  private isInteractive = false;
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private pointerActive = false;
  private isDragging = false;
  private pointerLocked = false;
  private observer?: IntersectionObserver;
  private stopReducedMotion?: () => void;
  private options: HeroOptions;

  constructor(container: HTMLElement, options: HeroOptions) {
    this.container = container;
    this.scene = container.querySelector('.hero-3d-scene');
    this.options = options;
    this.init();
  }

  private init() {
    if (!this.scene) return;
    this.updateReducedMotion(prefersReducedMotion());

    this.stopReducedMotion = onReducedMotionChange(prefers => {
      this.updateReducedMotion(prefers);
    });

    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const paused = !entry.isIntersecting;
          this.container.setAttribute(
            'data-hero-paused',
            paused ? 'true' : 'false'
          );
          if (paused) this.stop();
          else this.start();
        });
      },
      { threshold: 0.15 }
    );

    this.observer.observe(this.container);
  }

  private updateReducedMotion(prefers: boolean) {
    if (prefers) {
      this.container.setAttribute('data-hero-reduced', 'true');
      this.stop();
      return;
    }

    this.container.removeAttribute('data-hero-reduced');
    this.start();
  }

  private onPointerMove = (event: PointerEvent) => {
    if (!this.scene) return;
    if (this.pointerLocked) {
      const rect = this.container.getBoundingClientRect();
      const deltaX = event.movementX / rect.width;
      const deltaY = event.movementY / rect.height;
      this.targetX = clamp(this.targetX + deltaX, -0.5, 0.5);
      this.targetY = clamp(this.targetY + deltaY, -0.5, 0.5);
    } else {
      const rect = this.container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      this.targetX = x;
      this.targetY = y;
    }
    this.pointerActive = true;
    this.requestTick();
  };

  private onPointerDown = (event: PointerEvent) => {
    if (!this.scene) return;
    this.isDragging = true;
    this.container.setAttribute('data-hero-drag', 'true');
    this.container.setPointerCapture(event.pointerId);

    if (event.shiftKey && document.pointerLockElement !== this.container) {
      this.container.requestPointerLock?.();
    }
  };

  private onPointerUp = (event: PointerEvent) => {
    this.isDragging = false;
    this.container.removeAttribute('data-hero-drag');
    this.container.releasePointerCapture(event.pointerId);

    if (this.pointerLocked && document.pointerLockElement === this.container) {
      document.exitPointerLock?.();
    }
  };

  private onPointerCancel = (event: PointerEvent) => {
    this.isDragging = false;
    this.container.removeAttribute('data-hero-drag');
    this.container.releasePointerCapture(event.pointerId);
  };

  private onPointerLockChange = () => {
    this.pointerLocked = document.pointerLockElement === this.container;
    if (!this.pointerLocked && this.isDragging) {
      this.container.removeAttribute('data-hero-drag');
    }
  };

  private onPointerLeave = () => {
    this.pointerActive = false;
    if (!this.pointerLocked) {
      this.targetX = 0;
      this.targetY = 0;
    }
    this.requestTick();
  };

  private requestTick() {
    if (this.rafId) return;
    this.rafId = window.requestAnimationFrame(() => this.tick());
  }

  private tick() {
    this.rafId = 0;
    if (!this.scene) return;

    this.currentX += (this.targetX - this.currentX) * 0.1;
    this.currentY += (this.targetY - this.currentY) * 0.1;

    this.container.style.setProperty(
      '--hero-tilt-x',
      `${this.currentY * -18}deg`
    );
    this.container.style.setProperty(
      '--hero-tilt-y',
      `${this.currentX * 18}deg`
    );
    this.container.style.setProperty(
      '--cursor-x',
      `${this.currentX.toFixed(3)}`
    );
    this.container.style.setProperty(
      '--cursor-y',
      `${this.currentY.toFixed(3)}`
    );

    if (
      this.pointerActive ||
      Math.abs(this.currentX) > 0.001 ||
      Math.abs(this.currentY) > 0.001
    ) {
      this.requestTick();
    }
  }

  private start() {
    if (!this.options.interactive) return;
    if (this.isInteractive) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    this.container.addEventListener('pointermove', this.onPointerMove, {
      passive: true,
    });
    this.container.addEventListener('pointerdown', this.onPointerDown);
    this.container.addEventListener('pointerup', this.onPointerUp);
    this.container.addEventListener('pointercancel', this.onPointerCancel);
    this.container.addEventListener('pointerleave', this.onPointerLeave, {
      passive: true,
    });
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    this.isInteractive = true;
  }

  private stop() {
    if (!this.isInteractive) return;
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('pointerdown', this.onPointerDown);
    this.container.removeEventListener('pointerup', this.onPointerUp);
    this.container.removeEventListener('pointercancel', this.onPointerCancel);
    this.container.removeEventListener('pointerleave', this.onPointerLeave);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.isInteractive = false;
    this.pointerActive = false;
    this.isDragging = false;
    this.pointerLocked = false;
    this.container.removeAttribute('data-hero-drag');
  }

  public destroy() {
    this.stop();
    this.observer?.disconnect();
    this.stopReducedMotion?.();
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const heroNodes = document.querySelectorAll<HTMLElement>('[data-hero-3d]');

heroNodes.forEach(node => {
  const interactive = node.dataset.interactive !== 'false';
  const controller = new Hero3DController(node, { interactive });

  window.addEventListener(
    'beforeunload',
    () => {
      controller.destroy();
    },
    { once: true }
  );
});
