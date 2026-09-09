import { Injectable } from '@nestjs/common';
import { categorieTagTable } from '@tet/backend/collectivites/tags/categorie-tag.table';
import { indicateurCategorieTagTable } from '@tet/backend/indicateurs/definitions/indicateur-categorie-tag.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { actionScoreIndicateurValeurTable } from '@tet/backend/referentiels/models/action-score-indicateur-valeur.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type {
  IndicateurPeriodicite,
  IndicateurSourceMetadonnee,
} from '@tet/domain/indicateurs';
import { ScoreIndicatifType } from '@tet/domain/referentiels';
import { and, eq, inArray, not, sql } from 'drizzle-orm';
import { objectToCamel } from 'ts-case-convert';

type ScoreIndicatifFormula = Readonly<{
  actionId: string;
  exprScore: string | null;
}>;

type ScoreIndicatifDefinition = Readonly<{
  indicateurId: number;
  identifiantReferentiel: string | null;
  unite: string;
  titre: string;
  periodicite: IndicateurPeriodicite;
  categories: string[];
}>;

type LockedScoreIndicatifDefinition = Pick<
  ScoreIndicatifDefinition,
  'identifiantReferentiel' | 'periodicite'
>;

export type ScoreIndicatifSelectionScope = Readonly<{
  actionId: string;
  collectiviteId: number;
  indicateurId: number;
}>;

type SelectedScoreIndicatifValeur = Readonly<{
  indicateurValeurId: number;
  typeScore: ScoreIndicatifType;
}>;

type ScoreIndicatifReadScope = Readonly<{
  actionIds: string[];
  collectiviteId: number;
}>;

type ScoreIndicatifValeurRow = Readonly<{
  actionId: string;
  indicateurValeurId: number;
  typeScore: ScoreIndicatifType;
  indicateurId: number;
  dateValeur: string;
  resultat: number | null;
  objectif: number | null;
  sourceLibelle: string | null;
  sourceMetadonnee: IndicateurSourceMetadonnee | null;
}>;

const getScoreIndicatifSelectionLockKey = (
  input: ScoreIndicatifSelectionScope
): string =>
  `score-indicatif-selection:${input.actionId}:${input.collectiviteId}:${input.indicateurId}`;

@Injectable()
export class ScoreIndicatifRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  listFormules(actionIds: string[]): Promise<ScoreIndicatifFormula[]> {
    return this.databaseService.db
      .select({
        actionId: actionDefinitionTable.actionId,
        exprScore: actionDefinitionTable.exprScore,
      })
      .from(actionDefinitionTable)
      .where(inArray(actionDefinitionTable.actionId, actionIds));
  }

  listDefinitions(
    identifiantsReferentiel: string[]
  ): Promise<ScoreIndicatifDefinition[]> {
    return this.databaseService.db
      .select({
        indicateurId: indicateurDefinitionTable.id,
        identifiantReferentiel:
          indicateurDefinitionTable.identifiantReferentiel,
        unite: indicateurDefinitionTable.unite,
        titre: indicateurDefinitionTable.titre,
        periodicite: indicateurDefinitionTable.periodicite,
        categories: sql<string[]>`json_agg(${categorieTagTable.nom})`,
      })
      .from(indicateurDefinitionTable)
      .leftJoin(
        indicateurCategorieTagTable,
        eq(
          indicateurCategorieTagTable.indicateurId,
          indicateurDefinitionTable.id
        )
      )
      .leftJoin(
        categorieTagTable,
        eq(categorieTagTable.id, indicateurCategorieTagTable.categorieTagId)
      )
      .where(
        and(
          inArray(
            indicateurDefinitionTable.identifiantReferentiel,
            identifiantsReferentiel
          )
        )
      )
      .groupBy(indicateurDefinitionTable.id);
  }

  async getDefinitionForShare(
    indicateurId: number,
    tx: Transaction
  ): Promise<LockedScoreIndicatifDefinition | null> {
    const [definition] = await tx
      .select({
        periodicite: indicateurDefinitionTable.periodicite,
        identifiantReferentiel:
          indicateurDefinitionTable.identifiantReferentiel,
      })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1)
      .for('share');
    return definition ?? null;
  }

  /**
   * Serializes replacement of one score selection independently from the
   * presence of existing rows. Row locks cannot provide that guarantee when a
   * selection is still empty, hence the transaction-scoped advisory lock.
   */
  async lockSelectionScope(
    input: ScoreIndicatifSelectionScope,
    tx: Transaction
  ): Promise<void> {
    const lockKey = getScoreIndicatifSelectionLockKey(input);
    await tx.execute(sql`
      SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
    `);
  }

  async listCompatibleValeurIds(
    input: Pick<
      ScoreIndicatifSelectionScope,
      'collectiviteId' | 'indicateurId'
    >,
    valeurIds: number[],
    tx: Transaction
  ): Promise<number[]> {
    const valeurs = await tx
      .select({ id: indicateurValeurTable.id })
      .from(indicateurValeurTable)
      .where(
        and(
          inArray(indicateurValeurTable.id, valeurIds),
          eq(indicateurValeurTable.indicateurId, input.indicateurId),
          eq(indicateurValeurTable.collectiviteId, input.collectiviteId)
        )
      );
    return valeurs.map(({ id }) => id);
  }

  async replaceValeursUtilisees(
    input: ScoreIndicatifSelectionScope,
    valeurs: SelectedScoreIndicatifValeur[],
    tx: Transaction
  ): Promise<void> {
    await tx
      .delete(actionScoreIndicateurValeurTable)
      .where(
        and(
          eq(actionScoreIndicateurValeurTable.actionId, input.actionId),
          eq(
            actionScoreIndicateurValeurTable.collectiviteId,
            input.collectiviteId
          ),
          eq(actionScoreIndicateurValeurTable.indicateurId, input.indicateurId)
        )
      );

    if (valeurs.length > 0) {
      await tx.insert(actionScoreIndicateurValeurTable).values(
        valeurs.map((valeur) => ({
          actionId: input.actionId,
          collectiviteId: input.collectiviteId,
          indicateurId: input.indicateurId,
          indicateurValeurId: valeur.indicateurValeurId,
          typeScore: valeur.typeScore,
        }))
      );
    }
  }

  async listValeursUtilisees(
    input: ScoreIndicatifReadScope
  ): Promise<ScoreIndicatifValeurRow[]> {
    const valeurs = await this.databaseService.db
      .select({
        actionId: actionScoreIndicateurValeurTable.actionId,
        indicateurValeurId: actionScoreIndicateurValeurTable.indicateurValeurId,
        typeScore: actionScoreIndicateurValeurTable.typeScore,
        indicateurId: actionScoreIndicateurValeurTable.indicateurId,
        dateValeur: indicateurValeurTable.dateValeur,
        resultat: indicateurValeurTable.resultat,
        objectif: indicateurValeurTable.objectif,
        sourceLibelle: indicateurSourceTable.libelle,
        sourceMetadonnee:
          sql<IndicateurSourceMetadonnee | null>`to_jsonb(${indicateurSourceMetadonneeTable})`.as(
            'sourceMetadonnee'
          ),
      })
      .from(actionScoreIndicateurValeurTable)
      .innerJoin(
        indicateurValeurTable,
        eq(
          indicateurValeurTable.id,
          actionScoreIndicateurValeurTable.indicateurValeurId
        )
      )
      .leftJoin(
        indicateurSourceMetadonneeTable,
        eq(
          indicateurSourceMetadonneeTable.id,
          indicateurValeurTable.metadonneeId
        )
      )
      .leftJoin(
        indicateurSourceTable,
        eq(indicateurSourceTable.id, indicateurSourceMetadonneeTable.sourceId)
      )
      .where(
        and(
          inArray(actionScoreIndicateurValeurTable.actionId, input.actionIds),
          eq(
            actionScoreIndicateurValeurTable.collectiviteId,
            input.collectiviteId
          )
        )
      );

    return objectToCamel(valeurs);
  }

  async listActionIdsWithExprScore(): Promise<string[]> {
    const rows = await this.databaseService.db
      .select({ actionId: actionDefinitionTable.actionId })
      .from(actionDefinitionTable)
      .where(not(eq(actionDefinitionTable.exprScore, '')));
    return rows.map(({ actionId }) => actionId);
  }
}
