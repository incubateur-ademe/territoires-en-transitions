/** Les actions à reprendre : celles de la ligne « mise en œuvre » des dossiers repris ; celles d'un doublon « définitif » ou sans dossier ne sont pas lues. */

import { PoolClient } from 'pg';

export type Action = {
  tecId: number;
  titre: string;
  description: string | null;
  // telle que saisie dans T&C
  lanceeLe: string | null;
  creeeLe: string;
  commentaireConclusion: string | null;
  commentaireStatut: string | null;
  volets: number[];
  cibles: number[];
  secteurs: number[];
  secteursLibres: string[];
  typesAction: number[];
  typesPorteur: number[];
  porteursLibres: string[];
};

export type Dossier = {
  tecId: number;
  demarcheId: number;
  collectiviteId: number;
  collectivite: string;
  // celle du dossier dans TeT, déjà corrigée par l'import des dossiers
  lanceLe: string | null;
  actions: Action[];
};

/** Les dossiers repris qui portent des actions, avec leurs actions et leurs qualifications, triés : deux runs écrivent dans le même ordre. */
export const loadDossiers = async (client: PoolClient): Promise<Dossier[]> => {
  const { rows } = await client.query<
    Omit<Dossier, 'actions'> & { action: Action }
  >(`
    with ${aggregate('volets', 'staging_action_volet', 'volet_id')},
         ${aggregate('cibles', 'staging_action_cible', 'cible_id')},
         ${aggregate('secteurs', 'staging_action_secteur', 'secteur_id')},
         ${aggregate(
           'secteurs_libres',
           'staging_action_secteur_autre',
           'trim(libelle_secteur)'
         )},
         ${aggregate(
           'types_action',
           'staging_action_type_action',
           'type_action_id'
         )},
         ${aggregate(
           'types_porteur',
           'staging_action_type_porteur',
           'type_porteur_id'
         )},
         ${aggregate(
           'porteurs_libres',
           'staging_action_type_porteur_autre',
           'trim(libelle_type_porteur)'
         )}
    select c.tec_id::int         as "tecId",
           d.id                  as "demarcheId",
           d.collectivite_id     as "collectiviteId",
           co.nom                as collectivite,
           d.launched_at::text   as "lanceLe",
           json_build_object(
             'tecId', a.id,
             'titre', a.intitule_action,
             'description', nullif(trim(a.description_action), ''),
             'lanceeLe', a.date_lancement::text,
             'creeeLe', a.date_creation::text,
             'commentaireConclusion', nullif(trim(a.commentaire_conclusion), ''),
             'commentaireStatut', nullif(trim(a.commentaire_statut), ''),
             'volets', coalesce(volets.valeurs, '{}'),
             'cibles', coalesce(cibles.valeurs, '{}'),
             'secteurs', coalesce(secteurs.valeurs, '{}'),
             'secteursLibres', coalesce(secteurs_libres.valeurs, '{}'),
             'typesAction', coalesce(types_action.valeurs, '{}'),
             'typesPorteur', coalesce(types_porteur.valeurs, '{}'),
             'porteursLibres', coalesce(porteurs_libres.valeurs, '{}')
           )                     as action
      from reprise_tec.correspondance c
      join public.demarche d on d.id = c.tet_id
      join public.collectivite co on co.id = d.collectivite_id
      join reprise_tec.staging_action a on a.demarche_id = c.tec_id
      left join volets on volets.action_id = a.id
      left join cibles on cibles.action_id = a.id
      left join secteurs on secteurs.action_id = a.id
      left join secteurs_libres on secteurs_libres.action_id = a.id
      left join types_action on types_action.action_id = a.id
      left join types_porteur on types_porteur.action_id = a.id
      left join porteurs_libres on porteurs_libres.action_id = a.id
     where c.table_cible = 'demarche'
     order by c.tec_id, a.id`);

  const dossiers = new Map<number, Dossier>();
  for (const { action, ...dossier } of rows) {
    const existant = dossiers.get(dossier.tecId) ?? { ...dossier, actions: [] };
    existant.actions.push(action);
    dossiers.set(dossier.tecId, existant);
  }
  return [...dossiers.values()];
};

/** Les valeurs d'une table satellite, en tableau trié par action. */
const aggregate = (nom: string, table: string, valeur: string) => `
  ${nom} as (
    select action_id, array_agg(${valeur} order by ${valeur}) as valeurs
      from reprise_tec.${table}
     group by action_id
  )`;
