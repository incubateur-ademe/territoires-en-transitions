/** Les pièces, images et « site web » des actions reprises en fiches ; ceux des dossiers ne sont pas lus. */

import { PoolClient } from 'pg';

export type Fichier = {
  table: 'action_fichier' | 'action_image';
  tecId: number;
  ficheId: number;
  collectiviteId: number;
  // la date de création de l'action dans T&C
  creeeLe: string;
  // le nom de stockage dans T&C
  reference: string;
  nom: string;
};

export type UrlSiteWeb = {
  tecId: number;
  ficheId: number;
  collectiviteId: number;
  creeeLe: string;
  // telle que saisie dans T&C, sans les espaces autour
  adresse: string;
};

/** Lit les pièces, les images et les « site web » des actions reprises, avec leur fiche, triés : deux runs écrivent dans le même ordre. */
export const loadPieces = async (client: PoolClient) => {
  const fiches = `
    select c.tec_id as action_id, f.id as fiche_id, f.collectivite_id,
           a.date_creation::text as cree_le
      from reprise_tec.correspondance c
      join public.fiche_action f on f.id = c.tet_id
      join reprise_tec.staging_action a on a.id = c.tec_id
     where c.table_cible = 'fiche_action'`;

  const { rows: fichiers } = await client.query<Fichier>(`
    with fiches as (${fiches})
    select 'action_fichier' as "table", p.id::int as "tecId",
           f.fiche_id as "ficheId", f.collectivite_id as "collectiviteId",
           f.cree_le as "creeeLe", p.basename as reference, p.display_name as nom
      from reprise_tec.staging_action_fichier p
      join fiches f using (action_id)
    union all
    select 'action_image', p.id::int, f.fiche_id, f.collectivite_id,
           f.cree_le, p.basename, p.display_name
      from reprise_tec.staging_action_image p
      join fiches f using (action_id)
    order by 1, 2`);

  const { rows: urlsSiteWeb } = await client.query<UrlSiteWeb>(`
    with fiches as (${fiches})
    select a.id::int as "tecId", f.fiche_id as "ficheId",
           f.collectivite_id as "collectiviteId", f.cree_le as "creeeLe",
           trim(a.url_site_web) as adresse
      from reprise_tec.staging_action a
      join fiches f on f.action_id = a.id
     where nullif(trim(a.url_site_web), '') is not null
     order by a.id`);

  return { fichiers, urlsSiteWeb };
};
