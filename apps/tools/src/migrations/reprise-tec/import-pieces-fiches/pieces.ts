/** Les pièces des actions reprises en fiches (fichiers et « site web ») ; celles des dossiers ne sont pas lues. */

import { PoolClient } from 'pg';

export type Fichier = {
  table: 'action_fichier' | 'action_image';
  tecId: number;
  ficheId: number;
  collectiviteId: number;
  collectivite: string;
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
  collectivite: string;
  creeeLe: string;
  // telle que saisie dans T&C, sans les espaces autour
  adresse: string;
};

/** Lit les fichiers et les « site web » des actions reprises, avec leur fiche, triés : deux runs écrivent dans le même ordre. */
export const loadPieces = async (client: PoolClient) => {
  const fiches = `
    select c.tec_id as action_id, f.id as fiche_id, f.collectivite_id,
           co.nom as collectivite, a.date_creation::text as cree_le
      from reprise_tec.correspondance c
      join public.fiche_action f on f.id = c.tet_id
      join public.collectivite co on co.id = f.collectivite_id
      join reprise_tec.staging_action a on a.id = c.tec_id
     where c.table_cible = 'fiche_action'`;

  const { rows: fichiers } = await client.query<Fichier>(`
    with fiches as (${fiches})
    select 'action_fichier' as "table", p.id::int as "tecId",
           f.fiche_id as "ficheId", f.collectivite_id as "collectiviteId",
           f.collectivite, f.cree_le as "creeeLe", p.basename as reference,
           p.display_name as nom
      from reprise_tec.staging_action_fichier p
      join fiches f using (action_id)
    union all
    select 'action_image', p.id::int, f.fiche_id, f.collectivite_id,
           f.collectivite, f.cree_le, p.basename, p.display_name
      from reprise_tec.staging_action_image p
      join fiches f using (action_id)
    order by 1, 2`);

  const { rows: urlsSiteWeb } = await client.query<UrlSiteWeb>(`
    with fiches as (${fiches})
    select a.id::int as "tecId", f.fiche_id as "ficheId",
           f.collectivite_id as "collectiviteId", f.collectivite,
           f.cree_le as "creeeLe", trim(a.url_site_web) as adresse
      from reprise_tec.staging_action a
      join fiches f on f.action_id = a.id
     where nullif(trim(a.url_site_web), '') is not null
     order by a.id`);

  return { fichiers, urlsSiteWeb };
};

/** Garde, appelée par `gardes.ts` : l'import des fiches n'a pas tourné, ou une fiche qui doit recevoir une pièce a disparu. */
export const listCasBloquantsPieces = async (client: PoolClient) => {
  const { rows } = await client.query<{
    actionId: number | null;
    ficheId: number | null;
  }>(`
    with actions_avec_piece as (
      select action_id from reprise_tec.staging_action_fichier
      union
      select action_id from reprise_tec.staging_action_image
      union
      select id from reprise_tec.staging_action
       where nullif(trim(url_site_web), '') is not null
    )
    select null::int as "actionId", null::int as "ficheId"
     where not exists (select from reprise_tec.correspondance
                        where table_cible = 'fiche_action')
    union all
    select c.tec_id::int, c.tet_id::int
      from reprise_tec.correspondance c
     where c.table_cible = 'fiche_action'
       and c.tec_id in (select action_id from actions_avec_piece)
       and not exists (select from public.fiche_action f where f.id = c.tet_id)
     order by 1 nulls first`);
  return rows.map((r) =>
    r.actionId === null
      ? "  aucune fiche reprise : l'import des fiches (import-fiches) n'a pas tourné"
      : `  fiche ${r.ficheId} introuvable : action T&C ${r.actionId}, ses pièces n'ont plus de place`
  );
};
