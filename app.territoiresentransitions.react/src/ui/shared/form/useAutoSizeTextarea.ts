import {RefObject, useLayoutEffect, useRef} from 'react';

/**
 * Rend un champ de saisi qui se redimensionne en fonction de son contenu.
 * copié/adapté depuis: https://www.kindacode.com/article/react-typescript-create-an-autosize-textarea-from-scratch/
 * (il ne parait pas nécessaire d'ajouter une dépendance supplémentaire pour cette fonctionnalité)
 */
export const useAutoSizeTextarea = (
  value?: string,
  forwardRef?: RefObject<HTMLTextAreaElement> | null
) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);

  const textareaRef = forwardRef ? forwardRef : ref;

  // Permet de set la taille du textarea au changement de valeur
  useLayoutEffect(() => {
    if (textareaRef && textareaRef.current && shadowRef && shadowRef.current) {
      // Permet ensuite de récupérer la hauteur nécessaire dans scrollHeight
      textareaRef.current.style.height = '0px';

      // Met à jour la hauteur en fonction du contenu
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';

      // Une div invisible permet de conserver la hauteur pour éviter
      // les sauts dans la page à la mise à jour du texte
      shadowRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return {textareaRef, shadowRef};
};
