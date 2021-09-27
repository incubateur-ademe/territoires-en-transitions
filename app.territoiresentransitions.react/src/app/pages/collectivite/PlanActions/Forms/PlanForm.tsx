import {Categorie, PlanActionTyped} from 'types/PlanActionTypedInterface';
import {
  CategoryNode,
  nestPlanCategories,
} from 'app/pages/collectivite/PlanActions/sorting';
import React from 'react';

function CategoryTitle(props: {categorie: Categorie}) {
  return (
    <div className="flex flex-col w-full ">
      <div className="flex flex-row justify-between">
        <h3 className="text-2xl">{props.categorie.nom}</h3>
      </div>
    </div>
  );
}

function CategoryLevel(props: {nodes: CategoryNode[]}) {
  return (
    <>
      {props.nodes.map(node => {
        return (
          <div key={node.categorie.uid}>
            <CategoryTitle categorie={node.categorie} />

            {node.children && (
              <div className="ml-5">
                <CategoryLevel nodes={node.children} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export function PlanForm(props: {onSave: () => void; plan: PlanActionTyped}) {
  const categories = nestPlanCategories(props.plan.categories);
  return (
    <div>
      <h1>{props.plan.nom} ✏</h1>
      <CategoryLevel nodes={categories} />
    </div>
  );
}
