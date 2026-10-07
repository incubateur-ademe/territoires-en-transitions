import { FilterKeys } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { UserInfo } from '@tet/domain/users';

type CurrentUser = Pick<UserInfo, 'id' | 'prenom' | 'nom'>;

const personneFilterKeys: FilterKeys[] = [
  'utilisateurPiloteIds',
  'utilisateurReferentIds',
];

export const isPersonneFilterKey = (key: FilterKeys): boolean =>
  personneFilterKeys.includes(key);

export const getCurrentUserLabel = (
  currentUser: CurrentUser,
  personneId: string | number
): string | undefined => {
  const isCurrentUser = `${personneId}` === currentUser.id;
  return isCurrentUser
    ? `${currentUser.prenom} ${currentUser.nom}`
    : undefined;
};
