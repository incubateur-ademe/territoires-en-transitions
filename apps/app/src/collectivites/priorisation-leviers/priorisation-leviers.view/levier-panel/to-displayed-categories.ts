import {
  type ActionDeReference,
  type CategorieAction,
  categorieActionEnumValues,
} from '@tet/domain/shared';

export const toDisplayedCategories = ({
  action,
  filteredCategories,
}: {
  action: ActionDeReference;
  filteredCategories: readonly CategorieAction[];
}): readonly CategorieAction[] => {
  const isFiltering = filteredCategories.length > 0;
  if (!isFiltering) {
    return action.categories;
  }
  const firstMatchingCategorie = categorieActionEnumValues.find(
    (categorie) =>
      filteredCategories.includes(categorie) &&
      action.categories.includes(categorie)
  );
  return firstMatchingCategorie === undefined ? [] : [firstMatchingCategorie];
};
