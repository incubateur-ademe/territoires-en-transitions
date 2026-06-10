'use client';

import { appLabels } from '@/app/labels/catalog';
import { getRequestAuditTooltip } from '@/app/referentiels/audit-labellisation/audit-badge-status';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  AuditLabellisationReferentielId,
  AuditRequestUnavailableReason,
  getAuditRequestAvailability,
} from '@tet/domain/referentiels';
import { Button, Icon, Tooltip } from '@tet/ui';
import { ReactElement, ReactNode, useState } from 'react';
import { useRolePilotesPresence } from '../../audit-labellisation/use-role-pilotes-presence';
import { useCycleLabellisation } from '../useCycleLabellisation';
import { StartAuditModal } from './start-audit.modal';

type StartAuditButtonProps = {
  referentielId: AuditLabellisationReferentielId;
};

const OptionalTooltip = ({
  label,
  children,
}: {
  label: string | null;
  children: ReactElement;
}): ReactNode =>
  label ? <Tooltip label={label}>{children}</Tooltip> : children;

const tooltipForUnavailableReason = (
  reason: AuditRequestUnavailableReason
): string => {
  switch (reason.kind) {
    case 'cycleUnavailable':
      return getRequestAuditTooltip(reason.cause);
    case 'noRequestableAuditType':
      return appLabels.demanderAuditScoreInsuffisant;
    case 'prerequisitesIncomplete':
      return appLabels.renseignerCriteresPourDemande;
    case 'rolePilotesIncomplete':
      return appLabels.renseignerPilotesPourDemande;
  }
};

export const StartAuditButton = ({
  referentielId,
}: StartAuditButtonProps): ReactNode => {
  const { collectiviteId } = useCurrentCollectivite();
  const { parcours, isCOT, maximumRequestableStar, viewerRole } =
    useCycleLabellisation(referentielId);
  const { presence: rolePilotesPresence, isLoaded: rolePilotesLoaded } =
    useRolePilotesPresence(referentielId);
  const [isOpen, setIsOpen] = useState(false);

  if (
    parcours === null ||
    maximumRequestableStar === null ||
    !rolePilotesLoaded
  ) {
    return null;
  }

  if (viewerRole !== 'auditee') {
    return null;
  }

  const availability = getAuditRequestAvailability(parcours, {
    isCOT,
    maximumRequestableStar,
    rolePilotesPresence,
  });

  const tooltip = availability.canRequest
    ? null
    : tooltipForUnavailableReason(availability.reason);

  const button = (
    <Button
      size="xs"
      disabled={!availability.canRequest}
      onClick={() => setIsOpen(true)}
      variant="outlined"
    >
      {appLabels.demanderAudit}
      <Icon icon="arrow-right-line" />
    </Button>
  );

  return (
    <>
      <OptionalTooltip label={tooltip}>{button}</OptionalTooltip>
      <StartAuditModal
        openState={{ isOpen, setIsOpen }}
        collectiviteId={collectiviteId}
        referentielId={referentielId}
        isCOT={isCOT}
        canRequestLabellisation={maximumRequestableStar >= 2}
        maximumRequestableStar={maximumRequestableStar}
      />
    </>
  );
};
