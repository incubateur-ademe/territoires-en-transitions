export const LocalSelectors = {
  "Valider l'audit": {
    selector: '[data-test=ValiderAuditBtn]',
  },
  'dialogue de validation': {
    selector: '[data-test=ValiderAuditModal]',
    children: {
      'Ajouter le rapport': '[data-test=AddRapportButton]',
      Valider: '[data-test=validate]',
    },
  },
  "Commencer l'audit": {
    selector: '[data-test=StartAuditBtn]',
  },
  'Désactiver tous les filtres': {
    selector: '[data-test=desactiver-les-filtres]',
  },
};
