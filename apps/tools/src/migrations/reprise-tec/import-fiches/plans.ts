/** Les plans : un par dossier qui porte des actions, rattaché à lui ; jamais écrits : `plan` (trigger), `source`, `panier_id` (courriel), `description`. */

import { PoolClient } from 'pg';
import type { Dossier } from './dossiers';
import { reserveIds } from './ecriture';

/** Règle : « PCAET <année de lancement> (repris de Territoires & Climat) », sans année si le dossier n'a pas de date. */
export const buildNomPlan = (dossier: Dossier) =>
  dossier.lanceLe === null
    ? 'PCAET (repris de Territoires & Climat)'
    : `PCAET ${dossier.lanceLe.slice(0, 4)} (repris de Territoires & Climat)`;

/** Écrit les plans, leur lien au dossier et leur trace ; rend le plan de chaque dossier. */
export const createPlans = async (
  client: PoolClient,
  dossiers: readonly Dossier[],
  typePlanId: number
) => {
  const ids = await reserveIds(client, 'axe', dossiers.length);
  await client.query(
    `with plans as (
       insert into public.axe (id, nom, collectivite_id, type, modified_by)
       select id, nom, collectivite_id, $5, null
         from unnest($1::int[], $2::text[], $3::int[]) as p(id, nom, collectivite_id)
       returning id
     ), liens as (
       insert into public.demarche_plan_action (demarche_id, plan_action_id, created_by)
       select demarche_id, id, null
         from unnest($4::int[], $1::int[]) as l(demarche_id, id)
       returning demarche_id
     ), correspondance as (
       insert into reprise_tec.correspondance (table_cible, tec_id, tet_id)
       select 'axe', tec_id, id from unnest($6::int[], $1::int[]) as c(tec_id, id)
     )
     insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
     select 'axe', id from plans
     union all
     select 'demarche_plan_action', demarche_id from liens`,
    [
      ids,
      dossiers.map(buildNomPlan),
      dossiers.map((d) => d.collectiviteId),
      dossiers.map((d) => d.demarcheId),
      typePlanId,
      dossiers.map((d) => d.tecId),
    ]
  );
  return new Map(dossiers.map((d, i) => [d.tecId, ids[i]]));
};
