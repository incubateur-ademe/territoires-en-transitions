import { AuthRole } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import type { IndicateurTotalReader } from '@tet/domain/indicateurs';
import type { IndicateurValeursReadDenial } from '../indicateur-valeurs-read-access.service';
import type { ParentForTotals } from './get-indicateur-totals.repository';
import { GetIndicateurTotalsService } from './get-indicateur-totals.service';

const user = {
  id: '00000000-0000-0000-0000-000000000001',
  role: AuthRole.AUTHENTICATED,
} as never;

const input = { collectiviteId: 1, indicateurId: 42 };

const toValeurRow = ({
  indicateurId,
  dateValeur,
  resultat,
  objectif,
}: {
  indicateurId: number;
  dateValeur: string;
  resultat: number;
  objectif: number;
}) => ({
  indicateurValeur: { indicateurId, dateValeur, resultat, objectif },
});

const complete = (valeur: number) => ({ status: 'complete', valeur });

const createService = ({
  readerResult = success('member') as Result<
    IndicateurTotalReader,
    IndicateurValeursReadDenial
  >,
  parent = { precision: 2, confidentiel: false } as ParentForTotals | null,
  sousIndicateurs = [
    { id: 7, confidentiel: false },
    { id: 8, confidentiel: true },
  ],
}: {
  readerResult?: Result<IndicateurTotalReader, IndicateurValeursReadDenial>;
  parent?: ParentForTotals | null;
  sousIndicateurs?: { id: number; confidentiel: boolean }[];
} = {}) => {
  const repository = {
    getParentForTotals: vi.fn().mockResolvedValue(parent),
    listSousIndicateurs: vi.fn().mockResolvedValue(sousIndicateurs),
  };
  const valeursRepository = {
    listIndicateurValeurs: vi.fn().mockResolvedValue(
      success([
        toValeurRow({
          indicateurId: 7,
          dateValeur: '2022-01-01',
          resultat: 1.5,
          objectif: 10,
        }),
        toValeurRow({
          indicateurId: 8,
          dateValeur: '2022-01-01',
          resultat: 2.25,
          objectif: 20,
        }),
        toValeurRow({
          indicateurId: 7,
          dateValeur: '2023-01-01',
          resultat: 3,
          objectif: 11,
        }),
        toValeurRow({
          indicateurId: 8,
          dateValeur: '2023-01-01',
          resultat: 4,
          objectif: 21,
        }),
      ])
    ),
  };
  const readAccessService = {
    resolveReader: vi.fn().mockResolvedValue(readerResult),
  };
  const service = new GetIndicateurTotalsService(
    repository as never,
    valeursRepository as never,
    readAccessService as never
  );
  return { service, repository, valeursRepository };
};

describe('GetIndicateurTotalsService', () => {
  it('rend à un membre les totaux de résultats et d’objectifs de chaque date, y compris la plus récente', async () => {
    const { service } = createService();

    await expect(service.getIndicateurTotals(input, { user })).resolves.toEqual(
      success([
        {
          dateValeur: '2022-01-01',
          resultat: complete(3.75),
          objectif: complete(30),
        },
        {
          dateValeur: '2023-01-01',
          resultat: complete(7),
          objectif: complete(32),
        },
      ])
    );
  });

  it('masque à un visiteur le résultat de la date du dernier résultat d’un enfant confidentiel mais pas l’objectif', async () => {
    const { service } = createService({ readerResult: success('visitor') });

    await expect(service.getIndicateurTotals(input, { user })).resolves.toEqual(
      success([
        {
          dateValeur: '2022-01-01',
          resultat: complete(3.75),
          objectif: complete(30),
        },
        {
          dateValeur: '2023-01-01',
          resultat: { status: 'hidden' },
          objectif: complete(32),
        },
      ])
    );
  });

  it('masque à un visiteur le résultat le plus récent d’un parent confidentiel', async () => {
    const { service } = createService({
      readerResult: success('visitor'),
      parent: { precision: 2, confidentiel: true },
      sousIndicateurs: [
        { id: 7, confidentiel: false },
        { id: 8, confidentiel: false },
      ],
    });

    await expect(service.getIndicateurTotals(input, { user })).resolves.toEqual(
      success([
        {
          dateValeur: '2022-01-01',
          resultat: complete(3.75),
          objectif: complete(30),
        },
        {
          dateValeur: '2023-01-01',
          resultat: { status: 'hidden' },
          objectif: complete(32),
        },
      ])
    );
  });

  it('ne lit que la source collectivité des sous-indicateurs du parent', async () => {
    const { service, valeursRepository } = createService();

    await service.getIndicateurTotals(input, { user });

    expect(valeursRepository.listIndicateurValeurs).toHaveBeenCalledWith(
      { collectiviteId: 1, indicateurIds: [7, 8], sources: ['collectivite'] },
      undefined
    );
  });

  it('rend une liste vide pour un parent sans sous-indicateur sans lire de valeur', async () => {
    const { service, valeursRepository } = createService({
      sousIndicateurs: [],
    });

    await expect(service.getIndicateurTotals(input, { user })).resolves.toEqual(
      success([])
    );
    expect(valeursRepository.listIndicateurValeurs).not.toHaveBeenCalled();
  });

  it('refuse sans le droit de lire les valeurs', async () => {
    const { service, repository } = createService({
      readerResult: failure('READ_DENIED'),
    });

    await expect(service.getIndicateurTotals(input, { user })).resolves.toEqual(
      failure('UNAUTHORIZED')
    );
    expect(repository.getParentForTotals).not.toHaveBeenCalled();
  });

  it('signale un parent introuvable dans la collectivité', async () => {
    const { service } = createService({ parent: null });

    await expect(service.getIndicateurTotals(input, { user })).resolves.toEqual(
      failure('NOT_FOUND')
    );
  });
});
