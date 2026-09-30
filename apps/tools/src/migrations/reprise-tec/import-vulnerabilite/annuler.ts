#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 8 : retire de TeT les valeurs de vulnérabilité et les « Déchets » que `index.ts` a écrites, d'après les traces.
 * Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-vulnerabilite/annuler.ts [--confirm]
 */

import { PoolClient } from 'pg';
import { getCible } from '../db';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-annuler-vulnerabilite');
  const client = await pool.connect();

  try {
    await client.query('begin');
    try {
      const valeurs = await deleteValeurs(client);
      const dechets = await deleteThematiquesInutilisees(client);
      const ecarts = await deleteTraces(client);
      await client.query(isConfirmed ? 'commit' : 'rollback');

      console.log(
        `${valeurs} lignes de demarche_pcaet_vulnerabilite_valeur retirées`
      );
      console.log(
        `« Déchets » créées par l'import : ${dechets.retirees} retirées, ${dechets.gardees} gardées (rattachées à une autre démarche depuis)`
      );
      console.log(`${ecarts} écarts retirés`);
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

/** Supprime toutes les valeurs des démarches notées ; la table n'a pas d'id : une valeur saisie après l'import sur ces démarches part avec. */
const deleteValeurs = async (client: PoolClient) => {
  const { rowCount } = await client.query(
    `delete from public.demarche_pcaet_vulnerabilite_valeur
      where demarche_id in (select ligne_id from reprise_tec.lignes_ecrites
                             where table_cible = 'demarche_pcaet_vulnerabilite_valeur')`
  );
  return rowCount ?? 0;
};

/** Supprime les « Déchets » créées par l'import qu'aucune valeur ne vise plus ; celle qu'un autre dossier a reçue reste. */
const deleteThematiquesInutilisees = async (client: PoolClient) => {
  const { rows } = await client.query<{ retirees: number; gardees: number }>(
    `with creees as (
       select ligne_id as id from reprise_tec.lignes_ecrites
        where table_cible = 'demarche_pcaet_vulnerabilite_thematique'
     ), retirees as (
       delete from public.demarche_pcaet_vulnerabilite_thematique t
        where t.id in (select id from creees)
          and not exists (select from public.demarche_pcaet_vulnerabilite_valeur v
                           where v.thematique_id = t.id)
       returning t.id
     )
     select (select count(*) from retirees)::int as retirees,
            (select count(*) from creees)::int - (select count(*) from retirees)::int as gardees`
  );
  return rows[0];
};

/** Supprime les traces de l'étape (`lignes_ecrites`) et ses écarts. */
const deleteTraces = async (client: PoolClient) => {
  await client.query(
    `delete from reprise_tec.lignes_ecrites
      where table_cible in ('demarche_pcaet_vulnerabilite_thematique',
                            'demarche_pcaet_vulnerabilite_valeur')`
  );
  const { rowCount } = await client.query(
    `delete from reprise_tec.ecarts
      where table_source = 'demarche_domaine_vulnerabilite'`
  );
  return rowCount ?? 0;
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
