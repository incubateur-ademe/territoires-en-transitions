/** Les pilotes à écrire : chefs de projet, participants et élus rattachés des dossiers repris (ligne reprise et doublon), contacts des actions reprises. */

import { PoolClient } from 'pg';
import { buildNom, type PersonneTag } from './personne-tag';

// Chef de projet, participant ou coporteur, élu référent : les rôles T&C qui deviennent pilotes.
export const ROLES_PILOTES = [1, 2, 3];

// Les lignes T&C d'un dossier repris : la sienne et celle de son doublon « définitif », toutes deux vers la démarche reprise.
export const LIGNES_DES_DOSSIERS = `
  with lignes as (
    select c.tec_id as dossier, c.tec_id as ligne, c.tet_id as demarche_id
      from reprise_tec.correspondance c
     where c.table_cible = 'demarche'
    union all
    select c.tec_id, d.pcaet_definitif, c.tet_id
      from reprise_tec.correspondance c
      join reprise_tec.staging_demarche d on d.id = c.tec_id
     where c.table_cible = 'demarche' and d.pcaet_definitif is not null
  )`;

type Pilote = PersonneTag & {
  utilisateurId: number;
  collectivite: string;
};

export type PiloteDossier = Pilote & {
  // le dossier T&C repris
  dossierTecId: number;
  // la ligne T&C qui porte le lien : le dossier repris ou son doublon « définitif »
  ligneTecId: number;
  demarcheId: number;
  // 1 chef de projet, 2 participant ou coporteur, 3 élu référent
  role: number;
  // la collectivité T&C de l'utilisateur, quand ce n'est aucune de celles du dossier
  autreCollectiviteTec: string | null;
};

export type PiloteFiche = Pilote & {
  actionTecId: number;
  ficheId: number;
};

type Ligne = {
  utilisateurId: number;
  collectiviteId: number;
  collectivite: string;
  prenom: string | null;
  nom: string | null;
};

/** Lit les pilotes des dossiers et des fiches repris, chacun avec son nom et la collectivité TeT du dossier ou de la fiche ; triés, pour que deux runs écrivent dans le même ordre. */
export const loadPilotes = async (client: PoolClient) => {
  const { rows: dossiers } = await client.query<
    Ligne & Omit<PiloteDossier, keyof Pilote>
  >(
    `${LIGNES_DES_DOSSIERS}
     select l.dossier::int as "dossierTecId", l.ligne::int as "ligneTecId",
            l.demarche_id::int as "demarcheId", du.utilisateur_id::int as "utilisateurId",
            du.role_demarche_action_id::int as role, dm.collectivite_id as "collectiviteId",
            co.nom as collectivite, u.prenom, u.nom,
            case when not exists (
              select from reprise_tec.staging_demarche_collectivite dc
               where dc.demarche_id = l.ligne and dc.collectivite_id = u.collectivite_id
            ) then sc.nom end as "autreCollectiviteTec"
       from lignes l
       join reprise_tec.staging_demarche_utilisateur du on du.demarche_id = l.ligne
       join reprise_tec.staging_utilisateur u on u.id = du.utilisateur_id
       left join reprise_tec.staging_collectivite sc on sc.id = u.collectivite_id
       join public.demarche dm on dm.id = l.demarche_id
       join public.collectivite co on co.id = dm.collectivite_id
      where du.role_demarche_action_id = any($1)
      order by l.dossier, l.ligne, du.utilisateur_id, du.role_demarche_action_id`,
    [ROLES_PILOTES]
  );

  const { rows: fiches } = await client.query<
    Ligne & Omit<PiloteFiche, keyof Pilote>
  >(
    `select c.tec_id::int as "actionTecId", f.id as "ficheId",
            ac.utilisateur_id::int as "utilisateurId", f.collectivite_id as "collectiviteId",
            co.nom as collectivite, u.prenom, u.nom
       from reprise_tec.staging_action_contact ac
       join reprise_tec.correspondance c
         on c.table_cible = 'fiche_action' and c.tec_id = ac.action_id
       join public.fiche_action f on f.id = c.tet_id
       join public.collectivite co on co.id = f.collectivite_id
       join reprise_tec.staging_utilisateur u on u.id = ac.utilisateur_id
      order by c.tec_id, ac.utilisateur_id`
  );

  return {
    dossiers: dossiers.map(toPilote),
    fiches: fiches.map(toPilote),
  };
};

/** Réunit le prénom et le nom de T&C en un seul nom, « Prénom Nom ». */
const toPilote = <T extends Ligne>({ prenom, nom, ...ligne }: T) => ({
  ...ligne,
  nom: buildNom(prenom, nom),
});

/** Garde, appelée par `gardes.ts` : aucun dossier ou aucune fiche repris, ou une démarche ou une fiche qui doit recevoir un pilote a disparu. */
export const listCasBloquantsPilotes = async (client: PoolClient) => {
  const { rows } = await client.query<{
    cas: 'aucun_dossier' | 'aucune_fiche' | 'demarche' | 'fiche';
    tecId: number | null;
    tetId: number | null;
  }>(
    `${LIGNES_DES_DOSSIERS}
     select 'aucun_dossier' as cas, null::int as "tecId", null::int as "tetId"
      where not exists (select from reprise_tec.correspondance
                         where table_cible = 'demarche')
     union all
     select 'aucune_fiche', null, null
      where not exists (select from reprise_tec.correspondance
                         where table_cible = 'fiche_action')
        and exists (select from reprise_tec.staging_action_contact ac
                      join reprise_tec.staging_action a on a.id = ac.action_id
                      join lignes l on l.ligne = a.demarche_id and l.ligne = l.dossier)
     union all
     select distinct 'demarche', l.dossier::int, l.demarche_id::int
       from lignes l
       join reprise_tec.staging_demarche_utilisateur du on du.demarche_id = l.ligne
      where du.role_demarche_action_id = any($1)
        and not exists (select from public.demarche d where d.id = l.demarche_id)
     union all
     select distinct 'fiche', c.tec_id::int, c.tet_id::int
       from reprise_tec.correspondance c
       join reprise_tec.staging_action_contact ac on ac.action_id = c.tec_id
      where c.table_cible = 'fiche_action'
        and not exists (select from public.fiche_action f where f.id = c.tet_id)
      order by 1, 2`,
    [ROLES_PILOTES]
  );
  return rows.map(({ cas, tecId, tetId }) => {
    switch (cas) {
      case 'aucun_dossier':
        return "  aucun dossier repris : l'import des dossiers (import-demarches) n'a pas tourné";
      case 'aucune_fiche':
        return "  aucune fiche reprise alors que des actions reprises ont un contact : l'import des fiches (import-fiches) n'a pas tourné";
      case 'demarche':
        return `  démarche ${tetId} introuvable : dossier T&C ${tecId}, ses pilotes n'ont plus de place`;
      case 'fiche':
        return `  fiche ${tetId} introuvable : action T&C ${tecId}, son pilote n'a plus de place`;
    }
  });
};

/** Les dossiers repris qui ne reçoivent aucun pilote, pour le rapport. */
export const listDossiersSansPilote = async (
  client: PoolClient,
  pilotes: readonly PiloteDossier[]
) => {
  const { rows } = await client.query<{
    tecId: number;
    demarcheId: number;
    collectivite: string;
  }>(
    `select c.tec_id::int as "tecId", d.id as "demarcheId", co.nom as collectivite
       from reprise_tec.correspondance c
       join public.demarche d on d.id = c.tet_id
       join public.collectivite co on co.id = d.collectivite_id
      where c.table_cible = 'demarche' and not (c.tet_id = any($1))
      order by co.nom, c.tec_id`,
    [[...new Set(pilotes.map((p) => p.demarcheId))]]
  );
  return rows.map(
    (r) =>
      `${r.collectivite} : dossier T&C ${r.tecId}, démarche ${r.demarcheId}`
  );
};
