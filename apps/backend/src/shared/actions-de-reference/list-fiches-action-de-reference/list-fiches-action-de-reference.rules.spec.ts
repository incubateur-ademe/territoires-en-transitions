import { FicheWithRelations } from '@tet/domain/plans';
import { describe, expect, it } from 'vitest';
import { maskFichesNotReadableBy } from './list-fiches-action-de-reference.rules';

const toFiche = ({
  id,
  collectiviteId,
  restreint,
}: Pick<
  FicheWithRelations,
  'id' | 'collectiviteId' | 'restreint'
>): FicheWithRelations =>
  ({
    id,
    collectiviteId,
    restreint,
    titre: `Fiche ${id}`,
    description: 'Description confidentielle',
  } as FicheWithRelations);

const toDescriptionsById = (
  fiches: readonly FicheWithRelations[]
): Record<number, FicheWithRelations['description']> =>
  Object.fromEntries(fiches.map(({ id, description }) => [id, description]));

describe('maskFichesNotReadableBy', () => {
  it('masque la description d une fiche restreinte dont la collectivité est hors accès', () => {
    const fiches = maskFichesNotReadableBy({
      fiches: [toFiche({ id: 1, collectiviteId: 10, restreint: true })],
      collectiviteIdsWithRestreinteAccess: new Set<number>(),
    });

    expect(toDescriptionsById(fiches)).toEqual({ 1: null });
  });

  it('garde le titre d une fiche restreinte masquée', () => {
    const [fiche] = maskFichesNotReadableBy({
      fiches: [toFiche({ id: 1, collectiviteId: 10, restreint: true })],
      collectiviteIdsWithRestreinteAccess: new Set<number>(),
    });

    expect(fiche.titre).toBe('Fiche 1');
  });

  it('rend entière une fiche restreinte dont la collectivité est accessible', () => {
    const fiches = maskFichesNotReadableBy({
      fiches: [toFiche({ id: 1, collectiviteId: 10, restreint: true })],
      collectiviteIdsWithRestreinteAccess: new Set([10]),
    });

    expect(toDescriptionsById(fiches)).toEqual({
      1: 'Description confidentielle',
    });
  });

  it('rend entière une fiche non restreinte, accès ou non', () => {
    const fiches = maskFichesNotReadableBy({
      fiches: [
        toFiche({ id: 1, collectiviteId: 10, restreint: false }),
        toFiche({ id: 2, collectiviteId: 10, restreint: null }),
      ],
      collectiviteIdsWithRestreinteAccess: new Set<number>(),
    });

    expect(toDescriptionsById(fiches)).toEqual({
      1: 'Description confidentielle',
      2: 'Description confidentielle',
    });
  });

  it('juge chaque fiche restreinte sur sa propre collectivité', () => {
    const fiches = maskFichesNotReadableBy({
      fiches: [
        toFiche({ id: 1, collectiviteId: 10, restreint: true }),
        toFiche({ id: 2, collectiviteId: 20, restreint: true }),
      ],
      collectiviteIdsWithRestreinteAccess: new Set([20]),
    });

    expect(toDescriptionsById(fiches)).toEqual({
      1: null,
      2: 'Description confidentielle',
    });
  });
});
