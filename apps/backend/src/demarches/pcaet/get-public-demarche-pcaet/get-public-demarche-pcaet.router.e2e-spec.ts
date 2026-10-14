import { buildRandomDocumentHash } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { demarcheDocumentTable } from '@tet/backend/demarches/shared/models/demarche-document.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { DemarchePcaetStatusEnum } from '@tet/domain/demarches';
import { PlanStatusEnum } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import {
  addTestBibliothequeFichier,
  attachTestPlanToDemarchePcaet,
  createDemarche,
  PCAET_DOCUMENT_GLOBAL_ID,
} from '../demarches-pcaet.test-fixture';

describe('demarches.pcaet.getPublic', () => {
  let db: DatabaseService;
  let router: TrpcRouter;
  let visiteurCaller: ReturnType<TrpcRouter['createCaller']>;

  const publier = (demarcheId: number) =>
    db.db
      .update(demarcheTable)
      .set({ status: DemarchePcaetStatusEnum.PUBLIE })
      .where(eq(demarcheTable.id, demarcheId));

  const addFiche = async (
    collectiviteId: number,
    axeId: number,
    {
      titre,
      restreint,
      createdBy,
    }: { titre: string; restreint: boolean; createdBy: string }
  ) => {
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({ collectiviteId, titre, restreint })
      .returning({ id: ficheActionTable.id });
    await db.db
      .insert(ficheActionAxeTable)
      .values({ ficheId: fiche.id, axeId, createdBy });
    return fiche;
  };

  const lecteurCallerFor = async (collectiviteId: number) => {
    const lecteur = await addTestUser(db, {
      collectiviteId,
      role: CollectiviteRole.LECTURE,
    });
    return router.createCaller({
      user: getAuthUserFromUserCredentials(lecteur.user),
    });
  };

  beforeAll(async () => {
    const app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const visiteur = await addTestUser(db);
    visiteurCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(visiteur.user),
    });

    return async () => {
      await app.close();
    };
  });

  test('une démarche hors des statuts publics répond comme absente', async () => {
    const { collectiviteId, demarche } = await createDemarche(db, router);

    await expect(
      visiteurCaller.demarches.pcaet.getPublic({
        collectiviteId,
        demarcheId: demarche.id,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      visiteurCaller.demarches.pcaet.getPublicDiagnostic({
        collectiviteId,
        demarcheId: demarche.id,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('donne en-tête, pièces et plans, sans avis', async () => {
    const { collectiviteId, demarche, user } = await createDemarche(db, router);
    const fichier = await addTestBibliothequeFichier(db, { collectiviteId });
    await db.db.insert(demarcheDocumentTable).values({
      collectiviteId,
      demarcheId: demarche.id,
      documentId: PCAET_DOCUMENT_GLOBAL_ID,
      etape: 'amont',
      fichierId: fichier.id,
    });
    const plan = await attachTestPlanToDemarchePcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });
    await addFiche(collectiviteId, plan.id, {
      titre: 'Fiche publique',
      restreint: false,
      createdBy: user.id,
    });
    await publier(demarche.id);

    const consultation = await visiteurCaller.demarches.pcaet.getPublic({
      collectiviteId,
      demarcheId: demarche.id,
    });

    expect(consultation.demarche).toMatchObject({
      id: demarche.id,
      status: DemarchePcaetStatusEnum.PUBLIE,
    });
    expect(
      consultation.documents.documents.map(({ fichier }) => fichier?.id)
    ).toContain(fichier.id);
    expect(consultation.plans).toHaveLength(1);
    expect(consultation.plans[0].fiches.map(({ titre }) => titre)).toEqual([
      'Fiche publique',
    ]);
    expect(consultation).not.toHaveProperty('avis');
    expect(
      consultation.documents.documents.every(
        ({ modifiedBy, commentaire }) =>
          modifiedBy === null && commentaire === ''
      )
    ).toBe(true);

    const diagnostic = await visiteurCaller.demarches.pcaet.getPublicDiagnostic(
      { collectiviteId, demarcheId: demarche.id }
    );
    expect(diagnostic).toHaveProperty('indicateurDefinitions');
  });

  test('écarte pour un visiteur ce que seuls les membres lisent', async () => {
    const { collectiviteId, demarche, user } = await createDemarche(db, router);
    const [confidentiel] = await db.db
      .insert(bibliothequeFichierTable)
      .values({
        collectiviteId,
        hash: buildRandomDocumentHash(),
        filename: 'note-interne.pdf',
        confidentiel: true,
      })
      .returning({ id: bibliothequeFichierTable.id });
    await db.db.insert(demarcheDocumentTable).values({
      collectiviteId,
      demarcheId: demarche.id,
      documentId: PCAET_DOCUMENT_GLOBAL_ID,
      etape: 'amont',
      fichierId: confidentiel.id,
    });

    const plan = await attachTestPlanToDemarchePcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });
    await addFiche(collectiviteId, plan.id, {
      titre: 'Fiche publique',
      restreint: false,
      createdBy: user.id,
    });
    await addFiche(collectiviteId, plan.id, {
      titre: 'Fiche restreinte',
      restreint: true,
      createdBy: user.id,
    });
    const planAVerifier = await attachTestPlanToDemarchePcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
      nom: 'Plan importé à vérifier',
    });
    await db.db
      .update(axeTable)
      .set({ status: PlanStatusEnum.TO_VERIFY })
      .where(eq(axeTable.id, planAVerifier.id));
    await publier(demarche.id);

    const visiteur = await visiteurCaller.demarches.pcaet.getPublic({
      collectiviteId,
      demarcheId: demarche.id,
    });
    expect(
      visiteur.documents.documents.some(
        ({ fichier }) => fichier?.id === confidentiel.id
      )
    ).toBe(false);
    expect(visiteur.plans.map(({ id }) => id)).toEqual([plan.id]);
    expect(visiteur.plans[0].fiches.map(({ titre }) => titre)).toEqual([
      'Fiche publique',
    ]);
    expect(visiteur.plans[0].nbFiches).toBe(1);

    const lecteurCaller = await lecteurCallerFor(collectiviteId);
    const lecteur = await lecteurCaller.demarches.pcaet.getPublic({
      collectiviteId,
      demarcheId: demarche.id,
    });
    expect(
      lecteur.documents.documents.some(
        ({ fichier }) => fichier?.id === confidentiel.id
      )
    ).toBe(true);
    expect(lecteur.plans[0].fiches.map(({ titre }) => titre).sort()).toEqual([
      'Fiche publique',
      'Fiche restreinte',
    ]);
  });

  test('répond absente à un visiteur sur une collectivité en accès restreint, pas à un membre en lecture', async () => {
    const { collectiviteId, demarche } = await createDemarche(db, router, {
      collectivite: { accesRestreint: true },
    });
    await publier(demarche.id);

    await expect(
      visiteurCaller.demarches.pcaet.getPublic({
        collectiviteId,
        demarcheId: demarche.id,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      visiteurCaller.demarches.pcaet.getPublicDiagnostic({
        collectiviteId,
        demarcheId: demarche.id,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    const lecteurCaller = await lecteurCallerFor(collectiviteId);
    await expect(
      lecteurCaller.demarches.pcaet.getPublic({
        collectiviteId,
        demarcheId: demarche.id,
      })
    ).resolves.toMatchObject({ demarche: { id: demarche.id } });
  });

  test("ne sert pas une démarche sous l'identifiant d'une autre collectivité", async () => {
    const { demarche } = await createDemarche(db, router);
    const autre = await createDemarche(db, router);
    await publier(demarche.id);

    await expect(
      visiteurCaller.demarches.pcaet.getPublic({
        collectiviteId: autre.collectiviteId,
        demarcheId: demarche.id,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('ne donne le programme d’actions d’une collectivité restreinte qu’à qui peut en lire les plans', async () => {
    const { collectiviteId, demarche, user } = await createDemarche(
      db,
      router,
      {
        // Sur une collectivité ouverte, tout compte vérifié lit les plans : c'est
        // l'accès restreint qui réserve les plans aux rôles qui les lisent.
        collectivite: { accesRestreint: true },
      }
    );
    const plan = await attachTestPlanToDemarchePcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });
    await addFiche(collectiviteId, plan.id, {
      titre: 'Fiche publique',
      restreint: false,
      createdBy: user.id,
    });
    await publier(demarche.id);

    const editeurFiches = await addTestUser(db, {
      collectiviteId,
      role: CollectiviteRole.EDITION_FICHES_INDICATEURS,
    });
    const editeurFichesCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(editeurFiches.user),
    });
    const consultation = await editeurFichesCaller.demarches.pcaet.getPublic({
      collectiviteId,
      demarcheId: demarche.id,
    });

    expect(consultation.demarche.id).toBe(demarche.id);
    expect(consultation.plans).toEqual([]);
  });
});
