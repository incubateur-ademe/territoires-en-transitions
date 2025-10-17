export * from '@/backend/indicateurs/definitions/handle-definition-services/indicateur-service-tag.table';
export * from '@/backend/indicateurs/definitions/indicateur-definition.table';
export * from '@/backend/indicateurs/definitions/list-definitions/list-definitions.input';
export * from '@/backend/indicateurs/definitions/list-definitions/list-definitions.output';
export * from '@/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
export * from '@/backend/indicateurs/shared/models/indicateur-source.table';
export * from '@/backend/indicateurs/trajectoires/calcul-trajectoire.request';
export * from '@/backend/indicateurs/trajectoires/calcul-trajectoire.response';
export {
  hasEnoughCarbonSequestrationDataFromSource,
  hasEnoughConsommationsFinalesDataFromSource,
  hasEnoughEmissionsGesDataFromSource,
  MINIMAL_NUMBER_OF_VALID_VALUES_FOR_CONSOMMATIONS_FINALES,
  MINIMAL_NUMBER_OF_VALID_VALUES_FOR_EMISSIONS_GES,
} from '@/backend/indicateurs/trajectoires/domain/can-trajectoire-be-computed';
export * from '@/backend/indicateurs/trajectoires/domain/consommations-finales-properties';
export * from '@/backend/indicateurs/trajectoires/domain/constants';
export * from '@/backend/indicateurs/trajectoires/domain/ges-emissions-properties';
export * from '@/backend/indicateurs/trajectoires/domain/get-indicateur-trajectoire-for-value-input';
export { getIndicateurTrajectoireForValueInput } from '@/backend/indicateurs/trajectoires/domain/get-indicateur-trajectoire-for-value-input';
export * from '@/backend/indicateurs/trajectoires/domain/source-indicateur';
export * from '@/backend/indicateurs/trajectoires/domain/trajectoire-secteurs.enum';
export * from '@/backend/indicateurs/trajectoires/domain/trajectoires-carbon-sequestration-properties';
export * from '@/backend/indicateurs/trajectoires/domain/types';
export * from '@/backend/indicateurs/trajectoires/verification-trajectoire.request';
export * from '@/backend/indicateurs/trajectoires/verification-trajectoire.response';
export * from '@/backend/indicateurs/valeurs/indicateur-valeur.table';
export * from '@/backend/indicateurs/valeurs/valeurs.constants';
export { COLLECTIVITE_SOURCE_ID } from '@/backend/indicateurs/valeurs/valeurs.constants';
