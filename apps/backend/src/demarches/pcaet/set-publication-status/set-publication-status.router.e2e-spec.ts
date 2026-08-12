import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  addTestBibliothequeFichier,
  completeTestDossierPcaet,
} from '../demarches-pcaet.test-fixture';

describe('Publication d’une démarche PCAET', () => {
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

  // Antidate l'échéance d'avis (figée à la transmission) pour qu'elle soit écoulée.
  const backdateTransmission = async (demarcheId: number) => {
    await db.db
      .update(demarcheTable)
      .set({
        avisDeadlineAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      })
      .where(eq(demarcheTable.id, demarcheId));
  };

  const adopterDemarche = async (
    caller: ReturnType<TrpcRouter['createCaller']>,
    collectiviteId: number,
    demarcheId: number
  ) => {
    await completeTestDossierPcaet(db, { collectiviteId, demarcheId });
    await caller.demarches.pcaet.applyTransition({
      collectiviteId,
      demarcheId,
      transition: 'transmettre_pour_avis',
    });
    await backdateTransmission(demarcheId);
    await caller.demarches.pcaet.applyTransition({
      collectiviteId,
      demarcheId,
      transition: 'adopter',
    });
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Refuser la publication tant que le PCAET n’est pas adopté', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    await expect(
      caller.demarches.pcaet.setPublicationStatus({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        publicationStatus: 'published',
      })
    ).rejects.toThrow('Seule une démarche adoptée peut être publiée');
  });

  test('Publier puis dépublier une démarche adoptée', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await adopterDemarche(caller, collectivite.id, created.id);

    // La délibération d'adoption (pièce aval requise) conditionne la publication.
    await expect(
      caller.demarches.pcaet.setPublicationStatus({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        publicationStatus: 'published',
      })
    ).rejects.toThrow(
      'Les pièces requises pour la publication n’ont pas toutes été déposées'
    );

    const deliberation = await addTestBibliothequeFichier(db, {
      collectiviteId: collectivite.id,
      filename: 'deliberation-adoption.pdf',
    });
    await caller.demarches.pcaet.documents.add({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      documentId: 'pcaet_deliberation_adoption',
      fichierId: deliberation.id,
    });

    const publiee = await caller.demarches.pcaet.setPublicationStatus({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      publicationStatus: 'published',
    });
    expect(publiee.status).toBe('adopte');
    expect(publiee.publicationStatus).toBe('published');
    expect(publiee.publishedAt).toBeTruthy();

    const depubliee = await caller.demarches.pcaet.setPublicationStatus({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      publicationStatus: 'draft',
    });
    expect(depubliee.status).toBe('adopte');
    expect(depubliee.publicationStatus).toBe('draft');
    expect(depubliee.publishedAt).toBeNull();
  });
});
