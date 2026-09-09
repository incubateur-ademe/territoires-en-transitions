import { IndicateurValeurCreate } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { UpsertGridValeursRepository } from './upsert-grid-valeurs.repository';

const makeValeur = (
  indicateurId: number,
  fields: Partial<Pick<IndicateurValeurCreate, 'objectif' | 'resultat'>>
): IndicateurValeurCreate => ({
  indicateurId,
  collectiviteId: 1,
  dateValeur: '2026-01-01',
  metadonneeId: null,
  ...fields,
});

describe('UpsertGridValeursRepository', () => {
  it('regroupe les écritures selon les champs fournis au lieu d une requête par cellule', async () => {
    type ConflictOptions = { set: Record<string, unknown> };
    let currentValues: IndicateurValeurCreate[] = [];
    const returning = vi.fn(async () =>
      currentValues.map((value, index) => ({ ...value, id: index + 1 }))
    );
    const onConflictDoUpdate = vi.fn((_options: ConflictOptions) => ({
      returning,
    }));
    const values = vi.fn((input: IndicateurValeurCreate[]) => {
      currentValues = input;
      return { onConflictDoUpdate };
    });
    const insert = vi.fn(() => ({ values }));
    const repository = new UpsertGridValeursRepository();

    const result = await repository.upsert(
      [
        makeValeur(2, { resultat: 2 }),
        makeValeur(1, { resultat: 1 }),
        makeValeur(3, { objectif: 3 }),
      ],
      { insert } as never
    );

    expect(insert).toHaveBeenCalledTimes(2);
    expect(values).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({ indicateurId: 1, resultat: 1 }),
      expect.objectContaining({ indicateurId: 2, resultat: 2 }),
    ]);
    expect(values).toHaveBeenNthCalledWith(2, [
      expect.objectContaining({ indicateurId: 3, objectif: 3 }),
    ]);
    const firstConflictOptions = onConflictDoUpdate.mock.calls.at(0)?.[0];
    const secondConflictOptions = onConflictDoUpdate.mock.calls.at(1)?.[0];
    expect(firstConflictOptions).toBeDefined();
    expect(secondConflictOptions).toBeDefined();
    if (!firstConflictOptions || !secondConflictOptions) {
      throw new Error("Les deux groupes d'upsert doivent être présents");
    }
    expect(firstConflictOptions.set).toMatchObject({
      calculAuto: false,
      calculAutoIdentifiantsManquants: null,
      resultat: expect.anything(),
    });
    expect(firstConflictOptions.set).not.toHaveProperty('objectif');
    expect(secondConflictOptions.set).toMatchObject({
      calculAuto: false,
      calculAutoIdentifiantsManquants: null,
      objectif: expect.anything(),
    });
    expect(secondConflictOptions.set).not.toHaveProperty('resultat');
    expect(result).toHaveLength(3);
  });
});
