import { Injectable } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import { Indicateur } from '@tet/domain/indicateurs';
import { asc, inArray, sql } from 'drizzle-orm';
import { indicateurSelection } from './indicateur.column';
import { validateNatures } from './indicateur.adapter';

const INDICATEUR_CALCULATION_GRAPH_LOCK_KEY = 'indicateur-calculation-graph';

@Injectable()
export class IndicateurLockRepository {
  /** Allows concurrent value writes while excluding formula-graph mutations. */
  async lockForValueWrite(tx: Transaction): Promise<void> {
    await tx.execute(sql`
      SELECT pg_advisory_xact_lock_shared(
        hashtextextended(${INDICATEUR_CALCULATION_GRAPH_LOCK_KEY}, 0)
      )
    `);
  }

  /** Serializes definition mutations against calculations and value writes. */
  async lockForIndicateurMutation(tx: Transaction): Promise<void> {
    await tx.execute(sql`
      SELECT pg_advisory_xact_lock(
        hashtextextended(${INDICATEUR_CALCULATION_GRAPH_LOCK_KEY}, 0)
      )
    `);
  }

  /**
   * Relit les définitions sous verrou partagé dans un ordre global stable.
   * Toute écriture de valeur utilise ce même ordre afin de limiter les
   * interblocages avec une modification concurrente des définitions.
   */
  async lockIndicateurs(
    indicateurIds: number[],
    tx: Transaction
  ): Promise<Result<Indicateur[], 'DATABASE_ERROR'>> {
    await this.lockForValueWrite(tx);

    const sortedIndicateurIds = [...new Set(indicateurIds)].sort(
      (left, right) => left - right
    );
    if (sortedIndicateurIds.length === 0) {
      return success([]);
    }

    const definitions = await tx
      .select(indicateurSelection)
      .from(indicateurDefinitionTable)
      .where(inArray(indicateurDefinitionTable.id, sortedIndicateurIds))
      .orderBy(asc(indicateurDefinitionTable.id))
      .for('share');

    return validateNatures(definitions);
  }
}
