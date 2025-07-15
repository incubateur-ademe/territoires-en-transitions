import { RouterInput } from '@/api/utils/trpc/client';

import {
  SANS_PILOTE_LABEL,
  SANS_PRIORITE_LABEL,
  SANS_REFERENT_LABEL,
  SANS_STATUT_LABEL,
} from '@/backend/plans/fiches/shared/labels';
import * as formatter from './filter-formatters';
import { Filters, RawFilters } from './types';

describe('useFichesActionFiltresListe adapter', () => {
  it('format to search parameter format', () => {
    const filters: Filters = {
      collectivite_id: 1,
      axes: [1],
      statuts: ['À venir', SANS_STATUT_LABEL],
      referents: [SANS_REFERENT_LABEL, 'John Doe'],
      pilotes: [SANS_PILOTE_LABEL, 'Jane Doe'],
      priorites: ['Bas', 'Moyen', SANS_PRIORITE_LABEL],
    };
    const expected: RawFilters = {
      collectivite_id: 1,
      axes: [1],
      statuts: ['À venir'],
      sans_statut: ['1'],
      sans_referent: ['1'],
      referents: ['John Doe'],
      sans_pilote: ['1'],
      pilotes: ['Jane Doe'],
      priorites: ['Bas', 'Moyen'],
      sans_niveau: ['1'],
    };
    const result = formatter.toSearchParameterFormat(filters);
    expect(result).toEqual(expected);
  });

  it('format from search parameter format', () => {
    const filters: RawFilters = {
      collectivite_id: 1,
      axes: [1],
      statuts: ['À venir'],
      sans_statut: ['1'],
      referents: ['John Doe'],
      sans_referent: ['1'],
      pilotes: ['Jane Doe'],
      sans_pilote: ['1'],
      priorites: ['Bas', 'Moyen'],
      sans_niveau: ['1'],
    };
    const expected: Filters = {
      collectivite_id: 1,
      axes: [1],
      statuts: ['À venir', SANS_STATUT_LABEL],
      priorites: ['Bas', 'Moyen', SANS_PRIORITE_LABEL],
      referents: ['John Doe', SANS_REFERENT_LABEL],
      pilotes: ['Jane Doe', SANS_PILOTE_LABEL],
    };
    const result = formatter.fromSearchParameterFormat(filters);
    expect(result).toEqual(expected);
  });

  it('is an identity function when running toSearchParameterFormat and fromSearchParameterFormat', () => {
    const filters: Filters = {
      collectivite_id: 1,
      axes: [1],
    };
    const expected: Filters = {
      collectivite_id: 1,
      axes: [1],
    };
    const result = formatter.fromSearchParameterFormat(
      formatter.toSearchParameterFormat(filters)
    );
    expect(result).toEqual(expected);
  });

  it('format to query payload', () => {
    const filters: RawFilters = {
      collectivite_id: 1,
      axes: [1],
      statuts: ['À venir'],
      sans_statut: ['1'],
      referents: ['222', '123e4567-e89b-12d3-a456-426614174000'],
      sans_referent: ['1'],
      pilotes: ['111', '123e4567-e89b-12d3-a456-426614174000'],
      sans_pilote: ['1'],
      priorites: ['Bas', 'Moyen'],
      sans_niveau: ['1'],
    };
    const expected: RouterInput['plans']['fiches']['listResumes']['filters'] = {
      statuts: ['À venir'],
      noStatut: true,
      priorites: ['Bas', 'Moyen'],
      noPriorite: true,
      noReferent: true,
      noPilote: true,
      personneReferenteIds: [222],
      utilisateurReferentIds: ['123e4567-e89b-12d3-a456-426614174000'],
      personnePiloteIds: [111],
      utilisateurPiloteIds: ['123e4567-e89b-12d3-a456-426614174000'],
    };
    const result = formatter.toQueryPayload(filters);
    expect(result).toEqual(expected);
  });
});
