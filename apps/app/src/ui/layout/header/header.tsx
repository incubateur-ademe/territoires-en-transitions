import { usePathname } from 'next/navigation';

import { homePath, makeDemandesAvisUrl } from '@/app/app/paths';
import { useReferentsAccess } from '@/app/demarches/pcaet/referents/data/use-referents-access';
import { useCanReadDemarchesPcaet } from '@/app/demarches/pcaet/use-is-enabled';
import { useIsPriorisationEnabled } from '@/app/collectivites/priorisation-leviers/use-is-priorisation-enabled';
import { useReferentielTeEnabled } from '@/app/referentiels/use-referentiel-te-enabled';
import { makeUserTdbUrl } from '@/app/tableaux-de-bord/make-user-tdb-url';
import { useCollectiviteContext } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import {
  collectiviteTypeEnum,
  isServiceDeconcentre,
  REFERENTIEL_TE_DISABLED_REFERENTIELS_DISPLAY,
} from '@tet/domain/collectivites';
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
  const isDemarchePcaetEnabled = useCanReadDemarchesPcaet();
  const isPriorisationEnabled = useIsPriorisationEnabled();
  // Seule la DGEC y a accès, et elle est un service national : inutile
  // d'interroger le serveur pour toute autre collectivité.
  const referentsAccess = useReferentsAccess({
    collectiviteId: collectivite?.collectiviteId ?? 0,
    enabled:
      collectivite?.collectiviteType === collectiviteTypeEnum.SERVICE_NATIONAL,
  });

  const rootUrl = collectivite
    ? isServiceDeconcentre(collectivite.collectiviteType)
      ? makeDemandesAvisUrl({
          collectiviteId: collectivite.collectiviteId,
        })
      : makeUserTdbUrl({ user, collectiviteId: collectivite.collectiviteId })
    : homePath;

  return (
    <HeaderTet
      id={APP_HEADER_ID}
      pathname={pathname}
      rootUrl={rootUrl}
      mainNav={makeMainNav({
        user,
        currentCollectivite: collectivite,
        referentielDisplay: !referentielTeEnabled
          ? REFERENTIEL_TE_DISABLED_REFERENTIELS_DISPLAY
          : undefined,
        isDemarchePcaetEnabled,
        isPriorisationEnabled,
        canReadReferentsPcaet: referentsAccess.canRead,
      })}
      secondaryNav={makeSecondaryNav({
        user,
        currentCollectivite: collectivite,
        onLogout: logout,
      })}
    />
  );
};
