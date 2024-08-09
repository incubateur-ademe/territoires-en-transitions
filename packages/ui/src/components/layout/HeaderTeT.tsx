import AdemeLogo from '@tet/ui/assets/AdemeLogo';
import RepubliqueFrancaiseLogo from '@tet/ui/assets/RepubliqueFrancaiseLogo';
import { Button } from '@tet/ui/design-system/Button';
import { ButtonProps } from '@tet/ui/design-system/Button/types';
import { Header } from '@tet/ui/design-system/Header/Header';

import { ReactElement } from 'react';

type HeaderTeTProps = {
  /** Logos supplémentaires à afficher en fonction de la page visitée */
  customLogos?: React.ReactNode[];
  /** Url accessible en cliquant sur le titre et le logo du header */
  customRootUrl?: string;
  /** Menu accès rapide */
  quickAccessButtons?: (props: ButtonProps) => ReactElement<typeof Button>[];
};

/**
 * Header par défaut des applications Territoires en Transitions
 */

export const HeaderTeT = ({
  customLogos,
  customRootUrl,
  quickAccessButtons,
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
      quickAccessButtons={quickAccessButtons}
    />
  );
};
