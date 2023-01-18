import {RefObject, useLayoutEffect, useRef} from 'react';

/**
 * Rend un champ de saisi qui se redimensionne en fonction de son contenu.
 * copié/adapté depuis: https://www.kindacode.com/article/react-typescript-create-an-autosize-textarea-from-scratch/
 * (il ne parait pas nécessaire d'ajouter une dépendance supplémentaire pour cette fonctionnalité)
 */
export const useAutoSizeTextarea = (
  value?: string,
  minHeight?: string,
  ref?: RefObject<HTMLTextAreaElement> | null
) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const usedRef = ref ? ref : textareaRef;

  // Permet de set la taille du textarea au changement de valeur
  useLayoutEffect(() => {
    if (usedRef && usedRef.current) {
      usedRef.current.style.height = '0px';
      usedRef.current.style.minHeight = minHeight ?? '2.5rem';
      const scrollHeight = usedRef.current.scrollHeight;
      usedRef.current.style.height = scrollHeight + 'px';
    }
  }, [value]);

  return usedRef;
};
