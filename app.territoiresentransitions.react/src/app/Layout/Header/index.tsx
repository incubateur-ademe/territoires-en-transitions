'use client';

import { useNbActionsDansPanier } from '@/app/app/Layout/Header/useNbActionsDansPanier';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { useAuth } from '@/app/users/auth-provider';
import { useMaintenance } from '../useMaintenance';
import { Header as HeaderBase } from './Header';

/**
 * En-tête de l'application raccordé aux données
 */
const Header = () => {
  const auth = useAuth();
  const currentCollectivite = useCurrentCollectivite();
  const { data: panier } = useNbActionsDansPanier(
    currentCollectivite?.collectiviteId!
  );
  const maintenance = useMaintenance();

  return (
    <HeaderBase
      auth={auth}
      ownedCollectivites={auth.user?.collectivites ?? []}
      currentCollectivite={currentCollectivite}
      panierId={panier?.panierId}
      maintenance={maintenance}
    />
  );
};

export default Header;
