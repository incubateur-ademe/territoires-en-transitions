'use client';

import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { Button } from '@tet/ui';
import { ReactNode, useState } from 'react';
import { useCycleLabellisation } from '../useCycleLabellisation';
import { StartAuditModal } from './start-audit.modal';

type StartAuditButtonProps = {
  referentielId: ReferentielId;
};

export const StartAuditButton = ({
  referentielId,
}: StartAuditButtonProps): ReactNode => {
  const { hasCollectivitePermission, isRoleAuditeur, collectiviteId } =
    useCurrentCollectivite();
  const { status, parcours, isCOT, labellisable } =
    useCycleLabellisation(referentielId);
  const [isOpen, setIsOpen] = useState(false);

  if (parcours === null) {
    return null;
  }

  const canRequestAudit =
    hasCollectivitePermission('referentiels.mutate') &&
    !isRoleAuditeur &&
    status === 'non_demandee';

  if (!canRequestAudit) {
    return null;
  }

  return (
    <>
      <Button size="xs" onClick={() => setIsOpen(true)}>
        {appLabels.demanderAudit}
      </Button>
      <StartAuditModal
        openState={{ isOpen, setIsOpen }}
        collectiviteId={collectiviteId}
        referentielId={referentielId}
        canAskCOTLabellisation={isCOT}
        labellisable={labellisable}
        maximumPossibleStarToRequest={parcours.etoiles}
      />
    </>
  );
};
