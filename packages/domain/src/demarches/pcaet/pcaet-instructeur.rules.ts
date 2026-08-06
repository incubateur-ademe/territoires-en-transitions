import {
  CollectiviteType,
  collectiviteTypeEnum,
} from '../../collectivites';

export const typesInstructeur: readonly CollectiviteType[] = [
  collectiviteTypeEnum.DREAL,
];

export const isTypeInstructeur = (type: CollectiviteType): boolean =>
  typesInstructeur.includes(type);

export type CleGeoInstructeur = 'regionCode' | 'departementCode';

const cleGeoParTypeInstructeur: Partial<
  Record<CollectiviteType, CleGeoInstructeur>
> = {
  [collectiviteTypeEnum.DREAL]: 'regionCode',
};

export const getCleGeoInstructeur = (
  type: CollectiviteType
): CleGeoInstructeur | undefined => cleGeoParTypeInstructeur[type];
