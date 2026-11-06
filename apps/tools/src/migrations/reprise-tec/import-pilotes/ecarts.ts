/** Les écarts : chaque ligne T&C des personnes et de leurs liens, écrite ou écartée avec son motif, une fois ; les alertes ne sont pas dans la copie. */

import { PoolClient } from 'pg';
import type { Ecart, Ligne } from '../import-fiches/ecarts';
import { loadMotifsDossiers } from '../import-fiches/ecarts';
import {
  LIGNES_DES_DOSSIERS,
  ROLES_PILOTES,
  type PiloteDossier,
  type PiloteFiche,
} from './pilotes';

type LigneLue = Ligne & {
  utilisateur: number | null;
  // pour un lien de dossier : la ligne T&C du dossier, son rôle, et si c'est un dossier repris ou son doublon
  dossier: number | null;
  role: number | null;
  dossierLu: boolean;
  // pour un contact d'action : l'action, et si l'import des fiches l'a reprise
  action: number | null;
  actionReprise: boolean;
  // le motif que l'import des fiches a donné à l'action
  motifAction: string | null;
  // l'utilisateur est un agent d'une organisation régionale (ADEME, DREAL, région)
  agentInstructeur: boolean;
  // la ligne pointe vers un utilisateur, un dossier ou une action absent de la copie
  orphelin: boolean;
};

export type EluReferent = {
  dossierTecId: number;
  collectivite: string;
  texte: string;
};

/**
 * Lit les lignes des six sources, dossiers et actions repris ou non ; rend les lues, les écrites, les écarts et les élus tapés à la main.
 * Les écrites viennent des pilotes lus pour l'écriture, pas de la règle : le bilan vérifie que les deux disent la même chose.
 */
export const loadEcarts = async (
  client: PoolClient,
  pilotes: {
    dossiers: readonly PiloteDossier[];
    fiches: readonly PiloteFiche[];
  }
) => {
  const { rows: lues } = await client.query<LigneLue>(
    `${LIGNES_DES_DOSSIERS}
     select 'utilisateur' as "table", u.id::int, '' as precision,
            u.id::int as utilisateur, null::int as dossier, null::int as role,
            false as "dossierLu", null::int as action, false as "actionReprise",
            null as "motifAction", u.organisation_regionale_id is not null as "agentInstructeur",
            false as orphelin
       from reprise_tec.staging_utilisateur u
     union all
     select 'demarche_utilisateur', du.demarche_id::int,
            'utilisateur ' || du.utilisateur_id || ' role ' || du.role_demarche_action_id,
            du.utilisateur_id::int, du.demarche_id::int, du.role_demarche_action_id::int,
            exists (select from lignes l where l.ligne = du.demarche_id), null, false, null, false,
            not exists (select from reprise_tec.staging_utilisateur u where u.id = du.utilisateur_id)
              or not exists (select from reprise_tec.staging_demarche d where d.id = du.demarche_id)
       from reprise_tec.staging_demarche_utilisateur du
     union all
     select 'action_contact', ac.action_id::int, 'utilisateur ' || ac.utilisateur_id,
            ac.utilisateur_id::int, null, null, false, ac.action_id::int,
            exists (select from reprise_tec.correspondance c
                     where c.table_cible = 'fiche_action' and c.tec_id = ac.action_id),
            (select e.motif from reprise_tec.ecarts e
              where e.table_source = 'action' and e.tec_id = ac.action_id and e.precision = ''),
            false,
            not exists (select from reprise_tec.staging_utilisateur u where u.id = ac.utilisateur_id)
              or not exists (select from reprise_tec.staging_action a where a.id = ac.action_id)
       from reprise_tec.staging_action_contact ac
     union all
     select 'demarche_historique', h.id::int, '', null, null, null, false, null, false,
            null, false, false
       from reprise_tec.staging_demarche_historique h
     union all
     select 'organisation_regionale', o.id::int, '', null, null, null, false, null, false,
            null, false, false
       from reprise_tec.staging_organisation_regionale o
     union all
     select 'demarche', l.dossier::int, 'elu_referent', null, null, null, false, null, false,
            null, false, false
       from lignes l
       join reprise_tec.staging_demarche d on d.id = l.ligne
      where l.ligne = l.dossier and nullif(trim(d.elu_referent), '') is not null
     order by 1, 2, 3`,
    []
  );
  const getMotifDossier = await loadMotifsDossiers(client);
  const utilisateursEcrits = new Set(
    [...pilotes.dossiers, ...pilotes.fiches].map((p) => p.utilisateurId)
  );

  return {
    lues: lues.map(({ table, id, precision }) => ({ table, id, precision })),
    ecrites: [
      ...[...utilisateursEcrits].map((id) => ({
        table: 'utilisateur',
        id,
        precision: '',
      })),
      ...pilotes.dossiers.map((p) => ({
        table: 'demarche_utilisateur',
        id: p.ligneTecId,
        precision: `utilisateur ${p.utilisateurId} role ${p.role}`,
      })),
      ...pilotes.fiches.map((p) => ({
        table: 'action_contact',
        id: p.actionTecId,
        precision: `utilisateur ${p.utilisateurId}`,
      })),
    ],
    ecarts: lues.flatMap((l): Ecart[] => {
      const motif = decideLigne(l, utilisateursEcrits, getMotifDossier);
      return motif === null
        ? []
        : [{ table: l.table, id: l.id, precision: l.precision, motif }];
    }),
    elusReferents: await loadElusReferents(client),
  };
};

/**
 * Règle : un lien de rôle 1 à 3 d'un dossier repris ou de son doublon est écrit, un rôle 4 à 6 est un contact instructeur ;
 * un lien ou un contact prend sinon le motif de son dossier ou de son action ; historique, organisation et élu tapé ne sont jamais repris.
 */
const decideLigne = (
  l: LigneLue,
  utilisateursEcrits: ReadonlySet<number>,
  getMotifDossier: (dossier: number) => string | null
): string | null => {
  if (l.orphelin) {
    return 'orphelin';
  }
  switch (l.table) {
    case 'utilisateur':
      if (utilisateursEcrits.has(l.id)) {
        return null;
      }
      return l.agentInstructeur ? 'contact_instructeur' : 'sans_role_repris';
    case 'demarche_utilisateur':
      if (!l.dossierLu) {
        return getMotifDossier(l.dossier as number);
      }
      return ROLES_PILOTES.includes(l.role as number)
        ? null
        : 'contact_instructeur';
    case 'action_contact':
      if (l.actionReprise) {
        return null;
      }
      if (l.motifAction === null) {
        throw new Error(
          `Action T&C ${l.action} ni reprise ni écartée par l'import des fiches.`
        );
      }
      return l.motifAction;
    case 'demarche_historique':
      return 'historique_non_repris';
    case 'organisation_regionale':
      return 'service_de_tet';
    case 'demarche':
      return 'elu_referent_texte_libre';
    default:
      throw new Error(`Table T&C inattendue : ${l.table}.`);
  }
};

/** Les élus référents tapés à la main des dossiers repris, avec leur collectivité TeT, pour le rapport. */
const loadElusReferents = async (client: PoolClient) => {
  const { rows } = await client.query<EluReferent>(
    `select c.tec_id::int as "dossierTecId", co.nom as collectivite,
            regexp_replace(trim(d.elu_referent), '\\s+', ' ', 'g') as texte
       from reprise_tec.correspondance c
       join reprise_tec.staging_demarche d on d.id = c.tec_id
       join public.demarche dm on dm.id = c.tet_id
       join public.collectivite co on co.id = dm.collectivite_id
      where c.table_cible = 'demarche' and nullif(trim(d.elu_referent), '') is not null
      order by co.nom, c.tec_id`
  );
  return rows;
};
