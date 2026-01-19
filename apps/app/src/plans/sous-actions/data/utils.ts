import { naturalSort } from '@/app/utils/naturalSort';
import { FicheWithRelations } from '@tet/domain/plans';

const sortByTitle = <
  SousAction extends Pick<FicheWithRelations, 'titre' | 'createdAt'>
>(
  a: SousAction,
  b: SousAction
) => {
  if (!a.titre) return 1;
  if (!b.titre) return -1;
  return naturalSort(a.titre, b.titre);
};

const sortByCreatedAt = <
  SousAction extends Pick<FicheWithRelations, 'titre' | 'createdAt'>
>(
  a: SousAction,
  b: SousAction
) => {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
};

export const sortSousActionsByTitleOrCreationDateWithoutTitle = <
  SousAction extends Pick<FicheWithRelations, 'titre' | 'createdAt'>
>(
  sousActions: SousAction[]
) => {
  const sousActionsWithTitle = sousActions
    .filter((s) => s.titre !== null)
    .sort(sortByTitle);
  const sousActionsWithoutTitle = sousActions
    .filter((s) => s.titre === null)
    .sort(sortByCreatedAt);
  return [...sousActionsWithTitle, ...sousActionsWithoutTitle];
};
