/**
 * Sélecteurs d'éléments communs à toutes les pages
 */

export const Selectors = {
  header: {
    selector: 'header[role=banner]',
    children: {
      'Se connecter': '[data-test=signin]',
    },
  },
  footer: {
    selector: '#footer',
  },
  home: {
    selector: '[data-test=home]',
  },
  'mes collectivités': {
    selector: '[data-test=CurrentUserCollectivites]',
  },
  'bouton support': {
    selector: '.crisp-client',
  },
};
