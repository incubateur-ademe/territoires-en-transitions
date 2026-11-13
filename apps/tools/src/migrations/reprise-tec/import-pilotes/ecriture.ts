/** Les pilotes écrits : toujours un personne_tag, jamais un compte (un pilote à compte retirerait aux autres éditeurs le droit de faire avancer le dossier). */

import { PoolClient } from 'pg';
import { COMPTE_SYSTEME } from '../import-fiches/ecriture';
import type { PersonneTags } from './personne-tag';
import type { PiloteDossier, PiloteFiche } from './pilotes';

/**
 * Écrit un pilote par (démarche, personne_tag), sans auteur, chefs de projet d'abord, et la trace des démarches.
 * L'écran ne trie pas les pilotes : l'ordre d'écriture est celui qu'il montre, sans garantie.
 */
export const createPilotesDossiers = async (
  client: PoolClient,
  pilotes: readonly PiloteDossier[],
  personneTags: PersonneTags
) => {
  const parCle = new Map<
    string,
    { demarcheId: number; tagId: number; role: number; nom: string }
  >();
  for (const p of pilotes) {
    const tagId = personneTags.getId(p);
    const cle = `${p.demarcheId}|${tagId}`;
    const existant = parCle.get(cle);
    parCle.set(cle, {
      demarcheId: p.demarcheId,
      tagId,
      role: Math.min(p.role, existant?.role ?? p.role),
      nom: p.nom,
    });
  }
  const voulus = [...parCle.values()].sort(
    (a, b) =>
      a.demarcheId - b.demarcheId ||
      a.role - b.role ||
      a.nom.localeCompare(b.nom) ||
      a.tagId - b.tagId
  );

  const { rows } = await client.query<{ pilotes: number; demarches: number }>(
    `with ecrits as (
       insert into public.demarche_pilote (demarche_id, tag_id, created_by)
       select demarche_id, tag_id, null
         from unnest($1::int[], $2::int[]) with ordinality as p(demarche_id, tag_id, rang)
        order by rang
       returning demarche_id
     ), trace as (
       insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
       select distinct 'demarche_pilote', demarche_id from ecrits
     )
     select count(*)::int as pilotes, count(distinct demarche_id)::int as demarches
       from ecrits`,
    [voulus.map((p) => p.demarcheId), voulus.map((p) => p.tagId)]
  );
  return rows[0];
};

/** Écrit un pilote par (fiche, personne_tag), au nom du compte système, et la trace des fiches ; « Modifié le » ne bouge pas (aucun déclencheur). */
export const createPilotesFiches = async (
  client: PoolClient,
  pilotes: readonly PiloteFiche[],
  personneTags: PersonneTags
) => {
  const voulus = [
    ...new Map(
      pilotes.map((p) => {
        const tagId = personneTags.getId(p);
        return [`${p.ficheId}|${tagId}`, { ficheId: p.ficheId, tagId }];
      })
    ).values(),
  ];
  const { rows } = await client.query<{ pilotes: number; fiches: number }>(
    `with ecrits as (
       insert into public.fiche_action_pilote (fiche_id, tag_id, created_by)
       select fiche_id, tag_id, $3::uuid
         from unnest($1::int[], $2::int[]) as p(fiche_id, tag_id)
       returning fiche_id
     ), trace as (
       insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
       select distinct 'fiche_action_pilote', fiche_id from ecrits
     )
     select count(*)::int as pilotes, count(distinct fiche_id)::int as fiches
       from ecrits`,
    [voulus.map((p) => p.ficheId), voulus.map((p) => p.tagId), COMPTE_SYSTEME]
  );
  return rows[0];
};

/** Garde, appelée par `gardes.ts` : l'import est déjà passé, reconnu à ses traces. */
export const listCasBloquantsEcriture = async (client: PoolClient) => {
  const { rows } = await client.query<{ table: string; nombre: number }>(
    `select 'correspondance personne_tag' as "table", count(*)::int as nombre
       from reprise_tec.correspondance where table_cible = 'personne_tag'
     union all
     select 'lignes_ecrites ' || table_cible, count(*)::int
       from reprise_tec.lignes_ecrites
      where table_cible in ('personne_tag', 'demarche_pilote', 'fiche_action_pilote')
      group by table_cible
      order by 1`
  );
  const traces = rows.filter((r) => r.nombre > 0);
  return traces.length === 0
    ? []
    : [
        `  import des pilotes déjà passé (${traces
          .map((r) => `${r.nombre} ${r.table}`)
          .join(', ')}) : l'annuler d'abord`,
      ];
};
