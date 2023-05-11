export const LocalSelectors = {
  'cartouche de personnalisation': {
    selector: '[data-test=PersoPotentiel] [data-test=PointsPotentiels]',
    children: {
      'bouton Personnaliser': 'a',
      Personnaliser: 'a',
    },
  },
  'dialogue Personnaliser le potentiel': {
    selector: '[data-test=PersoPotentielDlg]',
    children: {
      cartouche: '[data-test=PointsPotentiels]',
    },
  },
  'Economie Circulaire': {
    selector: 'input[type=checkbox][name=eci]',
  },
  'Climat Air Energie': {
    selector: 'input[type=checkbox][name=cae]',
  },
  'Revenir au sommaire': {
    selector: '[data-test=btn-toc]',
  },
  'Catégorie suivante': {
    selector: '[data-test=btn-next]',
  },
};
