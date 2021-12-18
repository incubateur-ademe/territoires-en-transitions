import {useHistory, useParams} from 'react-router-dom';
import {useFicheAction} from 'core-logic/hooks/fiche_action';
import {
  FicheActionForm,
  FicheActionFormData,
} from 'app/pages/collectivite/PlanActions/Forms/FicheActionForm';
import {updatePlansOnFicheSave} from 'core-logic/commands/plans';
import {useCollectiviteId} from 'core-logic/hooks';
import {ficheActionWriteEndpoint} from 'core-logic/api/endpoints/FicheActionWriteEndpoint';
import {FicheActionWrite} from 'generated/dataLayer/fiche_action_write';

/**
 * This is the main component of FicheActionPage, use to show a fiche.
 */
const FicheActionEditor = () => {
  const {ficheUid} = useParams<{ficheUid: string}>();
  const history = useHistory();
  const collectiviteId = useCollectiviteId()!;
  const ficheAction = useFicheAction(collectiviteId, ficheUid);

  if (ficheAction === null) {
    return null;
  }

  const saveFiche = async (fiche: FicheActionWrite) => {
    await ficheActionWriteEndpoint.save(fiche);
  };

  const save = async (data: FicheActionFormData) => {
    await saveFiche(data);
    await updatePlansOnFicheSave(data);
    history.push(`/collectivite/${collectiviteId}/plan_actions`);
  };

  return (
    <main className="fr-container pt-8">
      <h1>Ma fiche action</h1>
      {ficheAction && (
        <FicheActionForm
          fiche={ficheAction}
          planCategories={[]}
          onSave={save}
        />
      )}
      {!ficheAction && <h2>Aucune fiche trouvée</h2>}
    </main>
  );
};

export default FicheActionEditor;
