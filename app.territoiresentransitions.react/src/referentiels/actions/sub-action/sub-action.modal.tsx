import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { Checkbox, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { ChangeEvent, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useActionSummaryChildren } from '../../referentiel-hooks';
import { AVANCEMENT_DETAILLE_PAR_STATUT } from '../../utils';
import {
  useActionStatut,
  useSaveActionStatut,
} from '../action-statut/use-action-statut';
import SubActionTasksList from '../sub-action-task/sub-action-task.list';
import AvancementDetailleSlider, {
  AvancementValues,
} from '../sub-action.detail/avancement-detaille.slider';
import ActionJustification from './sub-action-justification';
import { useSaveActionJustification } from './use-justification';

type Props = {
  actionDefinition: ActionDefinitionSummary;
  openState: OpenState;
  onSaveScoreDetaille: (values: number[]) => void;
};

/**
 * Modale détaillant la liste des tâches d'une sous-action
 * Evolution future : déplacement du contenu de la modale dans un panneau latéral
 * (à confirmer)
 */

const SubActionModal = ({
  actionDefinition,
  openState,
  onSaveScoreDetaille,
}: Props) => {
  const collectiviteId = useCollectiviteId();
  const { id: actionId, nom: actionName } = actionDefinition;

  const { statut } = useActionStatut(actionDefinition.id);
  const { avancement, avancementDetaille } = statut || {};
  const { saveActionStatut } = useSaveActionStatut();
  const { saveActionJustification } = useSaveActionJustification();

  const tasks = useActionSummaryChildren(actionDefinition);

  const isScoreDetailleFilled =
    avancementDetaille?.length === 3 &&
    !avancementDetaille.find((av) => av === 1);

  const [isPercentageScore, setIsPercentageScore] = useState(
    avancement === 'detaille'
  );
  const [currentAvancement, setCurrentAvancement] = useState<AvancementValues>(
    (isScoreDetailleFilled
      ? avancementDetaille
      : AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues
  );

  const handleSwithPercentageScore = (evt: ChangeEvent<HTMLInputElement>) => {
    const isChecked = evt.currentTarget.checked;
    setIsPercentageScore(isChecked);
    if (isChecked) {
      saveActionStatut({
        actionId: actionId,
        collectiviteId: collectiviteId,
        avancement: 'detaille',
        avancementDetaille: (isScoreDetailleFilled
          ? avancementDetaille
          : AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues,
        concerne: true,
      });
    } else {
      saveActionStatut({
        actionId: actionId,
        collectiviteId: collectiviteId,
        avancement: 'non_renseigne',
        avancementDetaille: null,
        concerne: true,
      });
    }
  };

  const handleDebouncedScoreDetaille = useDebouncedCallback(
    onSaveScoreDetaille,
    500
  );

  const handleSaveScoreDetaille = (values: AvancementValues) => {
    setCurrentAvancement(values);
    handleDebouncedScoreDetaille(values);
  };

  return (
    <Modal
      size="xl"
      title="Détailler l'avancement"
      subTitle={`${actionId.split('_')[1]} ${actionName}`}
      openState={openState}
      render={() => (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            {/* Switch pour passer au mode manuel */}
            <Checkbox
              variant="switch"
              label="Détailler l’avancement au pourcentage"
              checked={isPercentageScore}
              onChange={handleSwithPercentageScore}
            />

            {/* Slider pour détailler le score manuellement */}
            {isPercentageScore && (
              <>
                <div className="mx-12">
                  <AvancementDetailleSlider
                    className="my-8"
                    avancement={currentAvancement}
                    onChange={handleSaveScoreDetaille}
                  />
                </div>

                <ActionJustification
                  action={actionDefinition}
                  title="Justification de l’ajustement manuel"
                  subtitle="Précisez les raisons de cette répartition, dont les initiatives complémentaires à valoriser, pour faciliter la relecture et l’audit"
                  onSave={saveActionJustification}
                />
              </>
            )}
          </div>

          {/* Liste des tâches */}
          <SubActionTasksList
            tasks={tasks}
            statusWarningMessage={isPercentageScore}
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
