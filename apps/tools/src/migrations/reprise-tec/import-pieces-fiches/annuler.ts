#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 6 : retire de TeT les annexes et les lignes de bibliothèque que `index.ts` a écrites, et seulement elles, d'après `lignes_ecrites`.
 * Simulation par défaut, `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL="postgresql://..." pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-pieces-fiches/annuler.ts [--confirm]
 */

import { PoolClient } from 'pg';
import { getCible } from '../db';
import { COMPTE_TERRITOIRES_CLIMAT, keepModifieLe } from './ecriture';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-annuler-pieces-fiches');
  const client = await pool.connect();

  try {
    await validatePiecesDesDossiersAnnulees(client);
    await client.query('begin');
    try {
      const annexes = await deleteAnnexes(client);
      const bibliotheque = await deleteFichiersInutilises(client);
      const ecarts = await client.query(
        `delete from reprise_tec.ecarts
          where table_source in ('action_fichier', 'action_image')
             or (table_source = 'action' and precision = 'url_site_web')`
      );
      await client.query(isConfirmed ? 'commit' : 'rollback');

      console.log(
        `${annexes.retirees} annexes retirées, sur ${annexes.fiches} fiches dont « Modifié le » est remis tel qu'il était`
      );
      console.log(
        `  dont ${annexes.modifiees} modifiées depuis l'import : ces changements partent avec elles`
      );
      console.log(
        `Bibliothèque : ${bibliotheque.retirees} lignes retirées, ${bibliotheque.gardees} gardées (un autre document y pointe)`
      );
      console.log(`${ecarts.rowCount ?? 0} écarts retirés`);
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

/** Refuse si l'import des pièces des dossiers a écrit : il a donné leur empreinte aux fichiers des fiches, l'annuler d'abord. */
const validatePiecesDesDossiersAnnulees = async (client: PoolClient) => {
  const {
    rows: [{ lignes }],
  } = await client.query<{ lignes: number }>(
    `select count(*)::int as lignes from reprise_tec.correspondance
      where table_cible in ('action_fichier', 'action_image')`
  );
  if (lignes > 0) {
    throw new Error(
      `Annulation refusée : l'import des pièces des dossiers a donné leur empreinte à ${lignes} fichiers des fiches. L'annuler d'abord.`
    );
  }
};

/** Supprime les annexes écrites par l'import, en remettant « Modifié le » de leurs fiches, et leur trace. */
const deleteAnnexes = async (client: PoolClient) => {
  const { rows } = await client.query<{ ficheId: number; modifiee: boolean }>(
    `select fiche_id as "ficheId", modified_by <> $1 as modifiee
       from public.annexe
      where id in (select ligne_id from reprise_tec.lignes_ecrites
                    where table_cible = 'annexe')`,
    [COMPTE_TERRITOIRES_CLIMAT]
  );
  const ficheIds = rows.map((r) => r.ficheId);
  await keepModifieLe(client, ficheIds, () =>
    client.query(
      `delete from public.annexe
        where id in (select ligne_id from reprise_tec.lignes_ecrites
                      where table_cible = 'annexe')`
    )
  );
  await client.query(
    `delete from reprise_tec.lignes_ecrites where table_cible = 'annexe'`
  );
  return {
    retirees: rows.length,
    fiches: new Set(ficheIds).size,
    modifiees: rows.filter((r) => r.modifiee).length,
  };
};

/** Supprime les lignes de bibliothèque créées par l'import auxquelles plus aucun document ne pointe, et leur trace. */
const deleteFichiersInutilises = async (client: PoolClient) => {
  const { rows } = await client.query<{ retirees: number; gardees: number }>(
    `with creees as (
       select ligne_id as id from reprise_tec.lignes_ecrites
        where table_cible = 'bibliotheque_fichier'
     ), retirees as (
       delete from labellisation.bibliotheque_fichier b
        where b.id in (select id from creees)
          and not exists (select from public.annexe where fichier_id = b.id)
          and not exists (select from labellisation.preuve_base where fichier_id = b.id)
          and not exists (select from public.demarche_document where fichier_id = b.id)
          and not exists (select from public.demarche_document_additional where fichier_id = b.id)
          and not exists (select from public.plan_report_generation where file_id = b.id)
       returning id
     ), trace as (
       delete from reprise_tec.lignes_ecrites where table_cible = 'bibliotheque_fichier'
     )
     select (select count(*) from retirees)::int as retirees,
            (select count(*) from creees)::int - (select count(*) from retirees)::int as gardees`
  );
  return rows[0];
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
