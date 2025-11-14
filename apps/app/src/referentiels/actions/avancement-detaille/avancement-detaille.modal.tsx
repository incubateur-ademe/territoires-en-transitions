import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { ActionJustificationField } from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/action/action.justification-field';
import AvancementDetailleSliderAutoSave from './avancement-detaille.slider.auto-save';

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

  return (
    <Modal
      size="xl"
      title="Détailler l'avancement"
      subTitle={`${actionId.split('_')[1]} ${actionName}`}
      openState={openState}
      render={() => (
        <div className="flex flex-col gap-8">
          {/* Slider pour détailler le score manuellement */}
          <AvancementDetailleSliderAutoSave
            className="my-8 px-12"
            actionId={actionId}
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
          btnOKProps={{
            variant: 'outlined',
            children: 'Fermer',
            onClick: close,
          }}
        />
      )}
    />
  );
};

export default AvancementDetailleModal;
