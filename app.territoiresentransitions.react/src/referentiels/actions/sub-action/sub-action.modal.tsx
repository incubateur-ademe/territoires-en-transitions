import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import { useActionSummaryChildren } from '../../referentiel-hooks';
import AvancementDetailleSliderAutoSave from '../avancement-detaille/avancement-detaille.slider.auto-save';
import SubActionTasksList from '../sub-action-task/sub-action-task.list';

type Props = {
  actionDefinition: ActionDefinitionSummary;
  openState: OpenState;
};

/**
 * Modale détaillant la liste des tâches d'une sous-action
 * Evolution future : déplacement du contenu de la modale dans un panneau latéral
 * (à confirmer)
 */

const SubActionModal = ({ actionDefinition, openState }: Props) => {
  const { id: actionId, nom: actionName } = actionDefinition;
  const tasks = useActionSummaryChildren(actionDefinition);

  const [displayWarningMessage, setDisplayWarningMessage] = useState(false);

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
            conditionnalDisplay
            onAvancementUpdate={(avancement) =>
              avancement === 'detaille'
                ? setDisplayWarningMessage(true)
                : setDisplayWarningMessage(false)
            }
          />

          {/* Liste des tâches */}
          <SubActionTasksList
            tasks={tasks}
            statusWarningMessage={displayWarningMessage}
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

export default SubActionModal;
