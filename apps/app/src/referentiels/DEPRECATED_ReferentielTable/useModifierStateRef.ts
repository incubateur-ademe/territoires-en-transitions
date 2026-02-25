import {useEffect, useRef} from 'react';

/**
 * Donne l'état courant des touches "modificatrices" (shift, alt)
 */
export const useModifierStateRef = () => {
  const modifierStateRef = useRef({altKey: false, shiftKey: false});

  useEffect(() => {
    const onKeyUpOrDown = (e: KeyboardEvent) => {
      modifierStateRef.current = {
        altKey: e.altKey,
        shiftKey: e.shiftKey,
      };
    };

    document.addEventListener('keydown', onKeyUpOrDown);
    document.addEventListener('keyup', onKeyUpOrDown);

    return () => {
      document.removeEventListener('keydown', onKeyUpOrDown);
      document.removeEventListener('keyup', onKeyUpOrDown);
    };
  }, []);

  return modifierStateRef;
};
