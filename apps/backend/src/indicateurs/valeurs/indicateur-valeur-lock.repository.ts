import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { sql } from 'drizzle-orm';

type IndicateurValeurLock = {
  collectiviteId: number;
  dateValeur: string;
};

const getIndicateurValeurLockKeys = (
  valeurs: IndicateurValeurLock[]
): string[] =>
  [
    ...new Set(
      valeurs.map(
        ({ collectiviteId, dateValeur }) =>
          `indicateur-valeur:${collectiviteId}:${dateValeur}`
      )
    ),
  ].sort();

@Injectable()
export class IndicateurValeurLockRepository {
  async lock(valeurs: IndicateurValeurLock[], tx: Transaction): Promise<void> {
    const lockKeys = getIndicateurValeurLockKeys(valeurs);
    if (lockKeys.length === 0) return;
    const lockRows = sql.join(
      lockKeys.map((lockKey) => sql`(${lockKey})`),
      sql`, `
    );

    // Une seule requête, avec un ordre global stable, évite à la fois un aller-
    // retour par cellule et les interblocages entre lots multi-périodes.
    await tx.execute(sql`
      WITH lock_keys(lock_key) AS (VALUES ${lockRows})
      SELECT pg_advisory_xact_lock(hashtextextended(lock_key::text, 0))
      FROM (
        SELECT lock_key
        FROM lock_keys
        ORDER BY lock_key
      ) AS ordered_locks
    `);
  }
}
