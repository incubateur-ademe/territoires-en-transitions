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
};
