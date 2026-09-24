import { indicateurActionTable } from '@tet/backend/indicateurs/definitions/indicateur-action.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { actionScoreIndicateurValeurTable } from '@tet/backend/referentiels/models/action-score-indicateur-valeur.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, eq } from 'drizzle-orm';

/** Identifiant stable de l'indicateur de test, pour une formule déterministe */
export const TEST_INDICATEUR_SCORE_IDENTIFIANT = 'test_score_from_indicateur';

/** Le score vaut le résultat rapporté à 100 : un résultat de 50 donne 0,5 */
const TEST_EXPR_SCORE = `val(${TEST_INDICATEUR_SCORE_IDENTIFIANT}) / 100`;

/**
 * Prépare une action portant une formule de score indicatif, un indicateur de
 * test qui l'alimente et des valeurs de résultat pour la collectivité.
 *
 * Les valeurs ne sont PAS associées à l'action : c'est la procédure testée qui
 * crée cette association.
 */
export async function insertFixtureScoreFromIndicateur(
  databaseService: DatabaseService,
  {
    collectiviteId,
    actionId,
    valeurs,
    exprScore = TEST_EXPR_SCORE,
    identifiantReferentiel = TEST_INDICATEUR_SCORE_IDENTIFIANT,
  }: {
    collectiviteId: number;
    actionId: string;
    valeurs: { dateValeur: string; resultat: number }[];
    /** Formule custom (défaut : basée sur `val(...)`) — ex. pour tester `est_suivi(...)` */
    exprScore?: string;
    /** Identifiant custom (défaut : `TEST_INDICATEUR_SCORE_IDENTIFIANT`) — utile pour isoler un indicateur dédié d'un autre appel de cette fixture dans le même fichier de test */
    identifiantReferentiel?: string;
  }
): Promise<{
  indicateurId: number;
  valeurIds: number[];
  cleanup: () => Promise<void>;
}> {
  const [{ id: indicateurId }] = await databaseService.db
    .insert(indicateurDefinitionTable)
    .values({
      titre: 'Indicateur de test pour la dérivation du statut',
      unite: '%',
      identifiantReferentiel,
    })
    .onConflictDoUpdate({
      target: indicateurDefinitionTable.identifiantReferentiel,
      set: { unite: '%' },
    })
    .returning({ id: indicateurDefinitionTable.id });

  const previousExprScore = await databaseService.db
    .select({ exprScore: actionDefinitionTable.exprScore })
    .from(actionDefinitionTable)
    .where(eq(actionDefinitionTable.actionId, actionId))
    .then((rows) => rows[0]?.exprScore ?? null);

  await databaseService.db
    .update(actionDefinitionTable)
    .set({ exprScore })
    .where(eq(actionDefinitionTable.actionId, actionId));

  await databaseService.db
    .insert(indicateurActionTable)
    .values([{ indicateurId, actionId }])
    .onConflictDoNothing();

  const insertedValeurs = await databaseService.db
    .insert(indicateurValeurTable)
    .values(
      valeurs.map(({ dateValeur, resultat }) => ({
        indicateurId,
        collectiviteId,
        dateValeur,
        metadonneeId: null,
        resultat,
        objectif: null,
      }))
    )
    .returning({ id: indicateurValeurTable.id });

  return {
    indicateurId,
    valeurIds: insertedValeurs.map(({ id }) => id),
    cleanup: async () => {
      await databaseService.db
        .update(actionDefinitionTable)
        .set({ exprScore: previousExprScore })
        .where(eq(actionDefinitionTable.actionId, actionId));

      await databaseService.db
        .delete(actionScoreIndicateurValeurTable)
        .where(
          and(
            eq(actionScoreIndicateurValeurTable.collectiviteId, collectiviteId),
            eq(actionScoreIndicateurValeurTable.indicateurId, indicateurId)
          )
        );
      await databaseService.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, indicateurId));
      await databaseService.db
        .delete(indicateurActionTable)
        .where(eq(indicateurActionTable.indicateurId, indicateurId));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId));
    },
  };
}
