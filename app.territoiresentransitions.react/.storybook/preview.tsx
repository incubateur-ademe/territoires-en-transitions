import { Preview } from '@storybook/nextjs';
import { QueryClient, QueryClientProvider } from 'react-query';

// charge les styles globaux
import '../app/global.css';
// surcharge les styles pour la zone de prévisualisation
import './preview.css';

import { CollectiviteProvider } from '@/api/collectivites';
import { UserProvider } from '@/api/users/user-provider';
import { SupabaseProvider } from '@/api/utils/supabase/use-supabase';

const queryClient = new QueryClient();

const preview: Preview = {
  decorators: [
    (Story) => (
      <SupabaseProvider cookieOptions={null}>
        <QueryClientProvider client={queryClient}>
          <UserProvider user={null}>
            <CollectiviteProvider collectiviteId={1}>
              <Story />
            </CollectiviteProvider>
          </UserProvider>
        </QueryClientProvider>
      </SupabaseProvider>
    ),
  ],
};

export default preview;
