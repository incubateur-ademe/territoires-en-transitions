import { INestApplication } from '@nestjs/common';
import {
  addTestCollectiviteAndUsers,
  setCollectiviteAsCOT,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  createTRPCClientFromCaller,
  getAuthUser,
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
  ISO_OR_SQL_DATE_TIME_REGEX,
  signInWith,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import request from 'supertest';
import { onTestFinished } from 'vitest';
import {
  cleanupReferentielActionStatutsAndLabellisations,
  updateAllNeedReferentielStatutsToCompleteReferentiel,
  updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria,
} from '../../update-action-statut/referentiel-action-statut.test-fixture';
import { createTestDemandePreuve } from '../create-preuve/create-preuve.test-fixture';

describe('Request Labellisation Router', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let app: INestApplication;

  let collectivite: Collectivite;
  let adminUser: AuthenticatedUser;
  let adminAuthToken: string;
  let lectureUser: AuthenticatedUser;
  let editionFichesIndicateursUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const testCollectiviteAndUsersResult = await addTestCollectiviteAndUsers(
      db,
      {
        collectivite: {
          isCOT: true,
        },
        users: [
          {
            accessLevel: CollectiviteRole.ADMIN,
          },
          {
            accessLevel: CollectiviteRole.EDITION,
          },
          {
            accessLevel: CollectiviteRole.LECTURE,
          },
          {
            accessLevel: CollectiviteRole.EDITION_FICHES_INDICATEURS,
          },
        ],
      }
    );

    collectivite = testCollectiviteAndUsersResult.collectivite;

    const admin = testCollectiviteAndUsersResult.users[0];
    const adminUserSignInResponse = await signInWith({
      email: admin.email,
      password: YOLO_DODO.password,
    });
    adminAuthToken = adminUserSignInResponse.data.session?.access_token ?? '';
    adminUser = getAuthUserFromDcp(admin);
    lectureUser = getAuthUserFromDcp(testCollectiviteAndUsersResult.users[2]);
    editionFichesIndicateursUser = getAuthUserFromDcp(
      testCollectiviteAndUsersResult.users[3]
    );

    return async () => {
      await cleanupReferentielActionStatutsAndLabellisations(
        db,
        collectivite.id
      );

      await testCollectiviteAndUsersResult.cleanup();

      if (app) {
        await app.close();
      }
    };
  });

  beforeEach(async () => {
    await cleanupReferentielActionStatutsAndLabellisations(db, collectivite.id);
  });

  describe('Request Labellisation - Authentication', () => {
    test('not authenticated', async () => {
      const caller = router.createCaller({ user: null });

      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'cot',
          etoiles: null,
        })
      ).rejects.toThrow(/not authenticated/i);
    });
  });

  describe('Request Labellisation - Access Rights', () => {
    test('User without rights on collectivite cannot request labellisation', async () => {
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const caller = router.createCaller({ user: yoloDodoUser });

      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'cot',
          etoiles: null,
        })
      ).rejects.toThrow(`Vous n'avez pas les permissions nécessaires`);
    });

    test('User with lecture rights on collectivite cannot request labellisation', async () => {
      const caller = router.createCaller({ user: lectureUser });

      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'cot',
          etoiles: null,
        })
      ).rejects.toThrow(`Vous n'avez pas les permissions nécessaires`);
    });

    test('User with edition fiche indicateurs rights on collectivite cannot request labellisation', async () => {
      const caller = router.createCaller({
        user: editionFichesIndicateursUser,
      });

      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'cot',
          etoiles: null,
        })
      ).rejects.toThrow(`Vous n'avez pas les permissions nécessaires`);
    });
  });

  describe('Request Labellisation - Rules Validation', () => {
    test('ETOILE_NOT_ALLOWED_FOR_AUDIT_ONLY: cannot request etoile for audit only (cot)', async () => {
      const caller = router.createCaller({ user: adminUser });

      // This test validates the rule: if sujet === 'cot' && etoiles !== null, it should fail
      // Note: This may throw DEMANDE_NOT_FOUND if the parcours doesn't have a demande
      // or other errors depending on parcours state (completude, scores, etc.)
      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'cot',
          etoiles: 1, // Should be null for cot
        })
      ).rejects.toThrow(
        `On ne peut pas demander une étoile pour un audit seul sans labellisation.`
      );
    });

    test('MISSING_ETOILE_FOR_LABELLISATION: must provide etoile for labellisation', async () => {
      const caller = router.createCaller({ user: adminUser });

      // This test validates the rule: if sujet !== 'cot' && etoiles === null, it should fail
      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'labellisation',
          etoiles: null, // Should not be null for labellisation
        })
      ).rejects.toThrow(
        'Une étoile de labellisation est requise pour demander un audit avec labellisation.'
      );

      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'labellisation_cot',
          etoiles: null, // Should not be null for labellisation
        })
      ).rejects.toThrow(
        'Une étoile de labellisation est requise pour demander un audit avec labellisation.'
      );
    });

    test('REFERENTIEL_NOT_COMPLETED: cannot request if referentiel not completed', async () => {
      const caller = router.createCaller({ user: adminUser });

      // This will fail if the referentiel is not completed
      // The actual parcours state depends on the database content
      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'cot',
          etoiles: null,
        })
      ).rejects.toThrow(
        'Le référentiel doit être entièrement rempli pour demander un audit ou une labellisation.'
      );
    });

    test('Can create an audit without labellisation even if score criteria not satisfied (for audit only)', async () => {
      const caller = router.createCaller({ user: adminUser });
      const trpcClient = createTRPCClientFromCaller(caller);
      await updateAllNeedReferentielStatutsToCompleteReferentiel(
        trpcClient,
        collectivite.id,
        ReferentielIdEnum.CAE
      );

      // This will fail if the global score criteria is not satisfied
      // The actual parcours state depends on the database content
      const result =
        await caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'cot',
          etoiles: null,
        });

      expect(result).toEqual({
        id: expect.any(Number),
        collectiviteId: collectivite.id,
        referentiel: ReferentielIdEnum.CAE,
        sujet: 'cot',
        etoiles: null,
        enCours: false,
        date: expect.stringMatching(ISO_OR_SQL_DATE_TIME_REGEX),
        modifiedAt: expect.stringMatching(ISO_OR_SQL_DATE_TIME_REGEX),
        envoyeeLe: expect.stringMatching(ISO_OR_SQL_DATE_TIME_REGEX),
        demandeur: adminUser.id,
        associatedCollectiviteId: null,
      });
    }, 20_000);

    test('AUDIT_REQUESTED_FOR_COLLECTIVITE_NOT_COT', async () => {
      const caller = router.createCaller({ user: adminUser });

      await setCollectiviteAsCOT(db, collectivite.id, false);
      onTestFinished(async () => {
        await setCollectiviteAsCOT(db, collectivite.id, true);
      });

      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'cot',
          etoiles: null,
        })
      ).rejects.toThrow(
        'Un audit COT ne peut être demandé par une collectivité non COT.'
      );

      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'labellisation_cot',
          etoiles: 1,
        })
      ).rejects.toThrow(
        'Un audit COT ne peut être demandé par une collectivité non COT.'
      );
    });

    test('SCORE_GLOBAL_CRITERIA_NOT_SATISFIED: cannot request if global score criteria not satisfied', async () => {
      const caller = router.createCaller({ user: adminUser });
      const trpcClient = createTRPCClientFromCaller(caller);
      await updateAllNeedReferentielStatutsToCompleteReferentiel(
        trpcClient,
        collectivite.id,
        ReferentielIdEnum.CAE
      );

      // This will fail if the global score criteria is not satisfied
      // The actual parcours state depends on the database content
      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'labellisation',
          etoiles: 2,
        })
      ).rejects.toThrow(
        "Le critère de score global n'est pas atteint pour demander ce niveau de labellisation."
      );
    }, 20_000);

    test('SCORE_ACTIONS_CRITERIA_NOT_SATISFIED: cannot request if action score criteria not satisfied', async () => {
      const caller = router.createCaller({ user: adminUser });
      const trpcClient = createTRPCClientFromCaller(caller);
      await updateAllNeedReferentielStatutsToCompleteReferentiel(
        trpcClient,
        collectivite.id,
        ReferentielIdEnum.CAE
      );

      // This will fail if the action score criteria is not satisfied
      // The actual parcours state depends on the database content
      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'labellisation',
          etoiles: 1,
        })
      ).rejects.toThrow(
        "Un ou plusieurs critères d'action ne sont pas atteints pour demander ce niveau de labellisation."
      );
    }, 20_000);

    test('MISSING_FILE: cannot request if file is missing (for non-COT with etoile = 1)', async () => {
      const caller = router.createCaller({ user: adminUser });
      const trpcClient = createTRPCClientFromCaller(caller);

      await setCollectiviteAsCOT(db, collectivite.id, false);
      onTestFinished(async () => {
        await setCollectiviteAsCOT(db, collectivite.id, true);
      });

      await updateAllNeedReferentielStatutsToCompleteReferentiel(
        trpcClient,
        collectivite.id,
        ReferentielIdEnum.CAE
      );

      await updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria(
        trpcClient,
        collectivite.id,
        ReferentielIdEnum.CAE
      );

      // This will fail if the file condition is not satisfied
      // The actual parcours state depends on the database content
      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'labellisation',
          etoiles: 1,
        })
      ).rejects.toThrow(
        'Un fichier est requis pour demander un audit ou une labellisation.'
      );
    }, 20_000);

    test('Can request 1ère étoile for cot if all criteria are satisfied except the file', async () => {
      const caller = router.createCaller({ user: adminUser });
      const trpcClient = createTRPCClientFromCaller(caller);

      await updateAllNeedReferentielStatutsToCompleteReferentiel(
        trpcClient,
        collectivite.id,
        ReferentielIdEnum.CAE
      );

      await updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria(
        trpcClient,
        collectivite.id,
        ReferentielIdEnum.CAE
      );

      const demande =
        await caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'labellisation',
          etoiles: 1,
        });

      expect(demande).toMatchObject({
        id: expect.any(Number),
        collectiviteId: collectivite.id,
        referentiel: ReferentielIdEnum.CAE,
        sujet: 'labellisation',
        etoiles: '1',
        enCours: false,
        date: expect.stringMatching(ISO_OR_SQL_DATE_TIME_REGEX),
        modifiedAt: expect.stringMatching(ISO_OR_SQL_DATE_TIME_REGEX),
        envoyeeLe: expect.stringMatching(ISO_OR_SQL_DATE_TIME_REGEX),
        demandeur: adminUser.id,
        associatedCollectiviteId: null,
      });
    }, 20_000);

    test('Can request if a file has been uploaded (for non-COT with etoile = 1)', async () => {
      const caller = router.createCaller({ user: adminUser });
      const trpcClient = createTRPCClientFromCaller(caller);

      await setCollectiviteAsCOT(db, collectivite.id, false);
      onTestFinished(async () => {
        await setCollectiviteAsCOT(db, collectivite.id, true);
      });

      await updateAllNeedReferentielStatutsToCompleteReferentiel(
        trpcClient,
        collectivite.id,
        ReferentielIdEnum.CAE
      );

      await updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria(
        trpcClient,
        collectivite.id,
        ReferentielIdEnum.CAE
      );

      const testAgent = request(app.getHttpServer());
      await createTestDemandePreuve(
        trpcClient,
        testAgent,
        adminAuthToken,
        collectivite.id,
        ReferentielIdEnum.CAE
      );

      const demande =
        await caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'labellisation',
          etoiles: 1,
        });

      expect(demande).toMatchObject({
        id: expect.any(Number),
        collectiviteId: collectivite.id,
        referentiel: ReferentielIdEnum.CAE,
        sujet: 'labellisation',
        etoiles: '1',
        enCours: false,
        date: expect.stringMatching(ISO_OR_SQL_DATE_TIME_REGEX),
        modifiedAt: expect.stringMatching(ISO_OR_SQL_DATE_TIME_REGEX),
        envoyeeLe: expect.stringMatching(ISO_OR_SQL_DATE_TIME_REGEX),
        demandeur: adminUser.id,
        associatedCollectiviteId: null,
      });
    }, 20_000);

    test('AUDIT_ALREADY_REQUESTED: cannot request if audit already requested', async () => {
      const caller = router.createCaller({ user: adminUser });

      const trpcClient = createTRPCClientFromCaller(caller);
      await updateAllNeedReferentielStatutsToCompleteReferentiel(
        trpcClient,
        collectivite.id,
        ReferentielIdEnum.CAE
      );

      // Request the audit
      await caller.referentiels.labellisations.requestLabellisation({
        collectiviteId: collectivite.id,
        referentiel: ReferentielIdEnum.CAE,
        sujet: 'cot',
        etoiles: null,
      });

      // Ask again the same audit
      // This should fail because status !== 'non_demandee' (the demande is already sent)
      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'cot',
          etoiles: null,
        })
      ).rejects.toThrow(
        /Un audit ou une labellisation a déjà été demandé pour cette collectivité./i
      );

      // Ask another audit
      await expect(
        caller.referentiels.labellisations.requestLabellisation({
          collectiviteId: collectivite.id,
          referentiel: ReferentielIdEnum.CAE,
          sujet: 'labellisation',
          etoiles: 1,
        })
      ).rejects.toThrow(
        /Un audit ou une labellisation a déjà été demandé pour cette collectivité./i
      );
    });
  });
});
