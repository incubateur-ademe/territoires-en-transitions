export const Views = {
  defaultRoute: '/',
  home: {
    selector: '[data-test=home]',
  },
  'Toutes les collectivités': {
    route: '/recherches/collectivites',
    selector: '[data-test=ToutesLesCollectivites]',
  },
  'Mon compte': {
    route: '/profil/mon-compte',
    selector: '[data-test=MonCompte]',
  },
};

export const CollectivitePages = {
  'Personnalisation des référentiels': {
    route: 'referentiel/personnalisation',
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
  Accueil: {
    route: 'accueil',
    selector: '[data-test="accueil-collectivite"]',
  },
  'Bibliothèque de documents': {
    route: 'bibliotheque',
    selector: '[data-test=BibliothequeDocs]',
  },
  'Labellisation CAE': {
    route: 'referentiel/cae/labellisation/suivi',
    selector: '[data-test=labellisation-cae]',
  },
  'Labellisation ECi': {
    route: 'referentiel/eci/labellisation/suivi',
    selector: '[data-test=labellisation-eci]',
  },
  'Action ECI': {
    route: 'referentiel/eci/action/eci_3.1',
    selector: '[data-test^=Action]',
  },
  'Synthèse plans action': {
    route: 'plans/synthese',
    selector: '[data-test=PlansAction]',
  },
  'Plans action': {
    route: 'plans/plan',
    selector: '[data-test=PlansAction]',
  },
  'Fiches non classees': {
    route: 'plans/fiches',
    selector: '[data-test=FichesNonClassees]',
  },
  'Tous les indicateurs': {
    route: 'indicateurs/tous-les-indicateurs',
    selector: '[data-test=tous-les-indicateurs]',
  },
};
