import { useAuthState } from '@/panier/providers';
import { listUserCollectivites, UserCollectivite } from '@tet/api';
import useSWR, { SWRConfiguration } from 'swr';
import { match } from 'ts-pattern';

export type UserCollectivitesState =
  | { status: 'pending' }
  | { status: 'anonymous' }
  | { status: 'error'; retry: () => void }
  | { status: 'loaded'; collectivites: readonly UserCollectivite[] };

const PENDING_STATE: UserCollectivitesState = { status: 'pending' };
const ANONYMOUS_STATE: UserCollectivitesState = { status: 'anonymous' };

const REUSE_CACHE_ON_MOUNT: SWRConfiguration = {
  revalidateIfStale: false,
  shouldRetryOnError: false,
};

const toUserCollectivitesState = ({
  data,
  error,
  retry,
}: {
  data: readonly UserCollectivite[] | undefined;
  error: unknown;
  retry: () => void;
}): UserCollectivitesState => {
  if (data) {
    return { status: 'loaded', collectivites: data };
  }
  if (error) {
    return { status: 'error', retry };
  }
  return PENDING_STATE;
};

export const useUserCollectivites = (): UserCollectivitesState => {
  const authState = useAuthState();
  const userId =
    authState.status === 'authenticated' ? authState.user.id : null;
  const { data, error, mutate } = useSWR(
    userId ? ['users.users.get', userId] : null,
    listUserCollectivites,
    REUSE_CACHE_ON_MOUNT
  );
  const retry = (): void => {
    void mutate();
  };

  return match(authState)
    .with({ status: 'pending' }, () => PENDING_STATE)
    .with({ status: 'anonymous' }, () => ANONYMOUS_STATE)
    .with({ status: 'authenticated' }, () =>
      toUserCollectivitesState({ data, error, retry })
    )
    .exhaustive();
};
