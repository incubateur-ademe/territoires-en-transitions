import {Categorie, PlanActionTyped} from 'types/PlanActionTypedInterface';
import {
  CategoryNode,
  nestPlanCategories,
} from 'app/pages/collectivite/PlanActions/sorting';
import React, {useState} from 'react';
import {IconButton} from '@material-ui/core';
import {LabeledTextInput} from 'ui';
import {update} from 'ramda';
import {planActionStore} from 'core-logic/api/hybridStores';
import {PlanActionStorable} from 'storables/PlanActionStorable';

function EditableCategoryTitle(props: {
  categorie: Categorie;
  update: (categorie: Categorie) => void;
  add: (categorie: Categorie) => void;
}) {
  const [editing, setEditing] = useState<boolean>(false);
  const [nom, setNom] = useState<string>(props.categorie.nom);
  return (
    <div className="flex flex-col w-full ">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row items-center">
          {!editing && (
            <>
              <h3 className="text-2xl">{nom}</h3>
              <IconButton
                aria-label="renommer"
                onClick={e => {
                  e.preventDefault();
                  setEditing(true);
                }}
              >
                ✏
              </IconButton>
            </>
          )}
          {editing && (
            <div className="flex flex-row">
              <LabeledTextInput
                label=""
                value={nom}
                onChange={e => {
                  e.preventDefault();
                  setNom(e.target.value);
                }}
              />
              <IconButton
                aria-label="enregister"
                onClick={e => {
                  e.preventDefault();
                  setEditing(false);
                  props.update({
                    nom: nom,
                    uid: props.categorie.uid,
                    parent: props.categorie.parent,
                  });
                }}
              >
                💾
              </IconButton>
            </div>
          )}
        </div>
        {!editing && (
          <button className="fr-btn fr-btn--secondary">
            Ajouter un sous axe
          </button>
        )}
      </div>
    </div>
  );
}

function EditableCategoryLevel(props: {
  nodes: CategoryNode[];
  update: (categorie: Categorie) => void;
  add: (categorie: Categorie) => void;
}) {
  return (
    <>
      {props.nodes.map(node => {
        return (
          <div key={node.categorie.uid}>
            <EditableCategoryTitle
              categorie={node.categorie}
              update={props.update}
              add={props.add}
            />

            {node.children && (
              <div className="ml-5">
                <EditableCategoryLevel
                  nodes={node.children}
                  update={props.update}
                  add={props.add}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export function PlanForm(props: {
  onSave: () => void;
  plan: PlanActionStorable & PlanActionTyped;
}) {
  const categories = nestPlanCategories(props.plan.categories);
  return (
    <div>
      <h1>{props.plan.nom}</h1>
      <EditableCategoryLevel
        nodes={categories}
        update={(categorie: Categorie) => {
          const plan = props.plan;
          const cat: Categorie = plan.categories.find(
            (c: Categorie) => c.uid === categorie.uid
          )!;
          cat.nom = categorie.nom;
          planActionStore.store(plan);
        }}
        add={(categorie: Categorie) => null}
      />
    </div>
  );
}
