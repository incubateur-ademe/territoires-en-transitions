import {supabaseClient} from 'core-logic/api/supabase';
import {
  LabellisationParcoursRead,
  TEtoiles,
} from 'generated/dataLayer/labellisation_parcours_read';
import {LabellisationDemandeRead} from 'generated/dataLayer/labellisation_demande_read';
import {Referentiel} from 'types/litterals';

// charge les parcours (eci/cae) de labellisation d'une collectivité donnée
export const fetchParcours = async (
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

// charge la demande (ou la crée) associée au parcours de labellisation d'une
// collectivité pour un référentiel et un niveau
export const fetchDemande = async (
  collectivite_id: number | null,
  referentiel: Referentiel | null,
  etoiles: TEtoiles | undefined
): Promise<LabellisationDemandeRead | null> => {
  if (!collectivite_id || !referentiel || !etoiles) {
    return null;
  }
  const {data, error} = await supabaseClient
    .rpc('labellisation_demande', {
      collectivite_id,
      referentiel,
      etoiles,
    })
    .select();

  if (error) {
    return null;
  }
  return (data as unknown as LabellisationDemandeRead) || null;
};

// soumet une demande de labellisation
export const submitDemande = async (demande: {
  collectivite_id: number | null;
  referentiel: Referentiel | null;
  etoiles: TEtoiles | undefined;
}): Promise<boolean> => {
  const {collectivite_id, referentiel, etoiles} = demande;
  if (!collectivite_id || !referentiel || !etoiles) {
    return false;
  }
  const {error} = await supabaseClient.rpc('labellisation_submit_demande', {
    collectivite_id,
    referentiel,
    etoiles,
  });
  if (error) {
    return false;
  }
  return true;
};
