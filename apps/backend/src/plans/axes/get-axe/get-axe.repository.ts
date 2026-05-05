import { Injectable, Logger } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { AxeLight } from '@tet/domain/plans';
import { eq, sql } from 'drizzle-orm';
import { axeIndicateurTable } from '../../fiches/shared/models/axe-indicateur.table';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { GetAxeError, GetAxeErrorEnum } from './get-axe.errors';
import { Indicateur } from './get-axe.output';

type AxeDbRowFromPlanActionChemin = {
  id: number;
  nom: string | null;
  description: string | null;
  collectivite_id: number;
  parent: number | null;
  plan: number | null;
  type: number | null;
  created_at: string;
  modified_at: string;
  modified_by: string | null;
  panier_id: string | null;
};

function axeDbRowToAxeLight(row: AxeDbRowFromPlanActionChemin): AxeLight {
  return {
    id: row.id,
    nom: row.nom,
    description: row.description,
    collectiviteId: row.collectivite_id,
    parent: row.parent,
    plan: row.plan,
    typeId: row.type,
    createdAt: row.created_at,
    modifiedAt: row.modified_at,
    modifiedBy: row.modified_by,
    panierId: row.panier_id,
  };
}

@Injectable()
export class GetAxeRepository {
  private readonly logger = new Logger(GetAxeRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getAxe(
    axeId: number,
    tx?: Transaction
  ): Promise<Result<AxeLight, GetAxeError>> {
    try {
      const result = await (tx || this.databaseService.db)
        .select()
        .from(axeTable)
        .where(eq(axeTable.id, axeId))
        .limit(1);

      if (!result || result.length === 0) {
        return {
          success: false,
          error: GetAxeErrorEnum.AXE_NOT_FOUND,
        };
      }

      const [axe] = result;
      return {
        success: true,
        data: axe,
      };
    } catch (error) {
      this.logger.error(
        `Error getting axe basic info for axe ${axeId}: ${error}`
      );
      return {
        success: false,
        error: GetAxeErrorEnum.SERVER_ERROR,
      };
    }
  }

  async getAxeChemin(
    axeId: number,
    tx?: Transaction
  ): Promise<Result<AxeLight[], GetAxeError>> {
    const batchResult = await this.getAxesChemins([axeId], tx);
    if (!batchResult.success) {
      return batchResult;
    }
    return { success: true, data: batchResult.data[axeId] ?? [] };
  }

  async getAxesChemins(
    axeIds: number[],
    tx?: Transaction
  ): Promise<Result<Record<number, AxeLight[]>, GetAxeError>> {
    if (axeIds.length === 0) {
      return { success: true, data: {} };
    }

    try {
      const axeIdList = sql.join(
        axeIds.map((id) => sql`${id}`),
        sql`, `
      );
      const result = await (tx || this.databaseService.db).execute<{
        axe_id: number;
        chemin: AxeDbRowFromPlanActionChemin[] | null;
      }>(
        // Réécriture dans le backend de la vue legacy `plan_action_chemin`
        sql`
          WITH RECURSIVE chemin AS (
            SELECT a.id, a.nom, a.description, a.collectivite_id, a.parent,
                   a.plan, a.type, a.created_at, a.modified_at, a.modified_by, a.panier_id,
                   a.id AS leaf_axe_id, 0 AS depth
            FROM axe a
            WHERE a.id IN (${axeIdList})
            UNION ALL
            SELECT p.id, p.nom, p.description, p.collectivite_id, p.parent,
                   p.plan, p.type, p.created_at, p.modified_at, p.modified_by, p.panier_id,
                   c.leaf_axe_id, c.depth + 1
            FROM axe p
            INNER JOIN chemin c ON c.parent = p.id
          )
          SELECT leaf_axe_id AS axe_id,
                 jsonb_agg(
                   jsonb_build_object(
                     'id', id,
                     'nom', nom,
                     'description', description,
                     'collectivite_id', collectivite_id,
                     'parent', parent,
                     'plan', plan,
                     'type', type,
                     'created_at', created_at,
                     'modified_at', modified_at,
                     'modified_by', modified_by,
                     'panier_id', panier_id
                   )
                   ORDER BY depth DESC
                 ) AS chemin
          FROM chemin
          GROUP BY leaf_axe_id
        `
      );

      const cheminsByAxe: Record<number, AxeLight[]> = Object.fromEntries(
        result.rows.map((row) => [
          row.axe_id,
          (row.chemin ?? []).map(axeDbRowToAxeLight),
        ])
      );
      return { success: true, data: cheminsByAxe };
    } catch (error) {
      this.logger.error(
        `Error getting chemins for axes ${axeIds.join(', ')}: ${error}`
      );
      return { success: false, error: GetAxeErrorEnum.SERVER_ERROR };
    }
  }

  async getAxeIndicateurs(
    axeId: number,
    tx?: Transaction
  ): Promise<Result<Indicateur[], GetAxeError>> {
    try {
      const indicateurs = await (tx || this.databaseService.db)
        .select({
          id: indicateurDefinitionTable.id,
          titre: indicateurDefinitionTable.titre,
          unite: indicateurDefinitionTable.unite,
        })
        .from(axeIndicateurTable)
        .innerJoin(
          indicateurDefinitionTable,
          eq(indicateurDefinitionTable.id, axeIndicateurTable.indicateurId)
        )
        .where(eq(axeIndicateurTable.axeId, axeId));

      return {
        success: true,
        data: indicateurs,
      };
    } catch (error) {
      this.logger.error(`Error getting indicateurs for axe ${axeId}: ${error}`);
      return {
        success: false,
        error: GetAxeErrorEnum.GET_INDICATEURS_ERROR,
      };
    }
  }
}
