import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { getOrCreateSnbc3MetadonneeId } from '@tet/backend/indicateurs/trajectoires/snbc3/trajectoire-snbc3.test-fixture';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import {
  getAuthUserFromUserCredentials,
  getServiceRoleUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { defaultCollectivitePreferences } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { and, desc, eq } from 'drizzle-orm';
import { actionScoreIndicateurValeurTable } from '../../models/action-score-indicateur-valeur.table';
import { actionStatutTable } from '../../models/action-statut.table';
import { historiqueActionStatutTable } from '../../models/historique-action-statut.table';
import { cleanupReferentielActionStatutsAndLabellisations } from '../../update-action-statut/referentiel-action-statut.test-fixture';
import { insertFixtureScoreFromIndicateur } from '../set-score-from-indicateur.test-fixture';

/** Tâche TE sans formule en seed : la fixture lui donne `progression_snbc(...)` */
const ACTION_ID = 'te_2.2.4.1';
const IDENTIFIANT = 'test_refresh_progression_snbc';

/** Statut d'avant la bascule, dérivé de la SNBC 2 */
const STATUT_SNBC2 = {
  avancement: 'detaille' as const,
  avancementDetaille: [0.9, 0, 0.1] as [number, number, number],
};

describe('Rattrapage des statuts dérivés de progression_snbc', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let editorUser: AuthenticatedUser;
  let collectiviteId: number;
  let indicateurId: number;
  /** résultat 90 en 2024, puis 95 en 2020 (avant l'année de départ 2021) */
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
      actionId: ACTION_ID,
      exprScore: `progression_snbc(${IDENTIFIANT})`,
      identifiantReferentiel: IDENTIFIANT,
      valeurs: [
        { dateValeur: '2024-01-01', resultat: 90 },
        { dateValeur: '2020-01-01', resultat: 95 },
      ],
    });
    indicateurId = fixture.indicateurId;
    valeurIds = fixture.valeurIds;
    cleanupFixture = fixture.cleanup;

    // trajectoire snbc3 : 100 au départ (2021), 80 en 2024 ; le résultat 90
    // de 2024 donne une progression de 0,5. Supprimée avec les valeurs de
    // l'indicateur par le cleanup de la fixture.
    const snbc3MetadonneeId = await getOrCreateSnbc3MetadonneeId(
      databaseService
    );
    await databaseService.db.insert(indicateurValeurTable).values(
      [
        { dateValeur: '2021-01-01', objectif: 100 },
        { dateValeur: '2024-01-01', objectif: 80 },
      ].map(({ dateValeur, objectif }) => ({
        indicateurId,
        collectiviteId,
        dateValeur,
        metadonneeId: snbc3MetadonneeId,
        objectif,
      }))
    );
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

  const getStatut = () =>
    databaseService.db
      .select()
      .from(actionStatutTable)
      .where(
        and(
          eq(actionStatutTable.collectiviteId, collectiviteId),
          eq(actionStatutTable.actionId, ACTION_ID)
        )
      )
      .then((rows) => rows[0]);

  const getSelections = () =>
    databaseService.db
      .select()
      .from(actionScoreIndicateurValeurTable)
      .where(
        and(
          eq(actionScoreIndicateurValeurTable.collectiviteId, collectiviteId),
          eq(actionScoreIndicateurValeurTable.actionId, ACTION_ID)
        )
      );

  /** Sélectionne une valeur, puis remet le statut calculé avec la SNBC 2 */
  const setupSelectionAvecStatutSnbc2 = async (indicateurValeurId: number) => {
    const caller = router.createCaller({ user: editorUser });
    await caller.referentiels.actions.setScoreFromIndicateur({
      collectiviteId,
      actionId: ACTION_ID,
      indicateurId,
      valeurs: [{ indicateurValeurId, typeScore: 'fait' }],
    });
    await databaseService.db
      .update(actionStatutTable)
      .set(STATUT_SNBC2)
      .where(
        and(
          eq(actionStatutTable.collectiviteId, collectiviteId),
          eq(actionStatutTable.actionId, ACTION_ID)
        )
      );
  };

  const refresh = () =>
    router
      .createCaller({ user: getServiceRoleUser() })
      .referentiels.actions.refreshStatutsProgressionSnbc({
        collectiviteIds: [collectiviteId],
        modifiedBy: editorUser.id,
      });

  const getDernierHistorique = () =>
    databaseService.db
      .select()
      .from(historiqueActionStatutTable)
      .where(
        and(
          eq(historiqueActionStatutTable.collectiviteId, collectiviteId),
          eq(historiqueActionStatutTable.actionId, ACTION_ID)
        )
      )
      .orderBy(desc(historiqueActionStatutTable.id))
      .limit(1)
      .then((rows) => rows[0]);

  test('recalcule sur snbc3 le statut d’une sélection valide, historique sans auteur', async () => {
    await setupSelectionAvecStatutSnbc2(valeurIds[0]);

    expect(await refresh()).toEqual({
      collectiviteIds: [collectiviteId],
      selectionsSupprimees: 0,
    });
    expect(await getStatut()).toMatchObject({
      avancement: 'detaille',
      avancementDetaille: [0.5, 0, 0.5],
      modifiedBy: editorUser.id,
    });
    expect(await getDernierHistorique()).toMatchObject({
      avancementDetaille: [0.5, 0, 0.5],
      modifiedBy: null,
    });
    expect(await getSelections()).toHaveLength(1);
  });

  test("supprime une sélection antérieure à l'année de départ et repasse en non renseigné", async () => {
    await setupSelectionAvecStatutSnbc2(valeurIds[1]);

    expect(await refresh()).toEqual({
      collectiviteIds: [collectiviteId],
      selectionsSupprimees: 1,
    });
    expect(await getSelections()).toEqual([]);
    expect(await getStatut()).toMatchObject({
      avancement: 'non_renseigne',
      avancementDetaille: null,
    });
  });

  test('réservé au service role', async () => {
    const caller = router.createCaller({ user: editorUser });
    await expect(
      caller.referentiels.actions.refreshStatutsProgressionSnbc({
        collectiviteIds: [collectiviteId],
        modifiedBy: editorUser.id,
      })
    ).rejects.toThrow();
  });
});
