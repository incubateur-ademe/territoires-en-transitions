import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import PrioritesFilterDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesFilterDropdown';
import { FicheResume } from '@/domain/plans';
import { ModalFooterOKCancel } from '@/ui';
import { useState } from 'react';

type PriorityDropdownModalProps = {
  fiche: FicheResume;
  onClose: () => void;
};

export const PriorityDropdownModal = ({
  fiche,
  onClose,
}: PriorityDropdownModalProps) => {
  const [updatedPriority, setUpdatedPriority] = useState(fiche.priorite);
  const [isLoading, setIsLoading] = useState(false);
  const { mutate: updateFiche } = useUpdateFiche();

  const handleSave = async () => {
    return updateFiche({
      ficheId: fiche.id,
      ficheFields: { priorite: updatedPriority },
    });
  };

  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      onClose={onClose}
      openState={{ isOpen: true, setIsOpen: () => {} }}
      title="Statut de la fiche action"
      size="lg"
      render={() => (
        <PrioritesFilterDropdown
          values={updatedPriority ? [updatedPriority] : undefined}
          onChange={({ selectedPriorites }) =>
            setUpdatedPriority(selectedPriorites ?? null)
          }
        />
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
