import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { defaultCollectivitePreferences } from '@tet/domain/collectivites';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { actionScoreIndicateurValeurTable } from '../models/action-score-indicateur-valeur.table';
import { actionStatutTable } from '../models/action-statut.table';
import { createAuditWithOnTestFinished } from '../referentiels.test-fixture';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { cleanupReferentielActionStatutsAndLabellisations } from '../update-action-statut/referentiel-action-statut.test-fixture';
import { insertFixtureScoreFromIndicateur } from './set-score-from-indicateur.test-fixture';

/** Tâche TE qui porte la formule de score dans la fixture */
const ACTION_AVEC_FORMULE = 'te_2.2.3.1';
/** Tâche TE sans formule : le score n'y est pas calculable */
const ACTION_SANS_FORMULE = 'te_2.2.3.2';

describe('SetScoreFromIndicateurRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let editorUser: AuthenticatedUser;
  let collectiviteId: number;
  let indicateurId: number;
  /** Résultat de 50 (score 0,5) puis de 100 (score 1) */
  let valeurIds: number[];
  let cleanupFixture: () => Promise<void>;
  let cleanupCollectivite: () => Promise<void>;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      databaseService,
      { user: { role: CollectiviteRole.EDITION } }
    );
    collectiviteId = collectivite.id;
    editorUser = getAuthUserFromUserCredentials(user);
    cleanupCollectivite = cleanup;

    // le référentiel TE est en lecture seule par défaut
    await databaseService.db
      .update(collectiviteTable)
      .set({
        preferences: {
          ...defaultCollectivitePreferences,
          referentiels: {
            ...defaultCollectivitePreferences.referentiels,
            te: { display: true, mode: 'write' },
          },
        },
      })
      .where(eq(collectiviteTable.id, collectiviteId));

    const fixture = await insertFixtureScoreFromIndicateur(databaseService, {
      collectiviteId,
      actionId: ACTION_AVEC_FORMULE,
      valeurs: [
        { dateValeur: '2024-12-31', resultat: 50 },
        { dateValeur: '2023-12-31', resultat: 100 },
      ],
    });
    indicateurId = fixture.indicateurId;
    valeurIds = fixture.valeurIds;
    cleanupFixture = fixture.cleanup;
  });

  afterAll(async () => {
    await cleanupFixture();
    await cleanupCollectivite();
    await app.close();
  });

  afterEach(async () => {
    await databaseService.db
      .delete(actionScoreIndicateurValeurTable)
      .where(
        eq(actionScoreIndicateurValeurTable.collectiviteId, collectiviteId)
      );
    await cleanupReferentielActionStatutsAndLabellisations(
      databaseService,
      collectiviteId
    );
  });

  const getStatut = (actionId: string) =>
    databaseService.db
      .select()
      .from(actionStatutTable)
      .where(
        and(
          eq(actionStatutTable.collectiviteId, collectiviteId),
          eq(actionStatutTable.actionId, actionId)
        )
      )
      .then((rows) => rows[0]);

  const getValeursUtilisees = (actionId: string) =>
    databaseService.db
      .select()
      .from(actionScoreIndicateurValeurTable)
      .where(
        and(
          eq(actionScoreIndicateurValeurTable.collectiviteId, collectiviteId),
          eq(actionScoreIndicateurValeurTable.actionId, actionId)
        )
      );

  test('La valeur retenue est enregistrée et le statut en est dérivé', async () => {
    const caller = router.createCaller({ user: editorUser });

    const snapshot = await caller.referentiels.actions.setScoreFromIndicateur({
      collectiviteId,
      actionId: ACTION_AVEC_FORMULE,
      indicateurId,
      valeurs: [{ indicateurValeurId: valeurIds[0], typeScore: 'fait' }],
    });

    expect(await getValeursUtilisees(ACTION_AVEC_FORMULE)).toMatchObject([
      { indicateurValeurId: valeurIds[0], typeScore: 'fait' },
    ]);

    expect(await getStatut(ACTION_AVEC_FORMULE)).toMatchObject({
      avancement: 'detaille',
      avancementDetaille: [0.5, 0, 0.5],
      concerne: true,
    });

    expect(snapshot).toMatchObject({
      collectiviteId,
      referentielId: ReferentielIdEnum.TE,
    });
  });

  test('Le statut correspond à la valeur qui vient d’être enregistrée', async () => {
    const caller = router.createCaller({ user: editorUser });

    await caller.referentiels.actions.setScoreFromIndicateur({
      collectiviteId,
      actionId: ACTION_AVEC_FORMULE,
      indicateurId,
      valeurs: [{ indicateurValeurId: valeurIds[0], typeScore: 'fait' }],
    });

    await caller.referentiels.actions.setScoreFromIndicateur({
      collectiviteId,
      actionId: ACTION_AVEC_FORMULE,
      indicateurId,
      valeurs: [{ indicateurValeurId: valeurIds[1], typeScore: 'fait' }],
    });

    // le score de la seconde valeur (100 %) vaut 1 : l'action est faite
    expect(await getStatut(ACTION_AVEC_FORMULE)).toMatchObject({
      avancement: 'fait',
      avancementDetaille: null,
    });
  });

  test('Un score non calculable laisse le statut inchangé, sans erreur', async () => {
    const caller = router.createCaller({ user: editorUser });

    await caller.referentiels.actions.setScoreFromIndicateur({
      collectiviteId,
      actionId: ACTION_SANS_FORMULE,
      indicateurId,
      valeurs: [{ indicateurValeurId: valeurIds[0], typeScore: 'fait' }],
    });

    expect(await getValeursUtilisees(ACTION_SANS_FORMULE)).toMatchObject([
      { indicateurValeurId: valeurIds[0], typeScore: 'fait' },
    ]);
    expect(await getStatut(ACTION_SANS_FORMULE)).toBeUndefined();
  });

  test("Sans droit d'écriture sur les statuts, la valeur n'est pas enregistrée non plus", async () => {
    const caller = router.createCaller({ user: editorUser });

    // un audit en cours réserve l'écriture des statuts aux auditeurs
    await createAuditWithOnTestFinished({
      databaseService,
      collectiviteId,
      referentielId: ReferentielIdEnum.TE,
    });

    await expect(
      caller.referentiels.actions.setScoreFromIndicateur({
        collectiviteId,
        actionId: ACTION_AVEC_FORMULE,
        indicateurId,
        valeurs: [{ indicateurValeurId: valeurIds[0], typeScore: 'fait' }],
      })
    ).rejects.toThrow(/audit est en cours/i);

    expect(await getValeursUtilisees(ACTION_AVEC_FORMULE)).toEqual([]);
    expect(await getStatut(ACTION_AVEC_FORMULE)).toBeUndefined();
  });

  test('Non authentifié', async () => {
    const caller = router.createCaller({ user: null });

    await expect(
      caller.referentiels.actions.setScoreFromIndicateur({
        collectiviteId,
        actionId: ACTION_AVEC_FORMULE,
        indicateurId,
        valeurs: [{ indicateurValeurId: valeurIds[0], typeScore: 'fait' }],
      })
    ).rejects.toThrow(/not authenticated/i);
  });

  describe('Désélection explicite de la valeur retenue', () => {
    test("Envoyer un tableau `valeurs` vide efface la sélection et remet l'action à non renseignée", async () => {
      const caller = router.createCaller({ user: editorUser });

      const snapshotAvecSelection =
        await caller.referentiels.actions.setScoreFromIndicateur({
          collectiviteId,
          actionId: ACTION_AVEC_FORMULE,
          indicateurId,
          valeurs: [{ indicateurValeurId: valeurIds[0], typeScore: 'fait' }],
        });
      expect(snapshotAvecSelection).toMatchObject({
        collectiviteId,
        referentielId: ReferentielIdEnum.TE,
      });
      expect(await getStatut(ACTION_AVEC_FORMULE)).toMatchObject({
        avancement: 'detaille',
        avancementDetaille: [0.5, 0, 0.5],
      });

      const snapshotApresDeselection =
        await caller.referentiels.actions.setScoreFromIndicateur({
          collectiviteId,
          actionId: ACTION_AVEC_FORMULE,
          indicateurId,
          valeurs: [],
        });

      expect(await getValeursUtilisees(ACTION_AVEC_FORMULE)).toEqual([]);
      expect(await getStatut(ACTION_AVEC_FORMULE)).toMatchObject({
        avancement: 'non_renseigne',
        avancementDetaille: null,
      });
      expect(snapshotApresDeselection).toMatchObject({
        collectiviteId,
        referentielId: ReferentielIdEnum.TE,
      });
    });
  });

  describe('Correction de la valeur retenue', () => {
    test("Corriger la valeur d'indicateur retenue réactualise le score et l'avancement dérivé", async () => {
      const caller = router.createCaller({ user: editorUser });

      await caller.referentiels.actions.setScoreFromIndicateur({
        collectiviteId,
        actionId: ACTION_AVEC_FORMULE,
        indicateurId,
        valeurs: [{ indicateurValeurId: valeurIds[0], typeScore: 'fait' }],
      });
      expect(await getStatut(ACTION_AVEC_FORMULE)).toMatchObject({
        avancementDetaille: [0.5, 0, 0.5],
      });

      // la sélection ne change pas, seule la donnée saisie est corrigée
      await caller.indicateurs.valeurs.upsert({
        collectiviteId,
        indicateurId,
        id: valeurIds[0],
        resultat: 80,
      });

      expect(await getValeursUtilisees(ACTION_AVEC_FORMULE)).toMatchObject([
        { indicateurValeurId: valeurIds[0], typeScore: 'fait' },
      ]);
      expect(await getStatut(ACTION_AVEC_FORMULE)).toMatchObject({
        avancement: 'detaille',
        avancementDetaille: [0.8, 0, 0.2],
      });
    });

    test("Corriger une valeur d'indicateur qui n'est retenue par aucune action ne provoque pas d'erreur", async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.indicateurs.valeurs.upsert({
          collectiviteId,
          indicateurId,
          id: valeurIds[1],
          resultat: 42,
        })
      ).resolves.toBeDefined();
    });
  });

  describe('Suppression de la valeur sélectionnée (deleteValeurIndicateur)', () => {
    test("Supprimer une valeur d'indicateur sélectionnée réactualise le score et le snapshot, sans erreur", async () => {
      const caller = router.createCaller({ user: editorUser });

      await caller.referentiels.actions.setScoreFromIndicateur({
        collectiviteId,
        actionId: ACTION_AVEC_FORMULE,
        indicateurId,
        valeurs: [{ indicateurValeurId: valeurIds[0], typeScore: 'fait' }],
      });
      expect(await getValeursUtilisees(ACTION_AVEC_FORMULE)).toMatchObject([
        { indicateurValeurId: valeurIds[0], typeScore: 'fait' },
      ]);
      expect(await getStatut(ACTION_AVEC_FORMULE)).toMatchObject({
        avancement: 'detaille',
      });

      const snapshotsService = app.get(SnapshotsService);
      const computeAndUpsertSpy = vi.spyOn(
        snapshotsService,
        'computeAndUpsert'
      );

      await expect(
        caller.indicateurs.valeurs.delete({
          collectiviteId,
          indicateurId,
          id: valeurIds[0],
        })
      ).resolves.toBeUndefined();

      // la sélection a été supprimée en cascade avec la valeur d'indicateur
      expect(await getValeursUtilisees(ACTION_AVEC_FORMULE)).toEqual([]);

      // plus aucune valeur n'étant sélectionnée, l'action redevient non
      // renseignée (et non pas laissée à son ancien statut détaillé)
      expect(await getStatut(ACTION_AVEC_FORMULE)).toMatchObject({
        avancement: 'non_renseigne',
        avancementDetaille: null,
      });

      // le score/snapshot de l'action a bien été réactualisé suite à la
      // suppression (le score n'est alors plus calculable, faute de valeur
      // retenue, mais le recalcul a bien été tenté)
      expect(computeAndUpsertSpy).toHaveBeenCalledWith(
        { collectiviteId, referentielId: ReferentielIdEnum.TE },
        { user: editorUser }
      );

      computeAndUpsertSpy.mockRestore();
    });

    test("Supprimer une valeur d'indicateur qui n'est sélectionnée par aucune action ne provoque pas d'erreur", async () => {
      const caller = router.createCaller({ user: editorUser });

      await expect(
        caller.indicateurs.valeurs.delete({
          collectiviteId,
          indicateurId,
          id: valeurIds[1],
        })
      ).resolves.toBeUndefined();
    });
  });
});
