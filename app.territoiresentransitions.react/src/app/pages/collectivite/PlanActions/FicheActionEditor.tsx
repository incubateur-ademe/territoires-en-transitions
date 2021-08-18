import {useParams} from 'react-router-dom';
import {useFiche} from 'core-logic/hooks/fiches';
import {FicheActionStorable} from 'storables/FicheActionStorable';
import {FicheActionForm} from 'app/pages/collectivite/PlanActions/FicheActionForm';
import {FicheActionInterface} from 'generated/models/fiche_action';
import {ficheActionStore} from 'core-logic/api/hybridStores';

/**
 * This is the main component of FicheActionPage, use to show a fiche.
 */
const FicheActionEditor = () => {
  const {epciId, ficheUid} = useParams<{epciId: string; ficheUid: string}>();
  const ficheStorableId = FicheActionStorable.buildId(epciId, ficheUid);

  const fiche = useFiche(ficheStorableId);

  const save = async (fiche: FicheActionInterface) => {
    await ficheActionStore.store(new FicheActionStorable(fiche));
    // todo redirect to plan action
  };

  return (
    <>
      {fiche && <FicheActionForm fiche={fiche} onSave={save} />}
      {!fiche && <h2>Aucune fiche trouvée</h2>}
    </>
  );
};

export default FicheActionEditor;
