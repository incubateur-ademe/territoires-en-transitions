describe('recherche-partageable-par-url', () => {
  it.todo(
    "lit le texte, les leviers, les catégories et le tri depuis les paramètres de l'URL"
  );
  it.todo('sans paramètre, la recherche est vide et triée par titre');
  it.todo(
    "écrit chaque changement de recherche dans l'URL en remplaçant l'entrée d'historique"
  );
  it.todo("retire de l'URL un filtre vidé et le tri par titre");
});

describe('filtre-url-inconnu-ignore', () => {
  it.todo('ignore une valeur inconnue et applique le reste de la recherche');
  it.todo("réécrit l'URL sans la valeur inconnue dès l'affichage");
  it.todo('ne réécrit pas une URL dont toutes les valeurs sont connues');
});

describe('aucune-action-trouvee', () => {
  it.todo(
    'resetSearch efface le texte, les leviers et les catégories et ramène le tri au titre'
  );
});
