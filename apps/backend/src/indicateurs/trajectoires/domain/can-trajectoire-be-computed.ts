export const emissionsGesAreExhaustiveEnough = (
  donnees: (number | null)[]
): {
  isExhaustiveEnough: boolean;
  warningMessage?: string;
} => {
  const MINIMAL_NUMBER_OF_VALID_VALUES_FOR_EMISSIONS_GES = 4;

  const valeurEmissionGesValides = donnees.filter((v) => v !== null).length;

  const isExhaustiveEnough =
    valeurEmissionGesValides >=
    MINIMAL_NUMBER_OF_VALID_VALUES_FOR_EMISSIONS_GES;
  if (isExhaustiveEnough) {
    return {
      isExhaustiveEnough,
    };
  }
  return {
    isExhaustiveEnough,
    warningMessage: `Il est nécessaire de saisir au moins ${MINIMAL_NUMBER_OF_VALID_VALUES_FOR_EMISSIONS_GES} valeurs validées pour lancer un calcul de trajectoire.`,
  };
};

export const consommationsFinalesAreExhaustiveEnough = (
  donnees: (number | null)[]
): {
  isExhaustiveEnough: boolean;
  warningMessage?: string;
} => {
  const MINIMAL_NUMBER_OF_VALID_VALUES_FOR_CONSUMPTIONS_FINALES = 3;

  const valeurConsommationFinalesValides = donnees.filter(
    (v) => v !== null
  ).length;

  const isExhaustiveEnough =
    valeurConsommationFinalesValides >=
    MINIMAL_NUMBER_OF_VALID_VALUES_FOR_CONSUMPTIONS_FINALES;

  if (isExhaustiveEnough) {
    return {
      isExhaustiveEnough,
    };
  }
  return {
    isExhaustiveEnough,
    warningMessage: `Il est nécessaire de saisir au moins ${MINIMAL_NUMBER_OF_VALID_VALUES_FOR_CONSUMPTIONS_FINALES} valeurs validées pour lancer un calcul de trajectoire.`,
  };
};

export const canTrajectoireBeComputedFromInputData = (donnees: {
  emissionsGesValeurs: { valeur: number | null }[];
  consommationsFinalesValeurs: { valeur: number | null }[];
}): boolean => {
  return (
    emissionsGesAreExhaustiveEnough(
      donnees.emissionsGesValeurs.map((v) => v.valeur)
    ).isExhaustiveEnough &&
    consommationsFinalesAreExhaustiveEnough(
      donnees.consommationsFinalesValeurs.map((v) => v.valeur)
    ).isExhaustiveEnough
  );
};
