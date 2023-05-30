import PictoLeaf from 'ui/pictogrammes/PictoLeaf';
import {AxeActions} from './AxeActions';
import PlanActionAxe from './PlanActionAxe';
import PlanActionAxeFiches from './PlanActionAxeFiches';
import {PlanNode} from './data/types';

type Props = {
  isAxePage: boolean;
  plan: PlanNode;
  axe: PlanNode;
  isReadonly: boolean;
};

const PlanActionArborescence = ({isAxePage, plan, axe, isReadonly}: Props) => {
  const hasContent =
    axe.children.length > 0 || (axe.fiches && axe.fiches.length > 0);

  const displaySousAxe = (node: PlanNode) => (
    <PlanActionAxe
      key={node.id}
      isAxePage={isAxePage}
      planActionGlobal={plan}
      axe={node}
      displayAxe={displaySousAxe}
      isReadonly={isReadonly}
    />
  );

  return (
    <div>
      {hasContent ? (
        <>
          <div className="mb-4">
            {!isReadonly && (
              <AxeActions
                isAxePage={isAxePage}
                planActionId={plan.id}
                axeId={axe.id}
              />
            )}
            {/** Affichage des fiches */}
            {axe && axe.fiches && axe.fiches.length !== 0 && (
              <div className="mt-6">
                <PlanActionAxeFiches
                  isAxePage={isAxePage}
                  ficheIds={axe.fiches}
                  planId={plan.id}
                  axeId={axe.id}
                />
              </div>
            )}
          </div>
          {/** Affichage des sous-axes */}
          {axe.children &&
            axe.children.length > 0 &&
            axe.children.map(enfant => (
              <PlanActionAxe
                key={enfant.id}
                isAxePage={isAxePage}
                planActionGlobal={axe}
                axe={enfant}
                displayAxe={displaySousAxe}
                isReadonly={isReadonly}
              />
            ))}
        </>
      ) : (
        <div>
          <div className="flex flex-col items-center my-8">
            <PictoLeaf className="w-24 fill-gray-400" />
            <div className="my-6 text-gray-500">
              Aucune arborescence pour l'instant
            </div>
            {!isReadonly && (
              <AxeActions
                isAxePage={isAxePage}
                planActionId={plan.id}
                axeId={axe ? axe.id : plan.id}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanActionArborescence;
