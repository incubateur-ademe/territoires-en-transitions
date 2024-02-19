import AdemeLogo from '@assets/AdemeLogo';
import RepubliqueFrancaiseLogo from '@assets/RepubliqueFrancaiseLogo';
import {Button} from '@design-system/Button';
import {ButtonProps} from '@design-system/Button/types';
import {Header} from '@design-system/Header/Header';

import {ReactElement} from 'react';

type HeaderTeTProps = {
  customLogos?: React.ReactNode[];
  quickAccessButtons?: (props: ButtonProps) => ReactElement<typeof Button>[];
};

export const HeaderTeT = ({
  customLogos,
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
      quickAccessButtons={quickAccessButtons}
    />
  );
};
