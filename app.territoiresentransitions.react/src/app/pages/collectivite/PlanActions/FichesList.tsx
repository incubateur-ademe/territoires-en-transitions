import {useAllFiches} from 'core-logic/hooks/fiches';
import {Link} from 'react-router-dom';
import {useEpciId} from 'core-logic/hooks/params';
import {useAllStorables} from 'core-logic/hooks';
import {FicheActionCategorieStorable} from 'storables/FicheActionCategorieStorable';
import {ficheActionCategorieStore} from 'core-logic/api/hybridStores';
import {categorizeAndSortFiches, CategorizedFiche} from 'ui/fiches/sortFiches';
import {FicheCard} from 'app/pages/collectivite/PlanActions/FicheCard';
import {
  FicheActionCategorie,
  FicheActionCategorieInterface,
} from 'generated/models/fiche_action_categorie';
import React, {useState} from 'react';
import {LabeledTextInput} from 'ui';

const defaultCategorie = new FicheActionCategorieStorable({
  uid: '',
  epci_id: '',
  nom: 'sans categorie',
  parent_uid: '',
  fiche_actions_uids: [],
});

function CategoryForm(props: {
  categorie: FicheActionCategorieInterface;
  onSave: () => void;
}) {
  const categorie = props.categorie;
  const [nom, setNom] = useState<string>(categorie.nom);

  const handleSave = async () => {
    if (!categorie.nom) return;
    const storable = new FicheActionCategorieStorable({...categorie, nom: nom});
    await ficheActionCategorieStore.store(storable);
    props.onSave();
  };

  return (
    <div>
      <LabeledTextInput
        label="Nom de la categorie"
        maxLength={100}
        value={nom}
        onChange={event => {
          setNom(event.target.value);
        }}
      />
      <div className="flex flex-row-reverse p-5">
        <button className="fr-btn" onClick={handleSave}>
          Enregistrer
        </button>
      </div>
    </div>
  );
}

function CategoryTitle(props: {categorie: FicheActionCategorie}) {
  const [editing, setEditing] = useState<boolean>(false);
  const editable = props.categorie.uid !== defaultCategorie.uid;
  return (
    <div className="flex flex-col w-full ">
      <div className="flex flex-row justify-between">
        <h3 className="text-2xl">
          {props.categorie.nom}
          <span className="fr-fi-arrow-right-s-line ml-10" aria-hidden={true} />
        </h3>
        {editable && !editing && (
          <button className="fr-btn" onClick={() => setEditing(!editing)}>
            Modifier
          </button>
        )}
      </div>
      {editing && editable && (
        <div className="border-bf500 border-l-4 p-4 mt-2 mb-5 ml-5 bg-beige max-w-2xl">
          <div className="flex flex-row  w-full items-center justify-between">
            <h5 className="text-lg">Modifier la catégorie</h5>
            <button className="fr-btn" onClick={() => setEditing(false)}>
              x
            </button>
          </div>
          <CategoryForm
            categorie={props.categorie}
            onSave={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  );
}

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
              <div className="ml-5">
                <FicheCard fiche={fiche} />
              </div>
            );
          })}
        </details>
      );
    })}
  </>
);

const FichesList = () => {
  const epciId = useEpciId();
  const fiches = useAllFiches();
  const categories = useAllStorables<FicheActionCategorieStorable>(
    ficheActionCategorieStore
  );
  const categorized = categorizeAndSortFiches(
    fiches,
    categories,
    defaultCategorie
  );

  return (
    <main className="fr-container">
      <header className="flex justify-between items-center ">
        <h1>Plan d'actions de ma collectivité</h1>
        <Link
          className="fr-btn fr-btn--secondary"
          to={`/collectivite/${epciId}/nouvelle_fiche`}
        >
          Ajouter une fiche action
        </Link>
      </header>
      <nav className="bg-yellow-200 p-5 my-5">
        <section>todo filtres</section>
      </nav>

      <nav className="bg-yellow-200 p-5 my-5">
        <section>todo new categorie</section>
      </nav>

      <CategorizedFichesList categorized={categorized} />
    </main>
  );
};

export default FichesList;
