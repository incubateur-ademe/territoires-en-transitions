/** Les plans : un par dossier qui porte des actions, rattaché à lui ; jamais écrits : `plan` (trigger), `source`, `panier_id` (courriel), `description`. */

import { PoolClient } from 'pg';
import { decrireDossier, type Dossier } from './dossiers';
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

/** Garde, appelée par `gardes.ts` : un dossier qui a déjà un plan, écrit par un import précédent ou rattaché par la collectivité. */
export const listCasBloquantsPlans = async (
  client: PoolClient,
  dossiers: readonly Dossier[]
) => {
  const { rows } = await client.query<{
    demarcheId: number;
    plan: string | null;
    parLImport: boolean;
  }>(
    `select l.demarche_id as "demarcheId", a.nom as plan,
            exists (select from reprise_tec.correspondance c
                     where c.table_cible = 'axe' and c.tet_id = a.id) as "parLImport"
       from public.demarche_plan_action l
       join public.axe a on a.id = l.plan_action_id
      where l.demarche_id = any($1)
      order by l.demarche_id, a.id`,
    [dossiers.map((d) => d.demarcheId)]
  );
  const parDemarche = new Map(dossiers.map((d) => [d.demarcheId, d]));
  return rows.map(
    (r) =>
      `  dossier qui a déjà un plan ${
        r.parLImport
          ? "(l'import des fiches est déjà passé)"
          : 'rattaché par la collectivité'
      } : ${decrireDossier(parDemarche.get(r.demarcheId) as Dossier)}, plan « ${
        r.plan ?? 'sans nom'
      } »`
  );
};
