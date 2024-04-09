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
};

export const CollectivitePages = {
  'Personnalisation des référentiels': {
    route: 'personnalisation',
    selector: '[data-test=personnalisation]',
  },
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
  'Labellisation ECi': {
    route: 'labellisation/eci',
    selector: '[data-test=labellisation-eci]',
  },
  'Action ECI': {
    route: 'action/eci/eci_3.1',
    selector: '[data-test^=Action]',
  },
  'Plans action': {
    route: 'plans/synthese',
    selector: '[data-test=PlansAction]',
  },
  'Fiches non classees': {
    route: 'plans/fiches',
    selector: '[data-test=FichesNonClassees]',
  },
  'Indicateurs CAE': {
    route: 'indicateurs/cae',
    selector: '[data-test=ind-v-cae]',
  },
  'Indicateurs personnalisés': {
    route: 'indicateurs/perso',
    selector: '[data-test=ind-v-perso]',
  },
};
