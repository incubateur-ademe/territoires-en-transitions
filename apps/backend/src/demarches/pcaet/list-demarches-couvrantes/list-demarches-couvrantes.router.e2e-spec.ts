import { INestApplication } from '@nestjs/common';
import {
  addTestCollectiviteAndUser,
  cleanupCollectiviteDemarches,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteRelationsTable } from '@tet/backend/collectivites/shared/models/collectivite-relations.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { demarchePlanActionTable } from '@tet/backend/demarches/shared/models/demarche-plan-action.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { TypePorteurSupraEnum } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { eq, inArray } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { attachTestPlanToDemarchePcaet } from '../demarches-pcaet.test-fixture';

describe("L'EPCI couvert consulte le dépôt du Supra", () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  const addCollectivite = async (
    natureInsee: 'PETR' | 'CC',
    role: CollectiviteRole
  ) => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role },
      collectivite: { natureInsee },
    });
    onTestFinished(async () => {
      // `demarche.created_by` retient l'utilisateur : les démarches partent
      // avant lui.
      await cleanupCollectiviteDemarches(db, fixture.collectivite.id);
      await fixture.cleanup();
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    return {
      collectivite: fixture.collectivite,
      user,
      caller: router.createCaller({ user }),
    };
  };

  /** Un Supra, un EPCI membre dont l'utilisateur n'a que la lecture, et le dépôt du Supra qui le couvre. */
  const addDepotCouvrant = async () => {
    const supra = await addCollectivite('PETR', CollectiviteRole.ADMIN);
    const epci = await addCollectivite('CC', CollectiviteRole.LECTURE);
    await db.db
      .insert(collectiviteRelationsTable)
      .values({ id: epci.collectivite.id, parentId: supra.collectivite.id });
    const depot = await supra.caller.demarches.pcaet.create({
      collectiviteId: supra.collectivite.id,
      collectivitesCouvertesIds: [epci.collectivite.id],
    });
    return { supra, epci, depot };
  };

  it('liste aux membres de l’EPCI les dépôts qui le couvrent, avec leur porteur', async () => {
    const { supra, epci, depot } = await addDepotCouvrant();

    const couvrantes = await epci.caller.demarches.pcaet.listCouvrantes({
      collectiviteId: epci.collectivite.id,
    });

    expect(couvrantes).toEqual([
      expect.objectContaining({
        id: depot.id,
        collectiviteId: supra.collectivite.id,
        status: depot.status,
        porteur: {
          id: supra.collectivite.id,
          nom: supra.collectivite.nom,
          type: TypePorteurSupraEnum.PETR,
        },
      }),
    ]);
  });

  it('ouvre le dossier en lecture seule au membre de l’EPCI couvert', async () => {
    const { supra, epci, depot } = await addDepotCouvrant();
    const ref = {
      collectiviteId: supra.collectivite.id,
      demarcheId: depot.id,
    };

    const demarche = await epci.caller.demarches.pcaet.get(ref);
    expect(demarche).toMatchObject({
      lectureSeule: true,
      amontModifiable: false,
      avalModifiable: false,
      contenuModifiable: false,
    });
    expect(
      Object.values(demarche.transitions).some(
        ({ reachable, enabled }) => reachable || enabled
      )
    ).toBe(false);

    await expect(
      epci.caller.demarches.pcaet.diagnostic.get(ref)
    ).resolves.toBeDefined();
    await expect(
      epci.caller.demarches.pcaet.documents.list(ref)
    ).resolves.toBeDefined();
    await expect(epci.caller.demarches.pcaet.listPlans(ref)).resolves.toEqual(
      []
    );
    await expect(
      epci.caller.demarches.pcaet.listAvisRecus(ref)
    ).resolves.toEqual([]);

    // Lire n'est pas écrire.
    await expect(
      epci.caller.demarches.pcaet.update({ ...ref, titre: 'Modifié' })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    // Qui édite le dépôt le lit toujours en édition.
    const vueSupra = await supra.caller.demarches.pcaet.get(ref);
    expect(vueSupra.lectureSeule).toBe(false);
  });

  it('ne montre rien à qui n’est pas membre d’un EPCI couvert', async () => {
    const { supra, epci, depot } = await addDepotCouvrant();
    const autre = await addCollectivite('CC', CollectiviteRole.ADMIN);

    await expect(
      autre.caller.demarches.pcaet.listCouvrantes({
        collectiviteId: epci.collectivite.id,
      })
    ).resolves.toEqual([]);
    await expect(
      autre.caller.demarches.pcaet.get({
        collectiviteId: supra.collectivite.id,
        demarcheId: depot.id,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('refuse la lecture par couverture à une clé d’API sans lecture des démarches', async () => {
    const { supra, epci, depot } = await addDepotCouvrant();
    const cleRestreinte = router.createCaller({
      user: {
        ...epci.user,
        jwtPayload: { ...epci.user.jwtPayload, permissions: ['plans.read'] },
      },
    });

    await expect(
      cleRestreinte.demarches.pcaet.listCouvrantes({
        collectiviteId: epci.collectivite.id,
      })
    ).resolves.toEqual([]);
    await expect(
      cleRestreinte.demarches.pcaet.get({
        collectiviteId: supra.collectivite.id,
        demarcheId: depot.id,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('cache au membre couvert les fiches restreintes du Supra', async () => {
    const { supra, epci, depot } = await addDepotCouvrant();
    const ref = { collectiviteId: supra.collectivite.id, demarcheId: depot.id };
    const plan = await attachTestPlanToDemarchePcaet(db, ref);
    const fiches = await db.db
      .insert(ficheActionTable)
      .values([
        { collectiviteId: ref.collectiviteId, titre: 'Publique' },
        {
          collectiviteId: ref.collectiviteId,
          titre: 'Restreinte',
          restreint: true,
        },
      ])
      .returning({ id: ficheActionTable.id });
    // Avant la collectivité : le plan et ses fiches la retiennent.
    onTestFinished(async () => {
      await db.db
        .delete(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.axeId, plan.id));
      await db.db.delete(ficheActionTable).where(
        inArray(
          ficheActionTable.id,
          fiches.map(({ id }) => id)
        )
      );
      await db.db
        .delete(demarchePlanActionTable)
        .where(eq(demarchePlanActionTable.planActionId, plan.id));
      await db.db.delete(axeTable).where(eq(axeTable.id, plan.id));
    });
    await db.db.insert(ficheActionAxeTable).values(
      fiches.map(({ id }) => ({
        ficheId: id,
        axeId: plan.id,
        createdBy: supra.user.id,
      }))
    );

    const titres = async (caller: typeof epci.caller) =>
      (await caller.demarches.pcaet.listPlans(ref))
        .flatMap((contenu) => contenu.fiches.map(({ titre }) => titre))
        .sort();

    expect(await titres(epci.caller)).toEqual(['Publique']);
    expect(await titres(supra.caller)).toEqual(['Publique', 'Restreinte']);
  });

  it("n'ouvre pas une démarche sous l'identifiant d'une autre collectivité", async () => {
    const { epci, depot } = await addDepotCouvrant();

    await expect(
      epci.caller.demarches.pcaet.get({
        collectiviteId: epci.collectivite.id,
        demarcheId: depot.id,
      })
    ).rejects.toBeDefined();
  });
});
