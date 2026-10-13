import { Injectable } from '@nestjs/common';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { chunk } from 'es-toolkit';
import { randomUUID } from 'node:crypto';
import {
  and,
  asc,
  count,
  eq,
  inArray,
  lte,
  notInArray,
  or,
  sql,
  type SQLWrapper,
} from 'drizzle-orm';
import { indicateurValeurTable } from '../valeurs/indicateur-valeur.table';
import { indicateurDefinitionTable } from './indicateur-definition.table';
import { indicateurFormulaReconciliationTable } from './indicateur-formula-reconciliation.table';

const INSERT_CHUNK_SIZE = 1_000;

type EnqueueDefinitionReconciliation = Readonly<{
  indicateurId: number;
  expectedFormula: string | null;
  sourceIdentifiants: string[];
}>;

type ClaimReconciliationOptions = Readonly<{
  indicateurIds?: number[];
  includeDeferred?: boolean;
  excludedIds?: string[];
}>;

/**
 * Application-facing representation of a reconciliation intent. Keeping this
 * contract next to the repository prevents Drizzle's inferred table model from
 * leaking into application services.
 */
export type IndicateurFormulaReconciliationWorkItem = Readonly<{
  id: string;
  generation: string;
  indicateurId: number;
  collectiviteId: number;
  expectedFormula: string | null;
  createdAt: string;
  nextAttemptAt: string;
  failureCount: number;
  lastFailedAt: string | null;
  lastError: string | null;
}>;

@Injectable()
export class IndicateurFormulaReconciliationRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async enqueueForDefinition(
    input: EnqueueDefinitionReconciliation,
    tx: Transaction
  ): Promise<{ generation: string; workItemsCount: number }> {
    const candidateConditions = [
      and(
        eq(indicateurValeurTable.indicateurId, input.indicateurId),
        eq(indicateurValeurTable.calculAuto, true)
      ),
    ];
    if (input.sourceIdentifiants.length > 0) {
      candidateConditions.push(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          input.sourceIdentifiants
        )
      );
    }

    const candidates = await tx
      .selectDistinct({ collectiviteId: indicateurValeurTable.collectiviteId })
      .from(indicateurValeurTable)
      .innerJoin(
        indicateurDefinitionTable,
        eq(indicateurDefinitionTable.id, indicateurValeurTable.indicateurId)
      )
      .where(or(...candidateConditions))
      .orderBy(asc(indicateurValeurTable.collectiviteId));

    const generation = randomUUID();
    for (const candidateChunk of chunk(candidates, INSERT_CHUNK_SIZE)) {
      await tx
        .insert(indicateurFormulaReconciliationTable)
        .values(
          candidateChunk.map(({ collectiviteId }) => ({
            generation,
            indicateurId: input.indicateurId,
            collectiviteId,
            expectedFormula: input.expectedFormula,
          }))
        )
        .onConflictDoNothing();
    }

    return { generation, workItemsCount: candidates.length };
  }

  async claimNext(
    tx: Transaction,
    options: ClaimReconciliationOptions = {}
  ): Promise<IndicateurFormulaReconciliationWorkItem | null> {
    const conditions: SQLWrapper[] = [];
    if (!options.includeDeferred) {
      conditions.push(
        lte(
          indicateurFormulaReconciliationTable.nextAttemptAt,
          sql`CURRENT_TIMESTAMP`
        )
      );
    }
    if (options.indicateurIds?.length) {
      conditions.push(
        inArray(
          indicateurFormulaReconciliationTable.indicateurId,
          options.indicateurIds
        )
      );
    }
    if (options.excludedIds?.length) {
      conditions.push(
        notInArray(indicateurFormulaReconciliationTable.id, options.excludedIds)
      );
    }

    const [workItem] = await tx
      .select()
      .from(indicateurFormulaReconciliationTable)
      .where(and(...conditions))
      .orderBy(
        asc(indicateurFormulaReconciliationTable.nextAttemptAt),
        asc(indicateurFormulaReconciliationTable.failureCount),
        asc(indicateurFormulaReconciliationTable.createdAt),
        asc(indicateurFormulaReconciliationTable.indicateurId),
        asc(indicateurFormulaReconciliationTable.collectiviteId),
        asc(indicateurFormulaReconciliationTable.id)
      )
      .limit(1)
      .for('update', { skipLocked: true });

    return workItem ?? null;
  }

  async complete(id: string, tx: Transaction): Promise<void> {
    await tx
      .delete(indicateurFormulaReconciliationTable)
      .where(eq(indicateurFormulaReconciliationTable.id, id));
  }

  async recordFailure(
    id: string,
    generation: string,
    error: string
  ): Promise<void> {
    await this.databaseService.db
      .update(indicateurFormulaReconciliationTable)
      .set({
        failureCount: sql`${indicateurFormulaReconciliationTable.failureCount} + 1`,
        lastFailedAt: sql`CURRENT_TIMESTAMP`,
        lastError: error,
        // 1, 2, 4… minutes, plafonné à une heure. Une ligne empoisonnée ne
        // peut ainsi monopoliser les claims suivants du même drain.
        nextAttemptAt: sql`CURRENT_TIMESTAMP + LEAST(
          60,
          POWER(
            2,
            LEAST(6, ${indicateurFormulaReconciliationTable.failureCount})
          )
        ) * INTERVAL '1 minute'`,
      })
      .where(
        and(
          eq(indicateurFormulaReconciliationTable.id, id),
          eq(indicateurFormulaReconciliationTable.generation, generation)
        )
      );
  }

  async countPending(indicateurIds?: number[]): Promise<number> {
    const query = this.databaseService.db
      .select({ value: count() })
      .from(indicateurFormulaReconciliationTable);
    const [result] = indicateurIds?.length
      ? await query.where(
          inArray(
            indicateurFormulaReconciliationTable.indicateurId,
            indicateurIds
          )
        )
      : await query;
    return result.value;
  }
}
