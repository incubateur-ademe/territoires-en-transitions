'use client';

import { useAuth } from '@/app/core-logic/api/auth/AuthProvider';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { useMaintenance } from '../useMaintenance';
import { Header as HeaderBase } from './Header';

/**
 * En-tête de l'application raccordé aux données
 */
const Header = () => {
  const auth = useAuth();
  const currentCollectivite = useCurrentCollectivite();
  const maintenance = useMaintenance();

  return (
    <HeaderBase
      auth={auth}
      ownedCollectivites={auth.user?.collectivites ?? []}
      currentCollectivite={currentCollectivite}
      maintenance={maintenance}
    />
  );
};

export default Header;
