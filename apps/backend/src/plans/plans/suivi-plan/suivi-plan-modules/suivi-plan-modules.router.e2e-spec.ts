import { INestApplication } from '@nestjs/common';
import { tableauDeBordModuleTable } from '@tet/backend/metrics/module.table';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
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
import { CollectiviteRole } from '@tet/domain/users';
import { beforeAll, describe, expect, it } from 'vitest';

const FORBIDDEN = "Vous n'avez pas les permissions nécessaires";

describe('Suivi du plan : modules personnalisés', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let admin: AuthenticatedUser;
  let lecteur: AuthenticatedUser;
  let externe: AuthenticatedUser;
  let collectiviteId: number;
  let planId: number;
  let autrePlanId: number;
  let axeId: number;
  let db: DatabaseService;
  let autreCollectiviteId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { accesRestreint: true },
    });
    collectiviteId = collectivite.id;
    admin = getAuthUserFromUserCredentials(user);

    const { user: lecteurUser } = await addTestUser(db, {
      collectiviteId,
      role: CollectiviteRole.LECTURE,
    });
    lecteur = getAuthUserFromUserCredentials(lecteurUser);

    const { collectivite: autreCollectivite } = await addTestCollectivite(db);
    autreCollectiviteId = autreCollectivite.id;
    const { user: externeUser } = await addTestUser(db, {
      collectiviteId: autreCollectivite.id,
      role: CollectiviteRole.ADMIN,
    });
    externe = getAuthUserFromUserCredentials(externeUser);

    const caller = router.createCaller({ user: admin });
    planId = (await caller.plans.plans.create({ nom: 'Plan', collectiviteId }))
      .id;
    autrePlanId = (
      await caller.plans.plans.create({ nom: 'Autre plan', collectiviteId })
    ).id;
    axeId = (
      await caller.plans.axes.create({
        nom: 'Axe',
        collectiviteId,
        planId,
        parent: planId,
      })
    ).id;

    return async () => {
      await app.close();
    };
  });

  const createModule = (planIdToUse = planId) =>
    router.createCaller({ user: admin }).plans.suivi.upsertModule({
      planId: planIdToUse,
      titre: 'Par thématique',
      options: {
        countByProperty: 'thematiques',
        filtre: { planActionIds: [autrePlanId], noPlan: true },
      },
    });

  it('liste vide pour un plan sans module', async () => {
    const modules = await router
      .createCaller({ user: admin })
      .plans.suivi.listModules({ planId: autrePlanId });

    expect(modules).toEqual([]);
  });

  it('crée un module en forçant le filtre sur le plan', async () => {
    const module = await createModule();

    expect(module).toMatchObject({
      planId,
      collectiviteId,
      titre: 'Par thématique',
      defaultKey: null,
      options: {
        countByProperty: 'thematiques',
        filtre: { planActionIds: [planId] },
      },
    });
    expect(module.options.filtre.noPlan).toBeUndefined();

    const modules = await router
      .createCaller({ user: lecteur })
      .plans.suivi.listModules({ planId });
    expect(modules).toHaveLength(1);
    expect(modules[0]).toMatchObject({
      id: module.id,
      titre: 'Par thématique',
    });
  });

  it('supprime un module enregistré avec une clé par défaut', async () => {
    const id = crypto.randomUUID();
    await db.db.insert(tableauDeBordModuleTable).values({
      id,
      collectiviteId,
      planId,
      defaultKey: 'suivi-plan-fiches-par-statut',
      titre: 'Répartition par statut',
      type: 'fiche-action.count-by',
      options: { countByProperty: 'statut', filtre: {} },
    });
    const caller = router.createCaller({ user: admin });

    const avant = await caller.plans.suivi.listModules({ planId });
    expect(avant.find((module) => module.id === id)?.defaultKey).toBeNull();

    await caller.plans.suivi.deleteModule({ planId, moduleId: id });
    const apres = await caller.plans.suivi.listModules({ planId });
    expect(apres.map((module) => module.id)).not.toContain(id);
  });

  it('modifie puis supprime un module', async () => {
    const caller = router.createCaller({ user: admin });
    const module = await createModule();

    const modifie = await caller.plans.suivi.upsertModule({
      planId,
      id: module.id,
      titre: 'Par priorité',
      options: { countByProperty: 'priorite', filtre: {} },
    });
    expect(modifie).toMatchObject({
      id: module.id,
      titre: 'Par priorité',
      options: { countByProperty: 'priorite' },
    });

    await caller.plans.suivi.deleteModule({ planId, moduleId: module.id });
    const modules = await caller.plans.suivi.listModules({ planId });
    expect(modules.map((m) => m.id)).not.toContain(module.id);
  });

  it('refuse de modifier ou supprimer le module d’un autre plan', async () => {
    const caller = router.createCaller({ user: admin });
    const module = await createModule(autrePlanId);

    await expect(
      caller.plans.suivi.upsertModule({
        planId,
        id: module.id,
        titre: 'Détourné',
        options: { countByProperty: 'statut', filtre: {} },
      })
    ).rejects.toThrow("Le module demandé n'a pas été trouvé dans ce plan");
    await expect(
      caller.plans.suivi.deleteModule({ planId, moduleId: module.id })
    ).rejects.toThrow("Le module demandé n'a pas été trouvé dans ce plan");
  });

  it('refuse un axe qui n’est pas un plan', async () => {
    await expect(
      router.createCaller({ user: admin }).plans.suivi.listModules({
        planId: axeId,
      })
    ).rejects.toThrow("Le plan demandé n'a pas été trouvé");
  });

  it('refuse un critère hors liste du suivi', async () => {
    await expect(
      router.createCaller({ user: admin }).plans.suivi.upsertModule({
        planId,
        titre: 'Par plan',
        options: {
          countByProperty: 'plans' as 'statut',
          filtre: {},
        },
      })
    ).rejects.toThrow();
  });

  it('lecture avec les droits de lecture du plan, écriture avec les droits de modification', async () => {
    const module = await createModule();
    const lecteurCaller = router.createCaller({ user: lecteur });
    const externeCaller = router.createCaller({ user: externe });

    await expect(
      lecteurCaller.plans.suivi.listModules({ planId })
    ).resolves.toContainEqual(expect.objectContaining({ id: module.id }));
    await expect(createModuleAs(lecteurCaller)).rejects.toThrow(FORBIDDEN);
    await expect(
      lecteurCaller.plans.suivi.deleteModule({ planId, moduleId: module.id })
    ).rejects.toThrow(FORBIDDEN);

    await expect(
      externeCaller.plans.suivi.listModules({ planId })
    ).rejects.toThrow(FORBIDDEN);
    await expect(createModuleAs(externeCaller)).rejects.toThrow(FORBIDDEN);
  });

  it('les modules du plan sont absents du tableau de bord de la collectivité', async () => {
    const caller = router.createCaller({ user: admin });
    const module = await createModule();

    const modulesCollectivite = await caller.metrics.collectivites.listModules({
      collectiviteId,
    });
    expect(modulesCollectivite.map((m) => m.id)).not.toContain(module.id);

    await expect(
      caller.metrics.collectivites.getModule({ collectiviteId, id: module.id })
    ).rejects.toThrow();
    await expect(
      caller.metrics.collectivites.upsertModule({
        id: module.id,
        collectiviteId,
        titre: 'Détourné',
        type: 'fiche-action.count-by',
        options: { countByProperty: 'statut', filtre: {} },
      })
    ).rejects.toThrow();
    await expect(
      caller.metrics.collectivites.deleteModule({
        collectiviteId,
        moduleId: module.id,
      })
    ).rejects.toThrow();
    const [apres] = await caller.plans.suivi
      .listModules({ planId })
      .then((modules) => modules.filter((m) => m.id === module.id));
    expect(apres.titre).toBe('Par thématique');
  });

  it('ignore un module rattaché au plan par une autre collectivité', async () => {
    const id = crypto.randomUUID();
    await db.db.insert(tableauDeBordModuleTable).values({
      id,
      collectiviteId: autreCollectiviteId,
      planId,
      titre: 'Intrus',
      type: 'fiche-action.count-by',
      options: { countByProperty: 'statut', filtre: {} },
    });
    const caller = router.createCaller({ user: admin });

    const modules = await caller.plans.suivi.listModules({ planId });
    expect(modules.map((module) => module.id)).not.toContain(id);
    await expect(
      caller.plans.suivi.upsertModule({
        planId,
        id,
        titre: 'Détourné',
        options: { countByProperty: 'statut', filtre: {} },
      })
    ).rejects.toThrow("Le module demandé n'a pas été trouvé dans ce plan");
    await expect(
      caller.plans.suivi.deleteModule({ planId, moduleId: id })
    ).rejects.toThrow("Le module demandé n'a pas été trouvé dans ce plan");
  });

  const createModuleAs = (caller: ReturnType<TrpcRouter['createCaller']>) =>
    caller.plans.suivi.upsertModule({
      planId,
      titre: 'Interdit',
      options: { countByProperty: 'statut', filtre: {} },
    });
});
