import AdemeLogo from '@/ui/assets/AdemeLogo';
import RepubliqueFrancaiseLogo from '@/ui/assets/RepubliqueFrancaiseLogo';
import { Header } from '@/ui/design-system/Header/header-with-nav/header-with-nav';
import { HeaderPropsWithModalState } from '@/ui/design-system/Header/header-with-nav/types';
import { ComponentType } from 'react';

type HeaderTeTProps = {
  /** Logos supplémentaires à afficher en fonction de la page visitée */
  customLogos?: React.ReactNode[];
  /** Url accessible en cliquant sur le titre et le logo du header */
  customRootUrl?: string;
  /** Accès rapide */
  AccesRapide?: ComponentType<HeaderPropsWithModalState>;
};

/**
 * Header par défaut des applications Territoires en Transitions
 */

export const HeaderTeT = ({
  customLogos,
  customRootUrl,
  AccesRapide,
}: HeaderTeTProps) => {
  return (
    <Header
      title="Territoires en transitions"
      subtitle="Accompagner la transition écologique des collectivités"
      logos={[
        <RepubliqueFrancaiseLogo className="h-full" />,
        <AdemeLogo className="h-full" />,
        ...(customLogos ?? []),
      ]}
      customRootUrl={customRootUrl}
      AccesRapide={AccesRapide}
    />
  );
};
