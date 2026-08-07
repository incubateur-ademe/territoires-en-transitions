import {
  CollectiviteType,
  collectiviteTypeEnum,
} from './collectivite-type.enum';

export const servicesDeconcentresTypes: readonly CollectiviteType[] = [
  collectiviteTypeEnum.DREAL,
];

export const isServiceDeconcentre = (type: CollectiviteType): boolean =>
  servicesDeconcentresTypes.includes(type);
