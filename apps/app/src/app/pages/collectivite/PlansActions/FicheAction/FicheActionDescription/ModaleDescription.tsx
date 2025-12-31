import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { FicheWithRelations } from '@tet/domain/plans';
import { Button, Event, ModalFooterOKCancel, useEventTracker } from '@tet/ui';
import BaseUpdateFicheModal from '../FicheActionPlanning/base-update-fiche-modal';
import { FicheDescriptionForm } from './FicheDescriptionForm';

type ModaleDescriptionProps = {
  fiche: FicheWithRelations;
};

const ModaleDescription = ({ fiche }: ModaleDescriptionProps) => {
  const formId = `update-fiche-${fiche.id}-form`;
  const { mutateAsync: updateFiche } = useUpdateFiche();
  const tracker = useEventTracker();

  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      title="Modifier l'action"
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
    </BaseUpdateFicheModal>
  );
};

export default ModaleDescription;
