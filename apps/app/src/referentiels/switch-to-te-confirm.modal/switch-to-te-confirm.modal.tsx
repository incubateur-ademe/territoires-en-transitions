'use client';

import { appLabels } from '@/app/labels/catalog';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { SwitchToTeConfirmationFooter } from './switch-to-te-confirmation-footer';
import { SwitchToTeConfirmationStep } from './switch-to-te-confirmation-step';
import { SwitchToTeErrorStep } from './switch-to-te-error-step';
import { SwitchToTeInfoStep } from './switch-to-te-info-step';
import { SwitchToTeProgressStep } from './switch-to-te-progress-step';
import { SwitchToTeSuccessStep } from './switch-to-te-success-step';
import { useSwitchToTeConfirmState } from './use-switch-to-te-confirm-state';

type Props = { isOpen: boolean; onClose: () => void };

export const SwitchToTeConfirmModal = ({ isOpen, onClose }: Props) => {
  const flow = useSwitchToTeConfirmState();
  const { step } = flow;
  const isBusy = step === 'progress' || step === 'success';
  const showSubtitle = step === 'info' || step === 'confirmation';

  return (
    <Modal
      size="md"
      dataTest="referentiels.switch-to-te.confirm-modal"
      openState={{
        isOpen,
        setIsOpen: (open) => {
          if (!open) onClose();
        },
      }}
      noCloseButton={isBusy}
      disableDismiss={isBusy}
      title={appLabels.switchToTe}
      subTitle={
        showSubtitle
          ? step === 'info'
            ? appLabels.switchToTeConfirmEtapeInfo
            : appLabels.switchToTeConfirmEtapeConfirmation
          : undefined
      }
      render={({ close }) => {
        switch (step) {
          case 'progress':
            return <SwitchToTeProgressStep />;
          case 'success':
            return (
              <SwitchToTeSuccessStep
                onDone={() => {
                  // on ferme d'abord, puis on propage la bascule : le refresh
                  // démonte ce bandeau, il ne doit pas court-circuiter la
                  // fermeture.
                  close();
                  flow.applySwitch();
                }}
              />
            );
          case 'error':
            return <SwitchToTeErrorStep error={flow.error} />;
          case 'confirmation':
            return <SwitchToTeConfirmationStep state={flow} />;
          default:
            return <SwitchToTeInfoStep />;
        }
      }}
      renderFooter={
        isBusy
          ? undefined
          : step === 'error'
          ? ({ close }) => (
              <ModalFooterOKCancel
                btnCancelProps={{ children: appLabels.fermer, onClick: close }}
                btnOKProps={{
                  children: appLabels.switchToTeConfirmRetry,
                  onClick: flow.retry,
                }}
              />
            )
          : step === 'confirmation'
          ? ({ close }) => (
              <SwitchToTeConfirmationFooter
                onClose={close}
                onPrevious={flow.goToInfo}
                canSubmit={flow.canSubmit}
                onSubmit={flow.submit}
              />
            )
          : ({ close }) => (
              <ModalFooterOKCancel
                btnCancelProps={{ children: appLabels.annuler, onClick: close }}
                btnOKProps={{
                  children: appLabels.switchToTeConfirmContinue,
                  onClick: flow.goToConfirmation,
                }}
              />
            )
      }
    />
  );
};
