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
import { TypePorteurSupraEnum } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';

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
    return {
      collectivite: fixture.collectivite,
      caller: router.createCaller({
        user: getAuthUserFromUserCredentials(fixture.user),
      }),
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
