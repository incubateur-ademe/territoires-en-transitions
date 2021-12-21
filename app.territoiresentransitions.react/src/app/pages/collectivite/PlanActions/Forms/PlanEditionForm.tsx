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

/**
 * A title that is editable in place, as the title display is replaced with an
 * input.
 */
const InlineEditableTitle = (props: {
  text: string;
  onSave: (text: string) => void;
  remove?: () => void;
  level: number;
  // textClass?: string;
  onStateChange?: (editing: boolean) => void;
  initialEditingState?: boolean;
}) => {
  const [editing, setEditing] = useState<boolean>(
    props.initialEditingState ?? false
  );
  const [text, setText] = useState<string>(props.text);
  const onStateChange = props.onStateChange ?? (() => {});
  const textClasses = ['text-2xl', 'text-xl', 'text-lg'];
  const textClass = textClasses[Math.min(textClasses.length - 1, props.level)];
  return (
    <div className="flex flex-row items-center w-full">
      {!editing && (
        <>
          <div className={textClass + ' font-bold'}>{props.text}</div>
          <IconButton
            aria-label="renommer"
            onClick={e => {
              e.preventDefault();
              setEditing(true);
              onStateChange(true);
            }}
          >
            <div className="fr-fi-edit-fill" />
          </IconButton>

          {props.remove !== undefined && (
            <IconButton
              aria-label="supprimer"
              onClick={e => {
                e.preventDefault();
                props.remove!();
              }}
            >
              <div className="fr-fi-delete-fill" />
            </IconButton>
          )}
        </>
      )}
      {editing && (
        <div className="flex flex-row w-full">
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
            <div className="fr-fi-save-fill" />
          </IconButton>
        </div>
      )}
    </div>
  );
};

/**
 * Shows the categorie title as an editable title as well as a button to add a
 * sous-categorie if the add prop is present.
 */
function EditableCategoryTitle(props: {
  categorie: Categorie;
  level: number;
  update: (categorie: Categorie) => void;
  add?: (categorie: Categorie) => void;
  remove?: (categorie: Categorie) => void;
}) {
  const [editing, setEditing] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);

  return (
    <div className="flex flex-col w-full mt-1">
      <div className="flex flex-row justify-between ">
        <div
          className={'flex flex-row items-center ' + (editing ? 'w-full' : '')}
        >
          <InlineEditableTitle
            onSave={text => {
              props.categorie.nom = text;
              props.update(props.categorie);
            }}
            remove={
              props.remove
                ? () => {
                    props.remove!(props.categorie);
                  }
                : undefined
            }
            text={props.categorie.nom}
            onStateChange={setEditing}
            level={props.level}
          />
        </div>
        {!(editing || adding || !props.add) && (
          <div>
            <button
              className="fr-btn fr-btn--secondary fr-btn--xs whitespace-nowrap"
              onClick={() => setAdding(true)}
            >
              Ajouter un sous axe
            </button>
          </div>
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
          initialEditingState={true}
          level={props.level}
        />
      )}
    </div>
  );
}

/**
 * Display the categorie with its children as editable titles.
 */
function EditableCategoryLevel(props: {
  nodes: CategoryNode[];
  update: (categorie: Categorie) => void;
  add: (categorie: Categorie) => void;
  remove: (categorie: Categorie) => void;
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
              add={level < 2 ? props.add : undefined}
              remove={node.children.length > 0 ? undefined : props.remove}
              level={level}
            />
            {node.children && (
              <div className="ml-5">
                <EditableCategoryLevel
                  nodes={node.children}
                  update={props.update}
                  remove={props.remove}
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

/**
 * A form that handles the editing of plans and categories.
 *
 * @param props A plans storable, mutated in place and saved on user input.
 */
export const PlanEditionForm = (props: {
  plan: PlanActionStorable & PlanActionTyped;
}) => {
  const categories = nestPlanCategories(props.plan.categories);
  const [editing, setEditing] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);
  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between items-center mb-4">
        <InlineEditableTitle
          onSave={text => {
            props.plan.nom = text;
            planActionStore.store(props.plan);
          }}
          text={props.plan.nom}
          // textClass="text-4xl"
          onStateChange={setEditing}
          level={0}
        />
        {!(editing || adding) && (
          <div>
            <button
              className="fr-btn fr-btn--xs whitespace-nowrap"
              onClick={() => setAdding(true)}
            >
              Ajouter un axe
            </button>
          </div>
        )}
      </div>
      {adding && (
        <InlineEditableTitle
          onSave={text => {
            const category = {
              nom: text,
              uid: uuid(),
            };
            setAdding(false);
            props.plan.categories.push(category);
            planActionStore.store(props.plan);
          }}
          text="Axe"
          onStateChange={setEditing}
          initialEditingState={true}
          level={1}
        />
      )}
      <div className="ml-6 mt-2">
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
          remove={(categorie: Categorie) => {
            if (confirm(categoryDeletionMessage(categorie))) {
              const plan = props.plan;
              plan.categories = plan.categories.filter(
                (c: Categorie) => c.uid !== categorie.uid
              );
              plan.fiches_by_category = plan.fiches_by_category.map(
                (fc: {
                  category_uid?: string | undefined;
                  fiche_uid: string;
                }) => {
                  if (fc.category_uid === categorie.uid) {
                    return {fiche_uid: fc.fiche_uid};
                  }
                  return {
                    fiche_uid: fc.fiche_uid,
                    category_uid: fc.category_uid,
                  };
                }
              );
              planActionStore.store(plan);
            }
          }}
          level={1}
        />
      </div>
    </div>
  );
};

const categoryDeletionMessage = (categorie: Categorie) => {
  return (
    `Supprimer la catégorie ${categorie.nom}.\n\n` +
    `Les fiches appartenant à ${categorie.nom} ou a ses sous catégories seront ` +
    'rattachées à la catégorie "Fiches actions non classées".'
  );
};
