import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState, type JSX } from 'react';

type Props = {
  periode: IndicateurPeriode;
  onDismissConfirm: (isConfirmed: boolean) => void;
};

export const ConfirmDeleteSousIndicateursPeriode = ({
  periode,
  onDismissConfirm,
}: Props): JSX.Element => {
  const [isOpen, setIsOpen] = useState(true);
  const periodeLabel = IndicateurPeriodes.format(periode);

  return (
    <Modal
      disableDismiss
      noCloseButton
      size="lg"
      title={appLabels.confirmerSuppression}
      subTitle={appLabels.indicateurSuppressionDonneesCollectivite(
        periodeLabel
      )}
      openState={{ isOpen, setIsOpen }}
      render={() => (
        <p className="text-center mb-0">
          {appLabels.indicateurSuppressionPeriodeAttention(periodeLabel)}
        </p>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            children: appLabels.confirmer,
            onClick: () => {
              onDismissConfirm(true);
              close();
            },
          }}
          btnCancelProps={{
            onClick: () => {
              onDismissConfirm(false);
              close();
            },
          }}
        />
      )}
    />
  );
};
