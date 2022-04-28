export const LocalSelectors = {
  "dialogue d'ajout d'une preuve": {
    selector: '[data-test=AddPreuveDlg]',
    children: {
      Fichier: '[role=tablist] li:nth-child(2) button',
    },
  },
  'formulaire Lien': {
    selector: '[data-test=AddPreuveDlg] [data-test=AddPreuveLien]',
    children: {
      titre: 'input[name=titre]',
      lien: 'input[name=url]',
      Ajouter: 'button[type=submit]',
    },
  },
  'formulaire Fichier': {
    selector: '[data-test=AddPreuveDlg] [data-test=AddPreuveFichier]',
    children: {
      Ajouter: 'button[type=submit]',
    },
  },
};
