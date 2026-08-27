import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  OTHER_PDF_SAMPLE_FILE,
  uploadCreateTestDocument,
} from '@tet/backend/collectivites/documents/documents.test-fixture';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import {
  createTRPCClientFromCaller,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  signInWith,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import request from 'supertest';
import { onTestFinished } from 'vitest';
import { createAuditWithOnTestFinished } from '../../referentiels.test-fixture';
import { createTestDemandePreuve } from '../create-preuve/create-preuve.test-fixture';

describe('List Preuves Router', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let app: INestApplication;

  let collectivite: Collectivite;
  let editeurUser: AuthenticatedUser;
  let visiteurUser: AuthenticatedUser;
  let editeurAuthToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      db,
      {
        collectivite: {},
        users: [
          {
            role: CollectiviteRole.EDITION,
          },
        ],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;
    const editeur = testCollectiviteAndUsersResult.users[0];
    const editeurUserSignInResponse = await signInWith({
      email: editeur.email,
      password: editeur.password,
    });
    editeurAuthToken =
      editeurUserSignInResponse.data.session?.access_token ?? '';
    editeurUser = getAuthUserFromUserCredentials(editeur);

    const noAccessUserResult = await addTestUser(db);
    visiteurUser = getAuthUserFromUserCredentials(noAccessUserResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('List Preuves - Visiteur', () => {
    test('a visiteur can list preuves for a demande (listPreuvesLabellisation)', async () => {
      const { demande } = await createAuditWithOnTestFinished({
        databaseService: db,
        collectiviteId: collectivite.id,
        referentielId: ReferentielIdEnum.CAE,
        withDemande: true,
        dateDebut: null,
      });
      expect(demande).toBeDefined();

      const editeurCaller = router.createCaller({ user: editeurUser });
      const trpcClient = createTRPCClientFromCaller(editeurCaller);
      const testAgent = request(app.getHttpServer());
      await createTestDemandePreuve(
        trpcClient,
        testAgent,
        editeurAuthToken,
        collectivite.id,
        ReferentielIdEnum.CAE
      );

      const visiteurCaller = router.createCaller({ user: visiteurUser });

      const preuves =
        await visiteurCaller.referentiels.labellisations.listPreuvesLabellisation(
          {
            demandeId: demande?.id ?? 0,
          }
        );

      expect(preuves).toBeDefined();
      expect(Array.isArray(preuves)).toBe(true);
      expect(preuves.length).toBe(1);
    });

    test('a visiteur can list preuves for an audit (listPreuvesAudit)', async () => {
      const { audit } = await createAuditWithOnTestFinished({
        databaseService: db,
        collectiviteId: collectivite.id,
        referentielId: ReferentielIdEnum.CAE,
        withDemande: true,
      });

      const caller = router.createCaller({ user: visiteurUser });

      const preuves = await caller.referentiels.labellisations.listPreuvesAudit(
        {
          auditId: audit.id,
        }
      );

      expect(preuves).toBeDefined();
      expect(Array.isArray(preuves)).toBe(true);
    });
  });

  describe('List Preuves - Restrictions de lecture', () => {
    const createCollectiviteAvecDemande = async ({
      accesRestreint,
    }: {
      accesRestreint: boolean;
    }) => {
      const { collectivite, users, cleanup } =
        await addTestCollectiviteAndUsers(db, {
          collectivite: { accesRestreint },
          users: [{ role: CollectiviteRole.EDITION }],
        });
      onTestFinished(cleanup);

      const membre = users[0];
      const membreSignInResponse = await signInWith({
        email: membre.email,
        password: membre.password,
      });

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
        deposeUnePreuve: (document?: {
          fileName?: string;
          sampleFileName?: string;
          confidentiel?: boolean;
        }) =>
          createTestDemandePreuve(
            createTRPCClientFromCaller(membreCaller),
            request(app.getHttpServer()),
            membreSignInResponse.data.session?.access_token ?? '',
            collectivite.id,
            ReferentielIdEnum.CAE,
            document
          ),
        // Le depot d'une preuve d'audit n'a pas de service backend : le front
        // insere directement dans preuve_audit via Supabase (useAddPreuveAudit).
        deposeUnePreuveAudit: async (document: {
          fileName: string;
          sampleFileName?: string;
          confidentiel?: boolean;
        }) => {
          const fichier = await uploadCreateTestDocument({
            collectiviteId: collectivite.id,
            testAgent: request(app.getHttpServer()),
            token: membreSignInResponse.data.session?.access_token ?? '',
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

    test("refuse de lister les preuves d'une collectivite en acces restreint a un utilisateur non membre", async () => {
      const { demandeId, deposeUnePreuve } =
        await createCollectiviteAvecDemande({ accesRestreint: true });
      await deposeUnePreuve();

      const visiteurCaller = router.createCaller({ user: visiteurUser });

      await expect(
        visiteurCaller.referentiels.labellisations.listPreuvesLabellisation({
          demandeId,
        })
      ).rejects.toThrow(
        "Vous n'avez pas les permissions nécessaires pour lister les preuves de cette demande."
      );
    });

    test("refuse de lister les preuves d'audit d'une collectivite en acces restreint a un utilisateur non membre", async () => {
      const { auditId } = await createCollectiviteAvecDemande({
        accesRestreint: true,
      });

      const visiteurCaller = router.createCaller({ user: visiteurUser });

      await expect(
        visiteurCaller.referentiels.labellisations.listPreuvesAudit({ auditId })
      ).rejects.toThrow(
        "Vous n'avez pas les permissions nécessaires pour lister les preuves de cet audit."
      );
    });

    test("masque les documents d'audit confidentiels a un utilisateur non membre", async () => {
      const { auditId, membreCaller, deposeUnePreuveAudit } =
        await createCollectiviteAvecDemande({ accesRestreint: false });

      await deposeUnePreuveAudit({ fileName: 'audit-public.pdf' });
      await deposeUnePreuveAudit({
        fileName: 'audit-confidentiel.pdf',
        sampleFileName: OTHER_PDF_SAMPLE_FILE,
        confidentiel: true,
      });

      const visiteurCaller = router.createCaller({ user: visiteurUser });
      const preuvesVisiteur =
        await visiteurCaller.referentiels.labellisations.listPreuvesAudit({
          auditId,
        });

      expect(preuvesVisiteur.map((preuve) => preuve.fichier?.filename)).toEqual(
        ['audit-public.pdf']
      );

      const preuvesMembre =
        await membreCaller.referentiels.labellisations.listPreuvesAudit({
          auditId,
        });

      expect(preuvesMembre.map((preuve) => preuve.fichier?.filename)).toEqual([
        'audit-public.pdf',
        'audit-confidentiel.pdf',
      ]);
    });

    test('masque les documents confidentiels a un utilisateur non membre', async () => {
      const { demandeId, membreCaller, deposeUnePreuve } =
        await createCollectiviteAvecDemande({ accesRestreint: false });

      await deposeUnePreuve({ fileName: 'preuve-publique.pdf' });
      await deposeUnePreuve({
        fileName: 'preuve-confidentielle.pdf',
        sampleFileName: OTHER_PDF_SAMPLE_FILE,
        confidentiel: true,
      });

      const visiteurCaller = router.createCaller({ user: visiteurUser });
      const preuvesVisiteur =
        await visiteurCaller.referentiels.labellisations.listPreuvesLabellisation(
          { demandeId }
        );

      expect(preuvesVisiteur.map((preuve) => preuve.fichier?.filename)).toEqual(
        ['preuve-publique.pdf']
      );

      const preuvesMembre =
        await membreCaller.referentiels.labellisations.listPreuvesLabellisation(
          { demandeId }
        );

      expect(preuvesMembre.map((preuve) => preuve.fichier?.filename)).toEqual([
        'preuve-publique.pdf',
        'preuve-confidentielle.pdf',
      ]);
    });
  });
});
