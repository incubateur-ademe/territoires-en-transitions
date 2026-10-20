import type { ActionsDeReferenceList } from '@/app/shared/actions-de-reference/actions-de-reference.contract';
import type { CategorieAction } from '@tet/domain/shared';

export const keepCategories = ({
  list,
  categories,
}: {
  list: ActionsDeReferenceList;
  categories: readonly CategorieAction[];
}): ActionsDeReferenceList => {
  const hasActionsToFilter = list.status === 'loaded' && categories.length > 0;
  if (!hasActionsToFilter) {
    return list;
  }
  return {
    ...list,
    actions: list.actions.filter((action) =>
      action.categories.some((categorie) => categories.includes(categorie))
    ),
  };
};
