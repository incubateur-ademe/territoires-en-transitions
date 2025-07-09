/**
 * Sélecteurs d'éléments communs à toutes les pages
 */

export const Selectors = {
  header: {
    selector: 'header',
    children: {
      'Se connecter': '.fr-header__tools-links [data-test=signin]',
      'Créer un compte': '.fr-header__tools-links [data-test=signup]',
      Profil: '[data-test=profil]',
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
  'le tableau de bord personnel': {
    selector: '[data-test="tdb-personnel"]',
  },
  'menu collectivités': {
    selector: '[data-test=nav-collectivites]',
  },
  'toutes les collectivités': {
    selector: '[data-test=ToutesLesCollectivites]',
  },
  'finaliser mon inscription': {
    selector: '[data-test=FinaliserInscription]',
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
  'formulaire de connexion OTP': {
    selector: '[data-test=OTPForm]',
    children: {
      email: 'input[name=email]',
      code: 'input[name=code]',
      Valider: 'button[data-test=ok]',
    },
  },
  'formulaire de création de compte': {
    selector: '[data-test=SignUpPage]',
    children: {
      email: 'input[name=email]',
      mdp: 'input[name=password]',
      nom: 'input[name=nom]',
      prenom: 'input[name=prenom]',
      telephone: 'input[name=telephone]',
      cgu: 'input[name=cgu_acceptees]',
      rôle: '[data-test=role]',
      "message d'erreur": '[data-test=error]',
      Valider: 'button[type=submit]',
    },
  },
  'tableau des membres': {
    selector: '[data-test=MembreListTable]',
  },
  'confirmation de creation de compte': {
    selector: '[data-test=signup_success]',
    children: {
      'se connecter': '[data-test=SeConnecter]',
    },
  },
  'Compte avec mot de passe': {
    selector: '[id="tab-0"]',
  },
  'Compte sans mot de passe': {
    selector: '[id="tab-1"]',
  },
};
