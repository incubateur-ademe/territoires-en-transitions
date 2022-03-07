export const LocalSelectors = {
  "dialogue d'ajout d'une preuve": {
    selector: '[data-test=AddPreuveDlg]',
  },
  'formulaire Lien': {
    selector: '[data-test=AddPreuveDlg] [data-test=AddPreuveLien]',
    children: {
      titre: 'input[name=titre]',
      lien: 'input[name=url]',
      Ajouter: 'button[type=submit]',
    },
  },
};
