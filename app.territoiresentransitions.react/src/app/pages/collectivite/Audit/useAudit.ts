import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {TAudit} from './types';
import {Referentiel} from 'types/litterals';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {usePreuvesParType} from 'ui/shared/preuves/Bibliotheque/usePreuves';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

// charge les données
export const fetch = async (
  collectivite_id: number,
  referentiel: Referentiel
) => {
  // lit le statut de l'audit en cours (s'il existe)
  const {data, error} = await supabaseClient
    .from('audit_en_cours')
    .select('*,auditeurs:audit_auditeur (id:auditeur)')
    .match({collectivite_id, referentiel})
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  return data[0] as TAudit;
};

/**
 * Statut d'audit du référentiel et de la collectivité courante.
 */
export const useAudit = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId() as Referentiel;
  return useQuery(['audit', collectivite_id, referentiel], () =>
    collectivite_id && referentiel ? fetch(collectivite_id, referentiel) : null
  );
};

/** Indique si l'utilisateur courant est l'auditeur pour la
 * collectivité courante */
export const useIsAuditeur = () => {
  const collectivite = useCurrentCollectivite();
  return collectivite?.est_auditeur || false;
};

/** Liste des auditeurs pour la collectivité et le référentiel courant */
export const useAuditeurs = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId() as Referentiel;
  return useQuery(['auditeurs', collectivite_id, referentiel], () =>
    collectivite_id ? fetchAuditeurs(collectivite_id, referentiel) : null
  );
};

/** Liste des auditeurs d'un audit donné */
export const useAuditAuditeurs = (audit_id?: number) => {
  return useQuery(['audit_auditeurs', audit_id], async () => {
    if (!audit_id) {
      return [];
    }
    const {data} = await supabaseClient
      .from('audit_auditeur')
      .select('auditeur')
      .eq('audit_id', audit_id);
    return data || [];
  });
};

/** Indique si l'utilisateur courant est l'auditeur d'un audit donné */
export const useIsAuditAuditeur = (audit_id?: number) => {
  const {user} = useAuth();
  const {data: auditeurs} = useAuditAuditeurs(audit_id);
  if (!user || !auditeurs?.length) {
    return false;
  }
  return auditeurs.findIndex(({auditeur}) => auditeur === user.id) !== -1;
};

export type TAuditeur = {nom: string; prenom: string};
const fetchAuditeurs = async (
  collectivite_id: number,
  referentiel: Referentiel
) => {
  const {data, error} = await supabaseClient
    .from('auditeurs')
    .select('noms')
    .match({collectivite_id, referentiel})
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  return data[0].noms as TAuditeur[];
};

/** Rapport(s) associé(s) à un audit */
export const useRapportsAudit = (audit_id?: number) => {
  const {audit} = usePreuvesParType({preuve_types: ['audit'], audit_id});
  return audit || [];
};

/** Détermine si un COT est actif pour la collectivité */
export const useHasActiveCOT = () => {
  const collectivite_id = useCollectiviteId();
  const {data} = useQuery(['is_cot', collectivite_id], async () => {
    const {count} = await supabaseClient
      .from('cot')
      .select(undefined, {head: true, count: 'exact'})
      .match({collectivite_id, actif: true});
    return Boolean(count);
  });
  return data || false;
};

/** Détermine si la description de l'action doit être affichée dans la page
 * Action ou dans le panneau d'information */
export const useShowDescIntoInfoPanel = () => {
  const {data: audit} = useAudit();
  const isAuditeur = useIsAuditeur();

  // la description de l'action est affichée dans le panneau uniquement pour
  // l'auditeur et pour un audit en cours
  return (audit && audit.date_debut && !audit.valide && isAuditeur) || false;
};
