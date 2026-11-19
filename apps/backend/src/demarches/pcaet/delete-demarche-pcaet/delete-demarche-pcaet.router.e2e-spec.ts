import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addAndEnableUserSuperAdminMode } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';
import {
  completeTestDossierPcaet,
  listTestDemarchePcaetExports,
} from '../demarches-pcaet.test-fixture';
import { DEMARCHE_PCAET_EXPORTS_BUCKET } from '../exports/demarche-pcaet-exports-storage.service';

describe('Supprimer une démarche PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  const freshEditor = async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    return {
      collectivite: fixture.collectivite,
      caller: router.createCaller({
        user: getAuthUserFromUserCredentials(fixture.user),
      }),
    };
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Supprimer une démarche jamais transmise (avec pilotes)', async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    const caller = router.createCaller({ user });
    const created = await caller.demarches.pcaet.create({
      collectiviteId: fixture.collectivite.id,
      pilotes: [{ userId: user.id, tagId: null }],
    });

    await caller.demarches.pcaet.delete({
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });

    const demarches = await caller.demarches.pcaet.list({
      collectiviteId: fixture.collectivite.id,
    });
    expect(demarches).toEqual([]);
  });

  test('Refuser la suppression d’une démarche transmise pour avis', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    await expect(
      caller.demarches.pcaet.delete({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow(
      'Une démarche transmise ou publiée ne peut pas être supprimée'
    );
  });

  test('La suppression forcée retire les classeurs figés du stockage', async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    const caller = router.createCaller({ user });
    const collectiviteId = fixture.collectivite.id;
    const created = await caller.demarches.pcaet.create({ collectiviteId });
    await completeTestDossierPcaet(db, {
      collectiviteId,
      demarcheId: created.id,
    });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId,
      demarcheId: created.id,
    });
    // Un dossier par essai sous la transition : on descend d'un niveau.
    const listNames = async (dir: string) => {
      const { data, error } = await app
        .get(SupabaseService)
        .client.storage.from(DEMARCHE_PCAET_EXPORTS_BUCKET)
        .list(dir);
      if (error) {
        throw error;
      }
      return data.map(({ name }) => name);
    };
    const listObjects = async () => {
      const transitionDir = `${created.id}/transmettre_pour_avis`;
      const attempts = await listNames(transitionDir);
      const files = await Promise.all(
        attempts.map((attemptId) => listNames(`${transitionDir}/${attemptId}`))
      );
      return files.flat().sort();
    };
    expect(await listObjects()).toEqual(['indicateurs.xlsx', 'plan.xlsx']);

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: user.id,
    });
    onTestFinished(cleanup);
    await caller.demarches.pcaet.delete({
      collectiviteId,
      demarcheId: created.id,
    });

    expect(await listTestDemarchePcaetExports(db, created.id)).toEqual([]);
    expect(await listObjects()).toEqual([]);
  });

  test("IDOR : une démarche n'est pas supprimable via une autre collectivité", async () => {
    const owner = await freshEditor();
    const created = await owner.caller.demarches.pcaet.create({
      collectiviteId: owner.collectivite.id,
    });

    const other = await freshEditor();
    await expect(
      other.caller.demarches.pcaet.delete({
        collectiviteId: other.collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow("La démarche PCAET demandée n'a pas été trouvée");
  });
});
