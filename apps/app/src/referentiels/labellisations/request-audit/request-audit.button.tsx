'use client';

import { appLabels } from '@/app/labels/catalog';
import { getRequestAuditTooltip } from '@/app/referentiels/audit-labellisation/audit-badge-status';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  AuditLabellisationReferentielId,
  AuditRequestUnavailableReason,
  getAuditRequestAvailability,
  listAuditTypeOptions,
} from '@tet/domain/referentiels';
import { Button, Icon, Tooltip } from '@tet/ui';
import { ReactElement, ReactNode, useState } from 'react';
import { match } from 'ts-pattern';
import { useCycleLabellisation } from '../useCycleLabellisation';
import { RequestAuditModal } from './request-audit.modal';

type RequestAuditButtonProps = {
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
): string =>
  match(reason)
    .with({ kind: 'cycleUnavailable' }, ({ cause }) =>
      getRequestAuditTooltip(cause)
    )
    .with(
      { kind: 'auditTypeUnavailable', cause: 'SCORE_BELOW_AUDITABLE_STAR' },
      () => appLabels.demanderAuditScoreInsuffisant
    )
    .with(
      { kind: 'auditTypeUnavailable', cause: 'REFERENTIEL_NOT_COMPLETED' },
      () => appLabels.completudeCritere
    )
    .with(
      {
        kind: 'auditTypeUnavailable',
        cause: 'SCORE_GLOBAL_CRITERIA_NOT_SATISFIED',
      },
      {
        kind: 'auditTypeUnavailable',
        cause: 'SCORE_ACTIONS_CRITERIA_NOT_SATISFIED',
      },
      { kind: 'auditTypeUnavailable', cause: 'REFERENT_ROLES_NOT_DEFINED' },
      { kind: 'auditTypeUnavailable', cause: 'MISSING_FILE' },
      () => appLabels.renseignerCriteresPourDemande
    )
    .exhaustive();

export const RequestAuditButton = ({
  referentielId,
}: RequestAuditButtonProps): ReactNode => {
  const { collectiviteId } = useCurrentCollectivite();
  const { parcours, isCOT, maximumRequestableStar, viewerRole } =
    useCycleLabellisation(referentielId);
  const [isOpen, setIsOpen] = useState(false);

  if (parcours === null || maximumRequestableStar === null) {
    return null;
  }

  if (viewerRole !== 'auditee') {
    return null;
  }

  const auditTypeOptions = listAuditTypeOptions(parcours, {
    isCOT,
    maximumRequestableStar,
  });
  const availability = getAuditRequestAvailability(parcours, auditTypeOptions);

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
      <RequestAuditModal
        openState={{ isOpen, setIsOpen }}
        collectiviteId={collectiviteId}
        referentielId={referentielId}
        auditTypeOptions={auditTypeOptions}
        maximumRequestableStar={maximumRequestableStar}
      />
    </>
  );
};
