import { finaliserMonInscriptionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { isServiceDeconcentre } from '@tet/domain/collectivites';
import { hasRole, PlatformRole } from '@tet/domain/users';
import { makeCollectiviteNav } from './collectivite/make-collectivite-nav';
import { makeSimplifiedViewNav } from './collectivite/make-role-edition-actions-indicateurs-nav';
import { makeServiceDeconcentreNav } from './collectivite/make-service-deconcentre-nav';
import type { MakeMainNav } from './make-main-nav.contract';

export const makeMainNav: MakeMainNav = ({
  user,
  currentCollectivite,
  referentielDisplay,
  isDemarchePcaetEnabled,
}) => {
  const hasToCompleteRegistration =
    !hasRole(user, PlatformRole.VERIFIED) && user.collectivites.length === 0;

  if (hasToCompleteRegistration) {
    return {
      startItems: [
        {
          children: appLabels.finaliserInscription,
          href: finaliserMonInscriptionUrl,
        },
      ],
    };
  }

  if (currentCollectivite) {
    if (isServiceDeconcentre(currentCollectivite.collectiviteType)) {
      return makeServiceDeconcentreNav({ user, currentCollectivite });
    }

    if (currentCollectivite.isSimplifiedView) {
      return makeSimplifiedViewNav({
        user,
        currentCollectivite,
      });
    }

    return makeCollectiviteNav({
      user,
      currentCollectivite,
      referentielDisplay,
      isDemarchePcaetEnabled,
    });
  }
};
