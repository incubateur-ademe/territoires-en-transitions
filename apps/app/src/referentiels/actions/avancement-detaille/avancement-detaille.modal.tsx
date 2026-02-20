import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { ActionStatutCreate } from '@tet/domain/referentiels';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { ActionJustificationField } from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/action/action.justification-field';
import { useSaveActionStatut } from '../action-statut/use-action-statut';
import AvancementDetailleSliderWithCheckbox from './avancement-detaille.slider.with-checkbox';

type Props = {
  actionDefinition: ActionDefinitionSummary;
  openState: OpenState;
};

/**
 * Modale permettant l'ajustement manuel de l'avancement détaillé
 * + l'ajout d'un texte justificatif
 */

const AvancementDetailleModal = ({ actionDefinition, openState }: Props) => {
  const { id: actionId, nom: actionName } = actionDefinition;
  const { saveActionStatut } = useSaveActionStatut();
  const [actionStatutUpdate, setActionStatutUpdate] =
    useState<ActionStatutCreate | null>(null);

  return (
    <Modal
      size="xl"
      title="Détailler l'avancement"
      subTitle={`${actionId.split('_')[1]} ${actionName}`}
      openState={openState}
      render={() => (
        <div className="flex flex-col gap-8">
          {/* Slider pour détailler le score manuellement */}
          <AvancementDetailleSliderWithCheckbox
            className="my-8 px-12"
            actionId={actionId}
            onAvancementDetailleUpdate={(actionStatutUpdate) =>
              setActionStatutUpdate(actionStatutUpdate)
            }
          />

          {/* Raisons de la répartition */}
          <ActionJustificationField
            actionId={actionDefinition.id}
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
