import {useAllFiches} from 'core-logic/hooks/fiches';
import {useAllStorables} from 'core-logic/hooks';
import {FicheActionCategorieStorable} from 'storables/FicheActionCategorieStorable';
import {ficheActionCategorieStore} from 'core-logic/api/hybridStores';
import {categorizeAndSortFiches, CategorizedFiche} from 'ui/fiches/sortFiches';
import {FicheCard} from 'app/pages/collectivite/PlanActions/FicheCard';
import {FicheActionCategorie} from 'generated/models/fiche_action_categorie';
import {useState} from 'react';
import {defaultCategorie} from 'app/pages/collectivite/PlanActions/defaultCategorie';
import {CategoryForm} from 'app/pages/collectivite/PlanActions/Forms/CategoryForm';
import {AddFicheActionButton, Spacer} from 'ui/shared';
import {FicheAction} from 'generated/models/fiche_action';
import {UiDialogButton} from 'ui/UiDialogButton';

const ModificationDialogButton = (props: {categorie: FicheActionCategorie}) => {
  const [editing, setEditing] = useState<boolean>(false);
  return (
    <UiDialogButton
      title="Modifier la catégorie"
      opened={editing}
      setOpened={setEditing}
      buttonClasses="fr-btn--secondary"
    >
      <CategoryForm
        categorie={props.categorie}
        onSave={() => setEditing(false)}
      />
    </UiDialogButton>
  );
};

const CategoryTitle = (props: {categorie: FicheActionCategorie}) => {
  return (
    <div className="flex flex-col w-full ">
      <div className="flex flex-row justify-between">
        <h3 className="text-2xl">
          {props.categorie.nom}
          <span className="fr-fi-arrow-right-s-line ml-10" aria-hidden={true} />
        </h3>
        <ModificationDialogButton categorie={props.categorie} />
      </div>
    </div>
  );
};

const CategorizedFichesList = (props: {categorized: CategorizedFiche[]}) => (
  <>
    {props.categorized.map(cat => {
      return (
        <details open={true} className="pt-8">
          <summary className="flex items-center">
            <CategoryTitle categorie={cat.categorie} />
          </summary>
          {cat.fiches.map(fiche => {
            return (
              <div className="ml-5 mt-3">
                <FicheCard fiche={fiche} />
              </div>
            );
          })}
        </details>
      );
    })}
  </>
);

const UncategorizedFichesList = ({fiches}: {fiches: FicheAction[]}) => {
  if (!fiches.length) return <></>;
  return (
    <details open={true} className="pt-8">
      <summary className="flex items-center">
        <h3 className="text-2xl"> Fiches actions non classées</h3>
        <span className="fr-fi-arrow-right-s-line ml-10" aria-hidden={true} />
      </summary>
      {fiches.map(fiche => {
        return (
          <div className="ml-5 mt-3">
            <FicheCard fiche={fiche} />
          </div>
        );
      })}
    </details>
  );
};

const FichesList = () => {
  const fiches = useAllFiches();
  const categories = useAllStorables<FicheActionCategorieStorable>(
    ficheActionCategorieStore
  );
  const categorized = categorizeAndSortFiches(
    fiches,
    categories,
    defaultCategorie
  );
  const categorizedFichesWithCategorie = categorized.filter(
    categorizedFiche => categorizedFiche.categorie !== defaultCategorie
  );
  const uncategorizedFiches =
    categorized.find(
      categorizedFiche => categorizedFiche.categorie === defaultCategorie
    )?.fiches || [];

  return (
    <main className="fr-container">
      <header className="flex justify-between items-center ">
        <h1>Plan d'actions de ma collectivité</h1>
        <Spacer />
        <AddFicheActionButton />
      </header>

      <CategorizedFichesList categorized={categorizedFichesWithCategorie} />
      <UncategorizedFichesList fiches={uncategorizedFiches} />
    </main>
  );
};

export default FichesList;
