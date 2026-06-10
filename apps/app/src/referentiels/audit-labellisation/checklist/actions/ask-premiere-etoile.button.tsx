import { appLabels } from '@/app/labels/catalog';
import { getRequestAuditTooltip } from '@/app/referentiels/audit-labellisation/audit-badge-status';
import { Button, Tooltip } from '@tet/ui';
import { ReactElement } from 'react';
import { AskPremiereEtoileButtonState } from './ask-premiere-etoile-button-state';

type DisabledState = Exclude<
  AskPremiereEtoileButtonState,
  { kind: 'requestable' }
>;

const tooltipForDisabledState = (state: DisabledState): string => {
  switch (state.kind) {
    case 'demande-en-cours':
      return appLabels.demandePremiereEtoileEnCours;
    case 'criteres-incomplets':
      return appLabels.tousCriteresRequisPourDemande;
    case 'autre-cycle-en-cours':
      return getRequestAuditTooltip(state.reason);
  }
};

export const AskPremiereEtoileButton = ({
  state,
  onClick,
}: {
  state: AskPremiereEtoileButtonState;
  onClick: () => void;
}): ReactElement => {
  if (state.kind === 'requestable') {
    return (
      <Button size="xs" onClick={onClick}>
        {appLabels.obtenirPremiereEtoile}
      </Button>
    );
  }

  return (
    <Tooltip label={tooltipForDisabledState(state)}>
      <Button size="xs" disabled>
        {appLabels.obtenirPremiereEtoile}
      </Button>
    </Tooltip>
  );
};
