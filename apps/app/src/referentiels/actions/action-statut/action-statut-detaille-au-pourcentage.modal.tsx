import { StatutAvancementEnum } from '@tet/domain/referentiels';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { ActionJustificationField } from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/action/action.justification-field';
import { ActionListItem } from '../use-list-actions';
import AvancementDetailleSlider from './action-statut-detaille-au-pourcentage.slider';
import { useUpdateActionStatut } from './use-update-action-statut';

export const DEFAULT_STATUT_DETAILLE_AU_POURCENTAGE: [number, number, number] =
  [0.5, 0.25, 0.25];

type Props = {
  action: ActionListItem;
  openState: OpenState;
};

/**
 * Modale permettant l'ajustement manuel de l'avancement détaillé
 * + l'ajout d'un texte justificatif
 */
export const ActionStatutDetailleAuPourcentageModal = ({
  action,
  openState,
}: Props) => {
  const { actionId, nom: actionName, score } = action;

  const defaultStatutDetailleAuPourcentage =
    score.statut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE
      ? score.avancementDetaille
      : DEFAULT_STATUT_DETAILLE_AU_POURCENTAGE;

  const [statutDetailleAuPourcentage, setStatutDetailleAuPourcentage] =
    useState<[number, number, number]>(
      defaultStatutDetailleAuPourcentage ??
        DEFAULT_STATUT_DETAILLE_AU_POURCENTAGE
    );

  const { mutate: updateActionStatut } = useUpdateActionStatut();

  const handleSave = () => {
    updateActionStatut({
      actionId,
      statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
      statutDetailleAuPourcentage,
    });
  };

  return (
    <Modal
      size="xl"
      title="Détailler l'avancement au pourcentage"
      subTitle={`${actionId.split('_')[1]} ${actionName}`}
      openState={openState}
      render={() => (
        <div className="flex flex-col gap-8">
          {/* Slider pour détailler le score manuellement */}
          <AvancementDetailleSlider
            className="my-8 px-12"
            avancement={statutDetailleAuPourcentage}
            onChange={setStatutDetailleAuPourcentage}
          />

          {/* Raisons de la répartition */}
          <ActionJustificationField
            action={action}
            hint="Pour faciliter la relecture, vous pouvez préciser ici les raisons de cette répartition"
          />
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            children: 'Annuler',
            onClick: close,
          }}
          btnOKProps={{
            variant: 'primary',
            children: 'Valider',
            onClick: () => {
              handleSave();
              close();
            },
          }}
        />
      )}
    />
  );
};
