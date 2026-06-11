import { appLabels } from '@/app/labels/catalog';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { JSX } from 'react';
import { useValidateAudit } from '../data/use-validate-audit';
import { MailTemplateStepFooter } from './mail-template-step-footer';
import { MailTemplate } from './mail-template.view';

type MailStepArgs = {
  auditId: number;
  demandeId: number | null;
  isUploading: boolean;
  engagementChecked: boolean;
  onEngagementCheckedChange: (next: boolean) => void;
  onBack: () => void;
  onCancel: () => void;
  onCompleted: () => void;
};

export const useMailStep = ({
  auditId,
  demandeId,
  isUploading,
  engagementChecked,
  onEngagementCheckedChange,
  onBack,
  onCancel,
  onCompleted,
}: MailStepArgs): { body: JSX.Element; footer: JSX.Element } => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const { mutate: validateAudit, isPending } = useValidateAudit();
  const { setToast } = useToastContext();

  const handleSubmit = async (): Promise<void> => {
    if (isPending || !collectiviteId || !referentielId) return;

    try {
      const parcours = await queryClient.fetchQuery(
        trpc.referentiels.labellisations.getParcours.queryOptions({
          collectiviteId,
          referentielId,
        })
      );
      if (parcours.audit?.valide) {
        setToast('success', appLabels.auditDejaClosParAutre);
        onCompleted();
        return;
      }
    } catch {
      // fall-through vers la mutation, qui a son propre onError
    }

    validateAudit(
      { auditId },
      {
        onSuccess: onCompleted,
        onError: () => setToast('error', appLabels.echecValidationAudit),
      }
    );
  };

  return {
    body: (
      <MailTemplate
        demandeId={demandeId}
        engagementChecked={engagementChecked}
        onEngagementCheckedChange={onEngagementCheckedChange}
      />
    ),
    footer: (
      <MailTemplateStepFooter
        onBack={onBack}
        onCancel={onCancel}
        onSubmit={handleSubmit}
        canSubmit={engagementChecked && !isPending && !isUploading}
        isPending={isPending}
      />
    ),
  };
};
