// `index-domain.ts` file must only contain exports that are shareable with client-side apps.
// Exports from this file can be imported with `@/domain/*` alias path.

export * from './definitions/handle-definition-services/indicateur-service-tag.table';
export * from './definitions/indicateur-definition.table';
export * from './definitions/list-definitions/list-definitions.input';
export * from './definitions/list-definitions/list-definitions.output';
export * from './shared/models/indicateur-source-metadonnee.table';
export * from './shared/models/indicateur-source.table';
export * from './trajectoires/calcul-trajectoire.request';
export * from './trajectoires/calcul-trajectoire.response';
export {
  hasEnoughCarbonSequestrationDataFromSource,
  hasEnoughConsommationsFinalesDataFromSource,
  hasEnoughEmissionsGesDataFromSource,
  MINIMAL_NUMBER_OF_VALID_VALUES_FOR_CONSOMMATIONS_FINALES,
  MINIMAL_NUMBER_OF_VALID_VALUES_FOR_EMISSIONS_GES,
} from './trajectoires/domain/can-trajectoire-be-computed';
export * from './trajectoires/domain/consommations-finales-properties';
export * from './trajectoires/domain/constants';
export * from './trajectoires/domain/ges-emissions-properties';
export * from './trajectoires/domain/get-indicateur-trajectoire-for-value-input';
export { getIndicateurTrajectoireForValueInput } from './trajectoires/domain/get-indicateur-trajectoire-for-value-input';
export * from './trajectoires/domain/source-indicateur';
export * from './trajectoires/domain/trajectoire-secteurs.enum';
export * from './trajectoires/domain/trajectoires-carbon-sequestration-properties';
export * from './trajectoires/domain/types';
export * from './trajectoires/verification-trajectoire.request';
export * from './trajectoires/verification-trajectoire.response';
export * from './valeurs/indicateur-valeur.table';
export * from './valeurs/valeurs.constants';
export { COLLECTIVITE_SOURCE_ID } from './valeurs/valeurs.constants';
