'use client';

import { appLabels } from '@/app/labels/catalog';
import { SendDemandeModal } from '@/app/referentiels/labellisations/send-demande/send-demande.modal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, Tooltip } from '@tet/ui';
import { ReactElement, ReactNode, useState } from 'react';
import { useChecklist } from '../../checklist.context';
import { DemandeVisee, toDemandeVisee } from '../../demande-visee';
import {
  DemandeAvailability,
  getDemandeAvailability,
} from './demande-availability';

const toSendDemandeLabel = (demande: DemandeVisee): string =>
  demande.kind === 'premiere-etoile'
    ? appLabels.obtenirPremiereEtoile
    : appLabels.demanderAudit;

const AvailabilityTooltip = ({
  availability,
  children,
}: {
  availability: DemandeAvailability;
  children: ReactElement;
}): ReactNode =>
  availability.isRequestable ? (
    children
  ) : (
    <Tooltip label={availability.tooltip}>{children}</Tooltip>
  );

const SendDemandeButton = (): ReactNode => {
  const { collectiviteId } = useCurrentCollectivite();
  const { cycle, referentielId, sujetVise } = useChecklist();
  const [isOpen, setIsOpen] = useState(false);

  if (cycle.parcours === null) {
    return null;
  }

  const demande = toDemandeVisee({
    sujetVise,
    etoile: cycle.parcours.etoiles,
  });
  const availability = getDemandeAvailability({
    demande,
    parcours: cycle.parcours,
    isCOT: cycle.isCOT,
    canAskFirstStar: cycle.canAskFirstStar,
  });

  return (
    <>
      <AvailabilityTooltip availability={availability}>
        <Button
          size="xs"
          disabled={!availability.isRequestable}
          onClick={() => setIsOpen(true)}
        >
          {toSendDemandeLabel(demande)}
        </Button>
      </AvailabilityTooltip>
      <SendDemandeModal
        openState={{ isOpen, setIsOpen }}
        collectiviteId={collectiviteId}
        referentiel={referentielId}
        demande={demande}
      />
    </>
  );
};

export { SendDemandeButton };
