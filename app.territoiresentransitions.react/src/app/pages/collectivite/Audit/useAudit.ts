import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {TAudit} from './types';
import {Referentiel} from 'types/litterals';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {usePreuvesParType} from 'ui/shared/preuves/Bibliotheque/usePreuves';

// charge les données
export const fetch = async (
  collectivite_id: number,
  referentiel: Referentiel
) => {
  // lit le statut de l'audit en cours (s'il existe)
  const {data, error} = await supabaseClient
    .from('audit_en_cours')
    .select(
      'id,collectivite_id,referentiel,demande_id,date_debut,date_fin,auditeurs:audit_auditeur (id:auditeur)'
    )
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
 * collectivité et le référentiel courant */
export const useIsAuditeur = () => {
  const {user} = useAuth();
  const {data: audit} = useAudit();
  if (!audit || !user || !audit.auditeurs?.length) {
    return false;
  }
  return audit.auditeurs.findIndex(({id}) => id === user.id) !== -1;
};

/** Liste des auditeurs */
export const useAuditeurs = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId() as Referentiel;
  return useQuery(['auditeurs', collectivite_id, referentiel], () =>
    collectivite_id ? fetchAuditeurs(collectivite_id, referentiel) : null
  );
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

/** Rapport associé à un audit */
export const useRapportAudit = (audit_id?: number) => {
  const {audit} = usePreuvesParType({preuve_types: ['audit'], audit_id});
  return audit?.length ? audit[0] : null;
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
