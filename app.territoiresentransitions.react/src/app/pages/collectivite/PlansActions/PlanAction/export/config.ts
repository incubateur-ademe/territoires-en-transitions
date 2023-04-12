/**
 * Configuration des exports
 */

export type TConfig = typeof ConfigPlanAction;

export const ConfigPlanAction = {
  first_data_row: 3,

  // les colonnes du tableau de données
  data_cols: {
    // Présentation de l’action
    nom_axe: 'A',
    sous_axe1: 'B',
    sous_axe2: 'C',
    titre: 'D',
    description: 'E',
    thematiques: 'F',
    sous_thematiques: 'G',

    // Objectifs et indicateurs
    objectifs: 'H',
    indicateurs: 'I',
    resultats_attendus: 'J',

    // Acteurs
    cibles: 'K',
    structures: 'L',
    ressources: 'M',
    partenaires: 'N',
    services: 'O',
    pilotes: 'P',
    referents: 'Q',

    // Modalités de mise en oeuvre
    financements: 'R',
    financeur1_nom: 'S',
    financeur1_montant: 'T',
    financeur2_nom: 'U',
    financeur2_montant: 'V',
    financeur3_nom: 'W',
    financeur3_montant: 'X',
    budget_previsionnel: 'Y',
    statut: 'Z',
    niveau_priorite: 'AA',
    date_debut: 'AB',
    date_fin_provisoire: 'AC',
    amelioration_continue: 'AD',
    calendrier: 'AE',
    actions: 'AF',
    notes_complementaires: 'AG',
    annexes: 'AH',
  },
};
