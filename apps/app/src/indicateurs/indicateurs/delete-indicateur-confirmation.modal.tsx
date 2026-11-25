import { appLabels } from '@/app/labels/catalog';
import { Alert, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

type Props = {
  titre: string;
  enfantsCount: number;
  openState: OpenState;
  onConfirm: () => void;
};

export const DeleteIndicateurConfirmationModal = ({
  titre,
  enfantsCount,
  openState,
  onConfirm,
}: Props) => (
  <Modal
    openState={openState}
    title={appLabels.suppressionIndicateur}
    subTitle={titre}
    render={() =>
      enfantsCount > 0 ? (
        <Alert
          state="warning"
          title={appLabels.indicateurSuppressionParentTitre}
          description={appLabels.indicateurSuppressionParentSousIndicateurs({
            count: enfantsCount,
          })}
        />
      ) : (
        <p className="mb-0">{appLabels.suppressionIndicateurDescription}</p>
      )
    }
    renderFooter={({ close }) => (
      <ModalFooterOKCancel
        btnCancelProps={{
          onClick: () => close(),
        }}
        btnOKProps={{
          'aria-label': appLabels.supprimer,
          children: appLabels.supprimer,
          onClick: () => {
            onConfirm();
            close();
          },
        }}
      />
    )}
  />
);
