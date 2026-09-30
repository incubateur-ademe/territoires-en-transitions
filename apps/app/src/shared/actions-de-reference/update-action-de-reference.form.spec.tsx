describe('modifier-action', () => {
  it.todo(
    "préremplit le titre, la description, le levier et la catégorie de l'action"
  );
  it.todo("envoie l'identifiant et les champs saisis à l'enregistrement");
  it.todo('signale la mise à jour quand la modification est acceptée');
});

describe('modifier-action-validation', () => {
  it.todo("refuse un titre vide et bloque l'enregistrement");
  it.todo("refuse un titre fait d'espaces");
  it.todo('refuse un titre de 301 caractères');
  it.todo('accepte un titre de 300 caractères');
  it.todo("refuse une description vide et bloque l'enregistrement");
  it.todo("n'envoie rien tant qu'un champ est invalide");
});

describe('modifier-action-conflit', () => {
  it.todo(
    'garde le volet ouvert et la saisie quand la modification est rejetée'
  );
});

describe('modifier-action-en-erreur', () => {
  it.todo(
    'garde le volet ouvert et la saisie quand la modification est rejetée'
  );
});

describe('fermer-volet-modifications-non-enregistrees', () => {
  it.todo(
    'répond stay-open à la demande de fermeture et ouvre la confirmation quand un champ a changé'
  );
  it.todo(
    "répond close à la demande de fermeture quand aucun champ n'a changé"
  );
  it.todo('« Fermer sans enregistrer » ferme le volet et abandonne la saisie');
  it.todo(
    '« Poursuivre la modification » referme la confirmation et garde la saisie'
  );
});
