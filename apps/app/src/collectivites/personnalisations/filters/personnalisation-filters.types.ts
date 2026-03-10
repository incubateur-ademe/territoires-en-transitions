import { ReferentielId } from '@tet/domain/referentiels';

export type PersonnalisationFilters = {
  thematiqueIds?: string[];
  referentielIds?: ReferentielId[];
  actionIds?: string[];
  questionIds?: string[];
};

export type PersonnalisationFilterKeys = keyof PersonnalisationFilters;
