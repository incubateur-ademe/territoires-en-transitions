describe('liste-en-chargement', () => {
  it.todo('montre un indicateur de chargement à la place des cards');
});

describe('liste-en-erreur', () => {
  it.todo("montre une carte d'erreur à la place des cards");
  it.todo('le bouton « Réessayer » relance le chargement');
});

describe('aucune-action-trouvee', () => {
  it.todo(
    "une liste chargée sans action montre l'état vide et le bouton « Effacer les filtres »"
  );
  it.todo(
    'le bouton « Effacer les filtres » demande la remise à zéro de la recherche'
  );
});

describe('aucune-action-en-base', () => {
  it.todo(
    'sans recherche ni filtre, une liste chargée sans action montre le même état vide, bouton compris'
  );
});

describe('card-affiche-action-entiere', () => {
  it.todo("montre une card par action, dans l'ordre reçu");
});

describe('modification-reservee-super-admin', () => {
  it.todo('transmet le droit de modification à chaque card');
});
