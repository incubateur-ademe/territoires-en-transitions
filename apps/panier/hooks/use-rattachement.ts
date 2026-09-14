import { match } from 'ts-pattern';
import {
  UserCollectivitesState,
  useUserCollectivites,
} from './use-user-collectivites';

export type Rattachement =
  | { status: 'pending' }
  | { status: 'error'; retry: () => void }
  | { status: 'anonymous' }
  | { status: 'own' }
  | { status: 'notOwn' };

const PENDING_RATTACHEMENT: Rattachement = { status: 'pending' };
const ANONYMOUS_RATTACHEMENT: Rattachement = { status: 'anonymous' };
const OWN_RATTACHEMENT: Rattachement = { status: 'own' };
const NOT_OWN_RATTACHEMENT: Rattachement = { status: 'notOwn' };

const toRattachement = ({
  userCollectivitesState,
  collectiviteId,
}: {
  userCollectivitesState: UserCollectivitesState;
  collectiviteId: number | null;
}): Rattachement =>
  match(userCollectivitesState)
    .with({ status: 'pending' }, () => PENDING_RATTACHEMENT)
    .with({ status: 'error' }, (errorState) => errorState)
    .with({ status: 'anonymous' }, () => ANONYMOUS_RATTACHEMENT)
    .with({ status: 'loaded' }, ({ collectivites }) =>
      collectivites.some(
        (collectivite) => collectivite.collectiviteId === collectiviteId
      )
        ? OWN_RATTACHEMENT
        : NOT_OWN_RATTACHEMENT
    )
    .exhaustive();

export const useRattachement = (collectiviteId: number | null): Rattachement =>
  toRattachement({
    userCollectivitesState: useUserCollectivites(),
    collectiviteId,
  });
