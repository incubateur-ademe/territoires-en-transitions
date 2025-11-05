type DataSufficiencyChecker = (donnees: (number | null)[]) => {
  isDataSufficient: boolean;
  warningMessage?: string;
};

export const MINIMAL_NUMBER_OF_VALID_VALUES_FOR_EMISSIONS_GES = 4;

export const hasEnoughEmissionsGesDataFromSource: DataSufficiencyChecker = (
  donnees
) => {
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

export const MINIMAL_NUMBER_OF_VALID_VALUES_FOR_CONSOMMATIONS_FINALES = 3;

export const hasEnoughConsommationsFinalesDataFromSource: DataSufficiencyChecker =
  (donnees) => {
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

export const hasEnoughCarbonSequestrationDataFromSource: DataSufficiencyChecker =
  (donnees) => {
    const valeursValides = donnees.filter((v) => v !== null).length;
    return {
      isDataSufficient: valeursValides > 0,
    };
  };

export const canTrajectoireBeComputedFromInputData = (donnees: {
  emissionsGesValeurs: { valeur: number | null }[];
  consommationsFinalesValeurs: { valeur: number | null }[];
  carbonSequestrationValeurs: { valeur: number | null }[];
}): boolean => {
  return (
    hasEnoughEmissionsGesDataFromSource(
      donnees.emissionsGesValeurs.map((v) => v.valeur)
    ).isDataSufficient &&
    hasEnoughConsommationsFinalesDataFromSource(
      donnees.consommationsFinalesValeurs.map((v) => v.valeur)
    ).isDataSufficient
  );
};
