import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUsers,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { uploadCreateTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { getAuthUserFromUserCredentials, signInWith } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Collectivite } from '@tet/domain/collectivites';
import { ObjetPreuveEnum, ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { inferProcedureInput } from '@trpc/server';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { onTestFinished } from 'vitest';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../../test/app-utils';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { AppRouter, TrpcRouter } from '../../../utils/trpc/trpc.router';
import { createAuditWithOnTestFinished } from '../../referentiels.test-fixture';
import { auditTable } from '../audit.table';
import {
  addAuditeurPermission,
  validateAudit,
} from '../labellisations.test-fixture';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
  addUserRoleSupport,
} from '@tet/backend/users/users/users.test-fixture';

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
    await app.close();
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

  test("le super admin en mode support ajoute un document sur un cycle validé", async () => {
    const { input, auditId } = await createValidInput();
    await validateAudit({ databaseService, auditId });

    const { user, cleanup } = await addTestUser(databaseService);
    onTestFinished(cleanup);
    const superAdmin = getAuthUserFromUserCredentials(user);
    const caller = router.createCaller({ user: superAdmin });
    const superAdminMode = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: superAdmin.id,
    });
    onTestFinished(superAdminMode.cleanup);

    const response =
      await caller.referentiels.labellisations.createLabellisationPreuve(input);

    expect(response).toMatchObject({
      demandeId: input.demandeId,
      fichierId: input.fichierId,
    });
  });

  test("refuse l'ajout au super admin dont le mode support est éteint", async () => {
    const { input, auditId } = await createValidInput();
    await validateAudit({ databaseService, auditId });

    const { user, cleanup } = await addTestUser(databaseService);
    onTestFinished(cleanup);
    const supportUser = getAuthUserFromUserCredentials(user);
    const roleSupport = await addUserRoleSupport({
      databaseService,
      userId: supportUser.id,
    });
    onTestFinished(roleSupport.cleanup);

    const caller = router.createCaller({ user: supportUser });

    await expect(
      caller.referentiels.labellisations.createLabellisationPreuve(input)
    ).rejects.toThrowError();
  });

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

  test("persiste l'objet de la preuve quand il est fourni", async () => {
    const caller = router.createCaller({ user: editorUser });
    const { input } = await createValidInput();

    const response =
      await caller.referentiels.labellisations.createLabellisationPreuve({
        ...input,
        objet: ObjetPreuveEnum.CANDIDATURE,
      });

    expect(response.objet).toBe(ObjetPreuveEnum.CANDIDATURE);
  });

  test("laisse l'objet à null quand il n'est pas fourni", async () => {
    const caller = router.createCaller({ user: editorUser });
    const { input } = await createValidInput();

    const response =
      await caller.referentiels.labellisations.createLabellisationPreuve(input);

    expect(response.objet).toBeNull();
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

  const addFichier = async (collectiviteId: number): Promise<number> => {
    const [fichier] = await databaseService.db
      .insert(bibliothequeFichierTable)
      .values({
        collectiviteId,
        hash: randomUUID(),
        filename: 'test-preuve.pdf',
        confidentiel: false,
      })
      .returning();

    return fichier.id;
  };

  const addFichierForAnotherCollectivite = async (): Promise<number> => {
    const { collectivite: autreCollectivite, cleanup } =
      await addTestCollectivite(databaseService);
    onTestFinished(cleanup);

    return addFichier(autreCollectivite.id);
  };

  const getDeletedFichierId = async (): Promise<number> => {
    const fichierId = await addFichier(collectivite.id);
    await databaseService.db
      .delete(bibliothequeFichierTable)
      .where(eq(bibliothequeFichierTable.id, fichierId));

    return fichierId;
  };

  test('refuse un fichier appartenant à une autre collectivité que celle de la demande', async () => {
    const caller = router.createCaller({ user: editorUser });
    const { input } = await createValidInput();
    const fichierId = await addFichierForAnotherCollectivite();

    await expect(
      caller.referentiels.labellisations.createLabellisationPreuve({
        ...input,
        fichierId,
      })
    ).rejects.toThrowError(
      'Aucun fichier trouvé dans la bibliothèque de la collectivité de cette demande.'
    );
  });

  test("refuse un fichier qui n'existe pas", async () => {
    const caller = router.createCaller({ user: editorUser });
    const { input } = await createValidInput();
    const fichierId = await getDeletedFichierId();

    await expect(
      caller.referentiels.labellisations.createLabellisationPreuve({
        ...input,
        fichierId,
      })
    ).rejects.toThrowError(
      'Aucun fichier trouvé dans la bibliothèque de la collectivité de cette demande.'
    );
  });

  const validerAudit = async (auditId: number): Promise<void> => {
    await databaseService.db
      .update(auditTable)
      .set({ valide: true })
      .where(eq(auditTable.id, auditId));
  };

  test("refuse l'ajout d'une preuve une fois l'audit validé (labellisation en cours)", async () => {
    const caller = router.createCaller({ user: editorUser });
    const { input, auditId } = await createValidInput();
    await validerAudit(auditId);

    await expect(
      caller.referentiels.labellisations.createLabellisationPreuve(input)
    ).rejects.toThrowError(/labellisation en cours/i);
  });
});
