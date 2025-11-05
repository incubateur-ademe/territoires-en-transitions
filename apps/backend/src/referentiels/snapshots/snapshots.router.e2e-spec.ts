import { snapshotTable } from '@/backend/referentiels/snapshots/snapshot.table';
import { getScoresIndicatifsFromSnapshot } from '@/backend/referentiels/snapshots/snapshots.utils';
import {
  fixturePourScoreIndicatif,
  insertFixturePourScoreIndicatif,
} from '@/backend/test';
import { DatabaseService } from '@/backend/utils/database/database.service';
import {
  ActionTypeEnum,
  ReferentielId,
  ReferentielIdEnum,
  SnapshotJalonEnum,
} from '@/domain/referentiels';
import { inferProcedureInput } from '@trpc/server';
import { eq } from 'drizzle-orm';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '../../../test/app-utils';
import { getAnonUser, getAuthUser } from '../../../test/auth-utils';
import { getCollectiviteIdBySiren } from '../../../test/collectivites-utils';
import { AuthenticatedUser } from '../../users/models/auth.models';
import { AppRouter, TrpcRouter } from '../../utils/trpc/trpc.router';
import { SnapshotsRouter } from './snapshots.router';

type ComputeScoreInput = inferProcedureInput<
  SnapshotsRouter['router']['computeAndUpsert']
>;

type UpdateSnapshotNameInput = inferProcedureInput<
  AppRouter['referentiels']['snapshots']['updateName']
>;

describe('SnapshotsRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let rhoneAggloCollectiviteId: number;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    yoloDodoUser = await getAuthUser();
    rhoneAggloCollectiviteId = await getCollectiviteIdBySiren(
      databaseService,
      '200072015'
    );
  });

  test("Création d'un snapshot: not authenticated", async () => {
    const caller = router.createCaller({ user: null });

    const input: ComputeScoreInput = {
      referentielId: ReferentielIdEnum.CAE,
      collectiviteId: 1,
      nom: 'test',
    };

    await expect(() =>
      caller.referentiels.snapshots.computeAndUpsert(input)
    ).rejects.toThrowError(/not authenticated/i);
  });

  test("Création d'un snapshot: not authorized, accès en lecture uniquement", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: ComputeScoreInput = {
      referentielId: ReferentielIdEnum.CAE,
      collectiviteId: rhoneAggloCollectiviteId,
      nom: 'test',
    };

    await expect(() =>
      caller.referentiels.snapshots.computeAndUpsert(input)
    ).rejects.toThrowError(/Droits insuffisants/i);
  });

  test("Création d'un snapshot avec nom et date spécifique", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const snapshotDate = '2024-09-21T21:59:00.000Z';
    const snapshotNom = 'Test snapshot avec date';

    const input = {
      referentielId: ReferentielIdEnum.CAE,
      collectiviteId: 1,
      nom: snapshotNom,
      date: snapshotDate,
    };

    const snapshot = await caller.referentiels.snapshots.computeAndUpsert(
      input
    );

    onTestFinished(async () => {
      await caller.referentiels.snapshots.delete({
        collectiviteId: 1,
        referentielId: ReferentielIdEnum.CAE,
        snapshotRef: snapshot.ref,
      });
    });

    expect(snapshot).toBeDefined();
    expect(snapshot.nom).toBe(snapshotNom);
    expect(snapshot.date).toEqual(expect.toEqualDate(snapshotDate));
    expect(snapshot.ref).toBe(
      `${snapshotNom.toLowerCase().replace(/\s+/g, '-')}`
    );

    // aucun score indicatif n'est présent dans le snapshot
    const scoresIndicatifs = await getScoresIndicatifsFromSnapshot(snapshot);
    expect(scoresIndicatifs).toEqual({});
  });

  test("Création d'un snapshot avec un score indicatif sur une action", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const snapshotDate = '2024-09-21T21:59:00.000Z';
    const snapshotNom = 'Test snapshot avec date';

    const input = {
      referentielId: ReferentielIdEnum.CAE,
      collectiviteId: 1,
      nom: snapshotNom,
      date: snapshotDate,
    };

    const cleanupScoreIndicatif = await insertFixturePourScoreIndicatif(
      databaseService,
      fixturePourScoreIndicatif
    );
    const snapshot = await caller.referentiels.snapshots.computeAndUpsert(
      input
    );

    onTestFinished(async () => {
      await caller.referentiels.snapshots.delete({
        collectiviteId: 1,
        referentielId: ReferentielIdEnum.CAE,
        snapshotRef: snapshot.ref,
      });
      await cleanupScoreIndicatif();
    });

    expect(snapshot).toBeDefined();
    const scoresIndicatifs = await getScoresIndicatifsFromSnapshot(snapshot);
    expect(scoresIndicatifs).toMatchObject({
      [fixturePourScoreIndicatif.actionId]: {
        fait: {
          score: -0.045,
          valeursUtilisees: [
            {
              valeur: 63,
              identifiantReferentiel: 'cae_7',
              indicateurId: expect.any(Number),
              dateValeur: fixturePourScoreIndicatif.dateValeur,
              sourceLibelle: 'CITEPA',
              sourceMetadonnee: {
                sourceId: 'citepa',
                dateVersion: expect.any(String),
              },
            },
          ],
        },
        programme: {
          score: 0,
          valeursUtilisees: [
            {
              valeur: 44,
              identifiantReferentiel: 'cae_7',
              indicateurId: expect.any(Number),
              dateValeur: fixturePourScoreIndicatif.dateValeur,
              sourceLibelle: null,
              sourceMetadonnee: null,
            },
          ],
        },
      },
    });
  });

  test(`Récupération du snapshot courant d'un référentiel sans token autorisé`, async () => {
    const caller = router.createCaller({ user: null });

    await expect(
      caller.referentiels.snapshots.getCurrent({
        collectiviteId: 1,
        referentielId: ReferentielIdEnum.CAE,
      })
    ).rejects.toThrowError(/not anonymous/i);
  });

  test(`Récupération anonyme du snapshot d'un référentiel`, async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    const snapshot = await caller.referentiels.snapshots.getCurrent({
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
    });

    expect(snapshot).toBeDefined();
    expect(snapshot.ref).toBe('score-courant');

    const referentielScores = snapshot.scoresPayload;
    const { actionsEnfant, ...referentielScoreWithoutActionsEnfant } =
      referentielScores.scores;
    expect(actionsEnfant.length).toBe(6);

    const { actionsEnfant: expectedActionEnfant, ...expectedCaeRoot } = {
      actionId: 'cae',
      identifiant: '',
      nom: 'Climat Air Énergie',
      points: 500,
      categorie: null,
      pourcentage: null,
      level: 0,
      preuves: null,
      actionType: ActionTypeEnum.REFERENTIEL,
      score: {
        actionId: 'cae',
        etoiles: 1,
        pointReferentiel: 500,
        pointPotentiel: 493.4,
        pointPotentielPerso: null,
        pointFait: 0.36,
        pointPasFait: 0.03,
        pointNonRenseigne: 492.8,
        pointProgramme: 0.21,
        concerne: true,
        completedTachesCount: 11,
        totalTachesCount: 1111,
        faitTachesAvancement: 1.2,
        programmeTachesAvancement: 0.7,
        pasFaitTachesAvancement: 0.1,
        pasConcerneTachesAvancement: 9,
        desactive: false,
        renseigne: false,
      },
      actionsEnfant: [],
      scoresTag: {},
      tags: [],
    };

    expect(referentielScoreWithoutActionsEnfant).toEqual(expectedCaeRoot);
  });

  test(`Récupération anonyme du score d'un référentiel pour une collectivite inconnue`, async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    await expect(
      caller.referentiels.snapshots.getCurrent({
        collectiviteId: 10000000,
        referentielId: ReferentielIdEnum.CAE,
      })
    ).rejects.toThrowError(
      "Collectivité avec l'identifiant 10000000 introuvable"
    );
  });

  test(`Récupération anonyme du score d'un référentiel inconnu`, async () => {
    const caller = router.createCaller({ user: getAnonUser() });

    await expect(
      caller.referentiels.snapshots.getCurrent({
        collectiviteId: 10000000,
        referentielId: 'inconnu' as unknown as ReferentielId,
      })
    ).rejects.toThrowError(/invalid option/i);
  });

  test(`Récupération du score d'un référentiel avec sauvegarde d'un snapshot autorisé pour un utilisateur en écriture`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const currentSnapshot = await caller.referentiels.snapshots.getCurrent({
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
    });

    expect(currentSnapshot).toBeDefined();
    expect(currentSnapshot.ref).toBe('score-courant');

    const snapshotListResponse = await caller.referentiels.snapshots.list({
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
      options: {
        jalons: [SnapshotJalonEnum.COURANT],
      },
    });

    expect(snapshotListResponse).toMatchObject({
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
      jalons: [SnapshotJalonEnum.COURANT],
      snapshots: [
        {
          auditId: null,
          createdAt: expect.toEqualDate(currentSnapshot.createdAt),
          modifiedBy: currentSnapshot.modifiedBy,
          date: expect.toEqualDate(currentSnapshot.date),
          modifiedAt: expect.toEqualDate(currentSnapshot.modifiedAt),
          nom: 'Score courant',
          pointFait: 0.36,
          pointNonRenseigne: 492.8,
          pointPasFait: 0.03,
          pointPotentiel: 493.4,
          pointProgramme: 0.21,
          ref: 'score-courant',
          referentielVersion: '1.0.3',
          jalon: SnapshotJalonEnum.COURANT,
        },
      ],
    });

    const snapshotTestAccent =
      await caller.referentiels.snapshots.computeAndUpsert({
        collectiviteId: 1,
        referentielId: ReferentielIdEnum.CAE,
        nom: 'test à accent',
      });

    onTestFinished(async () => {
      await caller.referentiels.snapshots.delete({
        collectiviteId: 1,
        referentielId: ReferentielIdEnum.CAE,
        snapshotRef: 'user-test-a-accent',
      });
    });

    expect(snapshotTestAccent).toBeDefined();
    expect(snapshotTestAccent.nom).toBe('test à accent');
    expect(snapshotTestAccent.ref).toBe('user-test-a-accent');

    const snapshotListResponseDatePerso =
      await caller.referentiels.snapshots.list({
        collectiviteId: 1,
        referentielId: ReferentielIdEnum.CAE,
        options: {
          jalons: [SnapshotJalonEnum.DATE_PERSONNALISEE],
        },
      });

    const returnedSnapshot = snapshotListResponseDatePerso.snapshots?.find(
      (s) => s.ref === snapshotTestAccent.ref
    );

    expect(returnedSnapshot).toEqual({
      date: expect.toEqualDate(snapshotTestAccent.date),
      nom: 'test à accent',
      ref: 'user-test-a-accent',
      jalon: SnapshotJalonEnum.DATE_PERSONNALISEE,
      modifiedAt: expect.toEqualDate(snapshotTestAccent.modifiedAt),
      createdAt: expect.toEqualDate(snapshotTestAccent.createdAt),
      referentielVersion: '1.0.3',
      auditId: null,
      createdBy: yoloDodoUser.id,
      modifiedBy: yoloDodoUser.id,
      pointFait: 0.36,
      pointNonRenseigne: 492.8,
      pointPasFait: 0.03,
      pointPotentiel: 493.4,
      pointProgramme: 0.21,
    });
  });

  test(`Suppression d'un snapshot non-autorisé pour un utilisateur en écriture mais sur un snapshot qui ne soit pas de type date personnalisée`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const currentSnapshot = await caller.referentiels.snapshots.getCurrent({
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
    });

    expect(currentSnapshot).toBeDefined();
    expect(currentSnapshot.ref).toBe('score-courant');

    // Suppression du score courant interdite
    await expect(
      caller.referentiels.snapshots.delete({
        collectiviteId: 1,
        referentielId: ReferentielIdEnum.CAE,
        snapshotRef: currentSnapshot.ref,
      })
    ).rejects.toThrowError(
      'Uniquement les snaphots de type date_personnalisee peuvent être supprimés par un utilisateur.'
    );
  });

  test(`Récupération de l'historique du score d'un référentiel pour un utilisateur autorisé`, async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const currentSnapshot =
      await caller.referentiels.snapshots.computeAndUpsert({
        collectiviteId: 1,
        referentielId: ReferentielIdEnum.CAE,
        nom: 'test date personnalisée',
        date: '2019-01-01T00:00:01Z',
      });

    onTestFinished(async () => {
      await caller.referentiels.snapshots.delete({
        collectiviteId: 1,
        referentielId: ReferentielIdEnum.CAE,
        snapshotRef: currentSnapshot.ref,
      });
    });

    expect(currentSnapshot).toBeDefined();
    expect(currentSnapshot.ref).toBe('test-date-personnalisee');
    expect(currentSnapshot.jalon).toBe(SnapshotJalonEnum.DATE_PERSONNALISEE);

    const referentielScores = currentSnapshot.scoresPayload;
    const { actionsEnfant, ...referentielScoreWithoutActionsEnfant } =
      referentielScores.scores;

    expect(referentielScores.date).toBe('2019-01-01T00:00:01Z');
    expect(actionsEnfant.length).toBe(6);

    const { actionsEnfant: expectedActionEnfant, ...expectedCaeRoot } = {
      actionId: 'cae',
      identifiant: '',
      nom: 'Climat Air Énergie',
      points: 500,
      categorie: null,
      pourcentage: null,
      level: 0,
      actionType: ActionTypeEnum.REFERENTIEL,
      preuves: null,
      score: {
        actionId: 'cae',
        etoiles: 1,
        pointReferentiel: 500,
        pointPotentiel: 499,
        pointPotentielPerso: null,
        pointFait: 0,
        pointPasFait: 0,
        pointNonRenseigne: 499,
        pointProgramme: 0,
        concerne: true,
        completedTachesCount: 9,
        totalTachesCount: 1111,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 9,
        desactive: false,
        renseigne: false,
      },
      actionsEnfant: [],
      scoresTag: {},
      tags: [],
    };

    expect(referentielScoreWithoutActionsEnfant).toEqual(expectedCaeRoot);
  });

  test("Mise à jour du nom d'un snapshot: not authorized, accès en lecture uniquement", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: UpdateSnapshotNameInput = {
      collectiviteId: rhoneAggloCollectiviteId,
      referentielId: ReferentielIdEnum.CAE,
      snapshotRef: 'some-ref',
      newName: 'Nouveau nom',
    };

    await expect(() =>
      caller.referentiels.snapshots.updateName(input)
    ).rejects.toThrowError(/Droits insuffisants/i);
  });

  test("Mise à jour du nom d'un snapshot autre que date_personnalisee: score_courant, not authorized", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: ComputeScoreInput = {
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
      jalon: SnapshotJalonEnum.COURANT,
    };

    const snapshot = await caller.referentiels.snapshots.computeAndUpsert(
      input
    );

    onTestFinished(async () => {
      await databaseService.db
        .delete(snapshotTable)
        .where(eq(snapshotTable.ref, snapshot.ref));
    });

    const inputWithNewName: UpdateSnapshotNameInput = {
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
      snapshotRef: snapshot.ref,
      newName: 'Nouveau nom',
    };

    await expect(() =>
      caller.referentiels.snapshots.updateName(inputWithNewName)
    ).rejects.toThrowError(
      `Seuls les noms des snapshots de type ${SnapshotJalonEnum.DATE_PERSONNALISEE} peuvent être modifiés`
    );
  });

  test("Mise à jour du nom d'un snapshot", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const input: ComputeScoreInput = {
      referentielId: ReferentielIdEnum.CAE,
      collectiviteId: 1,
      nom: 'Test avec un nom',
      date: '2024-09-21T21:59:00.000Z',
    };

    const snapshot = await caller.referentiels.snapshots.computeAndUpsert(
      input
    );

    const inputWithNewName: UpdateSnapshotNameInput = {
      collectiviteId: 1,
      referentielId: ReferentielIdEnum.CAE,
      snapshotRef: snapshot.ref,
      newName: 'Nouveau nom',
    };

    const updatedSnapshot = await caller.referentiels.snapshots.updateName(
      inputWithNewName
    );

    onTestFinished(async () => {
      await caller.referentiels.snapshots.delete({
        collectiviteId: 1,
        referentielId: ReferentielIdEnum.CAE,
        snapshotRef: snapshot.ref,
      });
    });

    expect(updatedSnapshot).toBeDefined();
    expect(updatedSnapshot[0].nom).toBe(inputWithNewName.newName);
  });
});
