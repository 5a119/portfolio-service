import {useEffect, useState} from 'react';

const FINE_HOVER_QUERY = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export default function usePointerEffectsEnabled() {
  const [enabled, setEnabled] = useState(() =>
    window.matchMedia(FINE_HOVER_QUERY).matches &&
    !window.matchMedia(REDUCED_MOTION_QUERY).matches,
  );

  useEffect(() => {
    const fineHover = window.matchMedia(FINE_HOVER_QUERY);
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setEnabled(fineHover.matches && !reducedMotion.matches);

    update();
    fineHover.addEventListener('change', update);
    reducedMotion.addEventListener('change', update);
    return () => {
      fineHover.removeEventListener('change', update);
      reducedMotion.removeEventListener('change', update);
    };
  }, []);

  return enabled;
}
