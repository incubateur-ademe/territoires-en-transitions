import {Categorie, PlanActionTyped} from 'types/PlanActionTypedInterface';
import {
  CategoryNode,
  nestPlanCategories,
} from 'app/pages/collectivite/PlanActions/sorting';
import React, {useState} from 'react';
import {IconButton} from '@material-ui/core';
import {LabeledTextInput} from 'ui';
import {planActionStore} from 'core-logic/api/hybridStores';
import {PlanActionStorable} from 'storables/PlanActionStorable';
import {v4 as uuid} from 'uuid';

function InlineEditableTitle(props: {
  text: string;
  onSave: (text: string) => void;
  textClass?: string;
  onStateChange?: (editing: boolean) => void;
  initialState?: boolean;
}) {
  const [editing, setEditing] = useState<boolean>(props.initialState ?? false);
  const [text, setText] = useState<string>(props.text);
  const onStateChange = props.onStateChange ?? (editing => {});
  const textClass = props.textClass ?? '';
  return (
    <div className="flex flex-row items-center">
      {!editing && (
        <>
          <h3 className={textClass}>{props.text}</h3>
          <IconButton
            aria-label="renommer"
            onClick={e => {
              e.preventDefault();
              setEditing(true);
              onStateChange(true);
            }}
          >
            🖊
          </IconButton>
        </>
      )}
      {editing && (
        <div className="flex flex-row">
          <LabeledTextInput
            label=""
            value={text}
            onChange={e => {
              e.preventDefault();
              setText(e.target.value);
            }}
          />
          <IconButton
            aria-label="enregister"
            onClick={e => {
              e.preventDefault();
              setEditing(false);
              onStateChange(false);
              props.onSave(text);
            }}
          >
            💾
          </IconButton>
        </div>
      )}
    </div>
  );
}

function EditableCategoryTitle(props: {
  categorie: Categorie;
  update: (categorie: Categorie) => void;
  add?: (categorie: Categorie) => void;
}) {
  const [editing, setEditing] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);

  return (
    <div className="flex flex-col w-full ">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row items-center">
          <InlineEditableTitle
            onSave={text => {
              props.categorie.nom = text;
              props.update(props.categorie);
            }}
            text={props.categorie.nom}
            onStateChange={setEditing}
          />
        </div>
        {!(editing || adding || !props.add) && (
          <button
            className="fr-btn fr-btn--secondary"
            onClick={() => setAdding(true)}
          >
            Ajouter un sous axe
          </button>
        )}
      </div>
      {adding && (
        <InlineEditableTitle
          onSave={text => {
            const category = {
              nom: text,
              uid: uuid(),
              parent: props.categorie.uid,
            };
            setAdding(false);
            if (props.add) {
              props.add!(category);
            }
          }}
          text="sous axe"
          onStateChange={setEditing}
          initialState={true}
        />
      )}
    </div>
  );
}

function EditableCategoryLevel(props: {
  nodes: CategoryNode[];
  update: (categorie: Categorie) => void;
  add: (categorie: Categorie) => void;
  level?: number;
}) {
  const level = props.level ?? 0;
  return (
    <>
      {props.nodes.map(node => {
        return (
          <div key={node.categorie.uid}>
            <EditableCategoryTitle
              categorie={node.categorie}
              update={props.update}
              add={level < 1 ? props.add : undefined}
            />

            {node.children && (
              <div className="ml-5">
                <EditableCategoryLevel
                  nodes={node.children}
                  update={props.update}
                  add={props.add}
                  level={level + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export function PlanForm(props: {plan: PlanActionStorable & PlanActionTyped}) {
  const categories = nestPlanCategories(props.plan.categories);
  return (
    <div>
      <InlineEditableTitle
        onSave={text => {
          props.plan.nom = text;
          planActionStore.store(props.plan);
        }}
        text={props.plan.nom}
        textClass="text-4xl"
      />
      <EditableCategoryLevel
        nodes={categories}
        update={(categorie: Categorie) => {
          const plan = props.plan;
          const existing: Categorie = plan.categories.find((c: Categorie) => {
            return c.uid === categorie.uid;
          })!;
          existing.nom = categorie.nom;
          planActionStore.store(plan);
        }}
        add={(categorie: Categorie) => {
          const plan = props.plan;
          plan.categories.push(categorie);
          planActionStore.store(plan);
        }}
      />
    </div>
  );
}
