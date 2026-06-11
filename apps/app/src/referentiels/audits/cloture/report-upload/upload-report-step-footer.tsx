import { appLabels } from '@/app/labels/catalog';
import { ModalFooterOKCancel } from '@tet/ui';
import { JSX } from 'react';

export const UploadReportStepFooter = ({
  onCancel,
  onNext,
  canGoToNextStep,
}: {
  onCancel: () => void;
  onNext: () => void;
  canGoToNextStep: boolean;
}): JSX.Element => (
  <ModalFooterOKCancel
    btnCancelProps={{ children: appLabels.annuler, onClick: onCancel }}
    btnOKProps={{
      children: appLabels.validerEtPasserEtapeSuivante,
      icon: 'arrow-right-line',
      iconPosition: 'right',
      onClick: onNext,
      disabled: !canGoToNextStep,
    }}
  />
);
