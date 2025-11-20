import { Dispatch, SetStateAction } from 'react';

import { Modal, ModalFooterOKCancel } from '@tet/ui';
import {
  Membre,
  TUpdateMembre,
} from '../../../../../../../src/app/pages/collectivite/Users/types';
import { TAccesDropdownOption } from '../@tabs/_components/MembreListTableRow';

type Props = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  selectedOption: TAccesDropdownOption | undefined;
  membre: Membre;
  updateMembre: TUpdateMembre;
};

/**
 * Confirmation avant de changer le niveau d'accès de l'admin lui-même.
 */
export const ConfirmerChangementNiveau = (props: Props) => {
  const { selectedOption, membre, updateMembre, isOpen, setIsOpen } = props;
  const membre_id = membre.user_id;
  if (!membre_id) {
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
              updateMembre({
                membre_id,
                name: 'niveau_acces',
                value: selectedOption ?? 'lecture',
              });
              close();
            },
          }}
          btnCancelProps={{ onClick: () => close() }}
        />
      )}
    />
  );
};
