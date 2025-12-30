import { usePathname } from 'next/navigation';

import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { useGetCollectivitePanierInfo } from '@/app/collectivites/panier/data/useGetCollectivitePanierInfo';
import { useDemoMode } from '@/app/users/demo-mode-support-provider';
import { useCollectiviteContext } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { Header as HeaderTet } from '@tet/ui';
import { makeMainNav } from './main-nav/make-main-nav';
import { makeSecondaryNav } from './make-secondary-nav';

export const APP_HEADER_ID = 'app-header';

export const Header = () => {
  const pathname = usePathname();

  const user = useUser();

  const { isDemoMode } = useDemoMode();

  const { collectivite } = useCollectiviteContext();

  const { panier } = useGetCollectivitePanierInfo(
    collectivite?.collectiviteId ?? null
  );

  return (
    <>
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
          isDemoMode,
          panierId: panier?.panierId,
        })}
        secondaryNav={makeSecondaryNav(user)}
      />
      {/** La classe "fr-header__brand" doit restée présente car
       * nécessaire pour valider l'utilisation du DSFR dans dashlord */}
      <div className="fr-header__brand h-0 w-0 m-0" />
    </>
  );
};
