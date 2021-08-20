import {useAllFiches} from 'core-logic/hooks/fiches';
import {Link} from 'react-router-dom';
import {useEpciId} from 'core-logic/hooks/params';
import {useAllStorables} from 'core-logic/hooks';
import {FicheActionCategorieStorable} from 'storables/FicheActionCategorieStorable';
import {ficheActionCategorieStore} from 'core-logic/api/hybridStores';
import {categorizeAndSortFiches, CategorizedFiche} from 'ui/fiches/sortFiches';
import {FicheCard} from 'app/pages/collectivite/PlanActions/FicheCard';

const defaultCategorie = new FicheActionCategorieStorable({
  uid: '',
  epci_id: '',
  nom: 'sans categorie',
  parent_uid: '',
  fiche_actions_uids: [],
});

function CategorizedFichesList(props: {categorized: CategorizedFiche[]}) {
  return (
    <>
      {props.categorized.map(cat => {
        return (
          <details open={true}>
            <summary className="flex items-center">
              <h3 className="text-2xl">
                {cat.categorie.nom}
                <span
                  className="fr-fi-arrow-right-s-line ml-10"
                  aria-hidden={true}
                />
              </h3>
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
}

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
        <h2>Plan d'actions de ma collectivité</h2>
        <Link className="fr-btn " to={`/collectivite/${epciId}/nouvelle_fiche`}>
          Ajouter une fiche action
        </Link>
      </header>
      <nav className="bg-yellow-200 p-5 my-5">
        <section>todo filtres</section>
      </nav>

      <CategorizedFichesList categorized={categorized} />
    </main>
  );
};

export default FichesList;
