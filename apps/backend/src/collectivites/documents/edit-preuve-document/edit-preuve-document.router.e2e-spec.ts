import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { uploadCreateTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { createFiche } from '@tet/backend/plans/fiches/fiches.test-fixture';
import { validateAudit } from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
import { createAuditWithOnTestFinished } from '@tet/backend/referentiels/referentiels.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  signInWith,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite, PreuveType } from '@tet/domain/collectivites';
import {
  ObjetPreuve,
  ObjetPreuveEnum,
  ReferentielIdEnum,
} from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { onTestFinished } from 'vitest';
import { preuveLabellisationTable } from '../models/preuve-labellisation.table';

describe('EditPreuveDocumentRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let adminUser: AuthenticatedUser;
  let visiteurUser: AuthenticatedUser;
  let editorAuthToken: string;
  let fichierId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      db,
      {
        users: [
          { role: CollectiviteRole.EDITION },
          { role: CollectiviteRole.ADMIN },
        ],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;
    const editorFixture = testCollectiviteAndUsersResult.users[0];
    editorUser = getAuthUserFromUserCredentials(editorFixture);
    adminUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUsersResult.users[1]
    );

    const signIn = await signInWith({
      email: editorFixture.email,
      password: editorFixture.password,
    });
    editorAuthToken = signIn.data.session?.access_token ?? '';
    if (!editorAuthToken) {
      throw new Error('token éditeur manquant');
    }

    const testAgent = request(app.getHttpServer());
    const doc = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent,
      token: editorAuthToken,
      fileName: 'preuve-update-lien-test.pdf',
    });
    fichierId = doc.id;

    const visiteurResult = await addTestUser(db);
    visiteurUser = getAuthUserFromUserCredentials(visiteurResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('updatePreuve', () => {
    test('un éditeur peut mettre à jour une annexe (preuve)', async () => {
      const caller = router.createCaller({ user: editorUser });
      const ficheId = await createFiche({
        caller,
        ficheInput: {
          titre: 'Fiche annexe lien à modifier',
          collectiviteId: collectivite.id,
        },
      });

      const annexe = await caller.plans.fiches.addAnnexe({
        ficheId,
        commentaire: '',
        lien: { url: 'https://example.com/a', titre: 'Titre A' },
      });

      const updated = await caller.collectivites.documents.updatePreuve({
        preuveId: annexe.id,
        preuveType: 'annexe',
        lien: { url: 'https://example.com/b', titre: 'Titre B' },
        commentaire: 'nouveau',
      });

      expect(updated.id).toBe(annexe.id);
      expect(updated.url).toBe('https://example.com/b');
      expect(updated.titre).toBe('Titre B');
      expect(updated.commentaire).toBe('nouveau');
    });

    test('un visiteur ne peut pas mettre à jour une annexe (preuve)', async () => {
      const editorCaller = router.createCaller({ user: editorUser });
      const ficheId = await createFiche({
        caller: editorCaller,
        ficheInput: {
          titre: 'Fiche annexe protégée',
          collectiviteId: collectivite.id,
        },
      });

      const annexe = await editorCaller.plans.fiches.addAnnexe({
        ficheId,
        lien: { url: 'https://example.com', titre: 'X' },
      });

      const visiteurCaller = router.createCaller({ user: visiteurUser });

      await expect(
        visiteurCaller.collectivites.documents.updatePreuve({
          preuveId: annexe.id,
          preuveType: 'annexe',
          lien: { url: 'https://evil.com', titre: 'Y' },
        })
      ).rejects.toThrowError(/Droits insuffisants|permissions nécessaires/i);
    });

    test("la transformation d'une annexe fichier en lien est refusée", async () => {
      const caller = router.createCaller({ user: editorUser });
      const ficheId = await createFiche({
        caller,
        ficheInput: {
          titre: 'Fiche annexe fichier',
          collectiviteId: collectivite.id,
        },
      });

      const annexe = await caller.plans.fiches.addAnnexe({
        ficheId,
        commentaire: '',
        fichierId,
      });

      await expect(
        caller.collectivites.documents.updatePreuve({
          preuveId: annexe.id,
          preuveType: 'annexe',
          lien: { url: 'https://example.com', titre: 'Nope' },
        })
      ).rejects.toThrowError(/fichier/i);
    });

    test('une preuve inexistante renvoie une erreur', async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.collectivites.documents.updatePreuve({
          preuveId: 2_000_000_000,
          preuveType: 'annexe',
          lien: { url: 'https://example.com', titre: 'X' },
        })
      ).rejects.toThrowError(/n'existe pas/i);
    });
  });

  describe('removePreuve', () => {
    test('un éditeur peut supprimer une preuve (annexe)', async () => {
      const caller = router.createCaller({ user: editorUser });
      const ficheId = await createFiche({
        caller,
        ficheInput: {
          titre: 'Fiche annexe à supprimer',
          collectiviteId: collectivite.id,
        },
      });

      const annexe = await caller.plans.fiches.addAnnexe({
        ficheId,
        commentaire: '',
        lien: { url: 'https://example.com/doc', titre: 'Lien exemple' },
      });

      const result = await caller.collectivites.documents.removePreuve({
        preuveId: annexe.id,
        preuveType: 'annexe',
      });

      expect(result.id).toBe(annexe.id);

      await expect(
        caller.collectivites.documents.removePreuve({
          preuveId: annexe.id,
          preuveType: 'annexe',
        })
      ).rejects.toThrowError(/n'existe pas|not found/i);
    });

    test('un visiteur ne peut pas supprimer de preuve (annexe)', async () => {
      const editorCaller = router.createCaller({ user: editorUser });
      const ficheId = await createFiche({
        caller: editorCaller,
        ficheInput: {
          titre: 'Fiche avec annexe protégée',
          collectiviteId: collectivite.id,
        },
      });

      const annexe = await editorCaller.plans.fiches.addAnnexe({
        ficheId,
        lien: { url: 'https://example.com', titre: 'X' },
      });

      const visiteurCaller = router.createCaller({ user: visiteurUser });

      await expect(
        visiteurCaller.collectivites.documents.removePreuve({
          preuveId: annexe.id,
          preuveType: 'annexe',
        })
      ).rejects.toThrowError(/Droits insuffisants|permissions nécessaires/i);
    });
  });

  describe('documents de candidature (preuve labellisation)', () => {
    const createCandidaturePreuve = async (objet?: ObjetPreuve) => {
      const caller = router.createCaller({ user: editorUser });
      const { audit, demande } = await createAuditWithOnTestFinished({
        databaseService: db,
        collectiviteId: collectivite.id,
        referentielId: ReferentielIdEnum.CAE,
        withDemande: true,
      });
      if (!demande) {
        throw new Error('demande manquante');
      }

      const preuve =
        await caller.referentiels.labellisations.createLabellisationPreuve({
          demandeId: demande.id,
          fichierId,
          commentaire: '',
          objet,
        });

      return { caller, preuve, auditId: audit.id };
    };

    const validerAuditEnCours = (auditId: number) =>
      validateAudit({ databaseService: db, auditId });

    test("un éditeur peut supprimer un document de candidature tant que l'audit n'est pas validé", async () => {
      const { caller, preuve } = await createCandidaturePreuve();

      const result = await caller.collectivites.documents.removePreuve({
        preuveId: preuve.id,
        preuveType: 'labellisation',
      });

      expect(result.id).toBe(preuve.id);
    });

    test("la suppression d'un document de candidature est refusée une fois l'audit validé (labellisation en cours)", async () => {
      const { caller, preuve, auditId } = await createCandidaturePreuve();
      await validerAuditEnCours(auditId);

      await expect(
        caller.collectivites.documents.removePreuve({
          preuveId: preuve.id,
          preuveType: 'labellisation',
        })
      ).rejects.toThrowError(/labellisation en cours/i);
    });

    test("la modification d'un document de candidature est refusée une fois l'audit validé (labellisation en cours)", async () => {
      const { caller, preuve, auditId } = await createCandidaturePreuve();
      await validerAuditEnCours(auditId);

      await expect(
        caller.collectivites.documents.updatePreuve({
          preuveId: preuve.id,
          preuveType: 'labellisation',
          commentaire: 'tentative de modification',
        })
      ).rejects.toThrowError(/labellisation en cours/i);
    });

    test("un objet envoye sur un type de preuve qui n'en porte pas est refuse", async () => {
      const caller = router.createCaller({ user: editorUser });
      const ficheId = await createFiche({
        caller,
        ficheInput: {
          titre: 'Fiche avec annexe',
          collectiviteId: collectivite.id,
        },
      });
      const annexe = await caller.plans.fiches.addAnnexe({
        ficheId,
        lien: { url: 'https://example.com', titre: 'X' },
      });

      const preuveType: PreuveType = 'annexe';

      await expect(
        caller.collectivites.documents.updatePreuve({
          preuveId: annexe.id,
          preuveType,
          commentaire: 'commentaire modifié',
          objet: ObjetPreuveEnum.CANDIDATURE,
        })
      ).rejects.toThrowError();
    });

    test("un super-admin reclasse l'objet d'un document dont l'audit est validé", async () => {
      const { caller, preuve, auditId } = await createCandidaturePreuve();
      await validerAuditEnCours(auditId);

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: editorUser.id,
      });
      onTestFinished(cleanup);

      const updated = await caller.collectivites.documents.updatePreuve({
        preuveId: preuve.id,
        preuveType: 'labellisation',
        objet: ObjetPreuveEnum.CANDIDATURE,
      });

      expect(updated.id).toBe(preuve.id);
      const [row] = await db.db
        .select({ objet: preuveLabellisationTable.objet })
        .from(preuveLabellisationTable)
        .where(eq(preuveLabellisationTable.id, preuve.id));
      expect(row.objet).toBe(ObjetPreuveEnum.CANDIDATURE);
    });

    test("un super-admin qui joint un commentaire au reclassement retombe sous le verrou de l'audit", async () => {
      const { caller, preuve, auditId } = await createCandidaturePreuve();
      await validerAuditEnCours(auditId);

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: editorUser.id,
      });
      onTestFinished(cleanup);

      await expect(
        caller.collectivites.documents.updatePreuve({
          preuveId: preuve.id,
          preuveType: 'labellisation',
          objet: ObjetPreuveEnum.CANDIDATURE,
          commentaire: 'reclassement accompagné d une edition',
        })
      ).rejects.toThrowError(/labellisation en cours/i);

      const [row] = await db.db
        .select({ objet: preuveLabellisationTable.objet })
        .from(preuveLabellisationTable)
        .where(eq(preuveLabellisationTable.id, preuve.id));
      expect(row.objet).toBeNull();
    });

    test("un super-admin declasse l'objet d'un document en le passant a null", async () => {
      const { caller, preuve } = await createCandidaturePreuve(
        ObjetPreuveEnum.CANDIDATURE
      );

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: editorUser.id,
      });
      onTestFinished(cleanup);

      await caller.collectivites.documents.updatePreuve({
        preuveId: preuve.id,
        preuveType: 'labellisation',
        objet: null,
      });

      const [row] = await db.db
        .select({ objet: preuveLabellisationTable.objet })
        .from(preuveLabellisationTable)
        .where(eq(preuveLabellisationTable.id, preuve.id));
      expect(row.objet).toBeNull();
    });

    test("un admin de la collectivite ne peut pas reclasser l'objet d'un document", async () => {
      const { preuve } = await createCandidaturePreuve();
      const adminCaller = router.createCaller({ user: adminUser });

      await expect(
        adminCaller.collectivites.documents.updatePreuve({
          preuveId: preuve.id,
          preuveType: 'labellisation',
          objet: ObjetPreuveEnum.ACTE_ENGAGEMENT,
        })
      ).rejects.toThrowError(/Droits insuffisants|permissions nécessaires/i);
    });

    test("un editeur de la collectivite ne peut pas reclasser l'objet d'un document", async () => {
      const { caller, preuve } = await createCandidaturePreuve();

      await expect(
        caller.collectivites.documents.updatePreuve({
          preuveId: preuve.id,
          preuveType: 'labellisation',
          objet: ObjetPreuveEnum.ACTE_ENGAGEMENT,
        })
      ).rejects.toThrowError(/Droits insuffisants|permissions nécessaires/i);
    });

    test("le reclassement par un tiers preserve le deposant d'origine", async () => {
      const { preuve } = await createCandidaturePreuve();

      const [preuveBeforeReclassement] = await db.db
        .select({ modifiedBy: preuveLabellisationTable.modifiedBy })
        .from(preuveLabellisationTable)
        .where(eq(preuveLabellisationTable.id, preuve.id));
      expect(preuveBeforeReclassement.modifiedBy).toBe(editorUser.id);

      const superAdminResult = await addTestUser(db);
      const superAdminUser = getAuthUserFromUserCredentials(
        superAdminResult.user
      );
      const superAdminCaller = router.createCaller({ user: superAdminUser });
      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller: superAdminCaller,
        userId: superAdminUser.id,
      });
      onTestFinished(cleanup);

      await superAdminCaller.collectivites.documents.updatePreuve({
        preuveId: preuve.id,
        preuveType: 'labellisation',
        objet: ObjetPreuveEnum.ACTE_ENGAGEMENT,
      });

      const [preuveAfterReclassement] = await db.db
        .select({ modifiedBy: preuveLabellisationTable.modifiedBy })
        .from(preuveLabellisationTable)
        .where(eq(preuveLabellisationTable.id, preuve.id));
      expect(preuveAfterReclassement.modifiedBy).toBe(
        preuveBeforeReclassement.modifiedBy
      );
    });
  });
});
