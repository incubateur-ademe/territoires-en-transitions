import { CurrentCollectivite } from '@/api/collectivites';
import { UserDetails } from '@/api/users/user-details.fetch.server';
import { finaliserMonInscriptionUrl } from '@/app/app/paths';
import { HeaderProps } from '@/ui';
import { makeMainNav } from './make-main-nav';

type Props = {
  user: UserDetails;
  currentCollectivite: CurrentCollectivite | null;
  isDemoMode: boolean;
  panierId?: string;
};

export const makeHeaderMainNav = ({
  user,
  currentCollectivite,
  isDemoMode,
  panierId,
}: Props): HeaderProps['mainNav'] => {
  const hasToFinishInscription =
    !user.isVerified && user.collectivites.length === 0;

  if (hasToFinishInscription) {
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
    return makeMainNav({
      user,
      currentCollectivite,
      collectivites: user.collectivites,
      isDemoMode,
      panierId,
    });
  }
};
