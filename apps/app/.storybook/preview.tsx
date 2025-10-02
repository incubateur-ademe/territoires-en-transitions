import { Preview } from '@storybook/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// charge les styles globaux
import '../app/global.css';
// surcharge les styles pour la zone de prévisualisation
import './preview.css';

import { CollectiviteProvider } from '@/api/collectivites';
import { UserProvider } from '@/api/users/user-provider';
import { SupabaseProvider } from '@/api/utils/supabase/use-supabase';
import { ReactQueryAndTRPCProvider } from '@/api/utils/trpc/client';
import { PermissionLevelEnum } from '@/domain/users';

const queryClient = new QueryClient();

const user = {
  collectivites: [
    {
      collectiviteId: 1,
      nom: 'Amberieu-en-Bugey',
      niveauAcces: PermissionLevelEnum.EDITION,
      isRoleAuditeur: false,
      role: null,
      accesRestreint: false,
      isReadOnly: false,
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
        <QueryClientProvider client={queryClient}>
          <UserProvider user={user}>
            <ReactQueryAndTRPCProvider>
              <CollectiviteProvider user={user}>
                <Story />
              </CollectiviteProvider>
            </ReactQueryAndTRPCProvider>
          </UserProvider>
        </QueryClientProvider>
      </SupabaseProvider>
    ),
  ],
};

export default preview;
