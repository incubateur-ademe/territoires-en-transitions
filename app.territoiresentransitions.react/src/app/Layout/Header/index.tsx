'use client';

import { useUser } from '@/api/users/user-provider';
import { useNbActionsDansPanier } from '@/app/app/Layout/Header/useNbActionsDansPanier';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Alert, useOnlineStatus } from '@/ui';
import { Header as HeaderBase } from './Header';

/**
 * En-tête de l'application raccordé aux données
 */
const Header = () => {
  const user = useUser();
  const currentCollectivite = useCurrentCollectivite();
  const { data: panier } = useNbActionsDansPanier(
    currentCollectivite?.collectiviteId ?? null
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
        currentCollectivite={currentCollectivite}
        panierId={panier?.panierId}
      />
    </>
  );
};

export default Header;
