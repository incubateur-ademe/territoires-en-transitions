/**
 * Validation d'une requête SQL proposée par un modèle avant exécution sur la
 * base analytique. C'est une défense en profondeur : la vraie garde est le
 * rôle Postgres en lecture seule. Portée de `validate_select_sql` du dashboard
 * de Baptiste (BaptisteTCS/dashboard_tet, utils/ai_workspace.py).
 */
export type ValidatedSql =
  | { ok: true; sql: string }
  | { ok: false; reason: string };

// Commandes d'écriture, puis fonctions qui modifient la session (et donc
// contournent `default_transaction_read_only` ou `statement_timeout` posés sur
// la connexion poolée), prennent des verrous de session, dorment, ou lisent le
// système de fichiers du serveur.
const FORBIDDEN_KEYWORDS =
  /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|set_config|setval|pg_sleep\w*|pg_terminate_backend|pg_cancel_backend|pg_reload_conf|pg_(?:try_)?advisory_\w+|pg_notify|pg_read_\w+|pg_ls_\w+|pg_stat_file|pg_logdir_ls|lo_\w+|dblink\w*)\b/i;

const CATALOG_TABLES = /\b(information_schema|pg_catalog)\b/i;

export function validateSelectSql(rawSql: string): ValidatedSql {
  let sql = rawSql.trim();
  if (!sql) {
    return { ok: false, reason: 'Requête SQL vide.' };
  }

  if (sql.startsWith('```')) {
    sql = sql.replace(/^```[a-zA-Z]*/, '');
    if (sql.endsWith('```')) {
      sql = sql.slice(0, -3);
    }
    sql = sql.trim();
  }

  sql = sql.replace(/;+\s*$/, '').trim();

  if (sql.includes(';')) {
    return {
      ok: false,
      reason:
        'Plusieurs instructions SQL détectées : une seule requête SELECT est autorisée.',
    };
  }

  if (!/^(select|with)\b/i.test(sql)) {
    return {
      ok: false,
      reason:
        'Seules les requêtes SELECT (ou WITH ... SELECT) sont autorisées.',
    };
  }

  const forbidden = sql.match(FORBIDDEN_KEYWORDS);
  if (forbidden) {
    return {
      ok: false,
      reason: `Requête refusée : commande non autorisée (${forbidden[1].toUpperCase()}).`,
    };
  }

  if (CATALOG_TABLES.test(sql)) {
    return {
      ok: false,
      reason:
        "N'interroge pas information_schema ni pg_catalog : utilise les outils list_tables et describe_table.",
    };
  }

  return { ok: true, sql };
}
