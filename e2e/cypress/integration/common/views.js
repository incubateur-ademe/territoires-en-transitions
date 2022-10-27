export const Views = {
  defaultRoute: '/',
  home: {
    selector: '[data-test=home]',
  },
  'Toutes les collectivités': {
    route: '/toutes_collectivites',
    selector: '[data-test=ToutesLesCollectivites]',
  },
  'Mon compte': {
    route: '/profil/mon-compte',
    selector: '[data-test=MonCompte]',
  },
  'Rejoindre une collectivité': {
    route: 'profil/rejoindre-une-collectivite',
    selector: '[data-test=RejoindreUneCollectivite]',
  },
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
  'Bibliothèque de documents': {
    route: 'bibliotheque',
    selector: '[data-test=BibliothequeDocs]',
  },
  'Labellisation CAE': {
    route: 'labellisation/cae',
    selector: '[data-test=labellisation-cae]',
  },
  'Action ECI': {
    route: 'action/eci/eci_3.1',
    selector: '[data-test=Action]',
  },
};
