import { cleanSearchParams } from './clean-search-params';

const toRecord = (searchParams: URLSearchParams): Record<string, string> =>
  Object.fromEntries(searchParams);

describe('filtre-url-inconnu-ignore', () => {
  it('retire un levier inconnu et garde les leviers connus', () => {
    const cleaned = cleanSearchParams(
      new URLSearchParams({
        leviers: 'covoiturage,levier_inconnu,gestion_haies',
      })
    );

    expect(toRecord(cleaned)).toEqual({
      leviers: 'covoiturage,gestion_haies',
    });
  });

  it("retire le paramètre des leviers quand aucun levier n'est connu", () => {
    const cleaned = cleanSearchParams(
      new URLSearchParams({ leviers: 'levier_inconnu,autre_inconnu' })
    );

    expect(toRecord(cleaned)).toEqual({});
  });

  it('retire une catégorie inconnue et garde les catégories connues', () => {
    const cleaned = cleanSearchParams(
      new URLSearchParams({ categories: 'financement,subvention' })
    );

    expect(toRecord(cleaned)).toEqual({ categories: 'financement' });
  });

  it("retire le paramètre des catégories quand aucune catégorie n'est connue", () => {
    const cleaned = cleanSearchParams(
      new URLSearchParams({ categories: 'subvention' })
    );

    expect(toRecord(cleaned)).toEqual({});
  });

  it('retire un tri inconnu', () => {
    const cleaned = cleanSearchParams(new URLSearchParams({ sortBy: 'prix' }));

    expect(toRecord(cleaned)).toEqual({});
  });

  it('retire chaque valeur inconnue et garde le reste de la recherche', () => {
    const cleaned = cleanSearchParams(
      new URLSearchParams({
        searchedText: 'combles',
        leviers: 'covoiturage,levier_inconnu',
        categories: 'subvention',
        sortBy: 'prix',
      })
    );

    expect(toRecord(cleaned)).toEqual({
      searchedText: 'combles',
      leviers: 'covoiturage',
    });
  });
});

describe('invariants', () => {
  it('laisse intacte une recherche dont toutes les valeurs sont connues', () => {
    const cleaned = cleanSearchParams(
      new URLSearchParams({
        searchedText: 'combles',
        leviers: 'covoiturage,gestion_haies',
        categories: 'financement,gouvernance',
        sortBy: 'levier',
      })
    );

    expect(toRecord(cleaned)).toEqual({
      searchedText: 'combles',
      leviers: 'covoiturage,gestion_haies',
      categories: 'financement,gouvernance',
      sortBy: 'levier',
    });
  });

  it('garde le texte cherché tel que saisi, casse et accents compris', () => {
    const cleaned = cleanSearchParams(
      new URLSearchParams({ searchedText: 'Combles Perdus isolés' })
    );

    expect(toRecord(cleaned)).toEqual({
      searchedText: 'Combles Perdus isolés',
    });
  });

  it('laisse une URL sans paramètre sans paramètre', () => {
    const cleaned = cleanSearchParams(new URLSearchParams());

    expect(toRecord(cleaned)).toEqual({});
  });

  it('garde un paramètre étranger à la recherche', () => {
    const cleaned = cleanSearchParams(
      new URLSearchParams({ view: 'grid', leviers: 'levier_inconnu' })
    );

    expect(toRecord(cleaned)).toEqual({ view: 'grid' });
  });

  it('retire le tri par titre, qui est le tri par défaut', () => {
    const cleaned = cleanSearchParams(
      new URLSearchParams({ searchedText: 'combles', sortBy: 'titre' })
    );

    expect(toRecord(cleaned)).toEqual({ searchedText: 'combles' });
  });

  it('retire un texte cherché vide', () => {
    const cleaned = cleanSearchParams(
      new URLSearchParams({ searchedText: '', sortBy: 'levier' })
    );

    expect(toRecord(cleaned)).toEqual({ sortBy: 'levier' });
  });

  it('ne modifie pas les paramètres reçus', () => {
    const received = new URLSearchParams({
      leviers: 'covoiturage,levier_inconnu',
      sortBy: 'prix',
    });

    cleanSearchParams(received);

    expect(toRecord(received)).toEqual({
      leviers: 'covoiturage,levier_inconnu',
      sortBy: 'prix',
    });
  });
});
