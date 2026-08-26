import { Preview } from '@storybook/nextjs-vite';

// charge les styles globaux
import '../app/global.css';
// surcharge les styles pour la zone de prévisualisation
import './preview.css';

import { ToastProvider } from '@/app/utils/toast/toast-context';
import { SupabaseProvider, TrpcWithReactQueryProvider } from '@tet/api';
import { CollectiviteProvider } from '@tet/api/collectivites';
import { UserProvider, useUserContext } from '@tet/api/users';
import { defaultCollectivitePreferences } from '@tet/domain/collectivites';
import {
    CollectiviteRole,
    permissionsByRole,
    UserWithRolesAndPermissions,
} from '@tet/domain/users';
import { ReactNode, useEffect } from 'react';

const user: UserWithRolesAndPermissions = {
  id: '',
  nom: '',
  prenom: '',
  email: '',
  telephone: null,
  cguAccepteesLe: null,
  roles: [],
  permissions: [],
  collectivites: [
    {
      collectiviteId: 1,
      collectiviteNom: 'Amberieu-en-Bugey',
      collectiviteAccesRestreint: false,
      collectivitePreferences: defaultCollectivitePreferences,
      role: CollectiviteRole.EDITION,
      permissions: permissionsByRole[CollectiviteRole.EDITION],
      audits: [],
    },
  ],
};

/**
 * Le UserProvider ne se peuple que sur un événement d'authentification Supabase,
 * qui ne survient jamais ici : sans amorçage, tout composant appelant `useUser`
 * échoue à rendre. On attend que le contexte porte l'utilisateur avant de rendre
 * la story, pour éviter un premier passage où il est encore absent.
 */
const WithMockedUser = ({ children }: { children: ReactNode }) => {
  const { user: currentUser, setUser } = useUserContext();

  useEffect(() => {
    if (!currentUser) setUser(user);
  }, [currentUser, setUser]);

  return currentUser ? children : null;
};

const preview: Preview = {
  decorators: [
    (Story) => (
      <SupabaseProvider cookieOptions={null}>
        <UserProvider>
          <WithMockedUser>
            <TrpcWithReactQueryProvider>
              <ToastProvider>
                <CollectiviteProvider user={user}>
                  <Story />
                </CollectiviteProvider>
              </ToastProvider>
            </TrpcWithReactQueryProvider>
          </WithMockedUser>
        </UserProvider>
      </SupabaseProvider>
    ),
  ],
};

export default preview;
