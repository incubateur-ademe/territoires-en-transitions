import {CollectiviteProvider} from './collectivite';
import {PanierProvider} from './panier';
import {PHProvider} from './posthog';
import {UserProvider} from './user';

export const StoreProvider = ({children}: {children: React.ReactNode}) => {
  return (
    <PHProvider>
      <CollectiviteProvider>
        <UserProvider>
          <PanierProvider>{children}</PanierProvider>
        </UserProvider>
      </CollectiviteProvider>
    </PHProvider>
  );
};
