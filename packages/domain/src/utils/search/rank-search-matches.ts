import { matchSearchText, type SearchTextMatch } from './match-search-text';

export type TypoFallbackResult<T> = {
  results: T[];
  /** Rien ne répondait tel quel : ces résultats tolèrent des fautes de frappe. */
  isApproximate: boolean;
};

/**
 * Cherche d'abord sans faute de frappe, puis en les tolérant si rien ne
 * ressort.
 *
 * Mêler les deux noierait un nom bien tapé parmi ses voisins approchants :
 * « lunel » ramènerait « lure ». Les résultats approchants ne viennent donc
 * qu'à défaut, et le disent, pour que l'écran puisse le signaler.
 */
export const withTypoFallback = <T>(
  search: (options: { allowTypos: boolean }) => T[]
): TypoFallbackResult<T> => {
  const exact = search({ allowTypos: false });
  if (exact.length > 0) {
    return { results: exact, isApproximate: false };
  }
  const approximate = search({ allowTypos: true });
  return { results: approximate, isApproximate: approximate.length > 0 };
};

export type RankedSearchMatch<T> = {
  item: T;
  /** Le texte de l'élément qui a répondu, parmi ceux de `getTexts`. */
  text: string;
  match: SearchTextMatch;
};

export type RankSearchMatchesResult<T> = {
  /** Les plus pertinents d'abord, dans la limite demandée. */
  matches: RankedSearchMatch<T>[];
  /** Le nombre d'éléments qui répondent, limite ignorée. */
  total: number;
  isApproximate: boolean;
};

const collator = new Intl.Collator('fr', { sensitivity: 'base' });

/**
 * Les éléments qui répondent à la recherche, du plus pertinent au moins
 * pertinent, à égalité par ordre alphabétique.
 *
 * Un élément peut se chercher sous plusieurs textes — un département par son
 * nom ou par son code — : le meilleur l'emporte.
 */
export const rankSearchMatches = <T>(
  items: readonly T[],
  query: string,
  {
    getTexts,
    limit = Infinity,
  }: {
    getTexts: (item: T) => readonly string[];
    limit?: number;
  }
): RankSearchMatchesResult<T> => {
  const { results, isApproximate } = withTypoFallback(({ allowTypos }) =>
    items.flatMap((item) => {
      let best: RankedSearchMatch<T> | null = null;
      for (const text of getTexts(item)) {
        const match = matchSearchText(query, text, { allowTypos });
        if (match && (!best || match.score > best.match.score)) {
          best = { item, text, match };
        }
      }
      return best ? [best] : [];
    })
  );

  const sorted = results.sort(
    (a, b) => b.match.score - a.match.score || collator.compare(a.text, b.text)
  );
  return {
    matches: sorted.slice(0, limit),
    total: sorted.length,
    isApproximate,
  };
};
