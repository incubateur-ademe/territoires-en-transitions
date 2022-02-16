/**
 * Sélecteurs d'éléments pour les fonctionnalités d'auth.
 */

export const LocalSelectors = {
  'formulaire de connexion': {
    selector: '[data-test=SignInPage]',
    children: {
      email: 'input[name=email]',
      mdp: 'input[name=password]',
      Valider: 'button[type=submit]',
      'Mot de passe oublié': '[data-test=forgotten-pwd]',
    },
  },
  'demande de lien de réinitialisation du mdp': {
    selector: '[data-test=PasswordRecovery]',
    children: {
      email: 'input[name=email]',
      Valider: 'button[type=submit]',
    },
  },
  'message lien envoyé': {
    selector: '[data-test=PasswordRecoverySucceed]',
    children: {
      'Retour à la connexion': 'button',
    },
  },
  'formulaire de réinitialisation du mdp': {
    selector: '[data-test=ResetPassword]',
    children: {
      mdp: 'input[name=password]',
      Valider: 'button[type=submit]',
    },
  },
  'réinitialisation du mot de passe réussie': {
    selector: '[data-test=ResetPasswordSucceed]',
  },
  'réinitialisation du mot de passe en erreur': {
    selector: '[data-test=ResetPasswordFailed]',
  },
};
