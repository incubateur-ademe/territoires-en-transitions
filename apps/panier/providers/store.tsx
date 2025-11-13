import { CollectiviteProvider } from './collectivite';
import { PanierProvider } from './panier';
import { PHProvider } from './posthog';
import { UserProvider } from './user';

export const StoreProvider = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <UserProvider>
      <PHProvider
        config={{
          host: process.env.POSTHOG_HOST,
          key: process.env.POSTHOG_KEY,
        }}
      >
        <CollectiviteProvider>
          <PanierProvider>{children}</PanierProvider>
        </CollectiviteProvider>
      </PHProvider>
    </UserProvider>
  );
};
