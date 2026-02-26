import { Dispatch, SetStateAction } from 'react';

import { Membre } from '@/app/collectivites/membres/list-membres/use-list-membres';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { TAccesDropdownOption } from '../../../../../../../src/collectivites/membres/list-membres/list-membres.table-row.editable-cell';

type Props = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  selectedOption: TAccesDropdownOption | undefined;
  membre: Membre;
  updateMembre: () => void;
};

/**
 * Confirmation avant de changer le niveau d'accès de l'admin lui-même.
 */
export const ConfirmerChangementNiveau = (props: Props) => {
  const { updateMembre, isOpen, setIsOpen } = props;

  return (
    <Modal
      size="md"
      title="Modifier mes droits d'accès à la collectivité"
      description="Souhaitez-vous vraiment modifier vos droits d'accès à cette
    collectivité ? Si possible, nommez une nouvelle personne avec
    l'accès admin."
      openState={{ isOpen, setIsOpen }}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            onClick: () => {
              updateMembre();
              close();
            },
          }}
          btnCancelProps={{ onClick: () => close() }}
        />
      )}
    />
  );
};
