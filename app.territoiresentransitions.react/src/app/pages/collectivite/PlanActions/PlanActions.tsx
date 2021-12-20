import {useCollectiviteId, useFicheActionList} from 'core-logic/hooks';
import {Link, useParams} from 'react-router-dom';
import {Categorie} from 'types/PlanActionTypedInterface';
import {FicheCard} from './FicheCard';
import {Spacer} from 'ui/shared';
import {PlanNav} from './PlanNav';
import {
  categorizeAndSortFiches,
  CategorizedNode,
  nestCategorized,
} from './sorting';
import React, {useState} from 'react';
import {UiDialogButton} from 'ui';
import {PlanEditionForm} from './Forms/PlanEditionForm';
import {PlanCreationForm} from './Forms/PlanCreationForm';
import {defaultDisplayCategorie} from 'app/pages/collectivite/PlanActions/defaultDisplayCategorie';
import {LazyDetailsWithChevron} from 'ui/shared/LazyDetails';
import {usePlanAction} from 'core-logic/hooks/plan_action';
import {PlanActionRead} from 'generated/dataLayer/plan_action_read';
import {makeCollectiviteNouvelleFichePath} from 'app/paths';

/**
 * The title of a category
 */
const CategoryTitle = (props: {categorie: Categorie; level: number}) => {
  const textClasses = ['text-2xl', 'text-xl', 'text-lg'];
  const textClass = textClasses[Math.min(textClasses.length - 1, props.level)];
  return <h3 className={textClass}>{props.categorie.nom}</h3>;
};

/**
 * Display a categorie with its fiche list, as well as its sub categories
 *
 * This Component is recursive.
 */
const CategoryLevel = (props: {nodes: CategorizedNode[]; level?: number}) => {
  const level = props.level ?? 0;
  return (
    <>
      {props.nodes.map(node => {
        const isDefault = node.categorie.uid === defaultDisplayCategorie.uid;
        if (isDefault && !node.fiches?.length) {
          return null;
        }
        return (
          <div key={node.categorie.uid} className="mt-4">
            <LazyDetailsWithChevron
              startOpen
              summary={
                <div className="mr-4">
                  <CategoryTitle categorie={node.categorie} level={level} />
                </div>
              }
            >
              {node.fiches &&
                node.fiches.map(fiche => {
                  return (
                    <div className="ml-5 mt-3" key={fiche.uid}>
                      <FicheCard fiche={fiche} />
                    </div>
                  );
                })}
              {node.children && (
                <div className="ml-10">
                  <CategoryLevel nodes={node.children} level={level + 1} />
                </div>
              )}
            </LazyDetailsWithChevron>
          </div>
        );
      })}
    </>
  );
};

/**
 * Displays plan categories.
 */
const Plan = (props: {plan: PlanActionRead}) => {
  const collectiviteId = useCollectiviteId()!;

  const fiches = useFicheActionList(collectiviteId);
  const sorted = categorizeAndSortFiches(fiches, props.plan);
  const nested = nestCategorized(sorted);

  return <CategoryLevel nodes={nested} />;
};

/**
 * Button row next to plan title.
 */
const PlanButtons = (props: {plan: PlanActionRead}) => {
  const [editing, setEditing] = useState<boolean>(false);

  const collectiviteId = useCollectiviteId()!;

  return (
    <div className="flex flex-row items-center justify-end w-full">
      <UiDialogButton
        title="Modifier l'arborescence"
        opened={editing}
        setOpened={setEditing}
        buttonClasses="fr-btn--secondary"
      >
        <Spacer />
        <PlanEditionForm plan={props.plan} />
      </UiDialogButton>
      <div className="mr-2" />

      <Link
        className="fr-btn h-8"
        to={makeCollectiviteNouvelleFichePath({
          collectiviteId,
          planActionUid: props.plan.uid,
        })}
      >
        Ajouter une fiche action
      </Link>
    </div>
  );
};

/**
 * Plans d'action page contents
 */
const PlanActions = function () {
  const {planUid} = useParams<{planUid: string}>();
  const collectiviteId = useCollectiviteId()!;
  const [creating, setCreating] = useState<boolean>(false);
  const plan = usePlanAction(collectiviteId, planUid);

  if (plan === null) {
    return null;
  }

  return (
    <main className="fr-container mt-9 mb-16">
      <div className="flex flex-row items-center w-full">
        <div className="flex flex-row items-center">
          <h1 className="fr-h1 mb-3 whitespace-nowrap mr-4">Plans d'actions</h1>
          <UiDialogButton
            title="Créer un plan d'action"
            opened={creating}
            setOpened={setCreating}
            useFrBtn={false}
            buttonClasses="whitespace-nowrap pt-2"
          >
            <Spacer />
            <PlanCreationForm onSave={() => setCreating(false)} />
          </UiDialogButton>
        </div>
        {plan && <PlanButtons plan={plan} />}
      </div>

      <PlanNav />
      <Spacer />
      {plan && <Plan plan={plan} />}
    </main>
  );
};

export default PlanActions;
