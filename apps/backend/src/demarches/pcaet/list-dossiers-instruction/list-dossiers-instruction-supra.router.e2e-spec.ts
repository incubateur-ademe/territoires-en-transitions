import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  CollectivitePcaetObligationEnum,
  PcaetPerimetreSaisineEnum,
  PcaetStatutInstructionEnum,
  TypePorteurSupraEnum,
} from '@tet/domain/demarches';
import { addTestDepotSupraVoisin } from './list-dossiers-instruction.test-fixture';
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

  it('montre le dépôt du Supra, ses EPCI en sous-lignes, et retire l’EPCI des lignes de tête', async () => {
    const { dreal, drealCaller, supra, epciChezLaDreal, epciChezLeSupra } =
      await addTestDepotSupraVoisin({ db, router });

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
      await addTestDepotSupraVoisin({ db, router });

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

  it('ramène le dépôt du Supra avec le seul EPCI couvert choisi', async () => {
    const { dreal, drealCaller, supra, epciChezLeSupra } =
      await addTestDepotSupraVoisin({ db, router });

    const { items } = await drealCaller.demarches.pcaet.listDossiersInstruction(
      {
        collectiviteId: dreal.collectivite.id,
        statuts: [],
        collectiviteIds: [epciChezLeSupra.id],
      }
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      collectivite: { id: supra.id },
      collectivitesCouvertes: [{ id: epciChezLeSupra.id }],
    });
  });

  it('tolère une faute de frappe à défaut de nom exact, et le signale', async () => {
    const { dreal, drealCaller, supra } = await addTestDepotSupraVoisin({
      db,
      router,
    });
    const lister = (recherche: string) =>
      drealCaller.demarches.pcaet.listDossiersInstruction({
        collectiviteId: dreal.collectivite.id,
        statuts: [],
        recherche,
      });

    const exacte = await lister('voisinage');
    expect(exacte.isRechercheApprochee).toBe(false);
    expect(exacte.items.map(({ collectivite }) => collectivite.id)).toEqual([
      supra.id,
    ]);

    // « voisinage » amputé d'une lettre : aucun nom ne le contient tel quel.
    const approchee = await lister('voisnage');
    expect(approchee.isRechercheApprochee).toBe(true);
    expect(approchee.items.map(({ collectivite }) => collectivite.id)).toEqual([
      supra.id,
    ]);
  });

  it('ne se rabat pas sur l’approchant quand un nom exact est écarté par un autre filtre', async () => {
    const { dreal, drealCaller } = await addTestDepotSupraVoisin({
      db,
      router,
    });

    // Le dépôt est en élaboration : le filtre « en instruction » l'écarte.
    const result = await drealCaller.demarches.pcaet.listDossiersInstruction({
      collectiviteId: dreal.collectivite.id,
      statuts: [PcaetStatutInstructionEnum.EN_INSTRUCTION],
      recherche: 'voisinage',
    });

    expect(result.items).toEqual([]);
    expect(result.isRechercheApprochee).toBe(false);
  });

  it('ouvre le dépôt en élaboration au service qui ne couvre qu’un EPCI membre', async () => {
    const { drealCaller, depot } = await addTestDepotSupraVoisin({
      db,
      router,
    });

    await expect(
      drealCaller.demarches.pcaet.getDossierInstruction({
        demarcheId: depot.id,
      })
    ).resolves.toMatchObject({ demarcheId: depot.id });
  });

  it('saisit à la transmission, en secondaire, le service d’un EPCI couvert', async () => {
    const { dreal, supra, depot } = await addTestDepotSupraVoisin({
      db,
      router,
    });
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
