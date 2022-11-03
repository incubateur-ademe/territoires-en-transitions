import {useFicheActionList} from 'core-logic/hooks/fiche_action';
import {Link, useParams} from 'react-router-dom';
import {Categorie} from 'types/PlanActionTypedInterface';
import {FicheCard} from './FicheCard';
import {Spacer} from 'ui/shared/Spacer';
import {PlanNav} from './PlanNav';
import {
  categorizeAndSortFiches,
  CategorizedNode,
  nestCategorized,
} from './sorting';
import {useState} from 'react';
import {PlanCreationForm} from './Forms/PlanCreationForm';
import {defaultDisplayCategorie} from 'app/pages/collectivite/PlanActions/defaultDisplayCategorie';
import {LazyDetailsWithChevron} from 'ui/shared/LazyDetails';
import {usePlanAction} from 'core-logic/hooks/plan_action';
import {PlanActionRead} from 'generated/dataLayer/plan_action_read';
import {makeCollectiviteNouvelleFicheUrl, planActionDefaultId} from 'app/paths';
import {UiDialogButton} from 'ui/UiDialogButton';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {ModifierArboDialogButton} from './ModifierArboDialogButton';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

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
  return (
    <div className="flex flex-row items-center justify-end w-full gap-4">
      <CreatePlanActionDialogButton />
      <ModifierArboDialogButton plan={props.plan} />
      <AddFicheActionLink plan={props.plan} />
    </div>
  );
};

const CreatePlanActionDialogButton = () => {
  const [creating, setCreating] = useState<boolean>(false);

  return (
    <UiDialogButton
      title="Créer un plan d'action"
      opened={creating}
      setOpened={setCreating}
      useFrBtn={true}
      buttonClasses="whitespace-nowrap pt-2 fr-btn--secondary"
    >
      <Spacer />
      <PlanCreationForm onSave={() => setCreating(false)} />
    </UiDialogButton>
  );
};

const AddFicheActionLink = (props: {plan: PlanActionRead}) => {
  const collectiviteId = useCollectiviteId()!;
  return (
    <Link
      className="fr-btn h-8"
      to={makeCollectiviteNouvelleFicheUrl({
        collectiviteId,
        planActionUid: props.plan.uid,
      })}
    >
      Ajouter une fiche action
    </Link>
  );
};

/**
 * Plans d'action page contents
 */
const PlanActions = () => {
  const currentCollectivite = useCurrentCollectivite();
  const {planActionUid} = useParams<{planActionUid: string}>();
  const collectiviteId = useCollectiviteId()!;
  const plan = usePlanAction(
    collectiviteId,
    planActionUid === planActionDefaultId ? undefined : planActionUid
  );

  if (plan === null) {
    return null;
  }

  return (
    <main className="fr-container mt-9 mb-16">
      <div className="flex flex-row items-center w-full">
        <div className="flex flex-row items-center">
          <h1 className="fr-h1 mb-3 whitespace-nowrap mr-4">Plans d'action</h1>
        </div>
        {plan && currentCollectivite?.niveau_acces && (
          <PlanButtons plan={plan} />
        )}
      </div>

      <PlanNav planActionUid={plan.uid} />
      <Spacer />
      {plan && <Plan plan={plan} />}
    </main>
  );
};

export default PlanActions;
