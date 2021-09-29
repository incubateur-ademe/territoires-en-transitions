import {useAllFiches, useEpciId, useStorable} from 'core-logic/hooks';
import {PlanActionStorable} from 'storables/PlanActionStorable';
import {planActionStore} from 'core-logic/api/hybridStores';
import {Link, useParams} from 'react-router-dom';
import {Categorie, PlanActionTyped} from 'types/PlanActionTypedInterface';
import {FicheCard} from './FicheCard';
import {Spacer} from 'ui/shared';
import {PlanNav} from './PlanNav';
import {
  categorizeAndSortFiches,
  CategorizedNode,
  defaultCategorie,
  nestCategorized,
} from './sorting';
import React, {useState} from 'react';
import {UiDialogButton} from 'ui';
import {PlanEditionForm} from './Forms/PlanEditionForm';
import {PlanCreationForm} from './Forms/PlanCreationForm';

/**
 * The title of a category
 */
const CategoryTitle = (props: {categorie: Categorie; level: number}) => {
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
              <div className="ml-10">
                <CategoryLevel nodes={node.children} level={level + 1} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

/**
 * Displays plan categories.
 */
const Plan = (props: {plan: PlanActionTyped}) => {
  const epciId = useEpciId()!;
  const fiches = useAllFiches(epciId);
  const sorted = categorizeAndSortFiches(fiches, props.plan);
  const nested = nestCategorized(sorted);

  return <CategoryLevel nodes={nested} />;
};

/**
 * Button row next to plan title.
 */
const PlanButtons = (props: {plan: PlanActionStorable & PlanActionTyped}) => {
  const [editing, setEditing] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const epciId = useEpciId()!;

  return (
    <div className="flex flex-row justify-between w-full">
      <UiDialogButton
        title="Créer un plan d'action"
        opened={creating}
        setOpened={setCreating}
        buttonClasses="fr-btn--secondary"
      >
        <Spacer />
        <PlanCreationForm onSave={() => setCreating(false)} />
      </UiDialogButton>

      <div className="flex flex-row ">
        <UiDialogButton
          title="Modifier la structure"
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
          to={`/collectivite/${epciId}/nouvelle_fiche`}
        >
          Ajouter une fiche action
        </Link>
      </div>
    </div>
  );
};

/**
 * Plans d'action page contents
 */
const PlanActions = function () {
  const {epciId, planUid} = useParams<{epciId: string; planUid: string}>();
  const planId = PlanActionStorable.buildId(epciId, planUid);
  const plan = useStorable<PlanActionStorable>(planId, planActionStore);

  return (
    <main className="fr-container mt-9 mb-16">
      <div className="flex flex-row items-center">
        <h1 className="fr-h1 mb-3 whitespace-nowrap mr-10">Plans d'action</h1>
        {plan && (
          <PlanButtons plan={plan as PlanActionStorable & PlanActionTyped} />
        )}
      </div>

      <PlanNav />
      <Spacer />
      {plan && <Plan plan={plan as PlanActionTyped} />}
    </main>
  );
};

export default PlanActions;
