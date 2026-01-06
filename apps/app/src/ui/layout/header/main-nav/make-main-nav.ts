import { finaliserMonInscriptionUrl } from '@/app/app/paths';
import {
  CollectiviteAccess,
  UserWithCollectiviteAccesses,
} from '@tet/domain/users';
import { HeaderProps } from '@tet/ui';
import { makeCollectiviteNav } from './collectivite/make-collectivite-nav';
import { makeRoleEditionActionsIndicateursNav } from './collectivite/make-role-edition-actions-indicateurs-nav';

type Props = {
  user: UserWithCollectiviteAccesses;
  currentCollectivite: CollectiviteAccess | null;
  panierId?: string;
};

export const makeMainNav = ({
  user,
  currentCollectivite,
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
    if (currentCollectivite.isSimplifiedView) {
      return makeRoleEditionActionsIndicateursNav({
        currentCollectivite,
        collectivites: user.collectivites,
      });
    }

    return makeCollectiviteNav({
      user,
      currentCollectivite,
      collectivites: user.collectivites,
      panierId,
    });
  }
};
