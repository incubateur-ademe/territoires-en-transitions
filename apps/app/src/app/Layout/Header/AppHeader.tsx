'use client';

import { CurrentCollectivite } from '@/api/collectivites';
import { UserDetails } from '@/api/users/user-details.fetch.server';
import { AccesRapide } from '@/app/app/Layout/Header/AccesRapide';
import { MenuPrincipal } from '@/app/app/Layout/Header/MenuPrincipal';
import { Header } from '@/ui/design-system/Header/header-with-nav/header-with-nav';

type AppHeaderProps = {
  user?: UserDetails;
  currentCollectivite?: CurrentCollectivite;
  panierId?: string;
};

/**
 * Wrapper for the generic Header component, encapsulates 'use client' context
 */
export const AppHeader = ({
  user,
  currentCollectivite,
  panierId,
}: AppHeaderProps) => {
  return (
    <Header
      title="Territoires en Transitions"
      subtitle="Accompagner la transition écologique des collectivités"
      user={user}
      currentCollectivite={currentCollectivite}
      panierId={panierId}
      AccesRapide={AccesRapide}
      MenuPrincipal={MenuPrincipal}
    />
  );
};
