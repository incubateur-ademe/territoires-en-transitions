import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import { Button, Modal, ModalFooterOKCancel } from '@/ui';
import {
  FicheDescriptionForm,
  type FicheUpdatePayload,
} from './FicheDescriptionForm';

type ModaleDescriptionProps = {
  fiche: FicheUpdatePayload;
};

const ModaleDescription = ({ fiche }: ModaleDescriptionProps) => {
  const formId = `update-fiche-${fiche.id}-form`;
  const { mutate: updateFiche } = useUpdateFiche();
  return (
    <Modal
      title="Modifier la fiche"
      size="lg"
      render={({ close }) => (
        <FicheDescriptionForm
          fiche={fiche}
          onSubmit={(fiche) => {
            updateFiche(
              {
                ficheId: fiche.id,
                ficheFields: fiche,
              },
              {
                onSuccess: close,
                onError: (err) => console.error(err),
              }
            );
          }}
          formId={formId}
        />
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: close,
          }}
          btnOKProps={{
            form: formId,
          }}
        />
      )}
    >
      <Button
        icon="edit-fill"
        title="Modifier les informations"
        variant="white"
        size="xs"
        className="h-fit"
      />
    </Modal>
  );
};

export default ModaleDescription;
