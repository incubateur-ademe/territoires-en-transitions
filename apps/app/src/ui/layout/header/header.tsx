import { usePathname } from 'next/navigation';

import { useCollectiviteContext } from '@/api/collectivites';
import { useUser } from '@/api/users/user-context/user-provider';
import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { useGetCollectivitePanierInfo } from '@/app/collectivites/panier/data/useGetCollectivitePanierInfo';
import { useDemoMode } from '@/app/users/demo-mode-support-provider';
import { Header as HeaderTet } from '@/ui';
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
                view: 'synthetique',
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
      <span className="fr-header__brand h-0 w-0 m-0" />
    </>
  );
};
