import {useQuery} from 'react-query';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {Referentiel} from 'types/litterals';
import {fetch} from './useActionAuditStatuts';

/**
 * Statut d'audit de toutes les actions du référentiel et de la collectivité
 * courante.
 */

export const useActionAuditStatutsListe = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();
  const {data} = useQuery(
    ['action_audit_state_list', collectivite_id, referentiel],
    () =>
      collectivite_id && referentiel
        ? fetch(collectivite_id, referentiel as Referentiel)
        : []
  );
  return data || [];
};
