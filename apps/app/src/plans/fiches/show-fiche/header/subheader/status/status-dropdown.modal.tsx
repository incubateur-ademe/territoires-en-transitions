import { BaseUpdateFicheModal } from '@/app/plans/fiches/show-fiche/components/base-update-fiche.modal';
import { StatusBadge } from '@/app/plans/fiches/show-fiche/components/status.badge';
import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import { ficheActionStatutOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { FicheWithRelations, Statut } from '@tet/domain/plans';
import { Field, FormSectionGrid, ModalFooterOKCancel, Select } from '@tet/ui';
import { useState } from 'react';

type StatusDropdownModalProps = {
  fiche: FicheWithRelations;
  onClose: () => void;
};

export const StatusDropdownModal = ({
  fiche,
  onClose,
}: StatusDropdownModalProps) => {
  const [updatedStatus, setUpdatedStatus] = useState(fiche.statut);
  const [isLoading, setIsLoading] = useState(false);
  const { updateFiche } = useFicheContext();

  const handleSave = async () => {
    return updateFiche({
      ficheId: fiche.id,
      ficheFields: { statut: updatedStatus },
    });
  };

  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      onClose={onClose}
      openState={{ isOpen: true, setIsOpen: () => {} }}
      title="Statut de l'action"
      size="lg"
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          <Field title="Statut" className="col-span-2">
            <Select
              values={updatedStatus ? [updatedStatus] : undefined}
              onChange={(statut) => setUpdatedStatus(statut as Statut)}
              options={ficheActionStatutOptions}
              customItem={(item) => (
                <StatusBadge status={item.value as Statut} />
              )}
            />
          </Field>
        </FormSectionGrid>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            loading: isLoading,
            onClick: async () => {
              setIsLoading(true);
              await handleSave();
              setIsLoading(false);
              close();
            },
          }}
        />
      )}
    />
  );
};
