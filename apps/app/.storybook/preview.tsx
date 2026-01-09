import { Preview } from '@storybook/nextjs-vite';

// charge les styles globaux
import '../app/global.css';
// surcharge les styles pour la zone de prévisualisation
import './preview.css';

import { SupabaseProvider, TrpcWithReactQueryProvider } from '@tet/api';
import { CollectiviteProvider } from '@tet/api/collectivites';
import { UserProvider } from '@tet/api/users';
import { CollectiviteAccessLevelEnum } from '@tet/domain/users';

const user = {
  collectivites: [
    {
      collectiviteId: 1,
      nom: 'Amberieu-en-Bugey',
      niveauAcces: CollectiviteAccessLevelEnum.EDITION,
      role: null,
      accesRestreint: false,
      isReadOnly: false,
      isRoleAuditeur: false,
      isSimplifiedView: false,
      permissions: [],
    },
  ],
  id: '',
  isSupport: false,
  isVerified: false,
  app_metadata: {},
  user_metadata: {},
  email: '',
  email_verified: false,
  aud: '',
  created_at: '',
  nom: '',
  prenom: '',
  nomComplet: '',
  role: '',
  roleId: '',
  telephone: '',
  cgu_acceptees_le: null,
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
