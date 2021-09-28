import {useAllFiches, useEpciId, useStorable} from 'core-logic/hooks';
import {PlanActionStorable} from 'storables/PlanActionStorable';
import {planActionStore} from 'core-logic/api/hybridStores';
import {Link, useParams} from 'react-router-dom';
import {Categorie, PlanActionTyped} from 'types/PlanActionTypedInterface';
import {FicheCard} from 'app/pages/collectivite/PlanActions/FicheCard';
import {Spacer} from 'ui/shared';
import {PlanNav} from 'app/pages/collectivite/PlanActions/PlanNav';
import {
  categorizeAndSortFiches,
  CategorizedNode,
  defaultCategorie,
  nestCategorized,
} from 'app/pages/collectivite/PlanActions/sorting';
import React, {useState} from 'react';
import {UiDialogButton} from 'ui';
import {PlanForm} from 'app/pages/collectivite/PlanActions/Forms/PlanForm';

interface CurrentPlan {
  plan?: PlanActionTyped;
}

const CurrentPlanContext = React.createContext<CurrentPlan>({});

/**
 * The title of a category
 */
function CategoryTitle(props: {categorie: Categorie; level: number}) {
  const textClasses = ['text-2xl', 'text-xl', 'text-lg'];
  const textClass = textClasses[Math.min(textClasses.length - 1, props.level)];
  return (
    <div className="flex flex-col w-full ">
      <div className="flex flex-row justify-between">
        <h3 className={textClass}>
          {props.categorie.nom}
          <span className="fr-fi-arrow-right-s-line ml-10" aria-hidden={true} />
        </h3>
      </div>
    </div>
  );
}

/**
 * Display a categorie with its fiche list, as well as its sub categories
 *
 * This Component is recursive.
 */
function CategoryLevel(props: {nodes: CategorizedNode[]; level?: number}) {
  const level = props.level ?? 0;
  return (
    <>
      {props.nodes.map(node => {
        const isDefault = node.categorie.uid === defaultCategorie.uid;
        return (
          <div key={node.categorie.uid}>
            {!isDefault && (
              <CategoryTitle categorie={node.categorie} level={level} />
            )}
            {node.fiches &&
              node.fiches.map(fiche => {
                return (
                  <div className="ml-5 mt-3" key={fiche.uid}>
                    <FicheCard fiche={fiche} />
                  </div>
                );
              })}
            {node.children && (
              <div className="ml-5">
                <CategoryLevel nodes={node.children} level={level + 1} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/**
 * Displays plan categories.
 */
function Plan(props: {plan: PlanActionTyped}) {
  const epciId = useEpciId()!;
  const fiches = useAllFiches(epciId);
  const sorted = categorizeAndSortFiches(fiches, props.plan);
  const nested = nestCategorized(sorted);

  return (
    <CurrentPlanContext.Provider value={{plan: props.plan}}>
      <CategoryLevel nodes={nested} />
    </CurrentPlanContext.Provider>
  );
}

/**
 * Button row next to plan title.
 */
function PlanButtons(props: {plan: PlanActionStorable & PlanActionTyped}) {
  const [editing, setEditing] = useState<boolean>(false);
  const epciId = useEpciId();
  return (
    <div className="flex flex-row ">
      <UiDialogButton
        title="Modifier la structure"
        opened={editing}
        setOpened={setEditing}
        buttonClasses="fr-btn--secondary"
      >
        <PlanForm plan={props.plan} />
      </UiDialogButton>
      <div className="mr-2" />

      <Link
        className="fr-btn h-8"
        to={`/collectivite/${epciId}/nouvelle_fiche`}
      >
        Ajouter une fiche action
      </Link>
    </div>
  );
}

/**
 * Plans d'action page contents
 */
const PlanActions = function () {
  const {epciId, planUid} = useParams<{epciId: string; planUid: string}>();
  const planId = PlanActionStorable.buildId(epciId, planUid);
  const plan = useStorable<PlanActionStorable>(planId, planActionStore);

  return (
    <main className="fr-container mt-9 mb-16">
      <div className="flex flex-row justify-between">
        <h1 className="fr-h1 mb-3">Plans d'action</h1>
        <div className="flex flex-row">
          {plan && (
            <PlanButtons plan={plan as PlanActionStorable & PlanActionTyped} />
          )}
        </div>
      </div>

      <PlanNav />
      <Spacer />
      {plan && <Plan plan={plan as PlanActionTyped} />}
    </main>
  );
};

export default PlanActions;
