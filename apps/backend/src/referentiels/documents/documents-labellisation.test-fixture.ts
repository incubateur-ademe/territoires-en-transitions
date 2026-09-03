import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { uploadCreateTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import {
  createTRPCClientFromCaller,
  getAuthUserFromUserCredentials,
  signInWith,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import request from 'supertest';
import { onTestFinished } from 'vitest';
import { createTestDemandePreuve } from '../labellisations/create-preuve/create-preuve.test-fixture';
import { createAuditWithOnTestFinished } from '../referentiels.test-fixture';

type Contexte = {
  db: DatabaseService;
  router: TrpcRouter;
  app: INestApplication;
  accesRestreint: boolean;
};

/**
 * Monte une collectivité avec un cycle de labellisation complet — un audit et sa
 * demande — et les moyens d'y déposer des documents des deux natures.
 */
export const createCollectiviteAvecCycle = async ({
  db,
  router,
  app,
  accesRestreint,
}: Contexte) => {
  const { collectivite, users, cleanup } = await addTestCollectiviteAndUsers(
    db,
    {
      collectivite: { accesRestreint },
      users: [{ role: CollectiviteRole.EDITION }],
    }
  );
  onTestFinished(cleanup);

  const membre = users[0];
  const membreSignInResponse = await signInWith({
    email: membre.email,
    password: membre.password,
  });
  const membreToken = membreSignInResponse.data.session?.access_token ?? '';

  const { audit, demande } = await createAuditWithOnTestFinished({
    databaseService: db,
    collectiviteId: collectivite.id,
    referentielId: ReferentielIdEnum.CAE,
    withDemande: true,
    dateDebut: null,
  });
  if (!demande) {
    throw new Error('No demande found');
  }

  const membreCaller = router.createCaller({
    user: getAuthUserFromUserCredentials(membre),
  });

  return {
    collectiviteId: collectivite.id,
    auditId: audit.id,
    demandeId: demande.id,
    membreCaller,

    deposeUnDocumentDeDemande: (document?: {
      fileName?: string;
      sampleFileName?: string;
      confidentiel?: boolean;
    }) =>
      createTestDemandePreuve(
        createTRPCClientFromCaller(membreCaller),
        request(app.getHttpServer()),
        membreToken,
        collectivite.id,
        ReferentielIdEnum.CAE,
        document
      ),

    // Le depot d'un document d'audit n'a pas de service backend : le front
    // insere directement dans preuve_audit via Supabase (useAddPreuveAudit).
    deposeUnDocumentDAudit: async (document: {
      fileName: string;
      sampleFileName?: string;
      confidentiel?: boolean;
    }) => {
      const fichier = await uploadCreateTestDocument({
        collectiviteId: collectivite.id,
        testAgent: request(app.getHttpServer()),
        token: membreToken,
        fileName: document.fileName,
        sampleFileName: document.sampleFileName,
        confidentiel: document.confidentiel,
      });
      await db.db.insert(preuveAuditTable).values({
        collectiviteId: collectivite.id,
        auditId: audit.id,
        fichierId: fichier.id,
        commentaire: '',
        modifiedBy: membre.id,
      });
    },
  };
};
