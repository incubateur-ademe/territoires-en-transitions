export const LocalSelectors = {
  "dialogue d'ajout d'une preuve": {
    selector: '[data-test=AddPreuveModal]',
    children: {
      Fichier: '[role=tablist] li:nth-child(2) button',
    },
  },
  'formulaire Lien': {
    selector: '[data-test=AddPreuveModal] [data-test=AddLink]',
    children: {
      titre: 'input[name=titre]',
      lien: 'input[name=url]',
      Ajouter: 'button[data-test=ok]',
    },
  },
  'formulaire Fichier': {
    selector: '[data-test=AddPreuveModal] [data-test=AddFile]',
    children: {
      Ajouter: 'button[data-test=ok]',
    },
  },
  'Télécharger toutes les preuves': {
    selector: '[data-test=DownloadDocs]',
  },
  Commenter: {
    selector: '[data-test=btn-comment]',
  },
  Editer: {
    selector: '[data-test=btn-edit]',
  },
  Supprimer: {
    selector: '[data-test=btn-delete]',
  },
};
