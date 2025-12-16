import { BaseUpdateFicheModal } from '@/app/plans/fiches/show-fiche/components/base-update-fiche.modal';
import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import PrioritesFilterDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesFilterDropdown';
import { FicheWithRelations } from '@tet/domain/plans';
import { ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';

type PriorityDropdownModalProps = {
  fiche: FicheWithRelations;
  onClose: () => void;
};

export const PriorityDropdownModal = ({
  fiche,
  onClose,
}: PriorityDropdownModalProps) => {
  const [updatedPriority, setUpdatedPriority] = useState(fiche.priorite);
  const [isLoading, setIsLoading] = useState(false);
  const { updateFiche } = useFicheContext();

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
      title="Priorité de l'action"
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
