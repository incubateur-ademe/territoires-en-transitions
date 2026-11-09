import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
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
import {
  CollectivitePcaetObligationEnum,
  PcaetPerimetreSaisineEnum,
  PcaetStatutInstructionEnum,
  SEUIL_POPULATION_PCAET,
  TypePorteurSupraEnum,
} from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';
import { pickFreeRegionCode } from '../demarches-pcaet.test-fixture';
import { PcaetInstructeursRepository } from '../shared/pcaet-instructeurs.repository';

describe('Les services de l’État voient le Supra et ses EPCI couverts', () => {
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

  /**
   * Une DREAL, un Supra **hors** de sa région, et deux EPCI membres : l'un dans
   * la région de la DREAL, l'autre chez le Supra. Le dépôt du Supra couvre les
   * deux.
   */
  const addDepotSupraVoisin = async () => {
    const regionDreal = await pickFreeRegionCode(db, 'dreal');
    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: regionDreal,
        nom: 'DREAL test Supra voisin',
      },
    });
    // La DREAL prend sa région : la suivante tirée est forcément une autre.
    const regionSupra = await pickFreeRegionCode(db, 'dreal');

    const supra = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        natureInsee: 'PETR',
        regionCode: regionSupra,
        nom: 'PETR test du voisinage',
      },
    });
    const epciChezLaDreal = await addTestCollectivite(db, {
      nom: 'CC test chez la DREAL',
      natureInsee: 'CC',
      regionCode: regionDreal,
      population: SEUIL_POPULATION_PCAET + 1,
    });
    const epciChezLeSupra = await addTestCollectivite(db, {
      nom: 'CC test chez le Supra',
      natureInsee: 'CC',
      regionCode: regionSupra,
      population: 1000,
    });
    onTestFinished(async () => {
      // `demarche.created_by` retient l'utilisateur : les démarches partent
      // avant lui.
      await cleanupCollectiviteDemarches(db, supra.collectivite.id);
      await supra.cleanup();
      await epciChezLaDreal.cleanup();
      await epciChezLeSupra.cleanup();
      await dreal.cleanup();
    });

    await db.db.insert(collectiviteRelationsTable).values([
      { id: epciChezLaDreal.collectivite.id, parentId: supra.collectivite.id },
      { id: epciChezLeSupra.collectivite.id, parentId: supra.collectivite.id },
    ]);
    const depot = await router
      .createCaller({ user: getAuthUserFromUserCredentials(supra.user) })
      .demarches.pcaet.create({
        collectiviteId: supra.collectivite.id,
        collectivitesCouvertesIds: [
          epciChezLaDreal.collectivite.id,
          epciChezLeSupra.collectivite.id,
        ],
      });

    return {
      dreal,
      drealCaller: router.createCaller({
        user: getAuthUserFromUserCredentials(dreal.user),
      }),
      supra: supra.collectivite,
      epciChezLaDreal: epciChezLaDreal.collectivite,
      epciChezLeSupra: epciChezLeSupra.collectivite,
      depot,
    };
  };

  it('montre le dépôt du Supra, ses EPCI en sous-lignes, et retire l’EPCI des lignes de tête', async () => {
    const { dreal, drealCaller, supra, epciChezLaDreal, epciChezLeSupra } =
      await addDepotSupraVoisin();

    const { items, countByStatut } =
      await drealCaller.demarches.pcaet.listDossiersInstruction({
        collectiviteId: dreal.collectivite.id,
        statuts: [],
        limit: 200,
      });

    const ligneSupra = items.find(
      ({ collectivite }) => collectivite.id === supra.id
    );
    expect(ligneSupra).toMatchObject({
      typePorteurSupra: TypePorteurSupraEnum.PETR,
      statut: PcaetStatutInstructionEnum.EN_ELABORATION,
      collectivitesCouvertes: [
        {
          id: epciChezLaDreal.id,
          obligation: CollectivitePcaetObligationEnum.OBLIGATOIRE,
        },
        {
          id: epciChezLeSupra.id,
          obligation: CollectivitePcaetObligationEnum.VOLONTAIRE,
        },
      ],
    });
    expect(
      items.some(({ collectivite }) => collectivite.id === epciChezLaDreal.id)
    ).toBe(false);
    // Couvert, l'EPCI ne compte plus parmi les collectivités sans dépôt.
    expect(countByStatut[PcaetStatutInstructionEnum.AUCUN_DEPOT]).toBe(0);
  });

  it('filtre le groupe sur le département de ses EPCI couverts', async () => {
    const { dreal, drealCaller, supra, epciChezLaDreal } =
      await addDepotSupraVoisin();

    const { items } = await drealCaller.demarches.pcaet.listDossiersInstruction(
      {
        collectiviteId: dreal.collectivite.id,
        statuts: [],
        obligations: [CollectivitePcaetObligationEnum.OBLIGATOIRE],
      }
    );

    const ligneSupra = items.find(
      ({ collectivite }) => collectivite.id === supra.id
    );
    expect(ligneSupra?.collectivitesCouvertes.map(({ id }) => id)).toEqual([
      epciChezLaDreal.id,
    ]);
  });

  it('ouvre le dépôt en élaboration au service qui ne couvre qu’un EPCI membre', async () => {
    const { drealCaller, depot } = await addDepotSupraVoisin();

    await expect(
      drealCaller.demarches.pcaet.getDossierInstruction({
        demarcheId: depot.id,
      })
    ).resolves.toMatchObject({ demarcheId: depot.id });
  });

  it('saisit à la transmission, en secondaire, le service d’un EPCI couvert', async () => {
    const { dreal, supra, depot } = await addDepotSupraVoisin();
    const instructeurs = app.get(PcaetInstructeursRepository);

    const sansLeDepot = await instructeurs.listInstructeursCouvrants(supra.id);
    expect(
      sansLeDepot.some(
        ({ collectiviteId }) => collectiviteId === dreal.collectivite.id
      )
    ).toBe(false);

    const avecLeDepot = await instructeurs.listInstructeursCouvrants(
      supra.id,
      undefined,
      depot.id
    );
    expect(
      avecLeDepot.find(
        ({ collectiviteId }) => collectiviteId === dreal.collectivite.id
      )
    ).toMatchObject({ perimetre: PcaetPerimetreSaisineEnum.SECONDAIRE });
  });
});
