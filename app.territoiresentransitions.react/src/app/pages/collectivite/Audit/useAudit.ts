import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {TAudit} from './types';
import {Referentiel} from 'types/litterals';
import {useAuth} from 'core-logic/api/auth/AuthProvider';

// charge les données
export const fetch = async (
  collectivite_id: number,
  referentiel: Referentiel
) => {
  // lit le statut de l'audit en cours (si il existe)
  const query = supabaseClient
    .from('audit')
    .select()
    .match({collectivite_id, referentiel})
    .limit(1);

  const {data, error} = await query;

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
 * collectivité et le référentiel courants */
export const useIsAuditeur = () => {
  const {user} = useAuth();
  const {data: audit} = useAudit();
  return (audit && user && audit.auditeur === user.id) || false;
};
