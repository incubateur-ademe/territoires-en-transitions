export const emissionsGesDataIsSufficient = (
  donnees: (number | null)[]
): {
  isDataSufficient: boolean;
  warningMessage?: string;
} => {
  const MINIMAL_NUMBER_OF_VALID_VALUES_FOR_EMISSIONS_GES = 4;

  const valeurEmissionGesValides = donnees.filter((v) => v !== null).length;

  const isDataSufficient =
    valeurEmissionGesValides >=
    MINIMAL_NUMBER_OF_VALID_VALUES_FOR_EMISSIONS_GES;
  if (isDataSufficient) {
    return {
      isDataSufficient,
    };
  }
  return {
    isDataSufficient,
    warningMessage: `Il est nécessaire de saisir au moins ${MINIMAL_NUMBER_OF_VALID_VALUES_FOR_EMISSIONS_GES} valeurs validées pour lancer un calcul de trajectoire.`,
  };
};

export const consommationsFinalesDataIsSufficient = (
  donnees: (number | null)[]
): {
  isDataSufficient: boolean;
  warningMessage?: string;
} => {
  const MINIMAL_NUMBER_OF_VALID_VALUES_FOR_CONSOMMATIONS_FINALES = 3;

  const valeurConsommationFinalesValides = donnees.filter(
    (v) => v !== null
  ).length;

  const isDataSufficient =
    valeurConsommationFinalesValides >=
    MINIMAL_NUMBER_OF_VALID_VALUES_FOR_CONSOMMATIONS_FINALES;

  if (isDataSufficient) {
    return {
      isDataSufficient,
    };
  }
  return {
    isDataSufficient,
    warningMessage: `Il est nécessaire de saisir au moins ${MINIMAL_NUMBER_OF_VALID_VALUES_FOR_CONSOMMATIONS_FINALES} valeurs validées pour lancer un calcul de trajectoire.`,
  };
};

export const canTrajectoireBeComputedFromInputData = (donnees: {
  emissionsGesValeurs: { valeur: number | null }[];
  consommationsFinalesValeurs: { valeur: number | null }[];
}): boolean => {
  return (
    emissionsGesDataIsSufficient(
      donnees.emissionsGesValeurs.map((v) => v.valeur)
    ).isDataSufficient &&
    consommationsFinalesDataIsSufficient(
      donnees.consommationsFinalesValeurs.map((v) => v.valeur)
    ).isDataSufficient
  );
};
