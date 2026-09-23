#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 2 : retire de TeT les dossiers que `index.ts` a écrits, et
 * seulement eux (D6). Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-demarches/annuler.ts [--confirm]
 */

import { PoolClient } from 'pg';
import { getCible } from '../db';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-annuler-demarches');
  const client = await pool.connect();

  try {
    await client.query('begin');
    try {
      await validateTranchesDependantesAnnulees(client);
      const retires = await deleteDossiersRepris(client);
      await client.query(isConfirmed ? 'commit' : 'rollback');

      console.log(
        `${retires.saisines} saisines retirées d'abord (ajoutées hors reprise, D6)`
      );
      console.log(`${retires.demarches} dossiers retirés`);
      console.log(`${retires.ecarts} écarts retirés`);
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

/** Refuse si une tranche qui s'accroche aux dossiers (3 à 8) a déjà écrit : l'annuler d'abord. */
const validateTranchesDependantesAnnulees = async (client: PoolClient) => {
  const { rows } = await client.query<{ tableCible: string }>(
    `select distinct table_cible as "tableCible"
       from reprise_tec.lignes_ecrites
      where table_cible <> 'demarche'`
  );
  if (rows.length > 0) {
    throw new Error(
      `Annulation refusée : des tranches qui dépendent des dossiers ont écrit (${rows
        .map((r) => r.tableCible)
        .join(', ')}). Les annuler d'abord.`
    );
  }
};

/**
 * Supprime les saisines des dossiers repris (la base refuse de supprimer un
 * dossier qui en a), puis les dossiers, puis leurs lignes de correspondance,
 * lignes_ecrites et ecarts.
 */
const deleteDossiersRepris = async (client: PoolClient) => {
  const repris = `select ligne_id from reprise_tec.lignes_ecrites
                   where table_cible = 'demarche'`;

  const saisines = await client.query(
    `delete from public.demarche_pcaet_demande_avis
      where demarche_id in (${repris})`
  );
  // La base supprime avec eux, en cascade, ce que les utilisateurs y ont ajouté depuis l'import.
  const demarches = await client.query(
    `delete from public.demarche where id in (${repris})`
  );
  await client.query(
    `delete from reprise_tec.correspondance where table_cible = 'demarche'`
  );
  await client.query(
    `delete from reprise_tec.lignes_ecrites where table_cible = 'demarche'`
  );
  const ecarts = await client.query(
    `delete from reprise_tec.ecarts where table_source = 'demarche'`
  );

  return {
    saisines: saisines.rowCount ?? 0,
    demarches: demarches.rowCount ?? 0,
    ecarts: ecarts.rowCount ?? 0,
  };
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
