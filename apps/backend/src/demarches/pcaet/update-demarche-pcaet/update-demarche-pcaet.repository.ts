import { Injectable, Logger } from '@nestjs/common';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { DemarchePcaetRef } from '../shared/demarche-pcaet-ref.repository';
import { UpdateDemarchePcaetInput } from './update-demarche-pcaet.input';

export type UpdateDemarchePcaetHeaderPatch = Pick<
  UpdateDemarchePcaetInput,
  'titre' | 'description' | 'obligation' | 'launchedAt'
>;

@Injectable()
export class UpdateDemarchePcaetRepository {
  private readonly logger = new Logger(UpdateDemarchePcaetRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Ceux de ces identifiants qui ne sont pas un plan (axe racine) de cette
   * collectivité — la liste des refusés, pour que l'erreur les nomme.
   */
  async findPlanActionsHorsCollectivite(
    planActionIds: number[],
    collectiviteId: number,
    tx?: Transaction
  ): Promise<number[]> {
    if (planActionIds.length === 0) {
      return [];
    }
    const db = tx || this.databaseService.db;
    const rows = await db
      .select({ id: axeTable.id })
      .from(axeTable)
      .where(
        and(
          inArray(axeTable.id, planActionIds),
          eq(axeTable.collectiviteId, collectiviteId),
          isNull(axeTable.parent)
        )
      );
    const eligibles = new Set(rows.map((row) => row.id));
    return planActionIds.filter((id) => !eligibles.has(id));
  }

  /**
   * Met à jour les champs fournis du header. Le collectiviteId sert de filtre
   * (règle IDOR) et ne fait jamais partie du SET ; les colonnes modified_*
   * sont renseignées explicitement (le default `auth.uid()` est inopérant
   * sous connexion Drizzle).
   */
  async updateHeader(
    ref: Pick<DemarchePcaetRef, 'id' | 'collectiviteId'>,
    patch: UpdateDemarchePcaetHeaderPatch,
    userId: string,
    tx: Transaction
  ): Promise<Result<undefined, 'UPDATE_DEMARCHE_PCAET_ERROR'>> {
    try {
      await tx
        .update(demarcheTable)
        .set({
          ...(patch.titre !== undefined ? { titre: patch.titre } : {}),
          ...(patch.description !== undefined
            ? { description: patch.description }
            : {}),
          ...(patch.obligation !== undefined
            ? { obligation: patch.obligation }
            : {}),
          ...(patch.launchedAt !== undefined
            ? { launchedAt: patch.launchedAt }
            : {}),
          modifiedAt: new Date().toISOString(),
          modifiedBy: userId,
        })
        .where(
          and(
            eq(demarcheTable.id, ref.id),
            eq(demarcheTable.collectiviteId, ref.collectiviteId)
          )
        );
      return success(undefined);
    } catch (error) {
      this.logger.error(`Error updating demarche PCAET ${ref.id}: ${error}`);
      return failure('UPDATE_DEMARCHE_PCAET_ERROR');
    }
  }
}
