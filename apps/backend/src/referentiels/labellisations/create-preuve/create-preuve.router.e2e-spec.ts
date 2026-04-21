import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { uploadCreateTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { getAuthUserFromUserCredentials, signInWith } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import request from 'supertest';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../../test/app-utils';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { AppRouter, TrpcRouter } from '../../../utils/trpc/trpc.router';
import { createAuditWithOnTestFinished } from '../../referentiels.test-fixture';
import { addAuditeurPermission } from '../labellisations.test-fixture';

type Input = inferProcedureInput<
  AppRouter['referentiels']['labellisations']['createLabellisationPreuve']
>;

describe('CreatePreuveRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let readerUser: AuthenticatedUser;
  let createdDocumentId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      databaseService,
      {
        users: [
          {
            role: CollectiviteRole.EDITION,
          },
          {
            role: CollectiviteRole.LECTURE,
          },
        ],
      }
    );
    const _cleanupUsersAndCollectivite = testCollectiviteAndUsersResult.cleanup;

    collectivite = testCollectiviteAndUsersResult.collectivite;
    const editorUserFixture = testCollectiviteAndUsersResult.users[0];
    editorUser = getAuthUserFromUserCredentials(editorUserFixture);
    readerUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[1]
    );

    const editorUserSignInResponse = await signInWith({
      email: editorUserFixture.email,
      password: editorUserFixture.password,
    });
    const editorAuthToken = editorUserSignInResponse.data.session?.access_token;
    if (!editorAuthToken) {
      throw new Error('Failed to sign in editor user: no access token');
    }

    const testAgent = request(app.getHttpServer());
    const createdDocument = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: editorAuthToken,
      fileName: 'test-preuve.pdf',
    });
    createdDocumentId = createdDocument.id;

  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const createValidInput = async ({
    dateDebut,
  }: {
    dateDebut?: string | null;
  } = {}): Promise<{ input: Input; auditId: number }> => {
    const { audit, demande } = await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      withDemande: true,
      dateDebut,
    });

    if (!demande) {
      throw new Error('No demande found');
    }

    return {
      auditId: audit.id,
      input: {
        demandeId: demande.id,
        fichierId: createdDocumentId,
        commentaire: '',
      },
    };
  };

  test('a lecteur cannot create a preuve', async () => {
    const caller = router.createCaller({ user: readerUser });
    const { input } = await createValidInput();

    await expect(
      caller.referentiels.labellisations.createLabellisationPreuve(input)
    ).rejects.toThrowError(/permissions nécessaires/i);
  });

  test('an editor user can create a preuve', async () => {
    const caller = router.createCaller({ user: editorUser });
    const { input } = await createValidInput();

    const response =
      await caller.referentiels.labellisations.createLabellisationPreuve(input);

    expect(response).toMatchObject({
      id: expect.any(Number),
      collectiviteId: collectivite.id,
      demandeId: input.demandeId,
      fichierId: input.fichierId,
      commentaire: '',
      modifiedBy: editorUser.id,
    });
  });

  test('an auditeur cannot create a preuve if the audit has not started', async () => {
    const caller = router.createCaller({ user: readerUser });
    const { input, auditId } = await createValidInput({ dateDebut: null });

    await addAuditeurPermission({
      databaseService,
      auditId,
      userId: readerUser.id,
    });

    await expect(
      caller.referentiels.labellisations.createLabellisationPreuve(input)
    ).rejects.toThrowError(/permissions nécessaires/i);
  });

  test('an auditeur can create a preuve if the audit has started', async () => {
    const caller = router.createCaller({ user: readerUser });
    const { input, auditId } = await createValidInput();

    await addAuditeurPermission({
      databaseService,
      auditId,
      userId: readerUser.id,
    });

    const response =
      await caller.referentiels.labellisations.createLabellisationPreuve(input);

    expect(response).toMatchObject({
      id: expect.any(Number),
      collectiviteId: collectivite.id,
      demandeId: input.demandeId,
      fichierId: input.fichierId,
      commentaire: '',
      modifiedBy: readerUser.id,
    });
  });
});
