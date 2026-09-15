import { Injectable, Logger } from '@nestjs/common';
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
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  IndicateurPeriodicite,
  IndicateurPeriodiciteEnum,
  IndicateurSourceMetadonnee,
} from '@tet/domain/indicateurs';
import {
  ScoreIndicatifType,
  scoreIndicatifTypeEnum,
  ValeurUtilisee,
} from '@tet/domain/referentiels';
import { and, eq, getTableColumns, inArray, not, sql } from 'drizzle-orm';
import { groupBy } from 'es-toolkit';
import { objectToCamel } from 'ts-case-convert';
import { ScoreIndicatifError } from './score-indicatif.errors';

export type Formule = { actionId: string; exprScore: string | null };

export type IndicateurDefinitionAvecCategories = {
  indicateurId: number;
  identifiantReferentiel: string | null;
  unite: string;
  titre: string;
  periodicite: IndicateurPeriodicite;
  categories: string[];
};

type LockedScoreIndicatifDefinition = Pick<
  IndicateurDefinitionAvecCategories,
  'identifiantReferentiel' | 'periodicite'
>;

export type ScoreIndicatifSelectionScope = Readonly<{
  actionId: string;
  collectiviteId: number;
  indicateurId: number;
}>;

type ScoreIndicatifSelection = ScoreIndicatifSelectionScope &
  Readonly<{
    valeurs: readonly {
      indicateurValeurId: number | null;
      typeScore: ScoreIndicatifType;
    }[];
  }>;

const getScoreIndicatifSelectionLockKey = (
  input: ScoreIndicatifSelectionScope
): string =>
  `score-indicatif-selection:${input.actionId}:${input.collectiviteId}:${input.indicateurId}`;

@Injectable()
export class ScoreIndicatifRepository {
  private readonly logger = new Logger(ScoreIndicatifRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /** Charge les formules à utiliser pour le calcul du score indicatif des actions */
  async getFormules(
    actionIds: string[],
    tx?: Transaction
  ): Promise<Result<Formule[], ScoreIndicatifError>> {
    try {
      const { actionId, exprScore } = getTableColumns(actionDefinitionTable);

      const formules = await (tx ?? this.databaseService.db)
        .select({ actionId, exprScore })
        .from(actionDefinitionTable)
        .where(inArray(actionId, actionIds));

      return success(formules);
    } catch (error) {
      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /** Charge les définitions des indicateurs identifiés par leur identifiant référentiel, avec leurs catégories */
  async getIndicateurDefinitionsByIdentifiants(
    identifiants: string[],
    tx?: Transaction
  ): Promise<
    Result<IndicateurDefinitionAvecCategories[], ScoreIndicatifError>
  > {
    try {
      const {
        identifiantReferentiel,
        id: indicateurId,
        unite,
        titre,
      } = getTableColumns(indicateurDefinitionTable);

      const indicateurs = await (tx ?? this.databaseService.db)
        .select({
          indicateurId,
          identifiantReferentiel,
          unite,
          titre,
          periodicite: indicateurDefinitionTable.periodicite,
          categories: sql<string[]>`
            COALESCE(
              json_agg(${categorieTagTable.nom}) FILTER (
                WHERE ${categorieTagTable.nom} IS NOT NULL
              ),
              '[]'::json
            )
          `,
        })
        .from(indicateurDefinitionTable)
        .leftJoin(
          indicateurCategorieTagTable,
          eq(indicateurCategorieTagTable.indicateurId, indicateurId)
        )
        .leftJoin(
          categorieTagTable,
          eq(categorieTagTable.id, indicateurCategorieTagTable.categorieTagId)
        )
        .where(and(inArray(identifiantReferentiel, identifiants)))
        .groupBy(indicateurId);

      return success(indicateurs);
    } catch (error) {
      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /** Liste les valeurs d'indicateurs utilisées pour le calcul du score indicatif, groupées par action */
  async listValeursUtiliseesParActionId(
    input: { actionIds: string[]; collectiviteId: number },
    tx?: Transaction
  ): Promise<Result<Record<string, ValeurUtilisee[]>, ScoreIndicatifError>> {
    try {
      const valeurs = await (tx ?? this.databaseService.db)
        .select({
          actionId: actionScoreIndicateurValeurTable.actionId,
          indicateurValeurId:
            actionScoreIndicateurValeurTable.indicateurValeurId,
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
            eq(
              indicateurValeurTable.periodicite,
              IndicateurPeriodiciteEnum.ANNUELLE
            ),
            inArray(actionScoreIndicateurValeurTable.actionId, input.actionIds),
            eq(
              actionScoreIndicateurValeurTable.collectiviteId,
              input.collectiviteId
            )
          )
        );

      const valeursNonNulles = objectToCamel(valeurs)
        .map(({ objectif, resultat, ...v }) => ({
          ...v,
          valeur: (v.typeScore === scoreIndicatifTypeEnum.FAIT
            ? resultat
            : objectif) as number,
        }))
        .filter((v) => v.valeur !== null);

      return success(
        groupBy(
          valeursNonNulles,
          ({ actionId }: { actionId: string }) => actionId
        )
      );
    } catch (error) {
      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /** Extrait tous les identifiants d'actions pour lesquelles il y a une formule de calcul du score indicatif */
  async extractActionIdsWithExprScore(
    tx?: Transaction
  ): Promise<Result<string[], ScoreIndicatifError>> {
    try {
      const rows = await (tx ?? this.databaseService.db)
        .select({ actionId: actionDefinitionTable.actionId })
        .from(actionDefinitionTable)
        .where(not(eq(actionDefinitionTable.exprScore, '')));

      return success(rows.map((r) => r.actionId));
    } catch (error) {
      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
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
          eq(
            indicateurValeurTable.periodicite,
            IndicateurPeriodiciteEnum.ANNUELLE
          ),
          eq(indicateurValeurTable.indicateurId, input.indicateurId),
          eq(indicateurValeurTable.collectiviteId, input.collectiviteId)
        )
      );
    return valeurs.map(({ id }) => id);
  }

  /** Remplace les valeurs utilisées pour le calcul du score indicatif d'une action/indicateur */
  async replaceValeursUtiliseesForAction(
    input: ScoreIndicatifSelection,
    tx: Transaction
  ): Promise<Result<void, ScoreIndicatifError>> {
    try {
      const { actionId, collectiviteId, indicateurId } = getTableColumns(
        actionScoreIndicateurValeurTable
      );

      await tx
        .delete(actionScoreIndicateurValeurTable)
        .where(
          and(
            eq(actionId, input.actionId),
            eq(collectiviteId, input.collectiviteId),
            eq(indicateurId, input.indicateurId)
          )
        );

      const valeursNonNulles = input.valeurs.filter(
        (v) => v.indicateurValeurId !== null
      );
      if (valeursNonNulles.length) {
        await tx.insert(actionScoreIndicateurValeurTable).values(
          valeursNonNulles.map((v) => ({
            actionId: input.actionId,
            collectiviteId: input.collectiviteId,
            indicateurId: input.indicateurId,
            indicateurValeurId: v.indicateurValeurId as number,
            typeScore: v.typeScore,
          }))
        );
      }

      return success(undefined);
    } catch (error) {
      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
