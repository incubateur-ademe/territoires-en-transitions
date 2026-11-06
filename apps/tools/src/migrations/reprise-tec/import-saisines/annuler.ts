#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 4 : retire de TeT les saisines que `index.ts` a écrites,
 * et seulement elles, d'après `lignes_ecrites`. Les dossiers ne sont pas
 * touchés. Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-saisines/annuler.ts [--confirm]
 */

import { PoolClient } from 'pg';
import { getCible } from '../db';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-annuler-saisines');
  const client = await pool.connect();

  try {
    await client.query('begin');
    try {
      await validateAvisRepris(client);
      const retires = await deleteSaisines(client);
      await client.query(isConfirmed ? 'commit' : 'rollback');

      console.log(`${retires.saisines} saisines retirées`);
      console.log(
        `${retires.avis} avis retirés avec leur saisine (déposés par un service depuis l'import)`
      );
      console.log(
        isConfirmed
          ? '\nAnnulation terminée.'
          : '\nSimulation : tout a été annulé. Relancer avec --confirm pour annuler.'
      );
    } catch (e) {
      await client.query('rollback');
      throw e;
    }
  } finally {
    client.release();
    await pool.end();
  }
};

/** Refuse si la reprise a écrit des avis : ils partiraient avec leurs saisines sans laisser de trace. */
const validateAvisRepris = async (client: PoolClient) => {
  const {
    rows: [{ avis }],
  } = await client.query<{ avis: number }>(
    `select count(*)::int as avis
       from reprise_tec.lignes_ecrites
      where table_cible = 'demarche_pcaet_avis'`
  );
  if (avis > 0) {
    throw new Error(
      `Annulation refusée : la reprise a écrit ${avis} avis sur ces saisines. Annuler d'abord leur import.`
    );
  }
};

/** Compte les avis déposés depuis l'import (ils partent avec leur saisine), puis supprime les saisines écrites et leurs traces. */
const deleteSaisines = async (client: PoolClient) => {
  const ecrites = `select ligne_id from reprise_tec.lignes_ecrites
                    where table_cible = 'demarche_pcaet_demande_avis'`;

  const {
    rows: [{ avis }],
  } = await client.query<{ avis: number }>(
    `select count(*)::int as avis
       from public.demarche_pcaet_avis
      where demande_avis_id in (${ecrites})`
  );
  const saisines = await client.query(
    `delete from public.demarche_pcaet_demande_avis where id in (${ecrites})`
  );
  await client.query(
    `delete from reprise_tec.lignes_ecrites
      where table_cible = 'demarche_pcaet_demande_avis'`
  );

  return { saisines: saisines.rowCount ?? 0, avis };
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
