import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
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
import {
  addTestBibliothequeFichier,
  PCAET_DOCUMENT_GLOBAL_ID,
} from '../demarches-pcaet.test-fixture';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('getDossierDocumentUrl', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let demarcheId: number;
  let demandeAvisId: number;
  let filename: string;

  // Un code région propre à cette spec, pris hors de la plage réelle : les dix-huit
  // codes numériques portent les DREAL de l'import (collectivite/service_etat_import),
  // et l'index unique « une DREAL par région » ne tolère pas deux occupants.
  const REGION = 'DU';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test document url' },
    });
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
      filename: 'dossier-complet.pdf',
    });
    filename = fichier.filename;

    const depose = await router
      .createCaller({ user: marie })
      .demarches.pcaet.documents.add({
        collectiviteId: deposante.collectivite.id,
        demarcheId,
        documentId: PCAET_DOCUMENT_GLOBAL_ID,
        fichierId: fichier.id,
      });

    const documentStorage = app.get(DocumentStorageService);
    const storeResult = await documentStorage.storeDocument({
      bucketId: depose.fichier?.bucketId ?? '',
      key: depose.fichier?.hash ?? '',
      contentType: 'application/pdf',
      content: Buffer.from('%PDF-1.4 test'),
    });
    expect(storeResult.success).toBe(true);

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
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.id, demandeAvisId));
      await db.db.delete(demarcheTable).where(eq(demarcheTable.id, demarcheId));
      await dreal.cleanup();
      await deposante.cleanup();
      await app.close();
    };
  });

  it("l'instructrice obtient une URL signée et le nom du fichier", async () => {
    const result = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDossierDocumentUrl({
        demandeAvisId,
        documentId: PCAET_DOCUMENT_GLOBAL_ID,
      });

    expect(result.filename).toBe(filename);
    expect(result.url).toContain('/sign/');

    const response = await fetch(result.url);
    expect(response.status).toBe(200);
  });

  it("refuse l'agente de la collectivité déposante", async () => {
    await expect(
      router.createCaller({ user: marie }).demarches.pcaet.getDossierDocumentUrl({
        demandeAvisId,
        documentId: PCAET_DOCUMENT_GLOBAL_ID,
      })
    ).rejects.toThrow();
  });

  it('refuse un document absent du dossier', async () => {
    await expect(
      router
        .createCaller({ user: camille })
        .demarches.pcaet.getDossierDocumentUrl({
          demandeAvisId,
          documentId: 'pcaet_diagnostic',
        })
    ).rejects.toThrow("Le document n'a pas été trouvé dans ce dossier");
  });
});
