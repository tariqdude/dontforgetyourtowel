import Lenis from 'lenis';
import Splitting from 'splitting';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

type Cleanup = () => void;

type TweenWithScrollTrigger = gsap.core.Tween & {
  scrollTrigger?: ScrollTrigger;
};

const setupScrollMotion = (): Cleanup | null => {
  const root = document.querySelector<HTMLElement>('[data-ih]');
  if (!root) return null;

  const triggers: ScrollTrigger[] = [];

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Mobile-first: avoid smooth-scroll polyfills on coarse-pointer devices.
  // They can fight with native touch scrolling and the 3D hero's touch logic.
  const coarsePointer = Boolean(
    window.matchMedia?.('(pointer: coarse)').matches
  );

  gsap.registerPlugin(ScrollTrigger);

  let lenis: Lenis | null = null;
  let rafHandler: ((time: number) => void) | null = null;

  if (!reducedMotion && !coarsePointer) {
    lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.1,
      stopInertiaOnNavigate: true,
    });

    rafHandler = (time: number) => {
      lenis?.raf(time);
    };

    gsap.ticker.add(rafHandler);
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', ScrollTrigger.update);
  }

  // Splitting mutates DOM and doesn't provide a universal revert.
  // On initial load, both DOMContentLoaded and astro:page-load can fire,
  // so keep this resilient by only splitting nodes that haven't been split.
  const splitTargets = Array.from(
    root.querySelectorAll<HTMLElement>('[data-split]')
  ).filter(el => !el.hasAttribute('data-splitting'));
  if (splitTargets.length > 0) {
    Splitting({ target: splitTargets });
  }

  const panels = Array.from(
    root.querySelectorAll<HTMLElement>('[data-ih-panel]')
  );
  const railItems = Array.from(
    root.querySelectorAll<HTMLElement>('[data-ih-rail-item]')
  );
  const modeButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-ih-mode]')
  );
  let lastProgress = 0;

  panels.forEach(panel => {
    const tween = gsap.fromTo(
      panel,
      { autoAlpha: 0, y: 64, scale: 0.97 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: panel,
          start: 'top 88%',
          end: 'top 50%',
          scrub: reducedMotion ? false : 0.8,
        },
      }
    );

    // Track created triggers so cleanup doesn't nuke ScrollTriggers app-wide.
    const st = (tween as TweenWithScrollTrigger).scrollTrigger;
    if (st) triggers.push(st);
  });

  const railTrigger = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: self => {
      const progress = self.progress;
      const direction = progress >= lastProgress ? 1 : -1;
      lastProgress = progress;
      root.style.setProperty('--ih-progress', progress.toFixed(4));
      root.style.setProperty('--ih-direction', direction.toFixed(0));

      if (railItems.length > 0) {
        const idx = Math.min(
          railItems.length - 1,
          Math.max(0, Math.floor(progress * railItems.length))
        );
        railItems.forEach((item, index) => {
          item.classList.toggle('is-active', index === idx);
        });
      }
    },
  });

  triggers.push(railTrigger);

  const words = Array.from(
    root.querySelectorAll<HTMLElement>('.ih-split .word')
  );
  words.forEach((word, index) => {
    const tween = gsap.fromTo(
      word,
      { y: 20, opacity: 0, rotateX: -15 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 0.7,
        delay: index * 0.02,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: word,
          start: 'top 94%',
          toggleActions: 'play none none none',
        },
      }
    );

    const st = (tween as TweenWithScrollTrigger).scrollTrigger;
    if (st) triggers.push(st);
  });

  ScrollTrigger.refresh();

  const defaultMode = 'calm';
  root.dataset.mode = root.dataset.mode ?? defaultMode;
  modeButtons.forEach(button => {
    button.classList.toggle(
      'is-active',
      button.dataset.mode === root.dataset.mode
    );
  });

  const onModeClick = (event: Event) => {
    const target = event.currentTarget as HTMLButtonElement;
    const mode = target.dataset.mode ?? defaultMode;
    root.dataset.mode = mode;
    modeButtons.forEach(button => {
      button.classList.toggle('is-active', button === target);
    });
  };

  modeButtons.forEach(button => {
    button.addEventListener('click', onModeClick);
  });

  return () => {
    triggers.forEach(trigger => trigger.kill());
    modeButtons.forEach(button => {
      button.removeEventListener('click', onModeClick);
    });
    if (lenis) lenis.destroy();
    if (rafHandler) gsap.ticker.remove(rafHandler);
  };
};

let cleanup: Cleanup | null = null;
let mountedRoot: HTMLElement | null = null;

const mount = () => {
  const root = document.querySelector<HTMLElement>('[data-ih]');

  // If we're being called twice for the same DOM (common with ClientRouter),
  // keep the first initialization alive to avoid double-splitting + overlap.
  if (root && root === mountedRoot && cleanup) return;

  cleanup?.();
  cleanup = setupScrollMotion();
  mountedRoot = root;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}

document.addEventListener('astro:page-load', mount);

document.addEventListener('astro:before-swap', () => {
  cleanup?.();
  cleanup = null;
  mountedRoot = null;
});
