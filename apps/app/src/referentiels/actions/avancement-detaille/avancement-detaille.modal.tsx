import { useCollectiviteId } from '@tet/api/collectivites';
import { ActionStatutCreate } from '@tet/domain/referentiels';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { ActionJustificationField } from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/action/action.justification-field';
import { AVANCEMENT_DETAILLE_PAR_STATUT } from '../../utils';
import { useSaveActionStatut } from '../action-statut/use-action-statut';
import { ActionListItem } from '../use-list-actions';
import AvancementDetailleSlider, {
  AvancementValues,
} from './avancement-detaille.slider';

type Props = {
  action: ActionListItem;
  openState: OpenState;
};

/**
 * Modale permettant l'ajustement manuel de l'avancement détaillé
 * + l'ajout d'un texte justificatif
 */

const AvancementDetailleModal = ({ action, openState }: Props) => {
  const collectiviteId = useCollectiviteId();

  const { actionId, nom: actionName } = action;

  const statut = {
    collectiviteId,
    actionId,
    concerne: action.score.concerne,
    avancement: action.score.avancement || 'non_renseigne',
    avancementDetaille: action.score.avancementDetaille,
  };

  const { saveActionStatut } = useSaveActionStatut();
  const [actionStatutUpdate, setActionStatutUpdate] =
    useState<ActionStatutCreate | null>(statut);

  if (!actionStatutUpdate) {
    return null;
  }

  const handleSaveScoreDetaille = (values: AvancementValues) => {
    // Si la jauge est à 100% dans un des statuts, le statut
    // est mis à jour automatiquement
    const avancement =
      values[0] === 1
        ? 'fait'
        : values[1] === 1
        ? 'programme'
        : values[2] === 1
        ? 'pas_fait'
        : 'detaille';

    const newActionStatutUpdate: ActionStatutCreate = {
      ...actionStatutUpdate,
      collectiviteId,
      avancement,
      avancementDetaille: values,
      concerne: true,
    };

    setActionStatutUpdate(newActionStatutUpdate);
  };

  return (
    <Modal
      size="xl"
      title="Détailler l'avancement"
      subTitle={`${actionId.split('_')[1]} ${actionName}`}
      openState={openState}
      render={() => (
        <div className="flex flex-col gap-8">
          {/* Slider pour détailler le score manuellement */}
          <AvancementDetailleSlider
            className="my-8 px-12"
            avancement={
              (actionStatutUpdate.avancementDetaille ||
                AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues
            }
            onChange={handleSaveScoreDetaille}
          />

          {/* Raisons de la répartition */}
          <ActionJustificationField
            actionId={action.actionId}
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
              if (actionStatutUpdate) {
                saveActionStatut(actionStatutUpdate);
              }
              close();
            },
          }}
        />
      )}
    />
  );
};

export default AvancementDetailleModal;
