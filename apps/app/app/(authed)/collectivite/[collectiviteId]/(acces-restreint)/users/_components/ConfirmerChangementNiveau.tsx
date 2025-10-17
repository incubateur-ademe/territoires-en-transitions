import { Dispatch, SetStateAction } from 'react';

import { CollectiviteMembre } from '@/app/referentiels/tableau-de-bord/referents/useMembres';
import { UpdateMembresFunction } from '@/app/referentiels/tableau-de-bord/referents/useUpdateMembres';
import { Modal, ModalFooterOKCancel } from '@/ui';
import { TAccesDropdownOption } from '../@tabs/_components/MembreListTableRow';

type Props = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  selectedOption: TAccesDropdownOption | undefined;
  membre: CollectiviteMembre;
  collectiviteId: number;
  updateMembre: UpdateMembresFunction;
};

/**
 * Confirmation avant de changer le niveau d'accès de l'admin lui-même.
 */
export const ConfirmerChangementNiveau = (props: Props) => {
  const {
    selectedOption,
    membre,
    collectiviteId,
    updateMembre,
    isOpen,
    setIsOpen,
  } = props;

  if (!membre.userId) {
    return;
  }

  return (
    <Modal
      size="md"
      title="Modifier mes droits d’accès la collectivité"
      description="Souhaitez-vous vraiment modifier vos droits d’accès à cette
    collectivité ? Si possible, nommez une nouvelle personne avec
    l’accès admin."
      openState={{ isOpen, setIsOpen }}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            onClick: () => {
              updateMembre([
                {
                  collectiviteId,
                  userId: membre.userId,
                  niveauAcces: selectedOption ?? 'lecture',
                },
              ]);
              close();
            },
          }}
          btnCancelProps={{ onClick: () => close() }}
        />
      )}
    />
  );
};
