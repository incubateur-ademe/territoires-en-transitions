import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import {
  Button,
  Event,
  Modal,
  ModalFooterOKCancel,
  useEventTracker,
} from '@/ui';
import {
  FicheDescriptionForm,
  type FicheUpdatePayload,
} from './FicheDescriptionForm';

type ModaleDescriptionProps = {
  fiche: FicheUpdatePayload;
};

const ModaleDescription = ({ fiche }: ModaleDescriptionProps) => {
  const formId = `update-fiche-${fiche.id}-form`;
  const { mutateAsync: updateFiche } = useUpdateFiche();
  const tracker = useEventTracker();

  return (
    <Modal
      title="Modifier la fiche"
      footerIsAlwaysVisible
      size="lg"
      render={({ close }) => (
        <FicheDescriptionForm
          fiche={fiche}
          onSubmit={async (fiche) => {
            try {
              await updateFiche({
                ficheId: fiche.id,
                ficheFields: fiche,
              });
              tracker(Event.fiches.updateDescription);
              close();
            } catch (err) {
              console.error(err);
            }
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
