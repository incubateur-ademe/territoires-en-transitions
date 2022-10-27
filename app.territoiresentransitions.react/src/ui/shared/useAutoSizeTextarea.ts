import {useEffect, useRef} from 'react';

/**
 * Rend un champ de saisi qui se redimensionne en fonction de son contenu.
 * copié/adapté depuis: https://www.kindacode.com/article/react-typescript-create-an-autosize-textarea-from-scratch/
 * (il ne parait pas nécessaire d'ajouter une dépendance supplémentaire pour cette fonctionnalité)
 */
export const useAutoSizeTextarea = (value: string, minHeight?: string) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Permet de set la taille du textarea au changement de valeur
  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = '0px';
      textareaRef.current.style.minHeight = minHeight ?? '2.5rem';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + 'px';
    }
  }, [value]);

  return textareaRef;
};
