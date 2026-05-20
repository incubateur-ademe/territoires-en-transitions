import { appLabels } from '@/app/labels/catalog';
import { Button, Tooltip } from '@tet/ui';
import { ReactElement } from 'react';

export const AskPremiereEtoileButton = ({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}): ReactElement => {
  if (enabled) {
    return (
      <Button size="xs" onClick={onClick}>
        {appLabels.obtenirPremiereEtoile}
      </Button>
    );
  }

  return (
    <Tooltip label={appLabels.tousCriteresRequisPourDemande}>
      <Button size="xs" disabled>
        {appLabels.obtenirPremiereEtoile}
      </Button>
    </Tooltip>
  );
};
