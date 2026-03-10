import { PersonnalisationFilterKeys } from './personnalisation-filters.types';

export const personnalisationUrlKeys: Record<
  PersonnalisationFilterKeys,
  string
> = {
  thematiqueIds: 't',
  referentielIds: 'r',
  actionIds: 'a',
  questionIds: 'q',
};
