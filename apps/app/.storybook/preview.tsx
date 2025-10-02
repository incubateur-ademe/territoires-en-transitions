import { Preview } from '@storybook/nextjs';

// charge les styles globaux
import '../app/global.css';
// surcharge les styles pour la zone de prévisualisation
import './preview.css';

import { CollectiviteProvider } from '@/api/collectivites';
import { UserProvider } from '@/api/users/user-provider';
import { SupabaseProvider } from '@/api/utils/supabase/use-supabase';
import { ReactQueryAndTRPCProvider } from '@/api/utils/trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const preview: Preview = {
  decorators: [
    (Story) => (
      <SupabaseProvider cookieOptions={null}>
        <QueryClientProvider client={queryClient}>
          <UserProvider user={null}>
            <ReactQueryAndTRPCProvider>
              <CollectiviteProvider collectiviteId={1}>
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
