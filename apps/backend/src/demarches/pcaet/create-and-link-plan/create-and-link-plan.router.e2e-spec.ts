import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { PCAET_PLAN_TYPE_KEY } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';
import { completeTestDossierPcaet } from '../demarches-pcaet.test-fixture';

describe('Créer et rattacher un plan à une démarche PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  const freshEditor = async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    return {
      collectivite: fixture.collectivite,
      user,
      caller: router.createCaller({ user }),
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

  test('Créer le plan typé PCAET et le rattacher en une seule opération', async () => {
    const { caller, collectivite } = await freshEditor();
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    const updated = await caller.demarches.pcaet.createAndLinkPlan({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      nom: 'Mon programme PCAET',
    });

    expect(updated.planActionIds).toHaveLength(1);

    // Le type PCAET est celui retenu quand le client n'en impose aucun.
    const plan = await caller.plans.plans.get({
      planId: updated.planActionIds[0],
    });
    expect(plan.nom).toBe('Mon programme PCAET');
    expect(plan.type?.type).toBe(PCAET_PLAN_TYPE_KEY.type);
    expect(plan.type?.categorie).toBe(PCAET_PLAN_TYPE_KEY.categorie);
  });

  test('Nommer le plan comme le type quand aucun nom n’est fourni', async () => {
    const { caller, collectivite } = await freshEditor();
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    const updated = await caller.demarches.pcaet.createAndLinkPlan({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });

    const plan = await caller.plans.plans.get({
      planId: updated.planActionIds[0],
    });
    expect(plan.nom).toBe(PCAET_PLAN_TYPE_KEY.type);
  });

  test('Créer le plan avec le type choisi quand le client en impose un', async () => {
    const { caller, collectivite } = await freshEditor();
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    const planTypes = await caller.plans.plans.listTypes();
    const autreType = planTypes.find(
      (type) => type.type !== PCAET_PLAN_TYPE_KEY.type
    );
    if (!autreType) {
      throw new Error(
        'Le référentiel doit compter un type de plan autre que le type PCAET'
      );
    }

    const updated = await caller.demarches.pcaet.createAndLinkPlan({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      typeId: autreType.id,
    });

    const plan = await caller.plans.plans.get({
      planId: updated.planActionIds[0],
    });
    expect(plan.type?.id).toBe(autreType.id);
    // À défaut de nom, celui du type retenu.
    expect(plan.nom).toBe(autreType.type);
  });

  test('Refuser un type de plan inexistant', async () => {
    const { caller, collectivite } = await freshEditor();
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    await expect(
      caller.demarches.pcaet.createAndLinkPlan({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
        typeId: 999999,
      })
    ).rejects.toThrow('Le type de plan demandé n’existe pas');
  });

  test('Ajouter le plan créé à ceux déjà rattachés', async () => {
    const { caller, collectivite } = await freshEditor();
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    const premier = await caller.demarches.pcaet.createAndLinkPlan({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      nom: 'Premier programme',
    });

    const second = await caller.demarches.pcaet.createAndLinkPlan({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
      nom: 'Second programme',
    });

    expect(second.planActionIds).toHaveLength(2);
    // Le premier rattachement est conservé, le nouveau s'ajoute à la suite.
    expect(second.planActionIds[0]).toBe(premier.planActionIds[0]);
  });

  test('Refuser sur une démarche transmise pour avis', async () => {
    const { caller, collectivite } = await freshEditor();
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: demarche.id,
    });

    // La fixture a rattaché un plan mais le statut bloque en premier.
    await expect(
      caller.demarches.pcaet.createAndLinkPlan({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      })
    ).rejects.toThrow('n’est plus modifiable');
  });

  test('Refuser un utilisateur en lecture seule', async () => {
    const { caller, collectivite } = await freshEditor();
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    const { user: readonlyUser, cleanup } = await addTestUser(db, {
      collectiviteId: collectivite.id,
      role: CollectiviteRole.LECTURE,
    });
    onTestFinished(async () => {
      await cleanup();
    });

    const readonlyCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(readonlyUser),
    });
    await expect(
      readonlyCaller.demarches.pcaet.createAndLinkPlan({
        collectiviteId: collectivite.id,
        demarcheId: demarche.id,
      })
    ).rejects.toThrow();
  });
});
