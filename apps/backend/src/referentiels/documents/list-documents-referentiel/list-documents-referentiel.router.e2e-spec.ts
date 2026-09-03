import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  OTHER_PDF_SAMPLE_FILE,
  uploadCreateTestDocument,
} from '@tet/backend/collectivites/documents/documents.test-fixture';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { preuveRapportTable } from '@tet/backend/collectivites/documents/models/preuve-rapport.table';
import {
  createTRPCClientFromCaller,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  signInWith,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { onTestFinished } from 'vitest';
import { createAuditWithOnTestFinished } from '../../referentiels.test-fixture';
import { createTestDemandePreuve } from '../../labellisations/create-preuve/create-preuve.test-fixture';

describe('List Documents Router', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let app: INestApplication;
  let visiteurUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const visiteurResult = await addTestUser(db);
    visiteurUser = getAuthUserFromUserCredentials(visiteurResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  const createCollectiviteWithCycle = async ({
    accesRestreint,
  }: {
    accesRestreint: boolean;
  }) => {
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

    const { audit, demande } = await createAuditWithOnTestFinished({
      databaseService: db,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      withDemande: true,
      dateDebut: null,
    });

    const uploadFichier = (document: {
      fileName: string;
      sampleFileName?: string;
      confidentiel?: boolean;
    }) =>
      uploadCreateTestDocument({
        collectiviteId: collectivite.id,
        testAgent: request(app.getHttpServer()),
        token: membreSignInResponse.data.session?.access_token ?? '',
        fileName: document.fileName,
        sampleFileName: document.sampleFileName,
        confidentiel: document.confidentiel,
      });

    const membreCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(membre),
    });

    return {
      collectiviteId: collectivite.id,
      demandeId: demande?.id ?? null,
      membreCaller,
      uploadFichier,
      addPreuve: (document?: {
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
      insertPreuveAudit: async (document: {
        fileName: string;
        sampleFileName?: string;
        confidentiel?: boolean;
      }) => {
        const fichier = await uploadFichier(document);
        const [preuve] = await db.db
          .insert(preuveAuditTable)
          .values({
            collectiviteId: collectivite.id,
            auditId: audit.id,
            fichierId: fichier.id,
            commentaire: '',
            modifiedBy: membre.id,
          })
          .returning({ id: preuveAuditTable.id });
        onTestFinished(async () => {
          await db.db
            .delete(preuveAuditTable)
            .where(eq(preuveAuditTable.id, preuve.id));
        });
      },
      insertRapport: async (document: {
        fileName: string;
        sampleFileName?: string;
        confidentiel?: boolean;
        date?: string;
      }) => {
        const fichier = await uploadFichier(document);
        const [preuve] = await db.db
          .insert(preuveRapportTable)
          .values({
            collectiviteId: collectivite.id,
            fichierId: fichier.id,
            commentaire: '',
            modifiedBy: membre.id,
            date: document.date ?? '2026-01-15T00:00:00.000Z',
          })
          .returning({ id: preuveRapportTable.id });
        onTestFinished(async () => {
          await db.db
            .delete(preuveRapportTable)
            .where(eq(preuveRapportTable.id, preuve.id));
        });
      },
    };
  };

  test('rend les rapports de visite du plus recent au plus ancien', async () => {
    const { collectiviteId, membreCaller, insertRapport } =
      await createCollectiviteWithCycle({ accesRestreint: false });
    await insertRapport({
      fileName: 'visite-2024.pdf',
      date: '2024-06-15T00:00:00.000Z',
    });
    await insertRapport({
      fileName: 'visite-2026.pdf',
      sampleFileName: OTHER_PDF_SAMPLE_FILE,
      date: '2026-06-15T00:00:00.000Z',
    });

    const documents = await membreCaller.referentiels.documents.listDocumentsReferentiel({
      collectiviteId,
      referentielId: ReferentielIdEnum.CAE,
    });

    expect(documents.rapport.map((preuve) => preuve.fichier?.filename)).toEqual(
      ['visite-2026.pdf', 'visite-2024.pdf']
    );
  });

  test('rend le dernier rapport depose en premier quand deux rapports partagent la meme date', async () => {
    const { collectiviteId, membreCaller, insertRapport } =
      await createCollectiviteWithCycle({ accesRestreint: false });
    await insertRapport({
      fileName: 'visite-deposee-en-premier.pdf',
      date: '2026-06-15T00:00:00.000Z',
    });
    await insertRapport({
      fileName: 'visite-deposee-en-second.pdf',
      sampleFileName: OTHER_PDF_SAMPLE_FILE,
      date: '2026-06-15T00:00:00.000Z',
    });

    const documents = await membreCaller.referentiels.documents.listDocumentsReferentiel({
      collectiviteId,
      referentielId: ReferentielIdEnum.CAE,
    });

    expect(documents.rapport.map((preuve) => preuve.fichier?.filename)).toEqual(
      ['visite-deposee-en-second.pdf', 'visite-deposee-en-premier.pdf']
    );
  });

  test("n'expose pas le fichier d'une autre collectivite porte par un document", async () => {
    const cycle = await createCollectiviteWithCycle({ accesRestreint: false });
    const otherCycle = await createCollectiviteWithCycle({
      accesRestreint: false,
    });
    const otherCycleFichier = await otherCycle.uploadFichier({
      fileName: 'document-de-la-collectivite-voisine.pdf',
    });

    const [preuve] = await db.db
      .insert(preuveLabellisationTable)
      .values({
        collectiviteId: cycle.collectiviteId,
        demandeId: cycle.demandeId as number,
        fichierId: otherCycleFichier.id,
        commentaire: '',
        modifiedBy: visiteurUser.id,
      })
      .returning({ id: preuveLabellisationTable.id });
    onTestFinished(async () => {
      await db.db
        .delete(preuveLabellisationTable)
        .where(eq(preuveLabellisationTable.id, preuve.id));
    });

    const documents =
      await cycle.membreCaller.referentiels.documents.listDocumentsReferentiel({
        collectiviteId: cycle.collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
      });

    expect(
      documents.labellisation.map((document) => document.fichier)
    ).not.toContainEqual(
      expect.objectContaining({
        filename: 'document-de-la-collectivite-voisine.pdf',
      })
    );
  });

  test('rend les documents de labellisation du référentiel à un visiteur vérifié non membre', async () => {
    const { collectiviteId, addPreuve } = await createCollectiviteWithCycle({
      accesRestreint: false,
    });
    await addPreuve({ fileName: 'dossier-candidature.pdf' });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const documents = await visiteurCaller.referentiels.documents.listDocumentsReferentiel(
      {
        collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
      }
    );

    expect(
      documents.labellisation.map((document) => document.fichier?.filename)
    ).toEqual(['dossier-candidature.pdf']);
    expect(documents.audit).toEqual([]);
    expect(documents.rapport).toEqual([]);
  });

  test('expose le champ objet sur les documents de labellisation', async () => {
    const { collectiviteId, addPreuve } = await createCollectiviteWithCycle({
      accesRestreint: false,
    });
    await addPreuve({ fileName: 'acte-candidature.pdf' });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const documents = await visiteurCaller.referentiels.documents.listDocumentsReferentiel(
      {
        collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
      }
    );

    expect(documents.labellisation[0]).toHaveProperty('objet');
    expect(documents.labellisation[0].objet).toBeNull();
  });

  test('conserve chaque document dans son cycle via demande', async () => {
    const { collectiviteId, addPreuve } = await createCollectiviteWithCycle({
      accesRestreint: false,
    });
    await addPreuve({ fileName: 'piece-du-cycle.pdf' });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const documents = await visiteurCaller.referentiels.documents.listDocumentsReferentiel(
      {
        collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
      }
    );

    const document = documents.labellisation[0];
    expect(document.demande).not.toBeNull();
    expect(document.demande?.referentiel).toBe(ReferentielIdEnum.CAE);
    expect(document.preuveType).toBe('labellisation');
  });

  test('masque les documents confidentiels à un visiteur non membre', async () => {
    const { collectiviteId, membreCaller, addPreuve } =
      await createCollectiviteWithCycle({ accesRestreint: false });

    await addPreuve({ fileName: 'piece-publique.pdf' });
    await addPreuve({
      fileName: 'piece-confidentielle.pdf',
      sampleFileName: OTHER_PDF_SAMPLE_FILE,
      confidentiel: true,
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const documentsVisiteur =
      await visiteurCaller.referentiels.documents.listDocumentsReferentiel({
        collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
      });

    expect(
      documentsVisiteur.labellisation.map(
        (document) => document.fichier?.filename
      )
    ).toEqual(['piece-publique.pdf']);

    const documentsMembre =
      await membreCaller.referentiels.documents.listDocumentsReferentiel({
        collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
      });

    expect(
      documentsMembre.labellisation.map(
        (document) => document.fichier?.filename
      )
    ).toEqual(['piece-publique.pdf', 'piece-confidentielle.pdf']);
  });

  test("refuse la lecture d'une collectivité en accès restreint à un utilisateur non membre", async () => {
    const { collectiviteId, addPreuve } = await createCollectiviteWithCycle({
      accesRestreint: true,
    });
    await addPreuve();

    const visiteurCaller = router.createCaller({ user: visiteurUser });

    await expect(
      visiteurCaller.referentiels.documents.listDocumentsReferentiel({
        collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
      })
    ).rejects.toThrow(
      "Vous n'avez pas les permissions nécessaires pour lister les documents de ce référentiel."
    );
  });

  test("n'expose pas les documents d'une autre collectivité", async () => {
    const cycle = await createCollectiviteWithCycle({
      accesRestreint: false,
    });
    await cycle.addPreuve({ fileName: 'document-demande.pdf' });

    const otherCycle = await createCollectiviteWithCycle({
      accesRestreint: false,
    });
    await otherCycle.addPreuve({ fileName: 'document-voisin.pdf' });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const documents = await visiteurCaller.referentiels.documents.listDocumentsReferentiel(
      {
        collectiviteId: cycle.collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
      }
    );

    expect(
      documents.labellisation.map((document) => document.fichier?.filename)
    ).toEqual(['document-demande.pdf']);
  });

  test("n'expose pas les documents de labellisation d'un autre référentiel", async () => {
    const { collectiviteId, addPreuve } = await createCollectiviteWithCycle({
      accesRestreint: false,
    });
    await addPreuve({ fileName: 'document-cae.pdf' });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const documents = await visiteurCaller.referentiels.documents.listDocumentsReferentiel(
      {
        collectiviteId,
        referentielId: ReferentielIdEnum.ECI,
      }
    );

    expect(documents.labellisation).toEqual([]);
  });

  test("masque les documents d'audit confidentiels à un visiteur non membre", async () => {
    const { collectiviteId, membreCaller, insertPreuveAudit } =
      await createCollectiviteWithCycle({ accesRestreint: false });

    await insertPreuveAudit({
      fileName: 'rapport-audit.pdf',
    });
    await insertPreuveAudit({
      fileName: 'annexe-confidentielle.pdf',
      sampleFileName: OTHER_PDF_SAMPLE_FILE,
      confidentiel: true,
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const documentsVisiteur =
      await visiteurCaller.referentiels.documents.listDocumentsReferentiel({
        collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
      });

    expect(
      documentsVisiteur.audit.map((document) => document.fichier?.filename)
    ).toEqual(['rapport-audit.pdf']);

    const documentsMembre =
      await membreCaller.referentiels.documents.listDocumentsReferentiel({
        collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
      });

    expect(
      documentsMembre.audit.map((document) => document.fichier?.filename)
    ).toEqual(['rapport-audit.pdf', 'annexe-confidentielle.pdf']);
  });

  test('masque les rapports de visite confidentiels à un visiteur non membre', async () => {
    const { collectiviteId, membreCaller, insertRapport } =
      await createCollectiviteWithCycle({ accesRestreint: false });

    await insertRapport({
      fileName: 'visite-annuelle.pdf',
      date: '2026-06-15T00:00:00.000Z',
    });
    await insertRapport({
      fileName: 'visite-confidentielle.pdf',
      sampleFileName: OTHER_PDF_SAMPLE_FILE,
      confidentiel: true,
      date: '2025-06-15T00:00:00.000Z',
    });

    const visiteurCaller = router.createCaller({ user: visiteurUser });
    const documentsVisiteur =
      await visiteurCaller.referentiels.documents.listDocumentsReferentiel({
        collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
      });

    expect(
      documentsVisiteur.rapport.map((document) => document.fichier?.filename)
    ).toEqual(['visite-annuelle.pdf']);
    expect(documentsVisiteur.rapport[0].rapport.date).toBeDefined();

    const documentsMembre =
      await membreCaller.referentiels.documents.listDocumentsReferentiel({
        collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
      });

    expect(
      documentsMembre.rapport.map((document) => document.fichier?.filename)
    ).toEqual(['visite-annuelle.pdf', 'visite-confidentielle.pdf']);
  });
});
