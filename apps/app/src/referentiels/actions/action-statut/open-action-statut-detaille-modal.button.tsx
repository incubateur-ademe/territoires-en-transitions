import {
  StatutAvancement,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { Button } from '@tet/ui';
import { ComponentProps, useState } from 'react';
import { ActionListItem } from '../use-list-actions';
import { ActionStatutDetailleALaTacheModal } from './action-statut-detaille-a-la-tache.modal';
import { ActionStatutDetailleAuPourcentageModal } from './action-statut-detaille-au-pourcentage.modal';

interface Props extends Pick<ComponentProps<typeof Button>, 'ref'> {
  action: ActionListItem;
  statut: StatutAvancement;
}

export const OpenActionStatutDetailleModalButton = ({
  action,
  statut,
  ...props
}: Props) => {
  const [
    openActionStatutDetailleALaTacheModal,
    setOpenActionStatutDetailleALaTacheModal,
  ] = useState(false);
  const [
    openStatutDetailleAuPourcentageModal,
    setOpenStatutDetailleAuPourcentageModal,
  ] = useState(false);

  const hasStatutDetaille =
    statut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE ||
    statut === StatutAvancementEnum.DETAILLE_A_LA_TACHE;

  const openStatutDetailleModal = (
    selectedStatut: Extract<
      StatutAvancement,
      'detaille_a_la_tache' | 'detaille'
    >
  ) => {
    if (selectedStatut === StatutAvancementEnum.DETAILLE_A_LA_TACHE) {
      setOpenActionStatutDetailleALaTacheModal(true);
    } else {
      setOpenStatutDetailleAuPourcentageModal(true);
    }
  };

  if (!hasStatutDetaille) {
    return null;
  }

  return (
    <>
      <Button
        data-test="DetaillerAvancementButton"
        icon="edit-line"
        title="Détailler l'avancement"
        variant="underlined"
        size="xs"
        onClick={() => openStatutDetailleModal(statut)}
        {...props}
      />

      {openActionStatutDetailleALaTacheModal && (
        <div onClick={(evt) => evt.stopPropagation()}>
          <ActionStatutDetailleALaTacheModal
            action={action}
            openState={{
              isOpen: openActionStatutDetailleALaTacheModal,
              setIsOpen: setOpenActionStatutDetailleALaTacheModal,
            }}
          />
        </div>
      )}

      {openStatutDetailleAuPourcentageModal && (
        <div onClick={(evt) => evt.stopPropagation()}>
          <ActionStatutDetailleAuPourcentageModal
            key={action.actionId}
            action={action}
            openState={{
              isOpen: openStatutDetailleAuPourcentageModal,
              setIsOpen: setOpenStatutDetailleAuPourcentageModal,
            }}
          />
        </div>
      )}
    </>
  );
};
