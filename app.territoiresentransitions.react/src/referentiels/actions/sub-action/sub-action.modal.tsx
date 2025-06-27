import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import TasksList from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/task/task.cards-list';
import { useActionSummaryChildren } from '../../referentiel-hooks';
import AvancementDetailleSliderAutoSave from '../avancement-detaille/avancement-detaille.slider.auto-save';

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

  const [hideStatus, setHideStatus] = useState(false);

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
            conditionnalDisplay={tasks.length > 0}
            onAvancementUpdate={(avancement) =>
              avancement === 'detaille'
                ? setHideStatus(true)
                : setHideStatus(false)
            }
          />

          {/* Liste des tâches */}
          {tasks.length > 0 && (
            <TasksList
              tasks={tasks}
              hideStatus={hideStatus}
              shouldShowJustifications
            />
          )}
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
