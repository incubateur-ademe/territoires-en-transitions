'use client';

import { useAuth } from '@/app/core-logic/api/auth/AuthProvider';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { useMaintenance } from '../useMaintenance';
import { Header as HeaderBase } from './Header';
import { useNbActionsDansPanier } from '@/app/app/Layout/Header/useNbActionsDansPanier';

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
