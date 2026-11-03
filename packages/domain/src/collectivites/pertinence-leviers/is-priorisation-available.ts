import {
  CollectiviteType,
  collectiviteTypeEnum,
} from '../collectivite-type.enum';

const typesWithPriorisation: readonly CollectiviteType[] = [
  collectiviteTypeEnum.EPCI,
  collectiviteTypeEnum.TEST,
];

export const isPriorisationAvailable = (type: CollectiviteType): boolean =>
  typesWithPriorisation.includes(type);
