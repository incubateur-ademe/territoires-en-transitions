'use client';

import { AccesRapide } from '@/site/components/layout/AccesRapide';
import { MenuPrincipal } from '@/site/components/layout/MenuPrincipal';
import { Header } from '@/ui/design-system/Header/header-with-nav/header-with-nav';

export const SiteHeader = ({}) => {
  return (
    <Header
      title="Territoires en Transitions"
      subtitle="Accompagner la transition écologique des collectivités"
      AccesRapide={AccesRapide}
      MenuPrincipal={MenuPrincipal}
    />
  );
};
