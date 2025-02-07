'use client';

import { useNbActionsDansPanier } from '@/app/app/Layout/Header/useNbActionsDansPanier';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { useUser } from '@/app/users/user-provider';
import { useMaintenance } from '../useMaintenance';
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
  const maintenance = useMaintenance();

  return (
    <HeaderBase
      user={user}
      currentCollectivite={currentCollectivite}
      panierId={panier?.panierId}
      maintenance={maintenance}
    />
  );
};

export default Header;
