export const LocalSelectors = {
  'cartouche de personnalisation': {
    selector: '[data-test=PointsPotentiels]',
    children: {
      'bouton Personnaliser': 'button',
      Personnaliser: 'button',
    },
  },
  'dialogue Personnaliser le potentiel': {
    selector: '[data-test=PersoPotentielDlg]',
    children: {
      cartouche: '[data-test=PointsPotentiels]',
    },
  },
};
