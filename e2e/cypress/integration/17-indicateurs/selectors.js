export const LocalSelectors = {
  'Créer un indicateur': {
    selector: '[data-test=create-perso]',
  },
  Thématique: {selector: '[data-test=thematiques]'},
  Description: {selector: '[data-test=desc]'},
  'Personne pilote': {selector: '[data-test=personnes]'},
  'Service pilote': {selector: '[data-test=ServicePilote]'},
  Supprimer: {selector: 'button[aria-label=Supprimer]'},
  'modale de confirmation': {
    selector: '[data-test=Modal]',
    children: {
      Supprimer: 'button[aria-label=Supprimer]',
    },
  },
  'Appliquer à mes résultats': {selector: '[data-test="apply-resultat"]'},
  'Appliquer à mes objectifs': {selector: '[data-test="apply-objectif"]'},
  'dialogue de résolution des conflits': {
    selector: '[data-test=conflits]',
    children: {Valider: 'button[type=submit]'},
  },
  'Remplacer mes résultats': {selector: '#replace-data'},
  'Remplacer mes objectifs': {selector: '#replace-data'},
};
