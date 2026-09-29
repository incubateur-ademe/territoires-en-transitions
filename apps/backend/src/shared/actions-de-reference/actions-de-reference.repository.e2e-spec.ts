import { describe, it } from 'vitest';

describe('ActionsDeReferenceRepository contract', () => {
  describe('list-actions', () => {
    it.todo("renvoie toutes les actions quand aucun filtre n'est donné");
    it.todo(
      "trouve une action dont le titre contient le texte cherché, n'importe où dans le champ"
    );
    it.todo(
      "trouve une action dont la description contient le texte cherché, n'importe où dans le champ"
    );
    it.todo('ignore la casse du texte cherché dans le titre et la description');
    it.todo(
      'ignore les accents du texte cherché et du champ dans le titre et la description'
    );
    it.todo('cherche % et _ comme des caractères, pas comme des jokers');
    it.todo("renvoie une action qui porte l'un des leviers demandés");
    it.todo(
      'ne filtre pas sur le levier quand la liste de leviers est absente'
    );
    it.todo("renvoie une action qui porte l'une des catégories demandées");
    it.todo(
      'ne filtre pas sur la catégorie quand la liste de catégories est absente'
    );
    it.todo("renvoie une action dès qu'un seul filtre la retient");
    it.todo("ne renvoie pas une action qu'aucun filtre ne retient");
    it.todo(
      'renvoie toutes les actions quand les listes de leviers et de catégories sont absentes et sans autre filtre'
    );
    it.todo(
      'ne filtre pas sur le titre ni sur la description quand le texte cherché est absent'
    );
    it.todo(
      'renvoie les seules actions des leviers ou catégories demandés quand le titre et la description cherchés sont absents'
    );
    it.todo('renvoie une liste vide quand aucune action ne correspond');
    it.todo('trie par titre croissant par défaut');
    it.todo('trie par levier croissant quand le tri demandé est le levier');
    it.todo('à levier égal, trie par titre croissant');
    it.todo(
      'trie par catégorie croissante quand le tri demandé est la catégorie'
    );
    it.todo('à catégorie égale, trie par titre croissant');
    it.todo('renvoie toutes les actions correspondantes, sans pagination');
  });

  describe('update-action', () => {
    it.todo(
      "modifie le titre, la description, le levier et la catégorie donnés et renvoie l'id"
    );
    it.todo('laisse inchangés les champs absents de la mise à jour');
    it.todo(
      "renvoie l'id sans rien modifier quand seul l'id est donné et que l'action existe"
    );
    it.todo(
      "renvoie l'id sans rien modifier, sans erreur, quand tous les champs à modifier sont undefined"
    );
    it.todo('renvoie ACTION_DE_REFERENCE_NOT_FOUND pour un id inconnu');
    it.todo(
      "renvoie ACTION_DE_REFERENCE_NOT_FOUND pour un id inconnu quand seul l'id est donné"
    );
    it.todo(
      'renvoie ACTION_DE_REFERENCE_CONFLICT quand le triplet levier, catégorie, titre existe déjà sur une autre action'
    );
    it.todo("laisse l'action inchangée en base après un conflit");
  });
});
