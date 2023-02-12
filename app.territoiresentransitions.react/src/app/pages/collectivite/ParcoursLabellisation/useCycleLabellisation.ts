import {useQuery} from 'react-query';
import {TLabellisationParcours} from 'app/pages/collectivite/ParcoursLabellisation/types';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useIsAuditeur} from '../Audit/useAudit';
import {useCarteIdentite} from '../PersoReferentielThematique/useCarteIdentite';

// données du cycle de labellisation/audit actuel d'une collectivité
export type TCycleLabellisation = {
  parcours: TLabellisationParcours | null;
  status: TCycleLabellisationStatus;
  isAuditeur: boolean;
  isCOT: boolean;
  labellisable: boolean;
};

// état consolidé du cycle de labellisation/audit
type TCycleLabellisationStatus =
  | 'non_demandee'
  | 'demande_envoyee'
  | 'audit_en_cours'
  | 'audit_valide';

/** Renvoie les données de labellisation/audit de la collectivité courante */
export const useCycleLabellisation = (
  referentiel: string | null
): TCycleLabellisation => {
  const collectivite_id = useCollectiviteId();
  const isAuditeur = useIsAuditeur();
  const identite = useCarteIdentite(collectivite_id);

  // charge les données du parcours
  const {data: parcoursList} = useQuery(
    ['labellisation_parcours', collectivite_id],
    () => fetchParcours(collectivite_id)
  );

  // extrait le parcours correspondant au référentiel courant
  const parcours = getReferentielParcours(parcoursList, referentiel);
  const {completude_ok, rempli} = parcours || {};

  // états dérivés
  const status = getParcoursStatus(parcours);
  const isCOT = Boolean(identite?.is_cot);
  // on peut soumettre la demande de labellisation si...
  const labellisable = Boolean(
    // pas d'audit ou de labellisation demandée
    status === 'non_demandee' &&
      // et le référentiel est rempli
      completude_ok &&
      // et tous les critères sont atteints
      rempli
  );

  return {
    parcours,
    status,
    isAuditeur,
    isCOT,
    labellisable,
  };
};

// détermine l'état consolidé du cycle
const getParcoursStatus = (
  parcours: TLabellisationParcours | null
): TCycleLabellisationStatus => {
  if (!parcours) {
    return 'non_demandee';
  }
  const {demande, audit} = parcours;
  if (audit?.valide) {
    return 'audit_valide';
  }
  if (audit?.date_debut && !audit?.valide) {
    return 'audit_en_cours';
  }
  if (demande && !demande.en_cours) {
    return 'demande_envoyee';
  }
  return 'non_demandee';
};

// charge les parcours (eci/cae) de labellisation d'une collectivité donnée
const fetchParcours = async (
  collectivite_id: number | null
): Promise<TLabellisationParcours[] | null> => {
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
  return data.map(d => ({
    ...d,
    collectivite_id, // on ajoute l'id qui n'est pas redonné par la vue
  })) as TLabellisationParcours[];
};

export const getReferentielParcours = (
  parcoursList: TLabellisationParcours[] | null | undefined,
  referentiel: string | null
) => {
  const parcours: TLabellisationParcours | undefined = parcoursList?.find(
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
