import {
  SANS_PILOTE_LABEL,
  SANS_PRIORITE_LABEL,
  SANS_REFERENT_LABEL,
  SANS_STATUT_LABEL,
} from '@tet/domain/plans';
import * as formatter from './filter-formatters';
import {
  Filters,
  FormFilters,
  QueryPayload,
  searchParametersSchema,
} from './types';

describe('useFichesActionFiltresListe filter formatters', () => {
  it('format from form filters to raw filters', () => {
    const filters: FormFilters = {
      collectiviteId: 1,
      axes: [1],
      statuts: ['À venir', SANS_STATUT_LABEL],
      referents: [SANS_REFERENT_LABEL, 'John Doe'],
      pilotes: [SANS_PILOTE_LABEL, 'Jane Doe'],
      priorites: ['Bas', 'Moyen', SANS_PRIORITE_LABEL],
    };
    const expected: Filters = {
      collectiviteId: 1,
      axes: [1],
      statuts: ['À venir'],
      noStatut: true,
      noReferent: true,
      referents: ['John Doe'],
      noPilote: true,
      pilotes: ['Jane Doe'],
      priorites: ['Bas', 'Moyen'],
      noPriorite: true,
    };
    const result = formatter.splitReferentsAndPilotesIds(filters);
    expect(result).toEqual(expected);
  });

  it('format from raw filters to form filters', () => {
    const filters: Filters = {
      collectiviteId: 1,
      axes: [1],
      statuts: ['À venir'],
      noStatut: true,
      referents: ['John Doe'],
      noReferent: true,
      pilotes: ['Jane Doe'],
      noPilote: true,
      priorites: ['Bas', 'Moyen'],
      noPriorite: true,
    };
    const expected: FormFilters = {
      collectiviteId: 1,
      axes: [1],
      statuts: ['À venir', SANS_STATUT_LABEL],
      priorites: ['Bas', 'Moyen', SANS_PRIORITE_LABEL],
      referents: ['John Doe', SANS_REFERENT_LABEL],
      pilotes: ['Jane Doe', SANS_PILOTE_LABEL],
    };
    const result = formatter.toFilters(filters);
    expect(result).toEqual(expected);
  });

  it('is an identity function when running splitReferentsAndPilotesIds and toFilters', () => {
    const originalFilters: FormFilters = {
      collectiviteId: 1,
      axes: [1],
      statuts: ['À venir', SANS_STATUT_LABEL],
      referents: ['John Doe', SANS_REFERENT_LABEL],
      pilotes: ['Jane Doe', SANS_PILOTE_LABEL],
      priorites: ['Bas', 'Moyen', SANS_PRIORITE_LABEL],
    };

    const result = formatter.toFilters(
      formatter.splitReferentsAndPilotesIds(originalFilters)
    );
    expect(result).toEqual(originalFilters);
  });

  it('format to query payload', () => {
    const filters: Filters = {
      collectiviteId: 1,
      axes: [1],
      statuts: ['À venir'],
      noStatut: true,
      referents: ['222', '123e4567-e89b-12d3-a456-426614174000'],
      noReferent: true,
      pilotes: ['111', '123e4567-e89b-12d3-a456-426614174000'],
      noPilote: true,
      priorites: ['Bas', 'Moyen'],
      noPriorite: true,
    };
    const expected: QueryPayload = {
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

describe('périmètre « Actions et sous-actions »', () => {
  it('conserve withSousActionsMatches du formulaire à la requête', () => {
    const formFilters: FormFilters = {
      collectiviteId: 1,
      axes: [1],
      pilotes: ['111'],
      withSousActionsMatches: true,
    };
    const filters = formatter.splitReferentsAndPilotesIds(formFilters);
    expect(filters).toEqual({
      collectiviteId: 1,
      axes: [1],
      pilotes: ['111'],
      withSousActionsMatches: true,
    });
    expect(formatter.toFilters(filters)).toEqual(formFilters);
    expect(formatter.toQueryPayload(filters)).toMatchObject({
      personnePiloteIds: [111],
      withSousActionsMatches: true,
    });
  });
});

describe('searchParametersSchema', () => {
  it('relit les pilotes et les référents écrits dans l’URL', () => {
    const urlFilters = formatter.splitReferentsAndPilotesIds({
      collectiviteId: 1,
      axes: [],
      pilotes: ['111', '123e4567-e89b-12d3-a456-426614174000'],
      referents: ['222'],
      statuts: ['À venir'],
      withSousActionsMatches: true,
    });
    const { collectiviteId, ...urlValue } = urlFilters;

    expect(searchParametersSchema.parse(urlValue)).toEqual({
      pilotes: ['111', '123e4567-e89b-12d3-a456-426614174000'],
      referents: ['222'],
      statuts: ['À venir'],
      withSousActionsMatches: true,
    });
  });
});
