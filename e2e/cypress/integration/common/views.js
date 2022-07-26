export const Views = {
  defaultRoute: '/',
  home: {
    selector: '[data-test=home]',
  },
  'Toutes les collectivités': {
    route: '/toutes_collectivites',
    selector: '[data-test=ToutesLesCollectivites]',
  }
};

export const CollectivitePages = {
  'Gestion des membres': {
    route: 'users',
    selector: '[data-test=Users]',
  },
  'Tableau de bord': {
    route: 'tableau_bord',
    selector: '[data-test=TableauBord]',
  },
};
