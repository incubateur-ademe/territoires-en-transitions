#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 7 : retire ce que `index.ts` a écrit, d'après `lignes_ecrites`, puis les fichiers du stockage que plus rien ne référence.
 * Simulation par défaut (rien n'est retiré du stockage), `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL=… SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-pieces-dossiers/annuler.ts [--confirm]
 */

import { PoolClient } from 'pg';
import { getCible } from '../db';
import { keepModifieLe } from '../import-pieces-fiches/ecriture';
import { TRACE_BIBLIOTHEQUE } from './bibliotheque';
import { getStockage } from './stockage';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const pool = getCible('reprise-tec-annuler-pieces-dossiers');
  const client = await pool.connect();

  try {
    await client.query('begin');
    let comptes;
    try {
      const avis = await deleteAvis(client);
      const documents = await deleteDocuments(client);
      const fichiersDesFiches = await restoreFichiersDesFiches(client);
      const bibliotheque = await deleteFichiersInutilises(client);
      const ecarts = await client.query(
        `delete from reprise_tec.ecarts where table_source = 'demarche_fichier'`
      );
      const objets = await listObjetsInutilises(client);
      await client.query(isConfirmed ? 'commit' : 'rollback');
      comptes = {
        avis,
        documents,
        fichiersDesFiches,
        bibliotheque,
        ecarts: ecarts.rowCount ?? 0,
        objets,
      };
    } catch (e) {
      await client.query('rollback');
      throw e;
    }

    // Après la transaction : un objet retiré avant un échec manquerait à une ligne restée en base.
    const retires = isConfirmed ? await deleteObjets(comptes.objets) : 0;

    console.log(
      `${comptes.avis.retires} avis retirés, dont ${comptes.avis.modifies} modifiés depuis l'import`
    );
    console.log(
      `${comptes.documents.cases} pièces en case (inclusions comprises), ${comptes.documents.additionnels} documents additionnels retirés`
    );
    console.log(
      `Fichiers des fiches : ${comptes.fichiersDesFiches.remis} reprennent leur nom de stockage T&C, ${comptes.fichiersDesFiches.recrees} retrouvent leur propre ligne`
    );
    console.log(
      `Bibliothèque : ${comptes.bibliotheque.retirees} lignes retirées, ${comptes.bibliotheque.gardees} gardées (un autre document y pointe)`
    );
    console.log(`${comptes.ecarts} écarts retirés`);
    console.log(
      isConfirmed
        ? `Stockage : ${retires} fichiers retirés`
        : `Stockage : ${comptes.objets.length} fichiers à retirer (simulation, rien retiré)`
    );
    console.log(
      isConfirmed
        ? '\nAnnulation terminée.'
        : '\nSimulation : tout a été annulé. Relancer avec --confirm pour annuler.'
    );
  } finally {
    client.release();
    await pool.end();
  }
};

/** Supprime les avis écrits par l'import (repérés par leur saisine), et leur trace. */
const deleteAvis = async (client: PoolClient) => {
  const { rows } = await client.query<{ modifie: boolean }>(
    `delete from public.demarche_pcaet_avis
      where demande_avis_id in (select ligne_id from reprise_tec.lignes_ecrites
                                 where table_cible = 'demarche_pcaet_avis')
      returning modifie_le is not null as modifie`
  );
  await client.query(
    `delete from reprise_tec.lignes_ecrites where table_cible = 'demarche_pcaet_avis'`
  );
  return {
    retires: rows.length,
    modifies: rows.filter((r) => r.modifie).length,
  };
};

/** Supprime les pièces écrites par l'import, en case et en documents additionnels, et leur trace. */
const deleteDocuments = async (client: PoolClient) => {
  const supprimer = async (table: string) => {
    const { rowCount } = await client.query(
      `delete from public.${table}
        where id in (select ligne_id from reprise_tec.lignes_ecrites
                      where table_cible = $1)`,
      [table]
    );
    await client.query(
      `delete from reprise_tec.lignes_ecrites where table_cible = $1`,
      [table]
    );
    return rowCount ?? 0;
  };
  return {
    cases: await supprimer('demarche_document'),
    additionnels: await supprimer('demarche_document_additional'),
  };
};

/** Remet aux fichiers des fiches leur nom T&C ; celui qui avait rejoint une pièce de dossier retrouve sa ligne et son annexe. */
const restoreFichiersDesFiches = async (client: PoolClient) => {
  const { rows } = await client.query<{
    bibliothequeId: number;
    collectiviteId: number;
    reference: string;
    nom: string;
    ficheId: number;
    estSaLigne: boolean;
  }>(
    `with fichiers as (
       select 'action_fichier' as t, id, action_id, basename, display_name
         from reprise_tec.staging_action_fichier
       union all
       select 'action_image', id, action_id, basename, display_name
         from reprise_tec.staging_action_image
     )
     select c.tet_id::int as "bibliothequeId", b.collectivite_id as "collectiviteId",
            f.basename as reference, f.display_name as nom,
            fa.tet_id::int as "ficheId",
            c.tet_id in (select ligne_id from reprise_tec.lignes_ecrites
                          where table_cible = 'bibliotheque_fichier') as "estSaLigne"
       from reprise_tec.correspondance c
       join fichiers f on f.t = c.table_cible and f.id = c.tec_id
       join labellisation.bibliotheque_fichier b on b.id = c.tet_id
       join reprise_tec.correspondance fa
         on fa.table_cible = 'fiche_action' and fa.tec_id = f.action_id
      where c.table_cible in ('action_fichier', 'action_image')`
  );
  const remis = rows.filter((r) => r.estSaLigne);
  const recrees = rows.filter((r) => !r.estSaLigne);

  await client.query(
    `update labellisation.bibliotheque_fichier b set hash = v.hash
       from unnest($1::int[], $2::text[]) as v(id, hash)
      where b.id = v.id`,
    [remis.map((r) => r.bibliothequeId), remis.map((r) => r.reference)]
  );
  await keepModifieLe(
    client,
    recrees.map((r) => r.ficheId),
    () =>
      client.query(
        `with lignes as (
           insert into labellisation.bibliotheque_fichier
             (collectivite_id, hash, filename, confidentiel)
           select collectivite_id, hash, filename, false
             from unnest($1::int[], $2::text[], $3::text[])
                    as v(collectivite_id, hash, filename)
           returning id, collectivite_id, hash
         ), trace as (
           insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
           select 'bibliotheque_fichier', id from lignes
         )
         update public.annexe a set fichier_id = l.id
           from unnest($1::int[], $2::text[], $4::int[], $5::int[])
                  as v(collectivite_id, hash, fiche_id, partagee)
           join lignes l using (collectivite_id, hash)
          where a.fiche_id = v.fiche_id and a.fichier_id = v.partagee
            and a.id in (select ligne_id from reprise_tec.lignes_ecrites
                          where table_cible = 'annexe')`,
        [
          recrees.map((r) => r.collectiviteId),
          recrees.map((r) => r.reference),
          recrees.map((r) => r.nom),
          recrees.map((r) => r.ficheId),
          recrees.map((r) => r.bibliothequeId),
        ]
      )
  );
  await client.query(
    `delete from reprise_tec.correspondance
      where table_cible in ('action_fichier', 'action_image')`
  );
  return { remis: remis.length, recrees: recrees.length };
};

/** Supprime les lignes de bibliothèque créées par l'import auxquelles plus aucun document ni avis ne pointe, et leur trace. */
const deleteFichiersInutilises = async (client: PoolClient) => {
  const { rows } = await client.query<{ retirees: number; gardees: number }>(
    `with creees as (
       select ligne_id as id from reprise_tec.lignes_ecrites where table_cible = $1
     ), retirees as (
       delete from labellisation.bibliotheque_fichier b
        where b.id in (select id from creees)
          and not exists (select from public.annexe where fichier_id = b.id)
          and not exists (select from labellisation.preuve_base where fichier_id = b.id)
          and not exists (select from public.demarche_document where fichier_id = b.id)
          and not exists (select from public.demarche_document_additional where fichier_id = b.id)
          and not exists (select from public.plan_report_generation where file_id = b.id)
          and not exists (select from public.demarche_pcaet_avis
                           where emetteur_collectivite_id = b.collectivite_id
                             and fichier_ref = b.hash)
       returning id
     ), trace as (
       delete from reprise_tec.lignes_ecrites where table_cible = $1
     )
     select (select count(*) from retirees)::int as retirees,
            (select count(*) from creees)::int - (select count(*) from retirees)::int as gardees`,
    [TRACE_BIBLIOTHEQUE]
  );
  return rows[0];
};

/** Les fichiers du stockage des collectivités touchées par la reprise qu'aucune ligne de bibliothèque ne référence plus. */
const listObjetsInutilises = async (client: PoolClient) => {
  const { rows } = await client.query<{ bucket: string; nom: string }>(
    `with touchees as (
       select d.collectivite_id from reprise_tec.correspondance c
         join public.demarche d on d.id = c.tet_id where c.table_cible = 'demarche'
       union
       select f.collectivite_id from reprise_tec.correspondance c
         join public.fiche_action f on f.id = c.tet_id where c.table_cible = 'fiche_action'
       union
       select instructeur_collectivite_id from public.demarche_pcaet_demande_avis
        where id in (select ligne_id from reprise_tec.lignes_ecrites
                      where table_cible = 'demarche_pcaet_demande_avis')
     )
     select o.bucket_id as bucket, o.name as nom
       from storage.objects o
       join public.collectivite_bucket cb on cb.bucket_id = o.bucket_id
      where cb.collectivite_id in (select collectivite_id from touchees)
        and o.name ~ '^[0-9a-f]{64}$'
        and not exists (select from labellisation.bibliotheque_fichier b
                         where b.collectivite_id = cb.collectivite_id
                           and b.hash = o.name)
      order by 1, 2`
  );
  return rows;
};

/** Retire les fichiers du stockage par l'API, comme le produit, par paquets d'un bucket. */
const deleteObjets = async (objets: { bucket: string; nom: string }[]) => {
  const stockage = getStockage();
  const parBucket = new Map<string, string[]>();
  for (const o of objets) {
    parBucket.set(o.bucket, [...(parBucket.get(o.bucket) ?? []), o.nom]);
  }
  let retires = 0;
  for (const [bucket, noms] of parBucket) {
    for (let debut = 0; debut < noms.length; debut += 1000) {
      const { data, error } = await stockage.storage
        .from(bucket)
        .remove(noms.slice(debut, debut + 1000));
      if (error) {
        throw new Error(
          `Retrait du stockage refusé (bucket ${bucket}) : ${error.message}`
        );
      }
      retires += data.length;
    }
  }
  return retires;
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
