import { OPEN_AXES_KEY_SEARCH_PARAMETER } from '@/app/app/paths';
import { TProfondeurAxe } from '@/app/plans/plans/types';
import { parseAsArrayOf, parseAsInteger, useQueryState } from 'nuqs';
import { useState } from 'react';

/**
 * Hook pour gérer la sélection d'axes dans une arborescence.
 * Filtre les axes sélectionnés pour ne garder que ceux avec une profondeur inférieure,
 * puis ajoute le nouvel axe si les conditions sont remplies.
 * @returns Un objet contenant les axes sélectionnés, la fonction pour sélectionner un axe,
 * et la fonction pour ouvrir les axes parents et scroller vers un élément
 */
export const useSelectAxes = () => {
  const [selectedAxes, setSelectedAxes] = useState<TProfondeurAxe[]>([]);

  // Gestion de l'état d'ouverture des axes dans l'arborescence principale
  const [, setOpenAxes] = useQueryState(
    OPEN_AXES_KEY_SEARCH_PARAMETER,
    parseAsArrayOf(parseAsInteger).withDefault([])
  );

  const handleSelectAxe = (selectedAxe: TProfondeurAxe) => {
    setSelectedAxes((prevSelectedAxes) => {
      const selectedDepth = selectedAxe.profondeur;
      const currentDepth = prevSelectedAxes.length - 1;
      const isAlreadySelected = prevSelectedAxes.some(
        (axe) => axe.axe.id === selectedAxe.axe.id
      );

      if (isAlreadySelected && selectedDepth === currentDepth) {
        return prevSelectedAxes;
      }

      const newSelectedAxes = [
        ...prevSelectedAxes.filter((axe) => axe.profondeur < selectedDepth),
      ];

      if (
        !isAlreadySelected ||
        (isAlreadySelected && selectedDepth < currentDepth)
      ) {
        newSelectedAxes.push(selectedAxe);
      }

      return newSelectedAxes;
    });
  };

  /**
   * Ouvre les axes parents du nouvel emplacement et scrolle vers l'élément déplacé.
   * Utilisé après le déplacement d'un axe ou d'une fiche.
   * @param elementId - ID de l'élément vers lequel scroller (axe ou fiche)
   */
  const openParentAxesAndScrollToElement = (elementId: string) => {
    // ouvre les parents de l'axe du nouvel emplacement pour que le scroll fonctionne
    const axesToOpen = [...new Set(selectedAxes.map((a) => a.axe.id))];
    setOpenAxes(axesToOpen);

    // scroll vers le nouvel emplacement de l'élément
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', inline: 'end' });
      }
    }, 100);
  };

  return {
    selectedAxes,
    setSelectedAxes,
    handleSelectAxe,
    openParentAxesAndScrollToElement,
  };
};
