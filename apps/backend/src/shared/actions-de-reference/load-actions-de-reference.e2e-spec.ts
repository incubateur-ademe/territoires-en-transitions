import { describe, it } from 'vitest';

describe('load-data', () => {
  it.todo(
    'le seed local et CI remplit la table avec chaque ligne du fichier de chargement'
  );
  it.todo(
    'la table refuse une seconde action avec le même levier, la même catégorie et le même titre'
  );
  it.todo('la table refuse un titre ou une description absent');
  it.todo(
    "la table refuse un titre ou une description vide, fait d'espaces ou entouré d'espaces"
  );
  it.todo('la table refuse un levier ou une catégorie hors liste');
  it.todo(
    "rejouer le fichier de chargement sur une table qui contient déjà une de ses lignes échoue et n'ajoute aucune ligne"
  );
});
