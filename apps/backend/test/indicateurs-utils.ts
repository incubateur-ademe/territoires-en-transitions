import { indicateurActionTable } from '@/backend/indicateurs/definitions/indicateur-action.table';
import { indicateurDefinitionTable } from '@/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurValeurTable } from '@/backend/indicateurs/valeurs/indicateur-valeur.table';
import { actionDefinitionTable } from '@/backend/referentiels/models/action-definition.table';
import { actionScoreIndicateurValeurTable } from '@/backend/referentiels/models/action-score-indicateur-valeur.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { and, eq, inArray } from 'drizzle-orm';

export const getIndicateurIdByIdentifiant = async (
  databaseService: DatabaseService,
  identifiant: string
): Promise<number> => {
  const result = await databaseService.db
    .select({
      id: indicateurDefinitionTable.id,
    })
    .from(indicateurDefinitionTable)
    .where(eq(indicateurDefinitionTable.identifiantReferentiel, identifiant));
  if (result.length === 0) {
    throw new Error(`Indicateur with identifiant ${identifiant} not found`);
  }
  return result[0].id;
};

export const deleteIndicateurValeursForCollectivite = async (
  databaseService: DatabaseService,
  collectiviteId: number,
  indicateurIds: number[]
): Promise<void> => {
  await databaseService.db
    .delete(indicateurValeurTable)
    .where(
      and(
        eq(indicateurValeurTable.collectiviteId, collectiviteId),
        inArray(indicateurValeurTable.indicateurId, indicateurIds)
      )
    );
};

export const fixturePourScoreIndicatif = {
  collectiviteId: 1,
  actionId: 'cae_1.2.3.3.4',
  identifiantReferentiel: 'cae_7',
  dateValeur: '2025-05-29',
  exprScore: `si val(cae_7) < limite(cae_7) alors 0
  sinon si val(cae_7) > cible(cae_7) alors 1
  sinon ((val(cae_7) - limite(cae_7)) * 0.05) / (limite(cae_7) - cible(cae_7))`,
  objectif: 44, // objectif collectivité < limite (45),
  resultat: 63, // résultat citepa < cible (65)
};

// ajoute les données nécessaires au calcul d'un score indicatif
export async function insertFixturePourScoreIndicatif(
  databaseService: DatabaseService,
  fixture: typeof fixturePourScoreIndicatif
) {
  const {
    collectiviteId,
    actionId,
    identifiantReferentiel,
    dateValeur,
    exprScore,
    objectif,
    resultat,
  } = fixture;
  // lit l'id de l'indicateur
  const indicateurId = await getIndicateurIdByIdentifiant(
    databaseService,
    identifiantReferentiel
  );

  // la formule n'est pas dans les données de seed
  await databaseService.db
    .update(actionDefinitionTable)
    .set({ exprScore })
    .where(eq(actionDefinitionTable.actionId, actionId));

  // ni le lien entre l'action et l'indicateur
  await databaseService.db
    .insert(indicateurActionTable)
    .values([{ indicateurId, actionId }])
    .onConflictDoNothing();

  // insère des valeurs
  const result2 = await databaseService.db
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
  await databaseService.db
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
    await databaseService.db
      .update(actionDefinitionTable)
      .set({ exprScore: null })
      .where(eq(actionDefinitionTable.actionId, actionId));

    await databaseService.db
      .delete(indicateurActionTable)
      .where(eq(indicateurActionTable.actionId, actionId));

    await databaseService.db
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
