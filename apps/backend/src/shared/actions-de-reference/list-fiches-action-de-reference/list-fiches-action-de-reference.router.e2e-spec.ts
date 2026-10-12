import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { StatutEnum } from '@tet/domain/plans';
import { ActionDeReferenceId } from '@tet/domain/shared';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';
import { actionDeReferenceFicheTable } from '../models/action-de-reference-fiche.table';
import { actionDeReferenceTable } from '../models/action-de-reference.table';

describe('listFiches d une action de référence', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let ownerCollectiviteId: number;
  let openFicheId: number;
  let restrictedFicheId: number;
  let ownerCollectiviteMember: AuthenticatedUser;
  let otherCollectiviteMember: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const { collectivite: ownerCollectivite } = await addTestCollectivite(db);
    ownerCollectiviteId = ownerCollectivite.id;
    const { collectivite: otherCollectivite } = await addTestCollectivite(db);

    const { user: ownerMember } = await addTestUser(db, {
      collectiviteId: ownerCollectiviteId,
      role: CollectiviteRole.LECTURE,
    });
    ownerCollectiviteMember = getAuthUserFromUserCredentials(ownerMember);

    const { user: otherMember } = await addTestUser(db, {
      collectiviteId: otherCollectivite.id,
      role: CollectiviteRole.LECTURE,
    });
    otherCollectiviteMember = getAuthUserFromUserCredentials(otherMember);

    const fiches = await db.db
      .insert(ficheActionTable)
      .values([
        {
          titre: 'Fiche ouverte',
          description: 'Description publique',
          statut: StatutEnum.EN_COURS,
          restreint: false,
          collectiviteId: ownerCollectiviteId,
        },
        {
          titre: 'Fiche restreinte',
          description: 'Description confidentielle',
          statut: StatutEnum.EN_COURS,
          restreint: true,
          collectiviteId: ownerCollectiviteId,
        },
      ])
      .returning();
    openFicheId = fiches[0].id;
    restrictedFicheId = fiches[1].id;

    return async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.collectiviteId, ownerCollectiviteId));
      await app.close();
    };
  });

  const insertActionLinkedTo = async (
    ficheIds: readonly number[]
  ): Promise<ActionDeReferenceId> => {
    const [action] = await db.db
      .insert(actionDeReferenceTable)
      .values({
        titre: `e2e-fiches-action-de-reference-${Date.now()}-${Math.random()}`,
        description: 'Action de référence pour le test',
        levier: 'covoiturage',
        categorie: 'gouvernance',
      })
      .returning();
    onTestFinished(async () => {
      await db.db
        .delete(actionDeReferenceTable)
        .where(eq(actionDeReferenceTable.id, action.id));
    });
    if (ficheIds.length > 0) {
      await db.db.insert(actionDeReferenceFicheTable).values(
        ficheIds.map((ficheId) => ({
          actionDeReferenceId: action.id,
          ficheId,
        }))
      );
    }
    return action.id;
  };

  const listFichesFor = (user: AuthenticatedUser, id: ActionDeReferenceId) =>
    router.createCaller({ user }).shared.actionsDeReference.listFiches({ id });

  it('rend une liste vide pour une action de référence sans fiche liée', async () => {
    const id = await insertActionLinkedTo([]);

    expect(await listFichesFor(otherCollectiviteMember, id)).toEqual([]);
  });

  it('rend la fiche non restreinte entière à un membre d une autre collectivité', async () => {
    const id = await insertActionLinkedTo([openFicheId]);

    expect(await listFichesFor(otherCollectiviteMember, id)).toEqual([
      expect.objectContaining({
        id: openFicheId,
        collectiviteId: ownerCollectiviteId,
        titre: 'Fiche ouverte',
        description: 'Description publique',
      }),
    ]);
  });

  it('rend la fiche restreinte masquée à un membre d une autre collectivité', async () => {
    const id = await insertActionLinkedTo([restrictedFicheId]);

    expect(await listFichesFor(otherCollectiviteMember, id)).toEqual([
      expect.objectContaining({
        id: restrictedFicheId,
        titre: 'Fiche restreinte',
        statut: StatutEnum.EN_COURS,
        restreint: true,
        description: null,
      }),
    ]);
  });

  it('rend la fiche restreinte entière à un membre de la collectivité propriétaire', async () => {
    const id = await insertActionLinkedTo([restrictedFicheId]);

    expect(await listFichesFor(ownerCollectiviteMember, id)).toEqual([
      expect.objectContaining({
        id: restrictedFicheId,
        description: 'Description confidentielle',
      }),
    ]);
  });

  it('rend les fiches liées, masquées ou entières selon chacune', async () => {
    const id = await insertActionLinkedTo([openFicheId, restrictedFicheId]);

    const fiches = await listFichesFor(otherCollectiviteMember, id);

    expect(
      Object.fromEntries(fiches.map(({ id, description }) => [id, description]))
    ).toEqual({
      [openFicheId]: 'Description publique',
      [restrictedFicheId]: null,
    });
  });

  it('refuse un appel sans utilisateur connecté', async () => {
    const id = await insertActionLinkedTo([openFicheId]);

    await expect(
      router
        .createCaller({ user: null })
        .shared.actionsDeReference.listFiches({ id })
    ).rejects.toThrow(expect.objectContaining({ code: 'UNAUTHORIZED' }));
  });

  it('répond NOT_FOUND pour une action de référence inconnue', async () => {
    const unknownId = 2147483647 as ActionDeReferenceId;

    await expect(
      listFichesFor(otherCollectiviteMember, unknownId)
    ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
  });
});
