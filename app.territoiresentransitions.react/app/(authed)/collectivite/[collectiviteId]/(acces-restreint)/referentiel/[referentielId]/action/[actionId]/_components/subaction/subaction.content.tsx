import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import SubActionTasksList from '@/app/referentiels/actions/sub-action-task/sub-action-task.list';
import SubActionPreuvesAccordion from '@/app/referentiels/actions/sub-action/sub-action-preuves.accordion';
import SubActionDescription from '@/app/referentiels/actions/sub-action/sub-action.description';
import { useActionSummaryChildren } from '@/app/referentiels/referentiel-hooks';
import { Accordion } from '@/app/ui/Accordion';

type Props = {
  subAction: ActionDefinitionSummary;
};

const SubActionContent = ({ subAction }: Props) => {
  const { statut } = useActionStatut(subAction.id);
  const tasks = useActionSummaryChildren(subAction);

  const shouldHideTasksStatus =
    (statut !== null &&
      statut?.avancement !== 'non_renseigne' &&
      statut?.avancement !== 'detaille') ||
    statut?.concerne === false;

  return (
    <div>
      <div className="bg-grey-2 border-b border-primary-3 w-full p-4">
        <p className="text-primary-9 text-xl font-bold mb-0">
          {subAction.identifiant} {subAction.nom}
        </p>
      </div>

      <div className="p-6">
        {/* Section Description et Exemples */}
        {subAction.referentiel === 'eci' &&
          (subAction.description || subAction.have_exemples) && (
            <Accordion
              id={`Description-${subAction.id}`}
              className="mb-6"
              titre="Description"
              html={<SubActionDescription subAction={subAction} />}
            />
          )}

        {/* Section Tâches */}
        {tasks.length > 0 && (
          <Accordion
            id={`Tâches-${subAction.id}`}
            dataTest={`TâchesPanel-${subAction.identifiant}`}
            className="mb-6"
            titre="Tâches"
            html={
              <SubActionTasksList
                className="mt-2"
                tasks={tasks}
                hideStatus={
                  shouldHideTasksStatus ||
                  (statut !== null && statut?.avancement === 'detaille')
                }
              />
            }
          />
        )}

        {/* Section Documents */}
        <SubActionPreuvesAccordion subAction={subAction} />
      </div>
    </div>
  );
};

export default SubActionContent;
