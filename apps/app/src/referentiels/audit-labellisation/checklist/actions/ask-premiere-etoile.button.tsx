import { appLabels } from '@/app/labels/catalog';
import { getRequestAuditTooltip } from '@/app/referentiels/audit-labellisation/audit-badge-status';
import { Button, Tooltip } from '@tet/ui';
import { ReactElement } from 'react';
import { match } from 'ts-pattern';
import { AskPremiereEtoileButtonState } from './ask-premiere-etoile-button-state';

type DisabledState = Exclude<
  AskPremiereEtoileButtonState,
  { kind: 'requestable' }
>;

const tooltipForDisabledState = (state: DisabledState): string =>
  match(state)
    .with(
      { kind: 'demande-en-cours' },
      () => appLabels.demandePremiereEtoileEnCours
    )
    .with(
      { kind: 'criteres-incomplets' },
      () => appLabels.tousCriteresRequisPourDemande
    )
    .with({ kind: 'autre-cycle-en-cours' }, ({ reason }) =>
      getRequestAuditTooltip(reason)
    )
    .exhaustive();

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
