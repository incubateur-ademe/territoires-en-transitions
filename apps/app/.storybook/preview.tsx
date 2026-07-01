import { Preview } from '@storybook/nextjs-vite';

// charge les styles globaux
import '../app/global.css';
// surcharge les styles pour la zone de prévisualisation
import './preview.css';

import { SupabaseProvider, TrpcWithReactQueryProvider } from '@tet/api';
import { CollectiviteProvider } from '@tet/api/collectivites';
import { UserProvider } from '@tet/api/users';
import { defaultCollectivitePreferences } from '@tet/domain/collectivites';
import {
  CollectiviteRole,
  permissionsByRole,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';

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

const preview: Preview = {
  decorators: [
    (Story) => (
      <SupabaseProvider cookieOptions={null}>
        <UserProvider>
          <TrpcWithReactQueryProvider>
            <CollectiviteProvider user={user}>
              <Story />
            </CollectiviteProvider>
          </TrpcWithReactQueryProvider>
        </UserProvider>
      </SupabaseProvider>
    ),
  ],
};

export default preview;
