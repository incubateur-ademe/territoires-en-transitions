import {useRef} from 'react';
import {useParams} from 'react-router-dom';

import PlanActionHeader from './PlanActionHeader';
import PlanActionAxe from './PlanActionAxe';
import PictoLeaf from 'ui/pictogrammes/PictoLeaf';
import {AxeActions} from './AxeActions';
import FicheActionCard from '../FicheAction/FicheActionCard';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {makeCollectivitePlanActionFicheUrl} from 'app/paths';
import {usePlanAction} from './data/usePlanAction';
import {useEditAxe} from './data/useEditAxe';
import {TPlanAction} from './data/types/PlanAction';
import TextareaControlled from 'ui/shared/form/TextareaControlled';

type PlanActionProps = {
  plan: TPlanAction;
};

export const PlanAction = ({plan}: PlanActionProps) => {
  const collectivite_id = useCollectiviteId();

  const {mutate: updatePlan} = useEditAxe(plan.id);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleEditButtonClick = () => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const displaySousAxe = (axe: TPlanAction) => (
    <PlanActionAxe
      key={axe.id}
      plan_id={plan.id}
      axe={axe}
      displayAxe={displaySousAxe}
    />
  );

  return (
    <div className="w-full">
      <div className="bg-indigo-400">
        <h4 className="group max-w-4xl flex items-center mx-auto m-0 py-8 px-10 text-white">
          <TextareaControlled
            ref={inputRef}
            className="w-full placeholder:text-white focus:placeholder:text-gray-200 !outline-none !resize-none !text-2xl"
            initialValue={plan.nom}
            placeholder={'Sans titre'}
            onBlur={e =>
              e.target.value &&
              e.target.value.length > 0 &&
              e.target.value !== plan.nom &&
              updatePlan({id: plan.id, nom: e.target.value})
            }
          />
          <button
            className="fr-fi-edit-line group-hover:block hidden w-8 h-8"
            onClick={handleEditButtonClick}
          />
        </h4>
      </div>
      <div className="max-w-4xl mx-auto px-10">
        <PlanActionHeader plan={plan} collectivite_id={collectivite_id!} />
        {plan.enfants || plan.fiches ? (
          <>
            <div className="mb-4">
              <AxeActions planActionId={plan.id} axeId={plan.id} />
              {plan.fiches && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {plan.fiches.map(fiche => (
                    <FicheActionCard
                      key={fiche.id}
                      ficheAction={fiche}
                      link={makeCollectivitePlanActionFicheUrl({
                        collectiviteId: fiche.collectivite_id!,
                        planActionUid: plan.id.toString(),
                        ficheUid: fiche.id!.toString(),
                      })}
                    />
                  ))}
                </div>
              )}
            </div>
            {plan.enfants &&
              plan.enfants.map(enfant => (
                <PlanActionAxe
                  key={enfant.id}
                  plan_id={plan.id}
                  axe={enfant}
                  displayAxe={displaySousAxe}
                />
              ))}
          </>
        ) : (
          <div>
            <div className="flex flex-col items-center mt-8">
              <PictoLeaf className="w-24 fill-gray-400" />
              <div className="my-6 text-gray-500">
                Aucune arborescence pour l'instant
              </div>
              <AxeActions planActionId={plan.id} axeId={plan.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PlanActionConnected = () => {
  const {planUid} = useParams<{planUid: string}>();

  const data = usePlanAction(parseInt(planUid));

  return data ? <PlanAction plan={data.plan} /> : <div></div>;
};

export default PlanActionConnected;
