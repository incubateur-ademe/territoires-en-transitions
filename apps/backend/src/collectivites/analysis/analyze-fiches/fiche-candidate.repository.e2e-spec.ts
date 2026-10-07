import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createFicheAndCleanupFunction } from '@tet/backend/plans/fiches/fiches.test-fixture';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { type Result } from '@tet/backend/utils/result.type';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { inArray } from 'drizzle-orm';
import { sortBy, uniq } from 'es-toolkit';
import { beforeAll, describe, expect, it } from 'vitest';
import { FicheActionAnalysisRepository } from '../fiche-action-analysis.repository';
import { FicheCandidate } from '../models/fiche-analysis';
import { FicheCandidateError } from './analyze-fiches.errors';
import {
  FicheAnalysisUpsert,
  ficheAnalysisUpsertSchema,
} from './fiche-analysis-status.repository';
import {
  FicheCandidateRepository,
  FicheCandidateSelection,
} from './fiche-candidate.repository';

type FicheCaller = ReturnType<TrpcRouter['createCaller']>;

type FicheToCreate = {
  caller: FicheCaller;
  ficheCollectiviteId: number;
  titre: string;
  description?: string;
  parentId?: number;
  restreint?: boolean;
};

type FicheState = Pick<FicheCandidate, 'ficheId' | 'isDeleted'>;

type FicheStatesResult = Result<FicheState[], FicheCandidateError>;

const listedOrEmpty = <Item>(
  listResult: Result<Item[], FicheCandidateError>
): Item[] => (listResult.success ? listResult.data : []);

const processedFingerprint = 'a'.repeat(64);

const beforeEveryModification = new Date('2000-01-01T00:00:00.000Z');

const afterEveryModification = new Date('2100-01-01T00:00:00.000Z');

describe('FicheCandidateRepository contract', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;
  let repository: FicheCandidateRepository;
  let statusRepository: FicheActionAnalysisRepository;

  let collectiviteId: number;
  let restrictedOnlyCollectiviteId: number;
  let deletedWithStatusOnlyCollectiviteId: number;
  let subFicheAndDeletedOnlyCollectiviteId: number;
  let activeSubFicheId: number;

  let activeFicheId: number;
  let restrictedFicheId: number;
  let processedFicheId: number;
  let failedFicheId: number;
  let staleFicheId: number;
  let deletedWithStatusFicheId: number;
  let deletedWithoutStatusFicheId: number;
  let otherCollectiviteFicheId: number;

  const addCollectiviteWithCaller = async (): Promise<{
    collectiviteId: number;
    caller: FicheCaller;
  }> => {
    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    return {
      collectiviteId: collectivite.id,
      caller: router.createCaller({
        user: getAuthUserFromUserCredentials(user),
      }),
    };
  };

  const createFiche = async ({
    caller,
    ficheCollectiviteId,
    titre,
    description,
    parentId,
    restreint,
  }: FicheToCreate): Promise<number> => {
    const { ficheId } = await createFicheAndCleanupFunction({
      caller,
      ficheInput: {
        collectiviteId: ficheCollectiviteId,
        titre,
        description,
        parentId,
        restreint,
      },
    });
    return ficheId;
  };

  const upsertStatuses = async (
    ...analyses: FicheAnalysisUpsert[]
  ): Promise<void> => {
    const upsertResult = await statusRepository.upsertAnalyses({ analyses });
    expect(upsertResult).toEqual({ success: true, data: undefined });
  };

  const setUpMainCollectivite = async (): Promise<void> => {
    const mainCollectivite = await addCollectiviteWithCaller();
    collectiviteId = mainCollectivite.collectiviteId;
    const createMainFiche = (
      fiche: Omit<FicheToCreate, 'caller' | 'ficheCollectiviteId'>
    ): Promise<number> =>
      createFiche({
        caller: mainCollectivite.caller,
        ficheCollectiviteId: collectiviteId,
        ...fiche,
      });

    activeFicheId = await createMainFiche({
      titre: 'Aménager des pistes cyclables',
      description: 'Dix km de pistes',
    });
    restrictedFicheId = await createMainFiche({
      titre: 'Fiche restreinte',
      restreint: true,
    });
    await createMainFiche({ titre: 'Sous-fiche', parentId: activeFicheId });
    processedFicheId = await createMainFiche({ titre: 'Fiche traitée' });
    failedFicheId = await createMainFiche({ titre: 'Fiche en erreur' });
    staleFicheId = await createMainFiche({ titre: 'Fiche périmée' });
    deletedWithStatusFicheId = await createMainFiche({
      titre: 'Fiche supprimée avec statut',
    });
    deletedWithoutStatusFicheId = await createMainFiche({
      titre: 'Fiche supprimée sans statut',
    });

    await upsertStatuses(
      ficheAnalysisUpsertSchema.parse({
        ficheId: processedFicheId,
        collectiviteId,
        status: 'processed',
        fingerprint: processedFingerprint,
      }),
      ficheAnalysisUpsertSchema.parse({
        ficheId: failedFicheId,
        collectiviteId,
        status: 'failed',
      }),
      ficheAnalysisUpsertSchema.parse({
        ficheId: staleFicheId,
        collectiviteId,
        status: 'stale',
      }),
      ficheAnalysisUpsertSchema.parse({
        ficheId: deletedWithStatusFicheId,
        collectiviteId,
        status: 'processed',
        fingerprint: processedFingerprint,
      })
    );
    await mainCollectivite.caller.plans.fiches.delete({
      ficheId: deletedWithStatusFicheId,
    });
    await mainCollectivite.caller.plans.fiches.delete({
      ficheId: deletedWithoutStatusFicheId,
    });
  };

  const setUpRestrictedOnlyCollectivite = async (): Promise<number> => {
    const restrictedOnly = await addCollectiviteWithCaller();
    await createFiche({
      caller: restrictedOnly.caller,
      ficheCollectiviteId: restrictedOnly.collectiviteId,
      titre: 'Seule fiche, restreinte',
      restreint: true,
    });
    return restrictedOnly.collectiviteId;
  };

  const setUpDeletedWithStatusOnlyCollectivite = async (): Promise<number> => {
    const deletedWithStatusOnly = await addCollectiviteWithCaller();
    const deletedWithStatusOnlyFicheId = await createFiche({
      caller: deletedWithStatusOnly.caller,
      ficheCollectiviteId: deletedWithStatusOnly.collectiviteId,
      titre: 'Seule fiche, supprimée avec statut',
    });
    await upsertStatuses(
      ficheAnalysisUpsertSchema.parse({
        ficheId: deletedWithStatusOnlyFicheId,
        collectiviteId: deletedWithStatusOnly.collectiviteId,
        status: 'processed',
        fingerprint: processedFingerprint,
      })
    );
    await deletedWithStatusOnly.caller.plans.fiches.delete({
      ficheId: deletedWithStatusOnlyFicheId,
    });
    return deletedWithStatusOnly.collectiviteId;
  };

  const setUpSubFicheAndDeletedOnlyCollectivite = async (): Promise<{
    collectiviteId: number;
    subFicheId: number;
  }> => {
    const subFicheAndDeletedOnly = await addCollectiviteWithCaller();
    const deletedParentFicheId = await createFiche({
      caller: subFicheAndDeletedOnly.caller,
      ficheCollectiviteId: subFicheAndDeletedOnly.collectiviteId,
      titre: 'Fiche parente supprimée sans statut',
    });
    const subFicheId = await createFiche({
      caller: subFicheAndDeletedOnly.caller,
      ficheCollectiviteId: subFicheAndDeletedOnly.collectiviteId,
      titre: 'Sous-fiche',
      parentId: deletedParentFicheId,
    });
    await db.db
      .update(ficheActionTable)
      .set({ deleted: true })
      .where(inArray(ficheActionTable.id, [deletedParentFicheId]));
    return {
      collectiviteId: subFicheAndDeletedOnly.collectiviteId,
      subFicheId,
    };
  };

  const setUpOtherCollectiviteFiche = async (): Promise<number> => {
    const otherCollectivite = await addCollectiviteWithCaller();
    return createFiche({
      caller: otherCollectivite.caller,
      ficheCollectiviteId: otherCollectivite.collectiviteId,
      titre: "Fiche d'une autre collectivité",
    });
  };

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);
    repository = app.get(FicheCandidateRepository);
    statusRepository = new FicheActionAnalysisRepository(db);

    await setUpMainCollectivite();
    restrictedOnlyCollectiviteId = await setUpRestrictedOnlyCollectivite();
    deletedWithStatusOnlyCollectiviteId =
      await setUpDeletedWithStatusOnlyCollectivite();
    ({
      collectiviteId: subFicheAndDeletedOnlyCollectiviteId,
      subFicheId: activeSubFicheId,
    } = await setUpSubFicheAndDeletedOnlyCollectivite());
    otherCollectiviteFicheId = await setUpOtherCollectiviteFiche();

    return async () => {
      await app.close();
    };
  });

  const listTestCollectivitesWithFicheCandidates = async (): Promise<
    Result<number[], FicheCandidateError>
  > => {
    const collectiviteIdsResult =
      await repository.listCollectivitesWithFicheCandidates();
    if (!collectiviteIdsResult.success) {
      return collectiviteIdsResult;
    }
    const testCollectiviteIds = [
      collectiviteId,
      restrictedOnlyCollectiviteId,
      deletedWithStatusOnlyCollectiviteId,
      subFicheAndDeletedOnlyCollectiviteId,
    ];
    return {
      success: true,
      data: collectiviteIdsResult.data.filter((id) =>
        testCollectiviteIds.includes(id)
      ),
    };
  };

  const listFicheStates = async (
    selection: FicheCandidateSelection
  ): Promise<FicheStatesResult> => {
    const candidatesResult = await repository.listFicheCandidates(selection);
    if (!candidatesResult.success) {
      return candidatesResult;
    }
    return {
      success: true,
      data: sortBy(
        candidatesResult.data.map(({ ficheId, isDeleted }) => ({
          ficheId,
          isDeleted,
        })),
        [({ ficheId }) => ficheId]
      ),
    };
  };

  const activeStates = (...ficheIds: number[]): FicheState[] =>
    ficheIds.map((ficheId) => ({ ficheId, isDeleted: false }));

  it('listCollectivitesWithFicheCandidates renvoie les CT qui ont au moins une fiche non supprimée, y compris hors plan ou restreinte', async () => {
    const collectiviteIdsResult =
      await listTestCollectivitesWithFicheCandidates();

    expect({
      success: collectiviteIdsResult.success,
      hasCollectivite:
        collectiviteIdsResult.success &&
        collectiviteIdsResult.data.includes(collectiviteId),
      hasRestrictedOnlyCollectivite:
        collectiviteIdsResult.success &&
        collectiviteIdsResult.data.includes(restrictedOnlyCollectiviteId),
    }).toEqual({
      success: true,
      hasCollectivite: true,
      hasRestrictedOnlyCollectivite: true,
    });
  });

  it('listCollectivitesWithFicheCandidates renvoie une CT dont la seule fiche est supprimée en douce et a un statut', async () => {
    const collectiviteIdsResult =
      await listTestCollectivitesWithFicheCandidates();

    expect({
      success: collectiviteIdsResult.success,
      hasDeletedWithStatusOnlyCollectivite:
        collectiviteIdsResult.success &&
        collectiviteIdsResult.data.includes(
          deletedWithStatusOnlyCollectiviteId
        ),
    }).toEqual({ success: true, hasDeletedWithStatusOnlyCollectivite: true });
  });

  it("listCollectivitesWithFicheCandidates ne renvoie pas une CT qui n'a que des sous-fiches ou des fiches supprimées sans statut", async () => {
    const [subFiche] = await db.db
      .select({ deleted: ficheActionTable.deleted })
      .from(ficheActionTable)
      .where(inArray(ficheActionTable.id, [activeSubFicheId]));
    const collectiviteIdsResult =
      await listTestCollectivitesWithFicheCandidates();

    expect({
      isSubFicheActive: subFiche?.deleted === false,
      success: collectiviteIdsResult.success,
      hasSubFicheAndDeletedOnlyCollectivite:
        collectiviteIdsResult.success &&
        collectiviteIdsResult.data.includes(
          subFicheAndDeletedOnlyCollectiviteId
        ),
    }).toEqual({
      isSubFicheActive: true,
      success: true,
      hasSubFicheAndDeletedOnlyCollectivite: false,
    });
  });

  it('every_fiche renvoie les fiches non supprimées de la CT demandée, y compris hors plan et restreintes, sans les sous-fiches', async () => {
    const ficheStatesResult = await listFicheStates({
      kind: 'every_fiche',
      collectiviteId,
    });

    expect({
      success: ficheStatesResult.success,
      activeFiches: listedOrEmpty(ficheStatesResult).filter(
        ({ isDeleted }) => !isDeleted
      ),
    }).toEqual({
      success: true,
      activeFiches: activeStates(
        activeFicheId,
        restrictedFicheId,
        processedFicheId,
        failedFicheId,
        staleFicheId
      ),
    });
  });

  it('every_fiche renvoie avec isDeleted à true les fiches supprimées en douce qui ont un statut', async () => {
    const ficheStatesResult = await listFicheStates({
      kind: 'every_fiche',
      collectiviteId,
    });

    expect({
      success: ficheStatesResult.success,
      deletedFiches: listedOrEmpty(ficheStatesResult).filter(
        ({ isDeleted }) => isDeleted
      ),
    }).toEqual({
      success: true,
      deletedFiches: [{ ficheId: deletedWithStatusFicheId, isDeleted: true }],
    });
  });

  it('pending_since renvoie les fiches non supprimées sans statut, en erreur ou périmées, quelle que soit leur date de modification', async () => {
    const ficheStatesResult = await listFicheStates({
      kind: 'pending_since',
      collectiviteId,
      since: afterEveryModification,
    });

    expect({
      success: ficheStatesResult.success,
      activeFiches: listedOrEmpty(ficheStatesResult).filter(
        ({ isDeleted }) => !isDeleted
      ),
    }).toEqual({
      success: true,
      activeFiches: activeStates(
        activeFicheId,
        restrictedFicheId,
        failedFicheId,
        staleFicheId
      ),
    });
  });

  it('pending_since renvoie les fiches traitées modifiées après la date donnée', async () => {
    const ficheStatesResult = await listFicheStates({
      kind: 'pending_since',
      collectiviteId,
      since: beforeEveryModification,
    });

    expect({
      success: ficheStatesResult.success,
      hasProcessedFiche:
        ficheStatesResult.success &&
        ficheStatesResult.data.some(
          ({ ficheId }) => ficheId === processedFicheId
        ),
    }).toEqual({ success: true, hasProcessedFiche: true });
  });

  it('pending_since ne renvoie pas une fiche traitée modifiée avant la date donnée', async () => {
    const ficheStatesResult = await listFicheStates({
      kind: 'pending_since',
      collectiviteId,
      since: afterEveryModification,
    });

    expect({
      success: ficheStatesResult.success,
      hasProcessedFiche:
        ficheStatesResult.success &&
        ficheStatesResult.data.some(
          ({ ficheId }) => ficheId === processedFicheId
        ),
    }).toEqual({ success: true, hasProcessedFiche: false });
  });

  it('pending_since renvoie avec isDeleted à true les fiches supprimées en douce qui ont un statut', async () => {
    const ficheStatesResult = await listFicheStates({
      kind: 'pending_since',
      collectiviteId,
      since: afterEveryModification,
    });

    expect({
      success: ficheStatesResult.success,
      deletedFiches: listedOrEmpty(ficheStatesResult).filter(
        ({ isDeleted }) => isDeleted
      ),
    }).toEqual({
      success: true,
      deletedFiches: [{ ficheId: deletedWithStatusFicheId, isDeleted: true }],
    });
  });

  it("ne renvoie pas une fiche supprimée en douce qui n'a pas de statut", async () => {
    const [everyFicheResult, pendingResult] = await Promise.all([
      listFicheStates({ kind: 'every_fiche', collectiviteId }),
      listFicheStates({
        kind: 'pending_since',
        collectiviteId,
        since: beforeEveryModification,
      }),
    ]);
    const isDeletedWithoutStatusFiche = ({ ficheId }: FicheState): boolean =>
      ficheId === deletedWithoutStatusFicheId;

    expect({
      everyFicheSuccess: everyFicheResult.success,
      pendingSuccess: pendingResult.success,
      everyFicheHasDeletedWithoutStatus:
        everyFicheResult.success &&
        everyFicheResult.data.some(isDeletedWithoutStatusFiche),
      pendingHasDeletedWithoutStatus:
        pendingResult.success &&
        pendingResult.data.some(isDeletedWithoutStatusFiche),
    }).toEqual({
      everyFicheSuccess: true,
      pendingSuccess: true,
      everyFicheHasDeletedWithoutStatus: false,
      pendingHasDeletedWithoutStatus: false,
    });
  });

  it("ne renvoie pas les fiches d'une autre CT", async () => {
    const candidatesResult = await repository.listFicheCandidates({
      kind: 'every_fiche',
      collectiviteId,
    });

    expect({
      success: candidatesResult.success,
      collectiviteIds: uniq(
        listedOrEmpty(candidatesResult).map((fiche) => fiche.collectiviteId)
      ),
      hasOtherCollectiviteFiche:
        candidatesResult.success &&
        candidatesResult.data.some(
          ({ ficheId }) => ficheId === otherCollectiviteFicheId
        ),
    }).toEqual({
      success: true,
      collectiviteIds: [collectiviteId],
      hasOtherCollectiviteFiche: false,
    });
  });

  it('renvoie le titre, la description et la date de modification de chaque fiche, supprimée ou non', async () => {
    const storedFiches = await db.db
      .select({
        ficheId: ficheActionTable.id,
        modifiedAt: ficheActionTable.modifiedAt,
      })
      .from(ficheActionTable)
      .where(
        inArray(ficheActionTable.id, [activeFicheId, deletedWithStatusFicheId])
      );
    const modifiedAtByFicheId = new Map(
      storedFiches.map(({ ficheId, modifiedAt }) => [
        ficheId,
        new Date(modifiedAt),
      ])
    );

    const candidatesResult = await repository.listFicheCandidates({
      kind: 'every_fiche',
      collectiviteId,
    });

    expect({
      success: candidatesResult.success,
      fiches: sortBy(
        listedOrEmpty(candidatesResult).filter(({ ficheId }) =>
          [activeFicheId, deletedWithStatusFicheId].includes(ficheId)
        ),
        [({ ficheId }) => ficheId]
      ),
    }).toEqual({
      success: true,
      fiches: [
        {
          ficheId: activeFicheId,
          collectiviteId,
          titre: 'Aménager des pistes cyclables',
          description: 'Dix km de pistes',
          modifiedAt: modifiedAtByFicheId.get(activeFicheId),
          isDeleted: false,
        },
        {
          ficheId: deletedWithStatusFicheId,
          collectiviteId,
          titre: 'Fiche supprimée avec statut',
          description: null,
          modifiedAt: modifiedAtByFicheId.get(deletedWithStatusFicheId),
          isDeleted: true,
        },
      ],
    });
  });
});
