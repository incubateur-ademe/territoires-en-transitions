import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
  cleanupCollectiviteDemarches,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteRelationsTable } from '@tet/backend/collectivites/shared/models/collectivite-relations.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { DemarchePcaetStatusEnum } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';

describe('Dépôt PCAET porté par un Supra', () => {
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

  const addPorteur = async (natureInsee: 'PETR' | 'CC') => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { natureInsee },
    });
    onTestFinished(async () => {
      // `demarche.created_by` retient l'utilisateur : les démarches partent
      // avant lui.
      await cleanupCollectiviteDemarches(db, fixture.collectivite.id);
      await fixture.cleanup();
    });
    return {
      porteur: fixture.collectivite,
      caller: router.createCaller({
        user: getAuthUserFromUserCredentials(fixture.user),
      }),
    };
  };

  /** Un membre du porteur d'après BANATIC. */
  const addMembre = async (
    porteurId: number,
    {
      nom,
      natureInsee,
      type = collectiviteTypeEnum.EPCI,
    }: {
      nom: string;
      natureInsee: 'CC' | 'CA' | null;
      type?:
        | typeof collectiviteTypeEnum.EPCI
        | typeof collectiviteTypeEnum.COMMUNE;
    }
  ) => {
    const { collectivite, cleanup } = await addTestCollectivite(db, {
      nom,
      natureInsee,
      type,
      departementCode: '31',
    });
    onTestFinished(cleanup);
    await db.db
      .insert(collectiviteRelationsTable)
      .values({ id: collectivite.id, parentId: porteurId });
    return collectivite;
  };

  it("ne propose aucun EPCI à une collectivité qui n'est pas un Supra", async () => {
    const { porteur, caller } = await addPorteur('CC');

    const contexte = await caller.demarches.pcaet.getDepotContext({
      collectiviteId: porteur.id,
    });

    expect(contexte).toMatchObject({
      estSupra: false,
      epciCandidats: [],
      perimetrePrecedent: [],
    });
  });

  it('propose au Supra ses EPCI membres, avec leur dernière démarche', async () => {
    const { porteur, caller } = await addPorteur('PETR');
    const epciB = await addMembre(porteur.id, {
      nom: 'B – CC du Lauragais',
      natureInsee: 'CC',
    });
    const epciA = await addMembre(porteur.id, {
      nom: 'A – CC Cœur Lauragais',
      natureInsee: 'CA',
    });
    // Une commune membre n'est pas un EPCI à fiscalité propre.
    await addMembre(porteur.id, {
      nom: 'Commune membre',
      natureInsee: null,
      type: collectiviteTypeEnum.COMMUNE,
    });
    await db.db.insert(demarcheTable).values({
      collectiviteId: epciB.id,
      type: 'pcaet',
      titre: 'PCAET de B',
      status: DemarchePcaetStatusEnum.ARCHIVE,
      launchedAt: '2019-03-01T00:00:00Z',
    });

    const contexte = await caller.demarches.pcaet.getDepotContext({
      collectiviteId: porteur.id,
    });

    expect(contexte.estSupra).toBe(true);
    expect(contexte.epciCandidats).toEqual([
      {
        id: epciA.id,
        nom: epciA.nom,
        departementCode: '31',
        derniereDemarche: null,
      },
      {
        id: epciB.id,
        nom: epciB.nom,
        departementCode: '31',
        derniereDemarche: {
          status: DemarchePcaetStatusEnum.ARCHIVE,
          dateDebut: expect.stringMatching(/^2019-03-01/),
        },
      },
    ]);
    expect(contexte.perimetrePrecedent).toEqual([]);
  });

  it('enregistre les EPCI cochés à la création du dépôt', async () => {
    const { porteur, caller } = await addPorteur('PETR');
    const epciA = await addMembre(porteur.id, {
      nom: 'A – CC Cœur Lauragais',
      natureInsee: 'CC',
    });
    const epciB = await addMembre(porteur.id, {
      nom: 'B – CC du Lauragais',
      natureInsee: 'CC',
    });
    await addMembre(porteur.id, {
      nom: 'C – CC non cochée',
      natureInsee: 'CC',
    });

    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: porteur.id,
      collectivitesCouvertesIds: [epciB.id, epciA.id],
    });

    expect(demarche.collectivitesCouvertes).toEqual([
      { id: epciA.id, nom: epciA.nom },
      { id: epciB.id, nom: epciB.nom },
    ]);

    const relue = await caller.demarches.pcaet.get({
      collectiviteId: porteur.id,
      demarcheId: demarche.id,
    });
    expect(relue.collectivitesCouvertes.map(({ id }) => id)).toEqual([
      epciA.id,
      epciB.id,
    ]);
  });

  it("refuse un EPCI qui n'est pas membre du Supra", async () => {
    const { porteur, caller } = await addPorteur('PETR');
    await addMembre(porteur.id, { nom: 'Membre', natureInsee: 'CC' });
    const { collectivite: etranger, cleanup } = await addTestCollectivite(db, {
      natureInsee: 'CC',
    });
    onTestFinished(cleanup);

    await expect(
      caller.demarches.pcaet.create({
        collectiviteId: porteur.id,
        collectivitesCouvertesIds: [etranger.id],
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it("refuse un périmètre à une collectivité qui n'est pas un Supra", async () => {
    const { porteur, caller } = await addPorteur('CC');
    const membre = await addMembre(porteur.id, {
      nom: 'Membre',
      natureInsee: 'CC',
    });

    await expect(
      caller.demarches.pcaet.create({
        collectiviteId: porteur.id,
        collectivitesCouvertesIds: [membre.id],
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('reprend en renouvellement le périmètre du dernier dépôt abouti', async () => {
    const { porteur, caller } = await addPorteur('PETR');
    const epciA = await addMembre(porteur.id, {
      nom: 'A – CC Cœur Lauragais',
      natureInsee: 'CC',
    });
    await addMembre(porteur.id, {
      nom: 'B – CC du Lauragais',
      natureInsee: 'CC',
    });

    const precedent = await caller.demarches.pcaet.create({
      collectiviteId: porteur.id,
      collectivitesCouvertesIds: [epciA.id],
    });
    await db.db
      .update(demarcheTable)
      .set({ status: DemarchePcaetStatusEnum.PUBLIE })
      .where(eq(demarcheTable.id, precedent.id));

    const contexte = await caller.demarches.pcaet.getDepotContext({
      collectiviteId: porteur.id,
    });

    expect(contexte.perimetrePrecedent).toEqual([epciA.id]);
  });

  it('ne pré-coche rien tant que le premier dépôt est en cours', async () => {
    const { porteur, caller } = await addPorteur('PETR');
    const epciA = await addMembre(porteur.id, {
      nom: 'A – CC Cœur Lauragais',
      natureInsee: 'CC',
    });
    await caller.demarches.pcaet.create({
      collectiviteId: porteur.id,
      collectivitesCouvertesIds: [epciA.id],
    });

    const contexte = await caller.demarches.pcaet.getDepotContext({
      collectiviteId: porteur.id,
    });

    expect(contexte.perimetrePrecedent).toEqual([]);
  });
});
