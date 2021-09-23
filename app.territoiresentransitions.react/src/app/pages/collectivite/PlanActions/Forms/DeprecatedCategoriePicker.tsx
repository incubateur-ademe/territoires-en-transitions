import {FicheActionCategorieStorable} from 'storables/FicheActionCategorieStorable';
import {ficheActionCategorieStore} from 'core-logic/api/hybridStores';
import {useAllStorables, useEpciId} from 'core-logic/hooks';
import {useEffect, useState} from 'react';
import {deprecatedDefaultCategorie} from 'app/pages/collectivite/PlanActions/deprecatedDefaultCategorie';
import {FicheActionCategorieInterface} from 'generated/models/fiche_action_categorie';
import {v4 as uuid} from 'uuid';
import {DeprecatedCategoryForm} from 'app/pages/collectivite/PlanActions/Forms/DeprecatedCategoryForm';
import {SelectInput, UiDialogButton} from 'ui';

const CategorieCreation = (props: {ficheUid: string; onSave: () => void}) => {
  const epciId = useEpciId();
  const categorie: FicheActionCategorieInterface = {
    epci_id: epciId!,
    uid: uuid(),
    parent_uid: '',
    nom: '',
    fiche_actions_uids: [props.ficheUid],
  };
  return <DeprecatedCategoryForm categorie={categorie} onSave={props.onSave} />;
};

/**
 * Pick a categorie for a given fiche uid.
 *
 * Note this is a kind of reverse picker as the `fiche action id`
 * is added to the catégorie as fiche is unaware of the categories it
 * belongs to.
 */
export function DeprecatedCategoriePicker(props: {ficheUid: string}) {
  const storedCategories = useAllStorables<FicheActionCategorieStorable>(
    ficheActionCategorieStore
  );
  const categories = [...storedCategories, deprecatedDefaultCategorie];

  const [creating, setCreating] = useState<boolean>(false);
  const [active, setActive] = useState<FicheActionCategorieStorable>(
    deprecatedDefaultCategorie
  );

  const ficheActionUid = props.ficheUid;

  useEffect(() => {
    setActive(
      categories.find(cat =>
        cat.fiche_actions_uids?.includes(props.ficheUid)
      ) ?? deprecatedDefaultCategorie
    );
  }, [active, storedCategories]);

  /**
   * Update and save categories that needs to be updated.
   *
   * It's a three step thing to ensure everything is in sync.
   */
  const selectCategorie = (selectedUid: string) => {
    const changed: FicheActionCategorieStorable[] = [];
    // Cleanup
    for (const categorie of storedCategories) {
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
    const selected = storedCategories.find(cat => cat.uid === selectedUid);
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
        <UiDialogButton
          buttonClasses="fr-btn--secondary"
          title="Créer une catégorie"
          opened={creating}
          setOpened={setCreating}
        >
          <CategorieCreation
            ficheUid={props.ficheUid}
            onSave={() => setCreating(false)}
          />
        </UiDialogButton>
      </div>

      <div className="w-full">
        <SelectInput
          options={categories.map(categorie => ({
            value: categorie.uid,
            label: categorie.nom,
          }))}
          key={active.uid}
          defaultValue={active.uid}
          onChange={selectCategorie}
        />
      </div>
    </fieldset>
  );
}
