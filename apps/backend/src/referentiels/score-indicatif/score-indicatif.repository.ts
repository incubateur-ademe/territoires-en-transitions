import { Injectable, Logger } from '@nestjs/common';
import { categorieTagTable } from '@tet/backend/collectivites/tags/categorie-tag.table';
import { indicateurCategorieTagTable } from '@tet/backend/indicateurs/definitions/indicateur-categorie-tag.table';
import { indicateurCollectiviteTable } from '@tet/backend/indicateurs/definitions/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { LigneValeurProgression } from '@tet/backend/indicateurs/valeurs/progression.rules';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { actionScoreIndicateurValeurTable } from '@tet/backend/referentiels/models/action-score-indicateur-valeur.table';
import { SetValeursUtiliseesRequest } from '@tet/backend/referentiels/score-indicatif/set-valeurs-utilisees.request';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { IndicateurSourceMetadonnee } from '@tet/domain/indicateurs';
import {
  scoreIndicatifTypeEnum,
  ValeurUtilisee,
} from '@tet/domain/referentiels';
import {
  and,
  eq,
  getTableColumns,
  gte,
  inArray,
  isNotNull,
  lte,
  not,
  or,
  sql,
} from 'drizzle-orm';
import { groupBy } from 'es-toolkit';
import { objectToCamel } from 'ts-case-convert';
import { ScoreIndicatifError } from './score-indicatif.errors';

export type Formule = { actionId: string; exprScore: string | null };

export type IndicateurDefinitionAvecCategories = {
  indicateurId: number;
  identifiantReferentiel: string | null;
  unite: string;
  titre: string;
  categories: string[];
  isApplicable: boolean;
};

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
    collectiviteId: number,
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
          categories: sql<string[]>`
            COALESCE(
              json_agg(${categorieTagTable.nom}) FILTER (
                WHERE ${categorieTagTable.nom} IS NOT NULL
              ),
              '[]'::json
            )
          `,
          isApplicable: sql<boolean>`coalesce(bool_and(${indicateurCollectiviteTable.isApplicable}), true)`,
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
        .leftJoin(
          indicateurCollectiviteTable,
          and(
            eq(indicateurCollectiviteTable.indicateurId, indicateurId),
            eq(indicateurCollectiviteTable.collectiviteId, collectiviteId)
          )
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

  /** Liste les actions dont le score indicatif est calculé à partir des valeurs d'indicateurs */
  async listActionsUsingIndicateurValeur(
    indicateurValeurId: number | number[],
    tx?: Transaction
  ): Promise<
    Result<{ collectiviteId: number; actionId: string }[], ScoreIndicatifError>
  > {
    try {
      const rows = await (tx ?? this.databaseService.db)
        .selectDistinct({
          collectiviteId: actionScoreIndicateurValeurTable.collectiviteId,
          actionId: actionScoreIndicateurValeurTable.actionId,
        })
        .from(actionScoreIndicateurValeurTable)
        .where(
          Array.isArray(indicateurValeurId)
            ? inArray(
                actionScoreIndicateurValeurTable.indicateurValeurId,
                indicateurValeurId
              )
            : eq(
                actionScoreIndicateurValeurTable.indicateurValeurId,
                indicateurValeurId
              )
        );

      return success(rows);
    } catch (error) {
      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Parmi les identifiants de valeurs d'indicateur fournis, renvoie ceux qui
   * appartiennent bien à la collectivité et à l'indicateur donnés
   */
  async filterIndicateurValeurIdsBelongingTo(
    indicateurValeurIds: number[],
    collectiviteId: number,
    indicateurId: number,
    tx?: Transaction
  ): Promise<Result<number[], ScoreIndicatifError>> {
    try {
      const rows = await (tx ?? this.databaseService.db)
        .select({ id: indicateurValeurTable.id })
        .from(indicateurValeurTable)
        .where(
          and(
            inArray(indicateurValeurTable.id, indicateurValeurIds),
            eq(indicateurValeurTable.collectiviteId, collectiviteId),
            eq(indicateurValeurTable.indicateurId, indicateurId)
          )
        );

      return success(rows.map((r) => r.id));
    } catch (error) {
      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Liste les lignes de valeurs de la collectivité ayant un objectif ou un
   * résultat, pour les indicateurs et les années donnés, avec leur source
   * (pour `progression_snbc(...)` et `reduction(...)`). Le filtre d'année porte
   * sur la plage `[a-01-01, a-12-31]` car `dateValeur` n'est pas forcément un
   * 1er janvier.
   */
  async getValeursProgression(
    indicateurIds: number[],
    collectiviteId: number,
    annees: number[],
    tx?: Transaction
  ): Promise<
    Result<
      Array<LigneValeurProgression & { indicateurId: number }>,
      ScoreIndicatifError
    >
  > {
    if (!indicateurIds.length || !annees.length) {
      return success([]);
    }
    try {
      const rows = await (tx ?? this.databaseService.db)
        .select({
          indicateurId: indicateurValeurTable.indicateurId,
          metadonneeId: indicateurValeurTable.metadonneeId,
          sourceId: indicateurSourceMetadonneeTable.sourceId,
          ordreAffichage: indicateurSourceTable.ordreAffichage,
          dateVersion: indicateurSourceMetadonneeTable.dateVersion,
          dateValeur: indicateurValeurTable.dateValeur,
          objectif: indicateurValeurTable.objectif,
          resultat: indicateurValeurTable.resultat,
        })
        .from(indicateurValeurTable)
        .leftJoin(
          indicateurSourceMetadonneeTable,
          eq(
            indicateurValeurTable.metadonneeId,
            indicateurSourceMetadonneeTable.id
          )
        )
        .leftJoin(
          indicateurSourceTable,
          eq(indicateurSourceMetadonneeTable.sourceId, indicateurSourceTable.id)
        )
        .where(
          and(
            inArray(indicateurValeurTable.indicateurId, indicateurIds),
            eq(indicateurValeurTable.collectiviteId, collectiviteId),
            or(
              isNotNull(indicateurValeurTable.objectif),
              isNotNull(indicateurValeurTable.resultat)
            ),
            or(
              ...annees.map((annee) =>
                and(
                  gte(indicateurValeurTable.dateValeur, `${annee}-01-01`),
                  lte(indicateurValeurTable.dateValeur, `${annee}-12-31`)
                )
              )
            )
          )
        );

      return success(rows);
    } catch (error) {
      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /** Remplace les valeurs utilisées pour le calcul du score indicatif d'une action/indicateur */
  async replaceValeursUtiliseesForAction(
    input: SetValeursUtiliseesRequest,
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
