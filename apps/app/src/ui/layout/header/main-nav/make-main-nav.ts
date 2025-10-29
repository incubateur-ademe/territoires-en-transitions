import { CurrentCollectivite } from '@/api/collectivites';
import { UserDetails } from '@/api/users/user-details.fetch.server';
import { finaliserMonInscriptionUrl } from '@/app/app/paths';
import { HeaderProps } from '@/ui';
import { makeCollectiviteNav } from './collectivite/make-collectivite-nav';

type Props = {
  user: UserDetails;
  currentCollectivite: CurrentCollectivite | null;
  isDemoMode: boolean;
  panierId?: string;
};

export const makeMainNav = ({
  user,
  currentCollectivite,
  isDemoMode,
  panierId,
}: Props): HeaderProps['mainNav'] => {
  const hasToCompleteRegistration =
    !user.isVerified && user.collectivites.length === 0;

  if (hasToCompleteRegistration) {
    return {
      startItems: [
        {
          children: 'Finaliser mon inscription',
          href: finaliserMonInscriptionUrl,
        },
      ],
    };
  }

  if (currentCollectivite) {
    return makeCollectiviteNav({
      user,
      currentCollectivite,
      collectivites: user.collectivites,
      isDemoMode,
      panierId,
    });
  }
};
