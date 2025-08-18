'use client';
import { useGetCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-provider';
import { useGetCollectivitePanierInfo } from '@/app/collectivites/panier/data/useGetCollectivitePanierInfo';
import { Alert, useOnlineStatus } from '@/ui';
import { useParams } from 'next/navigation';
import z from 'zod';
import { AppHeader as AppHeaderBase } from './AppHeader';

/**
 * En-tête de l'application raccordé aux données
 */
const AppHeader = () => {
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
      <AppHeaderBase
        user={user}
        currentCollectivite={collectivite ?? undefined}
        panierId={panier?.panierId}
      />
    </>
  );
};

export default AppHeader;
