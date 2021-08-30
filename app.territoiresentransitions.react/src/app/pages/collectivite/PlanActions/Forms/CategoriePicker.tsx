import {FicheActionCategorieStorable} from 'storables/FicheActionCategorieStorable';
import {ficheActionCategorieStore} from 'core-logic/api/hybridStores';
import {useAllStorables, useEpciId} from 'core-logic/hooks';
import {useState} from 'react';
import {defaultCategorie} from 'app/pages/collectivite/PlanActions/defaultCategorie';
import {FicheActionCategorieInterface} from 'generated/models/fiche_action_categorie';
import {v4 as uuid} from 'uuid';
import {CategoryForm} from 'app/pages/collectivite/PlanActions/Forms/CategoryForm';
import {SelectInput} from 'ui';

function CategorieCreation(props: {ficheUid: string; onSave: () => void}) {
  const epciId = useEpciId();
  const categorie: FicheActionCategorieInterface = {
    epci_id: epciId!,
    uid: uuid(),
    parent_uid: '',
    nom: '',
    fiche_actions_uids: [props.ficheUid],
  };
  return <CategoryForm categorie={categorie} onSave={props.onSave} />;
}

/**
 * Pick a categorie for a given fiche uid.
 *
 * Note this is a kind of reverse picker as the `fiche action id`
 * is added to the catégorie as fiche is unaware of the categories it
 * belongs to.
 */
export function CategoriePicker(props: {ficheUid: string}) {
  const categories = useAllStorables<FicheActionCategorieStorable>(
    ficheActionCategorieStore
  );
  const [creating, setCreating] = useState<boolean>(false);

  const ficheActionUid = props.ficheUid;
  // const active = categories.find(cat =>
  //   cat.fiche_actions_uids.includes(props.ficheUid)
  // );

  /**
   * Update and save categories that needs to be updated.
   *
   * It's a three step thing to ensure everything is in sync.
   */
  const selectCategorie = (selectedUid: string) => {
    const changed: FicheActionCategorieStorable[] = [];
    // Cleanup
    for (const categorie of categories) {
      // search for categories with this fiche uid excluding selected.
      if (selectedUid === categorie.uid) continue;
      if (categorie.fiche_actions_uids.includes(ficheActionUid)) {
        // remove id & add categorie to changed
        categorie.fiche_actions_uids = categorie.fiche_actions_uids.filter(
          uid => uid !== ficheActionUid
        );
        changed.push(categorie);
      }
    }

    // Update selected
    const selected = categories.find(cat => cat.uid === selectedUid);
    if (selected && !selected.fiche_actions_uids.includes(ficheActionUid)) {
      // add this fiche uid to selected categorie
      selected.fiche_actions_uids.push(ficheActionUid);
      // add selected to changed
      changed.push(selected);
    }

    // Save all changed
    for (const categorie of changed) {
      if (categorie.uid) ficheActionCategorieStore.store(categorie);
    }
  };

  return (
    <fieldset className="flex flex-col ">
      <div className="flex flex-row w-full space-between items-center justify-between">
        <label className="fr-label" htmlFor="categorie_picker">
          Catégorie
        </label>

        {!creating && (
          <button
            className="fr-btn fr-btn--secondary fr-btn--sm"
            onClick={e => {
              e.preventDefault();
              setCreating(true);
            }}
          >
            Nouvelle catégorie
          </button>
        )}
      </div>
      {!creating && (
        <div className="w-full">
          <SelectInput
            options={categories.map(categorie => ({
              value: categorie.uid,
              label: categorie.nom,
            }))}
            defaultValue={defaultCategorie.uid}
            onChange={selectCategorie}
          />
        </div>
      )}
      {creating && (
        <div className="border-bf500 border-l-4 p-2 mt-2 mb-5 ml-5 bg-beige">
          <button
            className="bg-bf500 text-white float-right w-5 pb-0.5"
            onClick={() => setCreating(false)}
          >
            x
          </button>
          <div className="flex flex-col ">
            <div className="flex flex-row  w-full items-center justify-between">
              <h5 className="text-lg">Nouvelle catégorie</h5>
            </div>
            <CategorieCreation
              ficheUid={props.ficheUid}
              onSave={() => setCreating(false)}
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
