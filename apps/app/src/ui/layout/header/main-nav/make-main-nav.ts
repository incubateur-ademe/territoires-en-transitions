import { finaliserMonInscriptionUrl } from '@/app/app/paths';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import {
  CollectiviteRole,
  hasRole,
  PlatformRole,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';
import { HeaderProps } from '@tet/ui';
import { makeCollectiviteNav } from './collectivite/make-collectivite-nav';
import { makeRoleEditionActionsIndicateursNav } from './collectivite/make-role-edition-actions-indicateurs-nav';

type Props = {
  user: UserWithRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent | null;
  panierId?: string;
};

export const makeMainNav = ({
  user,
  currentCollectivite,
  panierId,
}: Props): HeaderProps['mainNav'] => {
  const hasToCompleteRegistration =
    !hasRole(user, PlatformRole.VERIFIE) && user.collectivites.length === 0;

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
    if (
      currentCollectivite.role === CollectiviteRole.EDITION_FICHES_INDICATEURS
    ) {
      return makeRoleEditionActionsIndicateursNav({
        user,
        currentCollectivite,
      });
    }

    return makeCollectiviteNav({
      user,
      currentCollectivite,
      panierId,
    });
  }
};
