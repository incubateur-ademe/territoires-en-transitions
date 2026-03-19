import { FilterCategory } from '@tet/ui';
import type {
  PersonnalisationFilterKeys,
  PersonnalisationFilters,
} from './personnalisation-filters.types';

/** ordre d’affichage : Référentiels, Thématiques, Mesures (paramètre d’URL uniquement) */
const FILTER_KEYS_ORDER: PersonnalisationFilterKeys[] = [
  'referentielIds',
  'thematiqueIds',
  'actionIds',
];

const FILTER_CATEGORY_TITLES: Record<PersonnalisationFilterKeys, string> = {
  referentielIds: 'Référentiels',
  thematiqueIds: 'Thématiques',
  actionIds: 'Éléments impactés',
};

/**
 * Transforme les filtres personnalisation en catégories affichables par {@link BadgeFilters},
 * sur le même principe que les fiches (titres, valeurs résolues en libellés, readonly).
 */
export const formatToPrintableFilters = (
  filters: PersonnalisationFilters,
  readonlyFilters: Partial<PersonnalisationFilters>,
  getFilterValuesLabels: (
    key: PersonnalisationFilterKeys,
    values: string[]
  ) => string[]
): FilterCategory<PersonnalisationFilterKeys>[] => {
  const categories: FilterCategory<PersonnalisationFilterKeys>[] = [];

  for (const key of FILTER_KEYS_ORDER) {
    const values = filters[key];
    if (!values?.length) {
      continue;
    }

    const category: FilterCategory<PersonnalisationFilterKeys> = {
      key,
      title: FILTER_CATEGORY_TITLES[key],
      selectedFilters: getFilterValuesLabels(key, values),
    };

    if (readonlyFilters[key]) {
      category.readonly = true;
    }

    categories.push(category);
  }

  return categories;
};
