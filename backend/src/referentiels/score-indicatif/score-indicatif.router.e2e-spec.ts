import { AuthenticatedUser } from '@/backend/auth/index-domain';
import {
  indicateurDefinitionTable,
  indicateurValeurTable,
} from '@/backend/indicateurs/index-domain';
import { indicateurActionTable } from '@/backend/indicateurs/shared/models/indicateur-action.table';
import { actionDefinitionTable } from '@/backend/referentiels/index-domain';
import { actionScoreIndicateurValeurTable } from '@/backend/referentiels/models/action-score-indicateur-valeur.table';
import { DatabaseService } from '@/backend/utils';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import {
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from 'backend/test/app-utils';
import { getAuthUser } from 'backend/test/auth-utils';
import { and, eq } from 'drizzle-orm';

const collectiviteId = 1;

const exemple1 = {
  actionId: 'cae_1.2.3.3.4',
  identifiantReferentiel: 'cae_7',
  dateValeur: '2025-05-29',
  exprScore: `si val(cae_7) < limite(cae_7) alors 0
  sinon si val(cae_7) > cible(cae_7) alors 1
  sinon ((val(cae_7) - limite(cae_7)) * 0.05) / (limite(cae_7) - cible(cae_7))`,
  objectif: 44, // objectif collectivité < limite (45),
  resultat: 63, // résultat citepa < cible (65)
};

async function insertTestData(
  db: DatabaseService['db'],
  exemple: typeof exemple1
) {
  const {
    actionId,
    identifiantReferentiel,
    dateValeur,
    exprScore,
    objectif,
    resultat,
  } = exemple;
  // lit l'id de l'indicateur
  const result1 = await db
    .select()
    .from(indicateurDefinitionTable)
    .where(
      eq(
        indicateurDefinitionTable.identifiantReferentiel,
        identifiantReferentiel
      )
    );
  const { id: indicateurId } = result1[0];

  // la formule n'est pas dans les données de seed
  await db
    .update(actionDefinitionTable)
    .set({ exprScore })
    .where(eq(actionDefinitionTable.actionId, actionId));

  // ni le lien entre l'action et l'indicateur
  await db
    .insert(indicateurActionTable)
    .values([{ indicateurId, actionId, utiliseParExprScore: true }])
    .onConflictDoNothing();

  // insère des valeurs
  const result2 = await db
    .insert(indicateurValeurTable)
    .values([
      {
        indicateurId,
        collectiviteId,
        dateValeur,
        metadonneeId: null,
        resultat: null,
        objectif,
      },
      {
        indicateurId,
        collectiviteId,
        dateValeur,
        metadonneeId: 1,
        resultat,
        objectif: null,
      },
    ])
    .onConflictDoNothing()
    .returning();

  // associe les valeurs à l'action pour la collectivité
  await db
    .insert(actionScoreIndicateurValeurTable)
    .values([
      {
        actionId,
        collectiviteId,
        indicateurId,
        indicateurValeurId: result2[0].id,
        typeScore: 'programme',
      },
      {
        actionId,
        collectiviteId,
        indicateurId,
        indicateurValeurId: result2[1].id,
        typeScore: 'fait',
      },
    ])
    .onConflictDoNothing();

  // renvoi la fonction de cleanup
  return async () => {
    await db
      .delete(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.indicateurId, indicateurId),
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(indicateurValeurTable.dateValeur, dateValeur)
        )
      );
  };
}

describe('ScoreIndicatifRouter', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    yoloDodoUser = await getAuthUser();

    // insert test data
    const cleanup = await insertTestData(databaseService.db, exemple1);
    return async () => {
      await cleanup();
      await app.close();
    };
  });

  test('Lire les valeurs utilisables lève une erreur si on est non authentifié', async () => {
    const caller = router.createCaller({ user: null });

    await expect(() =>
      caller.referentiels.actions.getValeursUtilisables({
        collectiviteId: 1,
        actionIds: ['cae_1.2.3.3.4', 'cae_1.2', 'nimp'],
      })
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('Lire les valeurs utilisables pour le calcul du score indicatif', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.referentiels.actions.getValeursUtilisables({
      collectiviteId: 1,
      actionIds: ['cae_1.2.3.3.4', 'cae_1.2', 'nimp'],
    });

    expect(result).toMatchObject([
      {
        actionId: 'cae_1.2.3.3.4',
        indicateurs: [
          {
            identifiantReferentiel: 'cae_7',
            indicateurId: 255,
            titre: 'Recyclage des déchets',
            unite: '%',
            selection: {
              fait: {
                id: expect.any(Number),
                annee: 2025,
                source: 'citepa',
                valeur: 63,
              },
              programme: {
                id: expect.any(Number),
                annee: 2025,
                source: 'collectivite',
                valeur: 44,
              },
            },
            sources: [
              {
                source: 'collectivite',
                libelle: null,
                ordreAffichage: 0,
                programme: [
                  {
                    annee: 2025,
                    dateValeur: '2025-05-29',
                    utilisee: true,
                    valeur: 44,
                  },
                ],
                fait: [],
              },
              {
                source: 'citepa',
                libelle: 'CITEPA',
                ordreAffichage: 1000,
                programme: [],
                fait: [
                  {
                    annee: 2025,
                    dateValeur: '2025-05-29',
                    utilisee: true,
                    valeur: 63,
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  test('Lire les valeurs utilisées lève une erreur si on est non authentifié', async () => {
    const caller = router.createCaller({ user: null });

    await expect(() =>
      caller.referentiels.actions.getValeursUtilisees({
        collectiviteId: 1,
        actionIds: ['cae_1.2.3.3.4', 'cae_1.2', 'nimp'],
      })
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('Lire les valeurs utilisées pour le calcul du score indicatif', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.referentiels.actions.getValeursUtilisees({
      collectiviteId: 1,
      actionIds: ['cae_1.2.3.3.4', 'cae_1.2', 'nimp'],
    });

    expect(result).toMatchObject({
      'cae_1.2.3.3.4': [
        {
          actionId: 'cae_1.2.3.3.4',
          dateValeur: '2025-05-29',
          indicateurId: expect.any(Number),
          indicateurValeurId: expect.any(Number),
          sourceLibelle: null,
          sourceMetadonnee: null,
          typeScore: 'programme',
          valeur: 44,
        },
        {
          actionId: 'cae_1.2.3.3.4',
          dateValeur: '2025-05-29',
          indicateurId: expect.any(Number),
          indicateurValeurId: expect.any(Number),
          sourceLibelle: 'CITEPA',
          sourceMetadonnee: {
            dateVersion: expect.any(String),
            diffuseur: expect.any(String),
            id: expect.any(Number),
            limites: '',
            methodologie: expect.any(String),
            nomDonnees: '',
            producteur: expect.any(String),
            sourceId: 'citepa',
          },
          typeScore: 'fait',
          valeur: 63,
        },
      ],
    });
  });

  test('Demander le score lève une erreur si on est non authentifié', async () => {
    const caller = router.createCaller({ user: null });

    await expect(() =>
      caller.referentiels.actions.getScoreIndicatif({
        collectiviteId: 1,
        actionIds: ['cae_1.2.3.3.4'],
      })
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('Demander un score calculable', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: 1,
      actionIds: ['cae_1.2.3.3.4'],
    });

    expect(result).toMatchObject({
      'cae_1.2.3.3.4': {
        actionId: 'cae_1.2.3.3.4',
        indicateurs: [
          {
            indicateurId: expect.any(Number),
            identifiantReferentiel: 'cae_7',
            unite: '%',
            titre: expect.any(String),
          },
        ],
        fait: {
          score: -0.045,
          valeursUtilisees: [
            {
              valeur: 63,
              dateValeur: exemple1.dateValeur,
              sourceLibelle: 'CITEPA',
              sourceMetadonnee: {
                id: expect.any(Number),
                limites: expect.any(String),
                diffuseur: 'Citepa',
                sourceId: 'citepa',
                producteur: expect.any(String),
                nomDonnees: expect.any(String),
                dateVersion: expect.any(String),
                methodologie: expect.any(String),
              },
            },
          ],
        },
        programme: {
          score: 0,
          valeursUtilisees: [
            {
              valeur: 44,
              dateValeur: exemple1.dateValeur,
              sourceLibelle: null,
              sourceMetadonnee: null,
            },
          ],
        },
      },
    });
  });

  test("Demander un score quand il n'est pas encore calculable (par manque de valeurs sélectionnées)", async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: 1,
      actionIds: ['cae_1.2.3.3.1'],
    });

    expect(result).toMatchObject({
      'cae_1.2.3.3.1': {
        actionId: 'cae_1.2.3.3.1',
        indicateurs: [
          {
            actionId: 'cae_1.2.3.3.1',
            identifiantReferentiel: 'cae_6.a',
            indicateurId: expect.any(Number),
            optional: false,
            titre: expect.any(String),
            unite: expect.any(String),
          },
        ],
        fait: null,
        programme: null
      },
    });
  });

  test('Insérer des valeurs et demander le score', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const exemple2 = {
      actionId: 'cae_1.2.3.3.1',
      identifiantReferentiel: 'cae_6.a',
      dateValeur: '2025-05-29',
      exprScore: `si val(cae_6.a) < limite(cae_6.a) alors 0
        sinon si val(cae_6.a) > cible(cae_6.a) alors 1
        sinon ((val(cae_6.a) - limite(cae_6.a)) * 0.1) / (limite(cae_6.a) - cible(cae_6.a))`,
      objectif: 440, // objectif collectivité < limite (580),
      resultat: 350, // résultat citepa < cible (480)
    };
    const cleanup = await insertTestData(databaseService.db, exemple2);
    onTestFinished(() => cleanup());

    const result = await caller.referentiels.actions.getScoreIndicatif({
      collectiviteId: 1,
      actionIds: ['cae_1.2.3.3.1'],
    });

    expect(result).toMatchObject({
      'cae_1.2.3.3.1': {
        actionId: 'cae_1.2.3.3.1',
        indicateurs: [
          {
            actionId: 'cae_1.2.3.3.1',
            identifiantReferentiel: 'cae_6.a',
            indicateurId: expect.any(Number),
            optional: false,
            titre: expect.any(String),
            unite: expect.any(String),
          },
        ],
        fait: {
          score: 0,
          valeursUtilisees: [
            {
              dateValeur: '2025-05-29',
              indicateurId: 229,
              sourceLibelle: 'CITEPA',
              sourceMetadonnee: {
                dateVersion: '2023-01-01T00:00:00',
                diffuseur: 'Citepa',
                id: 1,
                limites: '',
                methodologie:
                  'Inventaire GES spatialisé (CITEPA 2023 - année 2021 et CITEPA 2021 - années 2016 et 2018) et périmètre (Banatic 2023)',
                nomDonnees: '',
                producteur: 'Citepa - Territoires en Transitions',
                sourceId: 'citepa',
              },
              valeur: 350,
            },
          ],
        },
        programme: {
          score: 0,
          valeursUtilisees: [
            {
              dateValeur: '2025-05-29',
              indicateurId: 229,
              sourceLibelle: null,
              sourceMetadonnee: null,
              valeur: 440,
            },
          ],
        },
      },
    });
  });
});
