/** Les fichiers déposés sur les dossiers repris, sur la ligne reprise et sur son doublon « définitif ». */

import { PoolClient } from 'pg';

export type Fichier = {
  tecId: number;
  dossierTecId: number;
  demarcheId: number;
  collectiviteId: number;
  collectivite: string;
  siren: string | null;
  typeFichierId: number;
  chemin: string;
  reference: string;
  nom: string;
  transmisLe: string | null;
  publieLe: string | null;
  envoiDreal: string | null;
  envoiCr: string | null;
};

/** Lit les fichiers des dossiers repris, triés par numéro T&C : deux runs écrivent dans le même ordre. */
export const loadFichiers = async (client: PoolClient) => {
  const { rows } = await client.query<Fichier>(
    `with repris as (
       select c.tec_id as dossier_tec_id, d.id as demarche_id,
              d.collectivite_id, co.nom as collectivite,
              lpad(co.siren, 9, '0') as siren,
              d.transmitted_at::text as transmis_le,
              d.published_at::text as publie_le,
              s.date_envoi_avis_dreal::text as envoi_dreal,
              s.date_envoi_avis_cr::text as envoi_cr,
              s.pcaet_definitif
         from reprise_tec.correspondance c
         join public.demarche d on d.id = c.tet_id
         join public.collectivite co on co.id = d.collectivite_id
         join reprise_tec.staging_demarche s on s.id = c.tec_id
        where c.table_cible = 'demarche'
     ), dossiers as (
       select dossier_tec_id as tec_id, * from repris
       union all
       select pcaet_definitif, * from repris where pcaet_definitif is not null
     )
     select f.id::int as "tecId", d.dossier_tec_id::int as "dossierTecId",
            d.demarche_id as "demarcheId", d.collectivite_id as "collectiviteId",
            d.collectivite, d.siren, f.type_fichier_id::int as "typeFichierId",
            f.fichier as chemin, f.basename as reference, f.display_name as nom,
            d.transmis_le as "transmisLe", d.publie_le as "publieLe",
            d.envoi_dreal as "envoiDreal", d.envoi_cr as "envoiCr"
       from reprise_tec.staging_demarche_fichier f
       join dossiers d on d.tec_id = f.demarche_id
      order by f.id`
  );
  return rows;
};

/** Garde, appelée par `gardes.ts` : l'import des dossiers ou celui des saisines n'a pas tourné. */
export const listCasBloquantsDossiers = async (client: PoolClient) => {
  const {
    rows: [etat],
  } = await client.query<{ dossiers: number; saisines: number }>(
    `select (select count(*) from reprise_tec.correspondance
              where table_cible = 'demarche')::int as dossiers,
            (select count(*) from reprise_tec.lignes_ecrites
              where table_cible = 'demarche_pcaet_demande_avis')::int as saisines`
  );
  return [
    ...(etat.dossiers === 0
      ? [
          "  aucun dossier repris : l'import des dossiers (import-demarches) n'a pas tourné",
        ]
      : []),
    ...(etat.saisines === 0
      ? [
          "  aucune saisine reprise : l'import des saisines (import-saisines) n'a pas tourné",
        ]
      : []),
  ];
};
