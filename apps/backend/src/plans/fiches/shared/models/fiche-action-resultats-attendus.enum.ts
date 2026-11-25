export enum ficheActionResultatsAttendusEnumType {
  ADAPTATION_CHANGEMENT_CLIMATIQUE = 'Adaptation au changement climatique',
  ALLONGEMENT_DUREE_USAGE = 'Allongement de la durée d’usage',
  AMELIORATION_QUALITE_VIE = 'Amélioration de la qualité de vie',
  DEVELOPPEMENT_ENERGIES_RENOUVELABLES = 'Développement des énergies renouvelables',
  EFFICACITE_ENERGETIQUE = 'Efficacité énergétique',
  PRESERVATION_BIODIVERSITE = 'Préservation de la biodiversité',
  REDUCTION_CONSOMMATIONS_ENERGETIQUES = 'Réduction des consommations énergétiques',
  REDUCTION_DECHETS = 'Réduction des déchets',
  REDUCTION_EMISSIONS_GES = 'Réduction des émissions de gaz à effet de serre',
  REDUCTION_POLLUANTS_ATMOSPHERIQUES = 'Réduction des polluants atmosphériques',
  SOBRIETE_ENERGETIQUE = 'Sobriété énergétique',
}
export const ficheActionResultatsAttenduValues = Object.values(
  ficheActionResultatsAttendusEnumType
) as [
  ficheActionResultatsAttendusEnumType,
  ...ficheActionResultatsAttendusEnumType[]
];
