import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { IndicateurLockRepository } from '@tet/backend/indicateurs/indicateur/indicateur-lock.repository';
import { AddIndicateurLinksService } from '@tet/backend/indicateurs/indicateurs/add-indicateur-links/add-indicateur-links.service';
import CreateIndicateurService from '@tet/backend/indicateurs/indicateurs/mutate-indicateur/create-indicateur.service';
import { ReconcileIndicateurValeursService } from '@tet/backend/indicateurs/valeurs/reconcile-indicateur-valeurs/reconcile-indicateur-valeurs.service';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { CreatePlanAggregateOutput } from '../create-plan-aggregate/create-plan-aggregate.types';
import { ManagePlanIndicateurSourceService } from '../manage-plan-indicateur-source/manage-plan-indicateur-source.service';
import { PersistPlanIndicateursService } from './persist-plan-indicateurs.service';
import { PersistPlanIndicateursInput } from './persist-plan-indicateurs.types';

const collectiviteId = 3;
const context = {
  user: buildRequesterUser('00000000-0000-0000-0000-000000000001'),
  tx: {} as Transaction,
};

const input: PersistPlanIndicateursInput = {
  collectiviteId,
  indicateurs: [
    {
      sourceKey: 'consommation',
      indicateurId: 10,
      target: { axeSourceKey: 'axe' },
    },
  ],
};

const plan: CreatePlanAggregateOutput = {
  planId: 1,
  axeIdsBySourceKey: new Map([['axe', 5]]),
  ficheIdsBySourceKey: new Map(),
  createdFicheIds: [],
};

const toServiceWithMocks = ({
  lockIndicateurs = vi.fn().mockResolvedValue(success([])),
  addLinks = vi.fn().mockResolvedValue(success(undefined)),
}: {
  lockIndicateurs?: ReturnType<typeof vi.fn>;
  addLinks?: ReturnType<typeof vi.fn>;
}) => {
  const locks = {
    lockForIndicateurMutation: vi.fn(),
    lockIndicateurs,
  } as unknown as IndicateurLockRepository;
  const createIndicateur = {} as unknown as CreateIndicateurService;
  const links = { addLinks } as unknown as AddIndicateurLinksService;
  const values = {} as unknown as ReconcileIndicateurValeursService;
  const sources = {} as unknown as ManagePlanIndicateurSourceService;
  return new PersistPlanIndicateursService(
    locks,
    createIndicateur,
    links,
    values,
    sources
  );
};

describe('PersistPlanIndicateursService, échecs imprévus', () => {
  it('convertit une exception du verrouillage en DATABASE_ERROR avec sa cause', async () => {
    const cause = new Error('verrou perdu');

    const result = await toServiceWithMocks({
      lockIndicateurs: vi.fn().mockRejectedValue(cause),
    }).lockAndValidate(input, context);

    expect(result).toEqual(failure([{ code: 'DATABASE_ERROR' }], cause));
  });

  it('porte la clé source de l’entrée en cours quand la liaison de la deuxième entrée lance', async () => {
    const cause = new Error('connexion perdue');
    const twoEntries: PersistPlanIndicateursInput = {
      collectiviteId,
      indicateurs: [
        ...input.indicateurs,
        {
          sourceKey: 'production',
          indicateurId: 11,
          target: { axeSourceKey: 'axe' },
        },
      ],
    };

    const result = await toServiceWithMocks({
      addLinks: vi
        .fn()
        .mockResolvedValueOnce(success(undefined))
        .mockRejectedValueOnce(cause),
    }).persist(twoEntries, plan, context);

    expect(result).toEqual(
      failure([{ code: 'DATABASE_ERROR', sourceKey: 'production' }], cause)
    );
  });

  it.each([
    ['ForbiddenException', new ForbiddenException('refusé')],
    ['BadRequestException', new BadRequestException('invalide')],
  ])(
    'ne mappe plus une %s en code métier : elle devient DATABASE_ERROR',
    async (_name, cause) => {
      const result = await toServiceWithMocks({
        addLinks: vi.fn().mockRejectedValue(cause),
      }).persist(input, plan, context);

      expect(result).toEqual(
        failure([{ code: 'DATABASE_ERROR', sourceKey: 'consommation' }], cause)
      );
    }
  );

  it('propage le failure de liaison avec sa clé source', async () => {
    const result = await toServiceWithMocks({
      addLinks: vi.fn().mockResolvedValue(failure('UNAUTHORIZED')),
    }).persist(input, plan, context);

    expect(result).toMatchObject({
      success: false,
      error: [{ code: 'UNAUTHORIZED', sourceKey: 'consommation' }],
    });
  });
});
