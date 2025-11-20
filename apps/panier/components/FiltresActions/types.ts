import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactTempsMiseEnOeuvre,
  ActionImpactThematique,
  ActionImpactTypologie,
} from '@tet/api';

/**
 * Listes passées au panneau de filtrage pour afficher les différentes
 * listes déroulantes.
 */
export type ContenuListesFiltre = {
  budgets: ActionImpactFourchetteBudgetaire[];
  temps: ActionImpactTempsMiseEnOeuvre[];
  thematiques: ActionImpactThematique[];
  typologies: ActionImpactTypologie[];
};

/**
 * Liste des onglets de la page panier
 */
export type PanierOngletName =
  | 'selection'
  | 'réalisées'
  | 'en cours'
  | 'importees';
