import {useQuery} from 'react-query';
import {LabellisationParcoursRead} from 'generated/dataLayer/labellisation_parcours_read';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useIsAuditeur} from '../Audit/useAudit';

export type TParcoursLabellisation = {
  parcours: LabellisationParcoursRead | null;
  demandeEnvoyee: boolean;
  auditEnCours: boolean;
  auditValide: boolean;
  isAuditeur: boolean;
};

/** Renvoie les données de labellisation/audit de la collectivité courante */
export const useParcoursLabellisation = (
  referentiel: string | null
): TParcoursLabellisation => {
  const collectivite_id = useCollectiviteId();
  const isAuditeur = useIsAuditeur();

  // charge les données du parcours
  const {data: parcoursList} = useQuery(
    ['labellisation_parcours', collectivite_id],
    () => fetchParcours(collectivite_id)
  );

  // extrait le parcours correspondant au référentiel courant
  const parcours = getReferentielParcours(parcoursList, referentiel);

  // états dérivés
  const {demande} = parcours || {};
  const {audit} = demande || {};
  const demandeEnvoyee = Boolean(demande?.demandee_le);
  const auditEnCours = Boolean(audit?.date_debut && !audit?.valide);
  const auditValide = Boolean(audit?.valide);

  return {
    parcours,
    demandeEnvoyee,
    auditEnCours,
    auditValide,
    isAuditeur,
  };
};

// charge les parcours (eci/cae) de labellisation d'une collectivité donnée
const fetchParcours = async (
  collectivite_id: number | null
): Promise<LabellisationParcoursRead[] | null> => {
  if (!collectivite_id) {
    return null;
  }

  const {data, error} = await supabaseClient
    .rpc('labellisation_parcours', {
      collectivite_id,
    })
    .select();

  if (error || !data) {
    return null;
  }
  return data as unknown as LabellisationParcoursRead[];
};

export const getReferentielParcours = (
  parcoursList: LabellisationParcoursRead[] | null | undefined,
  referentiel: string | null
) => {
  const parcours: LabellisationParcoursRead | undefined = parcoursList?.find(
    p => p.referentiel === referentiel
  );

  if (!parcours) {
    return null;
  }

  const {criteres_action} = parcours;
  return {
    ...parcours,
    // trie les critères action
    criteres_action: criteres_action.sort((a, b) => a.prio - b.prio),
  };
};
