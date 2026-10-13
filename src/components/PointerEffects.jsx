import {useEffect} from 'react';

const MAGNETIC_BUTTONS = '.header-cta, .button-primary, .button-secondary';

export default function PointerEffects() {
  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let stop = () => {};
    function start() {
      const cleanup = [];
      const resets = [];
      document.querySelectorAll(MAGNETIC_BUTTONS).forEach(button => {
        let bounds = null;
        button.classList.add('magnetic-button');
        const reset = () => {
          bounds = null;
          button.style.removeProperty('--magnet-x');
          button.style.removeProperty('--magnet-y');
        };
        const enter = (event) => { if (event.pointerType === 'mouse') bounds = button.getBoundingClientRect(); };
        const move = (event) => {
          if (event.pointerType !== 'mouse') return;
          // Keep the original bounds so the moving button never chases its own offset.
          bounds ||= button.getBoundingClientRect();
          const x = Math.max(-8, Math.min(8, (event.clientX - bounds.left - bounds.width / 2) * 0.16));
          const y = Math.max(-6, Math.min(6, (event.clientY - bounds.top - bounds.height / 2) * 0.2));
          button.style.setProperty('--magnet-x', `${x}px`);
          button.style.setProperty('--magnet-y', `${y}px`);
        };
        button.addEventListener('pointerenter', enter, { passive: true });
        button.addEventListener('pointermove', move, { passive: true });
        button.addEventListener('pointerleave', reset);
        resets.push(reset);
        cleanup.push(() => {
          reset();
          button.classList.remove('magnetic-button');
          button.removeEventListener('pointerenter', enter);
          button.removeEventListener('pointermove', move);
          button.removeEventListener('pointerleave', reset);
        });
      });
      document.querySelectorAll('.project-card').forEach(card => {
        const reset = () => {
          card.style.removeProperty('--spotlight-x');
          card.style.removeProperty('--spotlight-y');
          card.style.removeProperty('--spotlight-opacity');
        };
        const move = (event) => {
          if (event.pointerType !== 'mouse') return;
          const bounds = card.getBoundingClientRect();
          card.style.setProperty('--spotlight-x', `${event.clientX - bounds.left}px`);
          card.style.setProperty('--spotlight-y', `${event.clientY - bounds.top}px`);
          card.style.setProperty('--spotlight-opacity', '1');
        };
        card.addEventListener('pointermove', move, { passive: true });
        card.addEventListener('pointerleave', reset);
        resets.push(reset);
        cleanup.push(() => {
          reset();
          card.removeEventListener('pointermove', move);
          card.removeEventListener('pointerleave', reset);
        });
      });
      const resetAll = () => resets.forEach(reset => reset());
      const onKeyboard = (event) => { if (event.key === 'Tab') resetAll(); };
      const onVisibility = () => { if (document.hidden) resetAll(); };
      window.addEventListener('blur', resetAll);
      window.addEventListener('scroll', resetAll, { passive: true });
      window.addEventListener('resize', resetAll);
      window.addEventListener('keydown', onKeyboard);
      document.addEventListener('visibilitychange', onVisibility);
      return () => {
        cleanup.forEach(dispose => dispose());
        window.removeEventListener('blur', resetAll);
        window.removeEventListener('scroll', resetAll);
        window.removeEventListener('resize', resetAll);
        window.removeEventListener('keydown', onKeyboard);
        document.removeEventListener('visibilitychange', onVisibility);
      };
    }
    const update = () => {
      stop();
      stop = finePointer.matches && !reducedMotion.matches ? start() : () => {};
    };
    update();
    finePointer.addEventListener('change', update);
    reducedMotion.addEventListener('change', update);
    return () => {
      stop();
      finePointer.removeEventListener('change', update);
      reducedMotion.removeEventListener('change', update);
    };
  }, []);
  return null;
}
