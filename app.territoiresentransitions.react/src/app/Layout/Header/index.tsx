import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';
import {useMaintenance} from '../useMaintenance';
import {Header as HeaderBase} from './Header';

/**
 * En-tête de l'application raccordé aux données
 */
const Header = () => {
  const auth = useAuth();
  const currentCollectivite = useCurrentCollectivite();
  const ownedCollectivites = useOwnedCollectivites();
  const maintenance = useMaintenance();

  return (
    <HeaderBase
      auth={auth}
      currentCollectivite={currentCollectivite}
      ownedCollectivites={ownedCollectivites}
      maintenance={maintenance}
    />
  );
};

export default Header;
