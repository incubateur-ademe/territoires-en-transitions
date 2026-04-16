import { finaliserMonInscriptionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { ReferentielDisplayMap } from '@tet/domain/collectivites';
import {
  hasRole,
  PlatformRole,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';
import { HeaderProps } from '@tet/ui';
import { makeCollectiviteNav } from './collectivite/make-collectivite-nav';
import { makeSimplifiedViewNav } from './collectivite/make-role-edition-actions-indicateurs-nav';

type Props = {
  user: UserWithRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent | null;
  panierId?: string;
  referentielDisplay?: ReferentielDisplayMap;
};

export const makeMainNav = ({
  user,
  currentCollectivite,
  panierId,
  referentielDisplay,
}: Props): HeaderProps['mainNav'] => {
  const hasToCompleteRegistration =
    !hasRole(user, PlatformRole.VERIFIED) && user.collectivites.length === 0;

  if (hasToCompleteRegistration) {
    return {
      startItems: [
        {
          children: appLabels.navFinaliserInscription,
          href: finaliserMonInscriptionUrl,
        },
      ],
    };
  }

  if (currentCollectivite) {
    if (currentCollectivite.isSimplifiedView) {
      return makeSimplifiedViewNav({
        user,
        currentCollectivite,
      });
    }

    return makeCollectiviteNav({
      user,
      currentCollectivite,
      panierId,
      referentielDisplay,
    });
  }
};
