import { Panier, PanierAPI } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useEffect, useState } from 'react';
import { usePanierContext } from '../../providers';

/**
 * Fourni les décomptes d'actions réalisées/en cours totaux et ajouter dans le panier
 * ainsi que des fonctions pour ajouter/enlever une de ces sous-sélections du panier.
 */
export const useAjouterActionsRealiseesOuEnCoursState = () => {
  const { panier } = usePanierContext();

  const {
    count: nbEnCours,
    countInPanier: nbEnCoursInPanier,
    ajout: ajoutEnCours,
    toggleAjout: toggleAjoutEnCours,
  } = useToggleAjoutActions(panier, 'en_cours');
  const {
    count: nbRealisees,
    countInPanier: nbRealiseesInPanier,
    ajout: ajoutRealisees,
    toggleAjout: toggleAjoutRealisees,
  } = useToggleAjoutActions(panier, 'realise');

  return {
    nbEnCours,
    nbEnCoursInPanier,
    ajoutEnCours,
    toggleAjoutEnCours,
    nbRealisees,
    nbRealiseesInPanier,
    ajoutRealisees,
    toggleAjoutRealisees,
  };
};
export type AjouterActionsRealiseesOuEnCoursState = ReturnType<
  typeof useAjouterActionsRealiseesOuEnCoursState
>;

// enlève/ajoute un sous-ensemble d'actions dans le panier
const useToggleAjoutActions = (
  panier: Panier | null,
  subset: 'en_cours' | 'realise'
) => {
  const [ajout, setAjout] = useState(false);
  const supabase = useSupabase();
  const panierAPI = new PanierAPI(supabase);

  const panierId = panier?.id;

  // le sous-ensemble
  const actions = panier?.[subset];

  // nombre d'items total et dans le panier
  const count = actions?.length ?? 0;
  const countInPanier =
    actions?.filter((action) => action.isinpanier).length ?? 0;

  // ajoute/enlève les actions du panier
  const toggleAjout = () => {
    if (!actions?.length || !panierId) return;
    if (ajout) {
      actions.forEach((action) =>
        panierAPI.removeActionFromPanier(action.id, panierId)
      );
    } else {
      actions.forEach((action) =>
        panierAPI.addActionToPanier(action.id, panierId)
      );
    }
    setAjout(!ajout);
  };

  // synchronise l'état si il n'y a plus d'actions dans le panier
  useEffect(() => {
    if (!countInPanier && ajout) {
      setAjout(false);
    } else if (countInPanier && !ajout) {
      setAjout(true);
    }
  }, [countInPanier, ajout]);

  return { ajout, toggleAjout, count, countInPanier };
};
