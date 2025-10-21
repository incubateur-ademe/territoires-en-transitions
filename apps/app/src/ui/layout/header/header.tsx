import { usePathname } from 'next/navigation';

import { useCollectiviteContext } from '@/api/collectivites';
import { useUser } from '@/api/users/user-provider';
import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { useGetCollectivitePanierInfo } from '@/app/collectivites/panier/data/useGetCollectivitePanierInfo';
import { useDemoMode } from '@/app/users/demo-mode-support-provider';
import { Alert, Header as HeaderTet, useOnlineStatus } from '@/ui';
import { makeHeaderMainNav } from './header.main-nav';
import { makeSecondaryNav } from './make-secondary-nav';

export const Header = () => {
  const pathname = usePathname();

  const user = useUser();

  const isOnline = useOnlineStatus();

  const { isDemoMode } = useDemoMode();

  const { collectivite } = useCollectiviteContext();

  const { panier } = useGetCollectivitePanierInfo(
    collectivite?.collectiviteId ?? null
  );

  return (
    <>
      {!isOnline && (
        <Alert
          className="sticky top-0 z-tooltip"
          state="error"
          customIcon="cloud-off-line"
          title="Erreur de connexion réseau. Veuillez attendre que votre connexion soit rétablie pour utiliser l'application."
        />
      )}
      <HeaderTet
        id="app-header"
        pathname={pathname}
        rootUrl={
          collectivite?.collectiviteId
            ? makeTdbCollectiviteUrl({
                collectiviteId: collectivite.collectiviteId,
                view: 'synthetique',
              })
            : '/'
        }
        mainNav={makeHeaderMainNav({
          user,
          currentCollectivite: collectivite,
          isDemoMode,
          panierId: panier?.panierId,
        })}
        secondaryNav={makeSecondaryNav(user)}
      />
    </>
  );
};
