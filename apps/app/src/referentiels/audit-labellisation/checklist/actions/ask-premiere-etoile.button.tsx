import { appLabels } from '@/app/labels/catalog';
import { Button, Tooltip } from '@tet/ui';
import { ReactElement } from 'react';
import { AskPremiereEtoileButtonState } from './ask-premiere-etoile-button-state';

const DisabledAskPremiereEtoileButton = ({
  tooltipLabel,
}: {
  tooltipLabel: string;
}): ReactElement => (
  <Tooltip label={tooltipLabel}>
    <Button size="xs" disabled>
      {appLabels.obtenirPremiereEtoile}
    </Button>
  </Tooltip>
);

export const AskPremiereEtoileButton = ({
  state,
  onClick,
}: {
  state: AskPremiereEtoileButtonState;
  onClick: () => void;
}): ReactElement => {
  if (state === 'demande-en-cours') {
    return (
      <DisabledAskPremiereEtoileButton
        tooltipLabel={appLabels.demandePremiereEtoileEnCours}
      />
    );
  }

  if (state === 'criteres-incomplets') {
    return (
      <DisabledAskPremiereEtoileButton
        tooltipLabel={appLabels.tousCriteresRequisPourDemande}
      />
    );
  }

  return (
    <Button size="xs" onClick={onClick}>
      {appLabels.obtenirPremiereEtoile}
    </Button>
  );
};
