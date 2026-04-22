import { and, SQL } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { Scope } from './scope';

export type PolicyMode = 'read' | 'write';

export type PolicyInput<Table extends PgTable> = {
  table: Table;
  scope: Scope;
};

/**
 * Retour d'une clause de policy :
 * - `undefined` : bypass, aucun filtre à ajouter
 * - `SQL` : clause à composer en `and(...)` avec le where métier
 *   (convention : `sql\`1 = 0\`` pour un refus total)
 */
export type AccessPolicy<Table extends PgTable> = {
  read: (input: PolicyInput<Table>) => SQL | undefined;
  write: (input: PolicyInput<Table>) => SQL | undefined;
};

export function applyPolicyWhere<Table extends PgTable>({
  policy,
  mode,
  table,
  scope,
  where,
}: {
  policy: AccessPolicy<Table>;
  mode: PolicyMode;
  table: Table;
  scope: Scope;
  where: SQL | undefined;
}): SQL | undefined {
  const policyClause = policy[mode]({ table, scope });
  if (policyClause === undefined) {
    return where;
  }
  if (where === undefined) {
    return policyClause;
  }
  return and(policyClause, where);
}
