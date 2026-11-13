import { describe, expect, it } from 'vitest';
import {
  foldSearchText,
  matchSearchText,
  maxTyposForLength,
  typoDistance,
} from './match-search-text';
import { rankSearchMatches, withTypoFallback } from './rank-search-matches';

const passages = (text: string, ranges: readonly (readonly number[])[]) =>
  ranges.map(([start, end]) => text.slice(start, end));

describe('foldSearchText', () => {
  it('retire accents, casse et ponctuation, et déplie les ligatures', () => {
    expect(foldSearchText("CC du Pays d'Héricourt — Cœur")).toBe(
      'cc du pays d hericourt   coeur'
    );
  });
});

describe('typoDistance', () => {
  it('compte une lettre oubliée, en trop, remplacée ou inversée', () => {
    expect(typoDistance('hericout', 'hericourt')).toBe(1);
    expect(typoDistance('montpelliers', 'montpellier')).toBe(1);
    expect(typoDistance('lyon', 'lion')).toBe(1);
    expect(typoDistance('mnotpellier', 'montpellier')).toBe(1);
    expect(typoDistance('dole', 'dole')).toBe(0);
  });
});

describe('maxTyposForLength', () => {
  it('ne tolère aucune faute sous 5 caractères, une jusqu’à 8, deux au-delà', () => {
    expect([4, 5, 8, 9].map(maxTyposForLength)).toEqual([0, 1, 1, 2]);
  });
});

describe('matchSearchText', () => {
  it('trouve un nom partiel, sans égard aux accents ni à la ponctuation', () => {
    const text = 'Saint-Étienne Métropole';
    for (const query of ['etienne', 'SAINT ETIENNE', 'saint-étienne mét']) {
      expect(matchSearchText(query, text)).not.toBeNull();
    }
    expect(matchSearchText('saint etiennes', text)).toBeNull();
  });

  it('exige chaque mot tapé, dans n’importe quel ordre', () => {
    const text = 'Grenoble-Alpes-Métropole';
    expect(matchSearchText('metro alpes', text)).not.toBeNull();
    expect(matchSearchText('alpes lyon', text)).toBeNull();
  });

  it('trouve « coeur » dans « Cœur », et surligne la ligature', () => {
    const text = 'CC Cœur de Savoie';
    for (const query of ['coeur', 'cœur']) {
      const match = matchSearchText(query, text);
      expect(passages(text, match?.ranges ?? [])).toEqual(['Cœur']);
    }
  });

  it('ne répond pas à une recherche vide ou faite de ponctuation', () => {
    expect(matchSearchText('', 'Lyon')).toBeNull();
    expect(matchSearchText(' - ', 'Lyon')).toBeNull();
  });

  it('rend les passages reconnus, aux positions du texte d’origine', () => {
    const text = 'CC du Pays d’Héricourt';
    const match = matchSearchText('héri pays', text);
    expect(passages(text, match?.ranges ?? [])).toEqual(['Héri', 'Pays']);
    expect(match?.hasTypos).toBe(false);
  });

  it('classe un début de mot avant un milieu de mot', () => {
    const debut = matchSearchText('lun', 'CC du Pays de Lunel');
    const milieu = matchSearchText('lun', 'CA Melun Val de Seine');
    expect(debut?.score).toBeGreaterThan(milieu?.score ?? Infinity);
  });

  describe('avec allowTypos', () => {
    it.each([
      ['hericout', 'CC du Pays d’Héricourt', 'Héricourt'],
      ['monpellier', 'Montpellier Méditerranée Métropole', 'Montpellier'],
      ['monpel', 'Montpellier Méditerranée Métropole', 'Montpel'],
      ['grenble', 'Grenoble-Alpes-Métropole', 'Grenoble'],
    ])('« %s » trouve %s', (query, text, passage) => {
      const match = matchSearchText(query, text, { allowTypos: true });
      expect(match?.hasTypos).toBe(true);
      expect(passages(text, match?.ranges ?? [])).toEqual([passage]);
    });

    it('ne tolère rien sur un mot court', () => {
      expect(
        matchSearchText('lion', 'Métropole de Lyon', { allowTypos: true })
      ).toBeNull();
    });

    it('n’en tolère aucune sans l’option', () => {
      expect(matchSearchText('hericout', 'CC du Pays d’Héricourt')).toBeNull();
    });
  });
});

describe('withTypoFallback', () => {
  const noms = ['CC du Pays de Lunel', 'CC du Pays de Lure'];
  const chercher = (query: string) =>
    withTypoFallback(({ allowTypos }) =>
      noms.filter((nom) => matchSearchText(query, nom, { allowTypos }))
    );

  it('s’en tient aux résultats exacts quand il y en a', () => {
    expect(chercher('lunel')).toEqual({
      results: ['CC du Pays de Lunel'],
      isApproximate: false,
    });
  });

  it('tolère les fautes à défaut, et le dit', () => {
    expect(chercher('lunell')).toEqual({
      results: ['CC du Pays de Lunel'],
      isApproximate: true,
    });
  });

  it('ne se dit pas approchant quand rien ne répond', () => {
    expect(chercher('zzzzzz')).toEqual({ results: [], isApproximate: false });
  });
});

describe('rankSearchMatches', () => {
  const departements = [
    { code: '70', libelle: 'Haute-Saône' },
    { code: '71', libelle: 'Saône-et-Loire' },
    { code: '74', libelle: 'Haute-Savoie' },
  ];
  const ranger = (query: string, limit?: number) =>
    rankSearchMatches(departements, query, {
      getTexts: ({ code, libelle }) => [libelle, code],
      limit,
    });

  it('cherche dans chacun des textes d’un élément', () => {
    expect(ranger('70').matches.map(({ item }) => item.code)).toEqual(['70']);
  });

  it('range le plus pertinent d’abord, puis par ordre alphabétique', () => {
    expect(ranger('saone').matches.map(({ text }) => text)).toEqual([
      'Saône-et-Loire',
      'Haute-Saône',
    ]);
  });

  it('limite les résultats sans fausser le total', () => {
    const { matches, total } = ranger('haute', 1);
    expect(matches).toHaveLength(1);
    expect(total).toBe(2);
  });
});
