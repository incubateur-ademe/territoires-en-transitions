import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { Etoile, ReferentielId } from '@tet/domain/referentiels';
import { Modal } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { ReactNode } from 'react';
import { AuditSelection, auditSelectionToRequestInput } from './audit-selection';
import { RequestAuditForm } from './request-audit.form';
import { useRequestAudit } from './data/use-request-audit';

type RequestAuditModalProps = {
  openState: OpenState;
  collectiviteId: number;
  referentielId: ReferentielId;
  isCOT: boolean;
  canRequestLabellisation: boolean;
  maximumRequestableStar: Etoile;
};

export const RequestAuditModal = ({
  openState,
  collectiviteId,
  referentielId,
  isCOT,
  canRequestLabellisation,
  maximumRequestableStar,
}: RequestAuditModalProps): ReactNode => {
  const { setToast } = useToastContext();
  const { mutate, isPending } = useRequestAudit();

  const submitAudit = (selection: AuditSelection, close: () => void): void => {
    mutate(
      auditSelectionToRequestInput(
        { collectiviteId, referentiel: referentielId },
        selection
      ),
      {
        onSuccess: () => {
          setToast('success', appLabels.demandeAuditEnvoyee);
          close();
        },
        onError: (error) => {
          setToast('error', error.message);
        },
      }
    );
  };

  return (
    <Modal
      openState={openState}
      title={appLabels.demanderAudit}
      size="lg"
      render={({ close }) => (
        <RequestAuditForm
          isCOT={isCOT}
          canRequestLabellisation={canRequestLabellisation}
          maximumRequestableStar={maximumRequestableStar}
          isPending={isPending}
          onCancel={close}
          onSubmit={(selection) => submitAudit(selection, close)}
        />
      )}
    />
  );
};
