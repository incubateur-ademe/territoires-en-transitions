/**
 * Sélecteurs d'éléments dans la page
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
  'formulaire de connexion': {
    selector: '[data-test=SignInPage]',
    children: {
      email: 'input[name=email]',
      mdp: 'input[name=password]',
      Valider: 'button[type=submit]',
      'Mot de passe oublié': '[data-test=forgotten-pwd]',
    },
  },
  'formulaire de réinitialisation du mdp': {
    selector: '[data-test=PasswordRecovery]',
    children: {
      email: 'input[name=email]',
      Valider: 'button[type=submit]',
    },
  },
  'mes collectivités': {
    selector: '[data-test=CurrentUserCollectivites]',
  },
  'bouton support': {
    selector: '.crisp-client',
  },
};
