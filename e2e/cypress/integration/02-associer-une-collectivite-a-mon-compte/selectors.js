export const LocalSelectors = {
  'Associer une collectivité à mon compte': {
    selector: '[data-test=btn-AssocierCollectivite]'
  },
  'dialogue Associer une collectivité à mon compte': {
    selector: '[data-test=dialog-AssocierCollectivite]',
    children: {
      'Nom de la collectivité': '[role=combobox] input',
      'vous ne trouvez pas la collectivité que vous cherchez':
        '[data-test=no-selection-msg]',
      'Contenu pour activer la collectivité': '[data-test=ActiverCollectiviteDialogContent]',
      'Contenu pour rejoindre la collectivité': '[data-test=RejoindreCollectiviteDialogContent]',
    },
  },
  'bandeau lecture seule': {
    selector: '[data-test=ReadOnlyBanner]' 
  },
  'Rejoindre cette collectivité': {selector: '[data-test=btn-RejoindreCetteCollectivite]'},
  'dialogue Rejoindre cette collectivité': {selector: '[data-test=dialog-RejoindreCetteCollectivite]', children: {'Contenu pour rejoindre la collectivité': '[data-test=RejoindreCollectiviteDialogContent]'} },
};

