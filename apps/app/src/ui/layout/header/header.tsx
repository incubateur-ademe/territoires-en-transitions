import { usePathname } from 'next/navigation';

import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { useIsDemarchePcaetEnabled } from '@/app/demarches/pcaet/use-is-enabled';
import { useReferentielTeEnabled } from '@/app/referentiels/use-referentiel-te-enabled';
import { useCollectiviteContext } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { REFERENTIEL_TE_DISABLED_REFERENTIELS_DISPLAY } from '@tet/domain/collectivites';
import { Header as HeaderTet } from '@tet/ui';
import { makeMainNav } from './main-nav/make-main-nav';
import { makeSecondaryNav } from './make-secondary-nav';
import { useLogout } from './use-logout';

export const APP_HEADER_ID = 'app-header';

export const Header = () => {
  const pathname = usePathname();
  const logout = useLogout();

  const user = useUser();

  const { collectivite } = useCollectiviteContext();
  const referentielTeEnabled = useReferentielTeEnabled();
  const isDemarchePcaetEnabled = useIsDemarchePcaetEnabled();

  return (
    <HeaderTet
      id={APP_HEADER_ID}
      pathname={pathname}
      rootUrl={
        collectivite?.collectiviteId
          ? makeTdbCollectiviteUrl({
              collectiviteId: collectivite.collectiviteId,
            })
          : '/'
      }
      mainNav={makeMainNav({
        user,
        currentCollectivite: collectivite,
        referentielDisplay: !referentielTeEnabled
          ? REFERENTIEL_TE_DISABLED_REFERENTIELS_DISPLAY
          : undefined,
        isDemarchePcaetEnabled,
      })}
      secondaryNav={makeSecondaryNav({
        user,
        currentCollectivite: collectivite,
        onLogout: logout,
      })}
    />
  );
};
