import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { sql } from 'drizzle-orm';
import { indicateurValeurTable } from './indicateur-valeur.table';

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
  /** Transactions qui verrouillent toute la table : leurs verrous par période sont superflus. */
  private readonly transactionsLockingAllPeriodes = new WeakSet<Transaction>();

  async lock(valeurs: IndicateurValeurLock[], tx: Transaction): Promise<void> {
    if (this.transactionsLockingAllPeriodes.has(tx)) return;
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

  /**
   * Verrouille toutes les périodes de toutes les collectivités, pour un
   * recalcul de masse dans une seule transaction (import du catalogue).
   *
   * Les verrous consultatifs par période ne sont libérés qu'en fin de
   * transaction : sur des milliers de collectivités, ils saturent la table des
   * verrous de PostgreSQL (« out of shared memory »). Un verrou de table les
   * remplace : les lectures continuent, les écritures attendent la fin de la
   * transaction, et `lock` devient sans effet pour cette transaction.
   *
   * À appeler avant toute écriture de valeur dans la transaction : un verrou
   * consultatif déjà pris, combiné au verrou de table, exposerait à un
   * interblocage avec un écrivain concurrent.
   */
  async lockAllPeriodes(tx: Transaction): Promise<void> {
    if (this.transactionsLockingAllPeriodes.has(tx)) return;
    await tx.execute(
      sql`LOCK TABLE ${indicateurValeurTable} IN SHARE ROW EXCLUSIVE MODE`
    );
    this.transactionsLockingAllPeriodes.add(tx);
  }
}
