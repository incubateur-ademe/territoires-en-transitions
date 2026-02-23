import { usePathname } from 'next/navigation';

import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { useGetCollectivitePanierInfo } from '@/app/collectivites/panier/data/useGetCollectivitePanierInfo';
import { useReferentielTeEnabled } from '@/app/referentiels/use-referentiel-te-enabled';
import { useCollectiviteContext } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { ReferentielDisplayMap } from '@tet/domain/collectivites';
import { Header as HeaderTet } from '@tet/ui';
import { makeMainNav } from './main-nav/make-main-nav';
import { makeSecondaryNav } from './make-secondary-nav';

export const APP_HEADER_ID = 'app-header';

const REFERENTIEL_TE_DISABLED_REFERENTIELS_DISPLAY: ReferentielDisplayMap = {
  eci: true,
  cae: true,
  te: false,
} as const;

export const Header = () => {
  const pathname = usePathname();

  const user = useUser();

  const { collectivite } = useCollectiviteContext();
  const referentielTeEnabled = useReferentielTeEnabled();

  const { panier } = useGetCollectivitePanierInfo(
    collectivite?.collectiviteId ?? null
  );

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
        panierId: panier?.panierId,
        referentielDisplay: !referentielTeEnabled
          ? REFERENTIEL_TE_DISABLED_REFERENTIELS_DISPLAY
          : undefined,
      })}
      secondaryNav={makeSecondaryNav(user)}
    />
  );
};
