/** Les fichiers des fiches, écrits par l'import des pièces des fiches avec le nom de stockage T&C : ils reçoivent l'empreinte de leurs octets. */

import { PoolClient } from 'pg';
import { keepModifieLe } from '../import-pieces-fiches/ecriture';
import { readContenus, type Contenu } from './archive';
import type { Depot } from './bibliotheque';

export type FichierDeFiche = {
  table: 'action_fichier' | 'action_image';
  tecId: number;
  chemin: string;
  nom: string;
  reference: string;
  collectiviteId: number;
  collectivite: string;
  bibliothequeId: number;
};

/** Lit les fichiers des fiches dont la ligne de bibliothèque porte encore le nom de stockage T&C, triés. */
export const loadFichiersDesFiches = async (client: PoolClient) => {
  const { rows } = await client.query<FichierDeFiche>(
    `with fiches as (
       select c.tec_id as action_id, f.collectivite_id, co.nom as collectivite
         from reprise_tec.correspondance c
         join public.fiche_action f on f.id = c.tet_id
         join public.collectivite co on co.id = f.collectivite_id
        where c.table_cible = 'fiche_action'
     ), fichiers as (
       select 'action_fichier' as "table", id, action_id, fichier, display_name, basename
         from reprise_tec.staging_action_fichier
       union all
       select 'action_image', id, action_id, fichier, display_name, basename
         from reprise_tec.staging_action_image
     )
     select p."table", p.id::int as "tecId", p.fichier as chemin,
            p.display_name as nom, p.basename as reference,
            f.collectivite_id as "collectiviteId", f.collectivite,
            b.id as "bibliothequeId"
       from fichiers p
       join fiches f using (action_id)
       join labellisation.bibliotheque_fichier b
         on b.collectivite_id = f.collectivite_id and b.hash = p.basename
      where b.id in (select ligne_id from reprise_tec.lignes_ecrites
                      where table_cible = 'bibliotheque_fichier')
      order by 1, 2`
  );
  return rows;
};

/** Lit les octets de chaque fichier de fiche dans l'archive ; les numéros T&C se répètent d'une table à l'autre. */
export const readContenusDesFiches = async (
  archive: string,
  fichiers: readonly FichierDeFiche[]
) => {
  const contenus = new Map<string, Contenu>();
  for (const table of ['action_fichier', 'action_image'] as const) {
    const deLaTable = fichiers.filter((f) => f.table === table);
    const lus = await readContenus(archive, deLaTable);
    for (const f of deLaTable) {
      const contenu = lus.get(f.tecId);
      if (contenu) {
        contenus.set(toCle(f), contenu);
      }
    }
  }
  return contenus;
};

/** Un fichier de fiche se dépose dans le bucket de sa collectivité. */
export const toDepots = (
  fichiers: readonly FichierDeFiche[],
  contenus: ReadonlyMap<string, Contenu>
): Depot[] =>
  fichiers.flatMap((f) => {
    const contenu = contenus.get(toCle(f));
    return contenu
      ? [
          {
            collectiviteId: f.collectiviteId,
            fichier: f,
            contenu,
            confidentiel: false,
          },
        ]
      : [];
  });

export const toCle = (f: Pick<FichierDeFiche, 'table' | 'tecId'>) =>
  `${f.table}|${f.tecId}`;

/** Donne à chaque ligne son empreinte, ou pointe l'annexe vers la ligne de même contenu ; « Modifié le » des fiches gardé. */
export const updateFichiersDesFiches = async (
  client: PoolClient,
  fichiers: readonly FichierDeFiche[],
  contenus: ReadonlyMap<string, Contenu>
) => {
  const avecContenu = fichiers.flatMap((f) => {
    const contenu = contenus.get(toCle(f));
    return contenu ? [{ ...f, empreinte: contenu.empreinte }] : [];
  });
  const { rows: existantes } = await client.query<{
    collectiviteId: number;
    hash: string;
    id: number;
  }>(
    `select b.collectivite_id as "collectiviteId", b.hash, b.id
       from labellisation.bibliotheque_fichier b
       join unnest($1::int[], $2::text[]) as v(collectivite_id, hash)
         using (collectivite_id, hash)`,
    [
      avecContenu.map((f) => f.collectiviteId),
      avecContenu.map((f) => f.empreinte),
    ]
  );
  const ids = new Map(
    existantes.map((e) => [`${e.collectiviteId}|${e.hash}`, e.id])
  );
  const parcours = avecContenu.map((f) => ({
    ...f,
    existante: ids.get(`${f.collectiviteId}|${f.empreinte}`),
  }));
  const fondus = parcours.filter((f) => f.existante !== undefined);
  const misAJour = parcours.filter((f) => f.existante === undefined);

  const { rows: annexes } = await client.query<{ ficheId: number }>(
    `select fiche_id as "ficheId" from public.annexe where fichier_id = any($1)`,
    [fondus.map((f) => f.bibliothequeId)]
  );
  await keepModifieLe(
    client,
    annexes.map((a) => a.ficheId),
    () =>
      client.query(
        `update public.annexe a set fichier_id = v.existante
           from unnest($1::int[], $2::int[]) as v(heritee, existante)
          where a.fichier_id = v.heritee`,
        [fondus.map((f) => f.bibliothequeId), fondus.map((f) => f.existante)]
      )
  );
  await client.query(
    `with retirees as (
       delete from labellisation.bibliotheque_fichier where id = any($1)
     )
     delete from reprise_tec.lignes_ecrites
      where table_cible = 'bibliotheque_fichier' and ligne_id = any($1)`,
    [fondus.map((f) => f.bibliothequeId)]
  );
  await client.query(
    `update labellisation.bibliotheque_fichier b set hash = v.hash
       from unnest($1::int[], $2::text[]) as v(id, hash)
      where b.id = v.id`,
    [misAJour.map((f) => f.bibliothequeId), misAJour.map((f) => f.empreinte)]
  );
  await client.query(
    `insert into reprise_tec.correspondance (table_cible, tec_id, tet_id)
     select * from unnest($1::text[], $2::bigint[], $3::bigint[])`,
    [
      parcours.map((f) => f.table),
      parcours.map((f) => f.tecId),
      parcours.map((f) => f.existante ?? f.bibliothequeId),
    ]
  );
  return {
    misAJour,
    fondus,
    sansFichier: fichiers.length - avecContenu.length,
  };
};

/** Garde, appelée par `gardes.ts` : l'import des pièces des fiches n'a pas tourné. */
export const listCasBloquantsFichiersDesFiches = async (client: PoolClient) => {
  const {
    rows: [{ lignes }],
  } = await client.query<{ lignes: number }>(
    `select count(*)::int as lignes from reprise_tec.lignes_ecrites
      where table_cible = 'annexe'`
  );
  return lignes === 0
    ? [
        "  aucune annexe reprise : l'import des pièces des fiches (import-pieces-fiches) n'a pas tourné",
      ]
    : [];
};
