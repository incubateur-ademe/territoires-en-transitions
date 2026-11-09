import { describe, expect, it } from 'vitest';
import { filterAndSortDossiers } from './labellisations-admin.utils';

const a = {
  id: 'a',
  envoyeeLe: '2026-03-01',
  auditAttribueLe: null,
  dateFin: null,
  labellisationObtenueLe: null,
  sujet: 'cot',
  statut: 'audit_valide',
} as const;
const b = {
  id: 'b',
  envoyeeLe: null,
  auditAttribueLe: '2026-05-01',
  dateFin: null,
  labellisationObtenueLe: null,
  sujet: 'labellisation',
  statut: 'demande_envoyee',
} as const;
const c = {
  id: 'c',
  envoyeeLe: '2026-01-01',
  auditAttribueLe: '2026-02-01',
  dateFin: null,
  labellisationObtenueLe: null,
  sujet: null,
  statut: 'audit_en_cours',
} as const;
const dossiers = [a, b, c];
const noFilter = {
  sujets: [],
  statuts: [],
  sort: null,
  direction: 'asc',
} as const;
const ids = (list: { id: string }[]) => list.map((d) => d.id);

describe('filterAndSortDossiers', () => {
  it('garde l’ordre reçu sans filtre ni tri', () => {
    expect(ids(filterAndSortDossiers(dossiers, noFilter))).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('filtre par sujet et par statut', () => {
    expect(
      ids(
        filterAndSortDossiers(dossiers, {
          ...noFilter,
          sujets: ['cot', 'labellisation'],
        })
      )
    ).toEqual(['a', 'b']);
    expect(
      ids(
        filterAndSortDossiers(dossiers, {
          ...noFilter,
          statuts: ['audit_en_cours'],
        })
      )
    ).toEqual(['c']);
  });

  it('trie par date, valeurs absentes en fin de liste dans les deux sens', () => {
    expect(
      ids(filterAndSortDossiers(dossiers, { ...noFilter, sort: 'envoyeeLe' }))
    ).toEqual(['c', 'a', 'b']);
    expect(
      ids(
        filterAndSortDossiers(dossiers, {
          ...noFilter,
          sort: 'envoyeeLe',
          direction: 'desc',
        })
      )
    ).toEqual(['a', 'c', 'b']);
  });

  it('trie sur chaque colonne de date', () => {
    expect(
      ids(
        filterAndSortDossiers(dossiers, {
          ...noFilter,
          sort: 'auditAttribueLe',
        })
      )
    ).toEqual(['c', 'b', 'a']);
  });

  it('trie sujets et statuts dans l’ordre de leur enum', () => {
    expect(
      ids(filterAndSortDossiers(dossiers, { ...noFilter, sort: 'sujet' }))
    ).toEqual(['b', 'a', 'c']);
    expect(
      ids(filterAndSortDossiers(dossiers, { ...noFilter, sort: 'statut' }))
    ).toEqual(['b', 'c', 'a']);
  });
});
