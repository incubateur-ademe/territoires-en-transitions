#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 7 : retire de TeT les pilotes et les personne_tag que `index.ts` a écrits, et seulement eux, d'après les traces.
 * Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-pilotes/annuler.ts [--confirm]
 */

import { PoolClient } from 'pg';
import { getCible } from '../db';

// Une invitation vise un personne_tag sans clé étrangère.
const REFERENCES_SANS_CLE = [
  { table: 'utilisateur.invitation_personne_tag', colonne: 'tag_id' },
];

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-annuler-pilotes');
  const client = await pool.connect();

  try {
    await client.query('begin');
    try {
      const pilotes = await deletePilotes(client);
      const personneTags = await deletePersonneTagsInutilises(client);
      const ecarts = await deleteTraces(client);
      await client.query(isConfirmed ? 'commit' : 'rollback');

      console.log(
        `${pilotes.dossiers} pilotes de dossier et ${pilotes.fiches} pilotes de fiche retirés`
      );
      console.log(
        `personne_tag créés par l'import : ${personneTags.retires} retirés, ${personneTags.gardes} gardés (utilisés ailleurs depuis)`
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

/**
 * Supprime les pilotes des démarches et fiches notées par l'import dont le personne_tag est noté dans `correspondance`.
 * Les tables de pilotes n'ont pas d'id : un pilote identique ajouté à la main après l'import part avec.
 */
const deletePilotes = async (client: PoolClient) => {
  const personneTags = `select tet_id from reprise_tec.correspondance where table_cible = 'personne_tag'`;
  const ecrites = (table: string) =>
    `select ligne_id from reprise_tec.lignes_ecrites where table_cible = '${table}'`;

  const dossiers = await client.query(
    `delete from public.demarche_pilote
      where demarche_id in (${ecrites('demarche_pilote')})
        and tag_id in (${personneTags})`
  );
  const fiches = await client.query(
    `delete from public.fiche_action_pilote
      where fiche_id in (${ecrites('fiche_action_pilote')})
        and tag_id in (${personneTags})`
  );
  return { dossiers: dossiers.rowCount ?? 0, fiches: fiches.rowCount ?? 0 };
};

/**
 * Supprime les personne_tag créés par l'import que plus rien n'utilise ; ceux qui servent encore restent.
 * Les usages se lisent sur les clés étrangères vers `personne_tag`, lues dans la base, plus l'invitation, qui le vise sans clé.
 */
const deletePersonneTagsInutilises = async (client: PoolClient) => {
  const { rows: cles } = await client.query<{
    table: string;
    colonne: string;
  }>(
    `select c.conrelid::regclass::text as "table", a.attname as colonne
       from pg_constraint c
       join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
      where c.contype = 'f' and c.confrelid = 'public.personne_tag'::regclass
      order by 1`
  );
  const usages = [...cles, ...REFERENCES_SANS_CLE]
    .map(
      ({ table, colonne }) =>
        `and not exists (select from ${table} u where u.${colonne} = p.id)`
    )
    .join('\n          ');

  const { rows } = await client.query<{ retires: number; gardes: number }>(
    `with crees as (
       select ligne_id as id from reprise_tec.lignes_ecrites where table_cible = 'personne_tag'
     ), retires as (
       delete from public.personne_tag p
        where p.id in (select id from crees)
          ${usages}
       returning p.id
     )
     select (select count(*) from retires)::int as retires,
            (select count(*) from crees)::int - (select count(*) from retires)::int as gardes`
  );
  return rows[0];
};

/** Supprime les traces de l'étape (`lignes_ecrites`, `correspondance`) et ses écarts. */
const deleteTraces = async (client: PoolClient) => {
  await client.query(
    `delete from reprise_tec.lignes_ecrites
      where table_cible in ('personne_tag', 'demarche_pilote', 'fiche_action_pilote')`
  );
  await client.query(
    `delete from reprise_tec.correspondance where table_cible = 'personne_tag'`
  );
  const ecarts = await client.query(
    `delete from reprise_tec.ecarts
      where table_source in ('utilisateur', 'demarche_utilisateur', 'action_contact',
                             'demarche_historique', 'organisation_regionale')
         or (table_source = 'demarche' and precision = 'elu_referent')`
  );
  return ecarts.rowCount ?? 0;
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
