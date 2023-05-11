import {useEffect, useState} from 'react';

/**
 * Renvoi la position du défilement vertical dans un élément de la page
 *
 * @param elementId Identifiant de l'élément
 * @returns Position du scroll vertical dans l'élément (`0` si non trouvé)
 */
export const useScrollTop = (elementId: string) => {
  const element = document.getElementById(elementId);
  const [scrollTop, setScrollTop] = useState(element?.scrollTop || 0);

  useEffect(() => {
    if (!element) {
      return;
    }

    const onScroll = () => setScrollTop(element.scrollTop);
    element.addEventListener('scroll', onScroll);
    return () => element.removeEventListener('scroll', onScroll);
  }, [element]);

  return scrollTop;
};
