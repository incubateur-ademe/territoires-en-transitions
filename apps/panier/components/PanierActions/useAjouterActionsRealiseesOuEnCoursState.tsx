import { Panier, PanierAPI, useSupabase } from '@tet/api';
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
  const supabase = useSupabase();
  const panierAPI = new PanierAPI(supabase);

  const panierId = panier?.id;

  const actions = panier?.[subset];

  const itemsCount = actions?.length ?? 0;
  const itemsInPanier =
    actions?.filter((action) => action.isinpanier).length ?? 0;
  const isSubsetAddedToPanier =
    itemsCount > 0 && itemsInPanier === itemsCount;

  const toggleAjout = async () => {
    if (!actions?.length || !panierId) return;

    await Promise.all(
      actions.map(async (action) =>
        isSubsetAddedToPanier
          ? panierAPI.removeActionFromPanier(action.id, panierId)
          : panierAPI.addActionToPanier(action.id, panierId)
      )
    );
  };

  return {
    ajout: isSubsetAddedToPanier,
    toggleAjout,
    count: itemsCount,
    countInPanier: itemsInPanier,
  };
};
