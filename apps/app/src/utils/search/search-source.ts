import { rankSearchMatches } from '@tet/domain/utils';
import type { SearchComboboxGroup, SearchComboboxOption } from '@tet/ui';

/** Un groupe de suggestions pour une saisie, `null` si rien n'y répond. */
export type SearchSource = (query: string) => SearchComboboxGroup | null;

export type SearchSourceConfig<T> = {
  /** Identifie le groupe : c'est lui qui dit à quoi se rapporte un choix. */
  id: string;
  label: string;
  items: readonly T[];
  /**
   * Les textes sous lesquels un élément se cherche, le meilleur l'emporte :
   * un département par son nom ou son code.
   */
  getTexts: (item: T) => readonly string[];
  /** L'option affichée, sans surlignage : il est calculé ici. */
  toOption: (
    item: T
  ) => Omit<SearchComboboxOption, 'highlightRanges' | 'isApproximate'>;
  /** Nombre d'options montrées. Le groupe annonce le total au-delà. */
  limit?: number;
};

/**
 * Une source de suggestions : cherche dans `items` avec la règle partagée
 * du domaine — accents, casse et fautes de frappe tolérés comme côté serveur —
 * et rend les meilleures options, le passage reconnu surligné.
 */
export const createSearchSource =
  <T>({
    id,
    label,
    items,
    getTexts,
    toOption,
    limit = 6,
  }: SearchSourceConfig<T>): SearchSource =>
  (query) => {
    const { matches, total, isApproximate } = rankSearchMatches(items, query, {
      getTexts,
      limit,
    });
    if (matches.length === 0) {
      return null;
    }
    return {
      id,
      label,
      totalCount: total,
      options: matches.map(({ item, text, match }) => {
        const option = toOption(item);
        // Le texte reconnu peut n'être qu'une part du libellé : le code dans
        // « Haute-Saône (70) ».
        const offset = option.label.indexOf(text);
        return {
          ...option,
          highlightRanges:
            offset === -1
              ? undefined
              : match.ranges.map(
                  ([start, end]) => [start + offset, end + offset] as const
                ),
          isApproximate,
        };
      }),
    };
  };

/**
 * Les suggestions de plusieurs sources, dans l'ordre donné. Une source
 * `false`, `null` ou `undefined` est ignorée : de quoi en conditionner une.
 */
export const combineSearchSources =
  (sources: readonly (SearchSource | false | null | undefined)[]) =>
  (query: string): SearchComboboxGroup[] =>
    sources.flatMap((source) => {
      const group = source ? source(query) : null;
      return group ? [group] : [];
    });
