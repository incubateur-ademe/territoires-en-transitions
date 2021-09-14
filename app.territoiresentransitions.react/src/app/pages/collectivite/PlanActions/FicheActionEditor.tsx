import {useHistory, useParams} from 'react-router-dom';
import {useFiche} from 'core-logic/hooks/fiches';
import {FicheActionStorable} from 'storables/FicheActionStorable';
import {FicheActionForm} from 'app/pages/collectivite/PlanActions/Forms/FicheActionForm';
import {FicheActionInterface} from 'generated/models/fiche_action';
import {getFicheActionStoreForEpci} from 'core-logic/api/hybridStores';

/**
 * This is the main component of FicheActionPage, use to show a fiche.
 */
const FicheActionEditor = () => {
  const {epciId, ficheUid} = useParams<{epciId: string; ficheUid: string}>();
  const ficheActionStore = getFicheActionStoreForEpci(epciId);
  const ficheStorableId = FicheActionStorable.buildId(epciId, ficheUid);
  const history = useHistory();
  const fiche = useFiche(ficheStorableId, epciId);

  const save = async (fiche: FicheActionInterface) => {
    await ficheActionStore.store(new FicheActionStorable(fiche));
    history.push(`/collectivite/${epciId}/plan_actions`);
  };

  return (
    <main className="fr-container pt-8">
      <h1>Ma fiche action</h1>
      {fiche && <FicheActionForm fiche={fiche} onSave={save} />}
      {!fiche && <h2>Aucune fiche trouvée</h2>}
    </main>
  );
};

export default FicheActionEditor;
