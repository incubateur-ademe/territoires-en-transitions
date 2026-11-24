import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { demarcheDocumentAdditionalTable } from '@tet/backend/demarches/shared/models/demarche-document-additional.table';
import { demarcheDocumentTable } from '@tet/backend/demarches/shared/models/demarche-document.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { DocumentStorageService } from '@tet/backend/utils/supabase/document-storage.service';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { addTestBibliothequeFichier } from '../demarches-pcaet.test-fixture';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

const DIAGNOSTIC_ID = 'pcaet_diagnostic';
const DIAGNOSTIC_CONTENT = '%PDF-1.4 diagnostic';
const ANNEXE_FILENAME = 'annexe.pdf';
const ANNEXE_CONTENT = '%PDF-1.4 annexe';
describe('getDossierDocumentUrl', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let collectiviteId: number;
  let demarcheId: number;
  let demandeAvisId: number;
  let documentAdditionalId: number;
  let annexeFichierId: number;
  let filename: string;

  // Un code propre à cette spec, dans l'espace réservé aux codes figés — une
  // lettre puis un chiffre. Voir `pickFreeRegionCode` pour les trois espaces.
  const REGION = 'G2';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test document url' },
    });
    collectiviteId = deposante.collectivite.id;
    marie = getAuthUserFromUserCredentials(deposante.user);

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test document url',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);

    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.collectivite.id,
        type: 'pcaet',
        titre: 'PCAET test document url',
        status: 'en_elaboration',
      })
      .returning({ id: demarcheTable.id });
    demarcheId = demarche.id;

    const fichier = await addTestBibliothequeFichier(db, {
      collectiviteId: deposante.collectivite.id,
      filename: 'diagnostic.pdf',
    });
    filename = fichier.filename;

    const depose = await router
      .createCaller({ user: marie })
      .demarches.pcaet.documents.add({
        collectiviteId: deposante.collectivite.id,
        demarcheId,
        documentId: DIAGNOSTIC_ID,
        fichierId: fichier.id,
      });

    const documentStorage = app.get(DocumentStorageService);
    const storeResult = await documentStorage.storeDocument({
      bucketId: depose.fichier?.bucketId ?? '',
      key: depose.fichier?.hash ?? '',
      contentType: 'application/pdf',
      content: Buffer.from(DIAGNOSTIC_CONTENT),
    });
    expect(storeResult.success).toBe(true);

    const fichierAdditional = await addTestBibliothequeFichier(db, {
      collectiviteId,
      filename: ANNEXE_FILENAME,
    });
    annexeFichierId = fichierAdditional.id;
    const caller = router.createCaller({ user: marie });
    const pieceAdditional =
      await caller.demarches.pcaet.documents.createAdditional({
        collectiviteId,
        demarcheId,
        etape: 'amont',
      });
    documentAdditionalId = pieceAdditional.id;
    const annexe = await caller.demarches.pcaet.documents.updateAdditional({
      collectiviteId,
      demarcheId,
      documentAdditionalId,
      fichierId: annexeFichierId,
    });
    expect(annexe.titre).toBe('');
    const storeAnnexeResult = await documentStorage.storeDocument({
      bucketId: annexe.fichier?.bucketId ?? '',
      key: annexe.fichier?.hash ?? '',
      contentType: 'application/pdf',
      content: Buffer.from(ANNEXE_CONTENT),
    });
    expect(storeAnnexeResult.success).toBe(true);

    await db.db
      .update(demarcheTable)
      .set({
        status: 'transmis_pour_avis',
        transmittedAt: new Date().toISOString(),
        avisDeadlineAt: new Date(
          Date.now() + 30 * 24 * 3600 * 1000
        ).toISOString(),
      })
      .where(eq(demarcheTable.id, demarcheId));

    const [demande] = await db.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId,
        instructeurCollectiviteId: dreal.collectivite.id,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });
    demandeAvisId = demande.id;

    return async () => {
      for (const { fichier } of [depose, annexe]) {
        if (fichier?.bucketId) {
          await documentStorage.removeDocument({
            bucketId: fichier.bucketId,
            key: fichier.hash,
          });
        }
      }
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.id, demandeAvisId));
      await db.db.delete(demarcheTable).where(eq(demarcheTable.id, demarcheId));
      await dreal.cleanup();
      await deposante.cleanup();
      await app.close();
    };
  });

  it("l'instructrice télécharge la version transmise même après une reprise", async () => {
    const [reprise] = await db.db
      .insert(demarcheDocumentTable)
      .values({
        collectiviteId,
        demarcheId,
        documentId: DIAGNOSTIC_ID,
        etape: 'aval',
        fichierId: annexeFichierId,
      })
      .returning({ id: demarcheDocumentTable.id });
    onTestFinished(async () => {
      await db.db
        .delete(demarcheDocumentTable)
        .where(eq(demarcheDocumentTable.id, reprise.id));
    });

    const result = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDossierDocumentUrl({
        demandeAvisId,
        documentId: DIAGNOSTIC_ID,
      });

    expect(result.filename).toBe(filename);
    expect(result.url).toContain('/sign/');

    const response = await fetch(result.url);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(DIAGNOSTIC_CONTENT);
  });

  it("l'instructrice télécharge une pièce additionnelle sans titre", async () => {
    const result = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDossierDocumentUrl({
        demandeAvisId,
        documentAdditionalId,
      });

    expect(result.filename).toBe(ANNEXE_FILENAME);
    const response = await fetch(result.url);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(ANNEXE_CONTENT);
  });

  /**
   * Avant la transmission, la même pièce se lit par la démarche, au titre du
   * périmètre : le service suit un dépôt qu'il instruira. La clé par démarche
   * se referme dès que le dossier est transmis — la saisine prend le relais.
   */
  it('sert la pièce par la démarche tant que le dépôt est en élaboration', async () => {
    await db.db
      .update(demarcheTable)
      .set({ status: 'en_elaboration' })
      .where(eq(demarcheTable.id, demarcheId));
    onTestFinished(async () => {
      await db.db
        .update(demarcheTable)
        .set({ status: 'transmis_pour_avis' })
        .where(eq(demarcheTable.id, demarcheId));
    });

    const result = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDossierDocumentUrl({
        demarcheId,
        documentId: DIAGNOSTIC_ID,
      });

    expect(result.filename).toBe(filename);

    const annexe = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDossierDocumentUrl({
        demarcheId,
        documentAdditionalId,
      });
    expect(annexe.filename).toBe(ANNEXE_FILENAME);
  });

  it('refuse la clé par démarche une fois le dossier transmis', async () => {
    await expect(
      router
        .createCaller({ user: camille })
        .demarches.pcaet.getDossierDocumentUrl({
          demarcheId,
          documentId: DIAGNOSTIC_ID,
        })
    ).rejects.toThrow();
  });

  it.each(['catalogue', 'additionnelle'] as const)(
    "refuse l'agente de la collectivité déposante pour une pièce %s",
    async (type) => {
      const documentRef =
        type === 'catalogue'
          ? { documentId: DIAGNOSTIC_ID }
          : { documentAdditionalId };
      await expect(
        router
          .createCaller({ user: marie })
          .demarches.pcaet.getDossierDocumentUrl({
            demandeAvisId,
            ...documentRef,
          })
      ).rejects.toThrow();
    }
  );

  it('refuse un document absent du dossier', async () => {
    await expect(
      router
        .createCaller({ user: camille })
        .demarches.pcaet.getDossierDocumentUrl({
          demandeAvisId,
          documentId: 'pcaet_strategie_territoriale',
        })
    ).rejects.toThrow("Le document n'a pas été trouvé dans ce dossier");
  });

  it("refuse une pièce additionnelle d'un autre dossier de la même collectivité", async () => {
    const [autreDemarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId,
        type: 'pcaet',
        titre: 'PCAET précédent',
        status: 'archive',
      })
      .returning({ id: demarcheTable.id });
    onTestFinished(async () => {
      await db.db
        .delete(demarcheTable)
        .where(eq(demarcheTable.id, autreDemarche.id));
    });
    const [autrePiece] = await db.db
      .insert(demarcheDocumentAdditionalTable)
      .values({
        collectiviteId,
        demarcheId: autreDemarche.id,
        etape: 'amont',
        fichierId: annexeFichierId,
      })
      .returning({ id: demarcheDocumentAdditionalTable.id });

    await expect(
      router
        .createCaller({ user: camille })
        .demarches.pcaet.getDossierDocumentUrl({
          demandeAvisId,
          documentAdditionalId: autrePiece.id,
        })
    ).rejects.toThrow("Le document n'a pas été trouvé dans ce dossier");
  });

  it.each([
    { raison: 'sans fichier', etape: 'amont', avecFichier: false },
    { raison: 'déposée après les avis', etape: 'aval', avecFichier: true },
  ] as const)(
    'refuse une pièce additionnelle $raison',
    async ({ etape, avecFichier }) => {
      const [piece] = await db.db
        .insert(demarcheDocumentAdditionalTable)
        .values({
          collectiviteId,
          demarcheId,
          etape,
          fichierId: avecFichier ? annexeFichierId : null,
        })
        .returning({ id: demarcheDocumentAdditionalTable.id });
      onTestFinished(async () => {
        await db.db
          .delete(demarcheDocumentAdditionalTable)
          .where(eq(demarcheDocumentAdditionalTable.id, piece.id));
      });

      await expect(
        router
          .createCaller({ user: camille })
          .demarches.pcaet.getDossierDocumentUrl({
            demandeAvisId,
            documentAdditionalId: piece.id,
          })
      ).rejects.toThrow("Le document n'a pas été trouvé dans ce dossier");
    }
  );

  it.each(['absente', 'ambiguë'] as const)(
    'refuse une référence de pièce %s',
    async (reference) => {
      const input =
        reference === 'absente'
          ? { demandeAvisId }
          : { demandeAvisId, documentId: DIAGNOSTIC_ID, documentAdditionalId };

      await expect(
        router
          .createCaller({ user: camille })
          .demarches.pcaet.getDossierDocumentUrl(
            // Entrée invalide envoyée par un client non typé.
            input as never
          )
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    }
  );
});
