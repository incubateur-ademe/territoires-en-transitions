'use client';

import { useGetCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-provider';
import { useGetCollectivitePanierInfo } from '@/app/collectivites/panier/data/useGetCollectivitePanierInfo';
import { Alert, useOnlineStatus } from '@/ui';
import { useParams } from 'next/navigation';
import z from 'zod';
import { Header as HeaderBase } from './Header';

/**
 * En-tête de l'application raccordé aux données
 */
const Header = () => {
  const user = useUser();
  const p = useParams();

  const collectiviteId = z.coerce.number().safeParse(p.collectiviteId);
  const collectivite = useGetCurrentCollectivite(collectiviteId.data ?? 0);
  const { panier } = useGetCollectivitePanierInfo(
    collectivite?.collectiviteId ?? null
  );
  const isOnline = useOnlineStatus();

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
      <HeaderBase
        user={user}
        currentCollectivite={collectivite}
        panierId={panier?.panierId}
      />
    </>
  );
};

export default Header;
