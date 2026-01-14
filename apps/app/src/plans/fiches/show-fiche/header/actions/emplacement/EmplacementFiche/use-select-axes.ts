import { TProfondeurAxe } from '@/app/plans/plans/types';
import { useState } from 'react';

/**
 * Hook pour gérer la sélection d'axes dans une arborescence.
 * Filtre les axes sélectionnés pour ne garder que ceux avec une profondeur inférieure,
 * puis ajoute le nouvel axe si les conditions sont remplies.
 * @returns Un objet contenant les axes sélectionnés et la fonction pour sélectionner un axe
 */
export const useSelectAxes = () => {
  const [selectedAxes, setSelectedAxes] = useState<TProfondeurAxe[]>([]);

  const handleSelectAxe = (selectedAxe: TProfondeurAxe) => {
    setSelectedAxes((prevSelectedAxes) => {
      const selectedDepth = selectedAxe.profondeur;
      const currentDepth = prevSelectedAxes.length - 1;
      const isAlreadySelected = prevSelectedAxes.some(
        (axe) => axe.axe.id === selectedAxe.axe.id
      );

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

  return {
    selectedAxes,
    setSelectedAxes,
    handleSelectAxe,
  };
};
