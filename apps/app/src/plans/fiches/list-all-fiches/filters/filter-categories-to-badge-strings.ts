import { FilterCategory } from '@tet/ui';

export const filterCategoriesToBadgeStrings = (
  categories: FilterCategory[]
): string[] => {
  return categories.flatMap((category) => {
    if (category.onlyShowCategory) {
      return [category.title];
    }

    if (category.selectedFilters.length === 0) {
      return [];
    }

    return [`${category.title} : ${category.selectedFilters.join(', ')}`];
  });
};
