export const LocalSelectors = {
  'Créer un indicateur': {
    selector: '[data-test=create-perso]',
  },
  Thématique: {selector: '[data-test=thematiques]'},
  Description: {selector: '[data-test=desc]'},
  'Personne pilote': {selector: '[data-test=PersonnePilote]'},
  'Service pilote': {selector: '[data-test=ServicePilote]'},
  Supprimer: {selector: 'button[aria-label=Supprimer]'},
  'modale de confirmation': {
    selector: '[data-test=Modal]',
    children: {
      Supprimer: 'button[aria-label=Supprimer]',
    },
  },
};
