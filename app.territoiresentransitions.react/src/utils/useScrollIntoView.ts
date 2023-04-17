import {useEffect, useRef} from 'react';
import {useLocation} from 'react-router-dom';

/** on utilise scrollIntoView car la navigation classique (ajout d'un id sur un élément) vers les ancres semble ne pas fonctionner correctement... */
export const useScrollIntoView = (anchor: string) => {
  const myRef = useRef<null | HTMLDivElement>(null);
  const location = useLocation();
  useEffect(() => {
    // applique l'effet si l'url contient l'ancre voulue (et que la ref sur l'elt est créée)
    if (myRef && location.hash.substring(1).split('&').includes(anchor)) {
      // le timeout permet que le render soit terminé avant de scroller vers l'élément
      setTimeout(() => {
        myRef?.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 0);
    }
  }, [myRef, location.hash]);
  return myRef;
};
