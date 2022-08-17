/**
 * Sélecteurs d'éléments communs à toutes les pages
 */

export const Selectors = {
  header: {
    selector: 'header[role=banner]',
    children: {
      'Se connecter': '[data-test=signin]',
      'Créer un compte': '[data-test=signup]',
    },
  },
  footer: {
    selector: '#footer',
  },
  home: {
    selector: '[data-test=home]',
  },
'le tableau de bord de la collectivité': {
  selector: '[data-test=TableauBord]',
},
'toutes les collectivités': {
  selector: '[data-test=ToutesLesCollectivites]',
},
  'bouton support': {
    selector: '.crisp-client',
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
  'formulaire de création de compte': {
    selector: '[data-test=SignUpPage]',
    children: {
      email: 'input[name=email]',
      mdp: 'input[name=password]',
      nom: 'input[name=nom]',
      prenom: 'input[name=prenom]',
      cgu: 'input[name=vie_privee_conditions]',
      Valider: 'button[type=submit]',
    },
  },
};
