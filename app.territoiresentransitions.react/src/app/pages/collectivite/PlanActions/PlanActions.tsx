import {
  useAllFiches,
  useAllStorables,
  useEpciId,
  useStorable,
} from 'core-logic/hooks';
import {PlanActionStorable} from 'storables/PlanActionStorable';
import {planActionStore} from 'core-logic/api/hybridStores';
import {useParams} from 'react-router-dom';
import {Chip} from '@material-ui/core';
import {
  Categorie,
  PlanActionStructure,
  PlanActionTyped,
} from 'types/PlanActionTypedInterface';
import {FicheAction} from 'generated/models/fiche_action';
import {compareIndexes} from 'utils';
import {FicheCard} from 'app/pages/collectivite/PlanActions/FicheCard';
import {Spacer} from 'ui/shared';

interface Categorized {
  fiches: FicheAction[];
  categorie: Categorie;
}

const defaultCategorie: Categorie = {
  nom: 'Sans catégorie',
  uid: '',
};

function categorizeAndSortFiches(
  allFiches: FicheAction[],
  plan: PlanActionTyped
): Categorized[] {
  // step 1: sort categories
  const categories: Categorie[] = [...plan.categories, defaultCategorie];
  const fichesByCategory = (plan as PlanActionStructure).fiches_by_category;
  categories.sort((a, b) => compareIndexes(a.nom, b.nom));
  return categories.map((categorie: Categorie) => {
    // step 2: find fiches
    const fiches: FicheAction[] = [];
    for (const {fiche_uid} of fichesByCategory.filter(
      fc => fc.category_uid === categorie.uid
    )) {
      const fiche = allFiches.find(f => f.uid === fiche_uid);
      if (fiche) fiches.push(fiche);
    }
    // step 3: sort fiches
    fiches.sort((a, b) => compareIndexes(a.titre, b.titre));
    fiches.sort((a, b) => compareIndexes(a.custom_id, b.custom_id));
    return {
      categorie: categorie,
      fiches: fiches,
    };
  });
}

interface CategorizedNode {
  fiches: FicheAction[];
  categorie: Categorie;
  children: CategorizedNode[];
}

function nestCategorized(categorized: Categorized[]): CategorizedNode[] {
  // Tree
  const root: CategorizedNode[] = categorized
    .filter(c => !c.categorie.parent)
    .map(c => {
      return {
        fiches: c.fiches,
        categorie: c.categorie,
        children: [],
      };
    });

  function search(
    nodes: CategorizedNode[],
    uid: string
  ): CategorizedNode | null {
    for (const node of nodes) {
      if (node.categorie.uid === uid) return node;
      const found = search(node.children, uid);
      if (found) return found;
    }
    return null;
  }

  // Consume categorized to put them in the tree.
  for (const c of categorized) {
    if (!c.categorie.parent) continue;
    const node = {
      fiches: c.fiches,
      categorie: c.categorie,
      children: [],
    };
    const parent = search(root, node.categorie.parent!);
    if (parent) parent.children.push(node);
  }
  return root;
}

function PlanNavChip(props: {
  epciId: string;
  planUid: string;
  planNom: string;
  active: boolean;
}) {
  return (
    <div className="mr-2">
      <Chip
        label={props.planNom}
        component="a"
        href={`/collectivite/${props.epciId}/plan_action/${props.planUid}`}
        color={props.active ? 'primary' : 'default'}
        clickable
      />
    </div>
  );
}

function PlanNav() {
  const {epciId, planUid} = useParams<{epciId: string; planUid: string}>();
  const plans = useAllStorables<PlanActionStorable>(planActionStore);
  plans.sort((a, b) => a.nom.localeCompare(b.nom));

  return (
    <nav className="flex flex-row">
      {plans.map(plan => (
        <PlanNavChip
          epciId={epciId}
          planUid={plan.uid}
          planNom={plan.nom}
          active={plan.uid === planUid}
          key={plan.uid}
        />
      ))}
    </nav>
  );
}

function ModificationDialogButton(props: {categorie: Categorie}) {
  return <div>todo modif</div>;
}

function CategoryTitle(props: {categorie: Categorie; editable: boolean}) {
  return (
    <div className="flex flex-col w-full ">
      <div className="flex flex-row justify-between">
        <h3 className="text-2xl">
          {props.categorie.nom}
          <span className="fr-fi-arrow-right-s-line ml-10" aria-hidden={true} />
        </h3>
        {props.editable && (
          <ModificationDialogButton categorie={props.categorie} />
        )}
      </div>
    </div>
  );
}

function NestedCategory(props: {nodes: CategorizedNode[]}) {
  return (
    <>
      {props.nodes.map(node => {
        const isDefault = node.categorie.uid === defaultCategorie.uid;
        return (
          <div key={node.categorie.uid}>
            {(node.fiches.length > 0 || !isDefault) && (
              <CategoryTitle categorie={node.categorie} editable={isDefault} />
            )}
            {node.fiches.map(fiche => {
              return (
                <div className="ml-5 mt-3" key={fiche.uid}>
                  <FicheCard fiche={fiche} />
                </div>
              );
            })}
            {node.children && (
              <div className="ml-5">
                <NestedCategory nodes={node.children} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function Plan(props: {plan: PlanActionTyped}) {
  const epciId = useEpciId()!;
  const fiches = useAllFiches(epciId);
  const sorted = categorizeAndSortFiches(fiches, props.plan);
  const nested = nestCategorized(sorted);

  return <NestedCategory nodes={nested} />;
}

const PlanActions = function () {
  const {epciId, planUid} = useParams<{epciId: string; planUid: string}>();
  const planId = PlanActionStorable.buildId(epciId, planUid);
  const plan = useStorable<PlanActionStorable>(planId, planActionStore);

  return (
    <main className="fr-container mt-9 mb-16">
      <h1 className="fr-h1 mb-3">Plans d'action</h1>
      <PlanNav />
      <Spacer />
      {plan && <Plan plan={plan as PlanActionTyped} />}
    </main>
  );
};

export default PlanActions;
