import {
  CollectiviteType,
  collectiviteTypeEnum,
} from '../collectivite-type.enum';

export const isPriorisationAvailable = (type: CollectiviteType): boolean =>
  type === collectiviteTypeEnum.EPCI;
