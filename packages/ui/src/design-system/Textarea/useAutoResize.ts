import {RefObject, useLayoutEffect, useRef} from 'react';

/**
 * Rend un champ de texte avec redimensionnement automatique en fonction de son contenu
 * Copié / adapté depuis:
 * https://www.kindacode.com/article/react-typescript-create-an-autosize-textarea-from-scratch/
 * https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/#comment-1794830
 */

export const useAutoResize = (
  value?: string,
  forwardRef?: RefObject<HTMLTextAreaElement> | null
) => {
  // Référence locale associée à la balise <textarea/>
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Référence associée à la balise invisible <div/>
  // Cette div permet de conserver la hauteur pour éviter
  // les sauts dans la page à la mise à jour du texte
  const shadowRef = useRef<HTMLDivElement | null>(null);

  // Référence associée à la balise <textarea>
  // (locale ou issue des props)
  const textareaRef = forwardRef ? forwardRef : ref;

  // Permet de set la taille du textarea au changement de valeur
  useLayoutEffect(() => {
    if (textareaRef && textareaRef.current && shadowRef && shadowRef.current) {
      // Initialise la hauteur du textarea à 0px
      textareaRef.current.style.height = '0px';

      // Met à jour la hauteur en fonction du contenu
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + 'px';

      // Une div invisible qui permet de conserver la hauteur pour éviter
      // les sauts dans la page à la mise à jour du texte
      shadowRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return {textareaRef, shadowRef};
};
