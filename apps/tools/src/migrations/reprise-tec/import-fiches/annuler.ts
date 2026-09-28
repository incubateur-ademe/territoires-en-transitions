#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 5 : retire de TeT les plans et les fiches que `index.ts` a écrits, et seulement eux, d'après `lignes_ecrites`.
 * Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-fiches/annuler.ts [--confirm]
 */

import { PoolClient } from 'pg';
import { getCible } from '../db';

// Les tables que les étapes suivantes écrivent sur les fiches : pièces jointes, pilotes.
const TABLES_DES_ETAPES_SUIVANTES = ['annexe', 'fiche_action_pilote'];

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-annuler-fiches');
  const client = await pool.connect();

  try {
    await client.query('begin');
    try {
      await validateEtapesSuivantesAnnulees(client);
      const retires = await deleteFiches(client);
      await client.query(isConfirmed ? 'commit' : 'rollback');

      console.log(
        `${retires.fiches} fiches retirées, avec leurs liens et leurs ${retires.notes} notes`
      );
      console.log(
        `  dont ${retires.fichesModifiees} modifiées depuis l'import : ces changements partent avec elles`
      );
      console.log(`${retires.historique} lignes d'historique retirées`);
      console.log(`${retires.plans} plans retirés, avec leur lien au dossier`);
      console.log(
        `Tags créés par l'import : ${retires.tagsRetires} retirés, ${retires.tagsGardes} gardés (portés par une autre fiche)`
      );
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

/** Refuse si les étapes des pièces ou des contacts ont écrit sur les fiches : les annuler d'abord. */
const validateEtapesSuivantesAnnulees = async (client: PoolClient) => {
  const { rows } = await client.query<{ tableCible: string }>(
    `select distinct table_cible as "tableCible"
       from reprise_tec.lignes_ecrites
      where table_cible = any($1)`,
    [TABLES_DES_ETAPES_SUIVANTES]
  );
  if (rows.length > 0) {
    throw new Error(
      `Annulation refusée : les étapes suivantes ont écrit sur les fiches (${rows
        .map((r) => r.tableCible)
        .join(', ')}). Les annuler d'abord.`
    );
  }
};

/**
 * Supprime les fiches (le trigger de TeT retire leurs liens), puis l'historique que leur écriture et leur suppression ont laissé, puis les plans et les tags créés restés sans fiche.
 * L'historique se retire après les fiches : leur suppression y écrit encore une ligne.
 */
const deleteFiches = async (client: PoolClient) => {
  const ecrites = (table: string) =>
    `select ligne_id from reprise_tec.lignes_ecrites where table_cible = '${table}'`;

  const {
    rows: [avant],
  } = await client.query<{ notes: number; fichesModifiees: number }>(
    `select (select count(*) from public.fiche_action_note
              where fiche_id in (${ecrites('fiche_action')}))::int as notes,
            (select count(*) from public.fiche_action
              where id in (${ecrites('fiche_action')})
                and modified_at <> created_at)::int as "fichesModifiees"`
  );
  const fiches = await client.query(
    `delete from public.fiche_action where id in (${ecrites('fiche_action')})`
  );
  const historique = await client.query(
    `delete from historique.fiche_action where fiche_id in (${ecrites(
      'fiche_action'
    )})`
  );
  const plans = await client.query(
    `delete from public.axe where id in (${ecrites('axe')})`
  );
  const tags = await deleteTagsSansFiche(client);

  await client.query(
    `delete from reprise_tec.correspondance where table_cible in ('axe', 'fiche_action')`
  );
  await client.query(
    `delete from reprise_tec.lignes_ecrites
      where table_cible in ('axe', 'demarche_plan_action', 'fiche_action',
                            'fiche_action_note', 'structure_tag', 'libre_tag')`
  );
  const ecarts = await client.query(
    `delete from reprise_tec.ecarts where table_source like 'action%'`
  );

  return {
    fiches: fiches.rowCount ?? 0,
    notes: avant.notes,
    fichesModifiees: avant.fichesModifiees,
    historique: historique.rowCount ?? 0,
    plans: plans.rowCount ?? 0,
    ...tags,
    ecarts: ecarts.rowCount ?? 0,
  };
};

/** Supprime les tags créés par l'import que plus aucune fiche ne porte ; ceux qu'une fiche de la collectivité a pris depuis restent. */
const deleteTagsSansFiche = async (client: PoolClient) => {
  let tagsRetires = 0;
  let tagsGardes = 0;
  for (const [table, lien, colonne] of [
    ['structure_tag', 'fiche_action_structure_tag', 'structure_tag_id'],
    ['libre_tag', 'fiche_action_libre_tag', 'libre_tag_id'],
  ]) {
    const { rows } = await client.query<{ retires: number; gardes: number }>(
      `with crees as (
         select ligne_id as id from reprise_tec.lignes_ecrites where table_cible = $1
       ), retires as (
         delete from public.${table}
          where id in (select id from crees)
            and not exists (select from public.${lien} l where l.${colonne} = ${table}.id)
         returning id
       )
       select (select count(*) from retires)::int as retires,
              (select count(*) from crees)::int - (select count(*) from retires)::int as gardes`,
      [table]
    );
    tagsRetires += rows[0].retires;
    tagsGardes += rows[0].gardes;
  }
  return { tagsRetires, tagsGardes };
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
