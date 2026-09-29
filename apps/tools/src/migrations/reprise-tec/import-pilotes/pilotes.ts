/** Les pilotes à écrire : chefs de projet, participants et élus rattachés des dossiers repris (ligne reprise et doublon), contacts des actions reprises. */

import { PoolClient } from 'pg';
import { buildNom, type PersonneTag } from './personne-tag';

// Chef de projet, participant ou coporteur, élu référent : les rôles T&C qui deviennent pilotes.
const ROLES_PILOTES = [1, 2, 3];

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
  nomDeFamille: string | null;
};

/** Lit les pilotes des dossiers et des fiches repris, chacun avec son nom et la collectivité TeT du dossier ou de la fiche ; triés, pour que deux runs écrivent dans le même ordre. */
export const loadPilotes = async (client: PoolClient) => {
  const { rows: dossiers } = await client.query<
    Ligne & Omit<PiloteDossier, keyof Pilote>
  >(
    `with lignes as (
       select c.tec_id as dossier, c.tec_id as ligne, c.tet_id as demarche_id
         from reprise_tec.correspondance c
        where c.table_cible = 'demarche'
       union all
       select c.tec_id, d.pcaet_definitif, c.tet_id
         from reprise_tec.correspondance c
         join reprise_tec.staging_demarche d on d.id = c.tec_id
        where c.table_cible = 'demarche' and d.pcaet_definitif is not null
     )
     select l.dossier::int as "dossierTecId", l.ligne::int as "ligneTecId",
            l.demarche_id::int as "demarcheId", du.utilisateur_id::int as "utilisateurId",
            du.role_demarche_action_id::int as role, dm.collectivite_id as "collectiviteId",
            co.nom as collectivite, u.prenom, u.nom as "nomDeFamille"
       from lignes l
       join reprise_tec.staging_demarche_utilisateur du on du.demarche_id = l.ligne
       join reprise_tec.staging_utilisateur u on u.id = du.utilisateur_id
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
            co.nom as collectivite, u.prenom, u.nom as "nomDeFamille"
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

/** Remplace le prénom et le nom de famille de T&C par le nom du personne_tag. */
const toPilote = <T extends Ligne>({ prenom, nomDeFamille, ...ligne }: T) => ({
  ...ligne,
  nom: buildNom(prenom, nomDeFamille),
});
