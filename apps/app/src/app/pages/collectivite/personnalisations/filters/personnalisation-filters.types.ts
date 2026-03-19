import { ReferentielId } from '@tet/domain/referentiels';

export type PersonnalisationFilters = {
  thematiqueIds?: string[];
  referentielIds?: ReferentielId[];
  actionIds?: string[];
};

export type PersonnalisationFilterKeys = keyof PersonnalisationFilters;
