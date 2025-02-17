import { FicheAction } from '@/api/plan-actions';
import ExportFicheActionButton from '@/app/app/pages/collectivite/PlansActions/ExportPdf/ExportFicheActionButton';
import { Button, ButtonProps, Modal, ModalFooter } from '@/ui';

type Props = {
  fiche: FicheAction;
  buttonProps?: Pick<
    ButtonProps,
    'children' | 'title' | 'variant' | 'size' | 'icon' | 'iconPosition'
  >;
};

const defaultButtonProps: ButtonProps = {
  title: 'Exporter en PDF',
  variant: 'grey',
  size: 'xs',
  icon: 'download-fill',
  iconPosition: 'left',
};

const ExportFicheActionModal = ({
  fiche,
  buttonProps = defaultButtonProps,
}: Props) => {
  return (
    <Modal
      title="Exporter en PDF"
      size="lg"
      renderFooter={({ close }) => (
        <ModalFooter variant="right">
          <Button variant="outlined" onClick={close}>
            Annuler
          </Button>
          <ExportFicheActionButton fiche={fiche} />
        </ModalFooter>
      )}
    >
      <Button {...buttonProps} />
    </Modal>
  );
};

export default ExportFicheActionModal;
