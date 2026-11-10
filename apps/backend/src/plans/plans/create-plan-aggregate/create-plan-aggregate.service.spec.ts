import {
  AuthenticatedUser,
  AuthRole,
} from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { ApplicationSousScopesEnum } from '@tet/domain/utils';
import assert from 'node:assert';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanErrorType } from '../plans.errors';
import { CreatePlanAggregateService } from './create-plan-aggregate.service';
import { CreatePlanAggregateInput } from './create-plan-aggregate.types';

describe('CreatePlanAggregateService', () => {
  const mocks = {
    axes: { upsertAxe: vi.fn() },
    plans: { upsertPlan: vi.fn() },
    createFiches: { createFicheWithAuthorization: vi.fn() },
    listFiches: { listFichesQuery: vi.fn() },
    permissions: { assertAllowed: vi.fn() },
    webhooks: { sendWebhookNotifications: vi.fn() },
    secteurs: { createFromImportIa: vi.fn() },
    fichePermissions: { canLinkFicheToCollectivite: vi.fn() },
    fiches: { addAxeLinks: vi.fn() },
  };
  const user: AuthenticatedUser = {
    id: 'user-123',
    role: AuthRole.AUTHENTICATED,
    isAnonymous: false,
    jwtPayload: { role: AuthRole.AUTHENTICATED },
  };
  const tx = {} as Transaction;
  let service: CreatePlanAggregateService;

  const createRequest = (): CreatePlanAggregateInput => ({
    collectiviteId: 1,
    nom: 'Mon Plan Test',
    typeId: 1,
    pilotes: [{ userId: 'pilot-1', tagId: null }],
    referents: [{ userId: null, tagId: 100 }],
    axes: [
      { sourceKey: 'axe', nom: 'Axe 1' },
      { sourceKey: 'sous-axe', parentSourceKey: 'axe', nom: 'Sous-axe 1' },
    ],
    fiches: [
      {
        sourceKey: 'fiche-1',
        axeSourceKey: 'axe',
        fiche: { titre: 'Fiche 1' },
      },
      {
        sourceKey: 'fiche-2',
        axeSourceKey: 'sous-axe',
        fiche: { titre: 'Fiche 2' },
      },
    ],
  });

  beforeEach(() => {
    vi.resetAllMocks();
    let nextAxeId = 10;
    let nextFicheId = 101;
    mocks.plans.upsertPlan.mockResolvedValue(success({ id: 1 }));
    mocks.axes.upsertAxe.mockImplementation(async () =>
      success({ id: nextAxeId++ })
    );
    mocks.createFiches.createFicheWithAuthorization.mockImplementation(
      async () => success({ id: nextFicheId++ })
    );
    mocks.listFiches.listFichesQuery.mockResolvedValue({ data: [], count: 0 });
    mocks.permissions.assertAllowed.mockResolvedValue(undefined);
    mocks.webhooks.sendWebhookNotifications.mockResolvedValue(undefined);
    mocks.secteurs.createFromImportIa.mockResolvedValue(null);
    mocks.fichePermissions.canLinkFicheToCollectivite.mockResolvedValue(true);
    mocks.fiches.addAxeLinks.mockResolvedValue(success(undefined));

    const dependencies = [
      mocks.axes,
      mocks.plans,
      mocks.createFiches,
      mocks.listFiches,
      mocks.permissions,
      mocks.webhooks,
      mocks.secteurs,
      mocks.fichePermissions,
      mocks.fiches,
    ] as unknown as ConstructorParameters<typeof CreatePlanAggregateService>;
    service = new CreatePlanAggregateService(...dependencies);
  });

  it('renvoie les IDs associés aux clés de source sans envoyer de webhook', async () => {
    const result = await service.create(createRequest(), { user, tx });

    expect(result).toEqual(
      success({
        planId: 1,
        axeIdsBySourceKey: new Map([
          ['axe', 10],
          ['sous-axe', 11],
        ]),
        ficheIdsBySourceKey: new Map([
          ['fiche-1', 101],
          ['fiche-2', 102],
        ]),
        createdFicheIds: [101, 102],
      })
    );
    expect(mocks.permissions.assertAllowed).toHaveBeenCalledTimes(1);
    expect(mocks.webhooks.sendWebhookNotifications).not.toHaveBeenCalled();
    expect(mocks.listFiches.listFichesQuery).not.toHaveBeenCalled();
  });

  it("enregistre les secteurs proposés par l'import avec la fiche créée", async () => {
    const request = createRequest();
    request.fiches[0].secteursProposes = {
      secteurs: ['residentiel'],
      justification: 'Rénovation des logements.',
    };

    const result = await service.create(request, { user, tx });

    expect(result.success).toBe(true);
    expect(mocks.secteurs.createFromImportIa).toHaveBeenCalledExactlyOnceWith(
      {
        ficheId: 101,
        secteurs: ['residentiel'],
        justification: 'Rénovation des logements.',
        modifiedBy: user.id,
      },
      tx
    );
  });

  it('crée les parents avant leurs enfants même si les axes sont fournis dans le désordre', async () => {
    const request = createRequest();
    request.axes.reverse();

    const result = await service.create(request, { user, tx });

    expect(result.success).toBe(true);
    expect(mocks.axes.upsertAxe).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ nom: 'Axe 1', parent: 1, planId: 1 }),
      { user, tx }
    );
    expect(mocks.axes.upsertAxe).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ nom: 'Sous-axe 1', parent: 10, planId: 1 }),
      { user, tx }
    );
  });

  it('crée un axe explicite sans fiche', async () => {
    const request = createRequest();
    request.fiches = [];

    const result = await service.create(request, { user, tx });

    assert(result.success);
    expect(result.data.axeIdsBySourceKey.size).toBe(2);
    expect(result.data.createdFicheIds).toEqual([]);
    expect(
      mocks.createFiches.createFicheWithAuthorization
    ).not.toHaveBeenCalled();
  });

  it('conserve deux axes homonymes avec des clés différentes', async () => {
    const request = createRequest();
    request.axes = [
      { sourceKey: 'axe', nom: 'Même titre' },
      { sourceKey: 'sous-axe', nom: 'Même titre' },
    ];

    const result = await service.create(request, { user, tx });

    assert(result.success);
    expect(result.data.axeIdsBySourceKey.get('axe')).not.toBe(
      result.data.axeIdsBySourceKey.get('sous-axe')
    );
  });

  it('transmet les paramètres du plan et la transaction appelante', async () => {
    const request = createRequest();
    request.planId = 42;
    request.dateDebut = '2026-01-01';

    await service.create(request, { user, tx });

    expect(mocks.plans.upsertPlan).toHaveBeenCalledWith(
      {
        id: 42,
        collectiviteId: 1,
        nom: request.nom,
        typeId: 1,
        dateDebut: '2026-01-01',
        dateFin: undefined,
        pilotes: request.pilotes,
        referents: request.referents,
      },
      { user, tx }
    );
  });

  it('rattache les sous-actions à leur parent par clé malgré des titres identiques', async () => {
    const request = createRequest();
    request.fiches = [
      {
        sourceKey: 'parent-a',
        axeSourceKey: 'axe',
        fiche: { titre: 'Parent' },
      },
      {
        sourceKey: 'parent-b',
        axeSourceKey: 'axe',
        fiche: { titre: 'Parent' },
      },
      {
        sourceKey: 'enfant-a',
        parentSourceKey: 'parent-a',
        axeSourceKey: 'axe',
        fiche: { titre: 'Enfant A' },
      },
      {
        sourceKey: 'enfant-b',
        parentSourceKey: 'parent-b',
        axeSourceKey: 'axe',
        fiche: { titre: 'Enfant B' },
      },
    ];

    const result = await service.create(request, { user, tx });

    assert(result.success);
    for (const [titre, parentSourceKey] of [
      ['Enfant A', 'parent-a'],
      ['Enfant B', 'parent-b'],
    ]) {
      expect(
        mocks.createFiches.createFicheWithAuthorization
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          fiche: expect.objectContaining({
            titre,
            parentId: result.data.ficheIdsBySourceKey.get(parentSourceKey),
          }),
          tx,
        })
      );
    }
  });

  it('rattache les fiches sans axe à la racine du plan', async () => {
    const request = createRequest();
    request.axes = [];
    request.fiches = [{ sourceKey: 'fiche', fiche: { titre: 'Sans axe' } }];

    const result = await service.create(request, { user, tx });

    expect(result.success).toBe(true);
    expect(mocks.axes.upsertAxe).not.toHaveBeenCalled();
    expect(
      mocks.createFiches.createFicheWithAuthorization
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        fiche: expect.objectContaining({ parentId: null }),
        ficheFields: expect.objectContaining({ axes: [{ id: 1 }] }),
      })
    );
  });

  it('arrête la création si le plan échoue', async () => {
    mocks.plans.upsertPlan.mockResolvedValue(
      failure(PlanErrorType.DATABASE_ERROR)
    );

    const result = await service.create(createRequest(), { user, tx });

    expect(result).toEqual(failure(PlanErrorType.DATABASE_ERROR));
    expect(mocks.axes.upsertAxe).not.toHaveBeenCalled();
    expect(
      mocks.createFiches.createFicheWithAuthorization
    ).not.toHaveBeenCalled();
  });

  it('arrête la création si un axe échoue', async () => {
    mocks.axes.upsertAxe.mockResolvedValue(
      failure(PlanErrorType.DATABASE_ERROR)
    );

    const result = await service.create(createRequest(), { user, tx });

    expect(result).toEqual(failure(PlanErrorType.DATABASE_ERROR));
    expect(
      mocks.createFiches.createFicheWithAuthorization
    ).not.toHaveBeenCalled();
  });

  it('remonte une erreur de création de fiche', async () => {
    mocks.createFiches.createFicheWithAuthorization.mockResolvedValueOnce(
      failure('SERVER_ERROR')
    );

    const result = await service.create(createRequest(), { user, tx });

    expect(result).toMatchObject({
      success: false,
      error: PlanErrorType.DATABASE_ERROR,
    });
  });

  it('remonte la cause Postgres sans la requête Drizzle', async () => {
    const cause = new Error('value too long for type character varying');
    mocks.createFiches.createFicheWithAuthorization.mockResolvedValueOnce(
      failure(
        'SERVER_ERROR',
        new Error('Failed query: insert … params: …', { cause })
      )
    );

    const result = await service.create(createRequest(), { user, tx });

    expect(result).toMatchObject({
      success: false,
      error: PlanErrorType.DATABASE_ERROR,
      cause,
    });
  });

  it('remonte une exception comme cause', async () => {
    const cause = new Error('connexion perdue');
    mocks.plans.upsertPlan.mockRejectedValue(cause);

    const result = await service.create(createRequest(), { user, tx });

    expect(result).toMatchObject({
      success: false,
      error: PlanErrorType.DATABASE_ERROR,
      cause,
    });
  });

  describe('notifyCreatedFiches', () => {
    it('recharge les fiches après commit et envoie un seul webhook batché', async () => {
      const fiches = [
        { id: 101, titre: 'Fiche 1' },
        { id: 102, titre: 'Fiche 2' },
      ];
      mocks.listFiches.listFichesQuery.mockResolvedValue({
        data: fiches,
        count: 2,
      });

      await service.notifyCreatedFiches({
        createdFicheIds: [101, 102],
        planId: 1,
      });

      expect(mocks.listFiches.listFichesQuery).toHaveBeenCalledExactlyOnceWith(
        null,
        { ficheIds: [101, 102], withChildren: true }
      );
      expect(
        mocks.webhooks.sendWebhookNotifications
      ).toHaveBeenCalledExactlyOnceWith(
        ApplicationSousScopesEnum.FICHES,
        fiches.map((fiche) => ({ entityId: String(fiche.id), payload: fiche }))
      );
    });

    it('ne relance pas la création si le webhook échoue', async () => {
      mocks.webhooks.sendWebhookNotifications.mockRejectedValue(
        new Error('webhook endpoint down')
      );

      await expect(
        service.notifyCreatedFiches({ createdFicheIds: [101], planId: 1 })
      ).resolves.toBeUndefined();

      expect(mocks.plans.upsertPlan).not.toHaveBeenCalled();
      expect(
        mocks.createFiches.createFicheWithAuthorization
      ).not.toHaveBeenCalled();
    });

    it("n'envoie rien si aucune fiche n'a été créée", async () => {
      await service.notifyCreatedFiches({ createdFicheIds: [], planId: 1 });

      expect(mocks.listFiches.listFichesQuery).not.toHaveBeenCalled();
      expect(mocks.webhooks.sendWebhookNotifications).not.toHaveBeenCalled();
    });
  });
});
