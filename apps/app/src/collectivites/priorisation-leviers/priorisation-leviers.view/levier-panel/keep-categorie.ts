import type { ActionsDeReferenceList } from '@/app/shared/actions-de-reference/actions-de-reference.contract';
import type { CategorieAction } from '@tet/domain/shared';

export const keepCategorie = ({
  list,
  categorie,
}: {
  list: ActionsDeReferenceList;
  categorie: CategorieAction | undefined;
}): ActionsDeReferenceList => {
  const hasActionsToFilter =
    list.status === 'loaded' && categorie !== undefined;
  if (!hasActionsToFilter) {
    return list;
  }
  return {
    ...list,
    actions: list.actions.filter((action) => action.categorie === categorie),
  };
};
