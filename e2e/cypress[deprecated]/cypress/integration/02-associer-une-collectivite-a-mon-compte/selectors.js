export const LocalSelectors = {
  'Associer une collectivité à mon compte': {
    selector: '[data-test=btn-AssocierCollectivite]',
  },
  'Nom de la collectivité': {
    selector: '[data-test=select-collectivite]',
  },
  Rôle: {
    selector: '[data-test=role]',
  },
  'dialogue Associer une collectivité à mon compte': {
    selector: '[data-test=dialog-AssocierCollectivite]',
    children: {
      'Nom de la collectivité': '[data-test=select-collectivite] input',
      Rôle: '[data-test=role] input',
      'vous ne trouvez pas la collectivité que vous cherchez':
        '[data-test=no-selection-msg]',
      'Contenu pour activer la collectivité':
        '[data-test=ActiverCollectiviteDialogContent]',
      'Contenu pour rejoindre la collectivité':
        '[data-test=RejoindreCollectiviteDialogContent]',
      Valider: 'button[type=submit]',
    },
  },
  'bandeau lecture seule': {
    selector: '[data-test=ReadOnlyBanner]',
  },
  'Rejoindre cette collectivité': {
    selector: '[data-test=btn-RejoindreCetteCollectivite]',
  },
  'dialogue Rejoindre cette collectivité': {
    selector: '[data-test=dialog-RejoindreCetteCollectivite]',
    children: {
      'Contenu pour rejoindre la collectivité':
        '[data-test=RejoindreCollectiviteDialogContent]',
    },
  },
  'formulaire rejoindre une collectivité': {
    selector: '[data-test=formulaire-RejoindreUneCollectivite]',
  },
  "Rejoindre en tant qu'admin": {
    selector: '[data-test="BtnActiverCollectivite"]',
  },
};
