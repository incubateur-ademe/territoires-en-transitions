import {useHistory, useParams} from 'react-router-dom';
import {useFicheAction} from 'core-logic/hooks/fiche_action';
import {
  FicheActionForm,
  FicheActionFormData,
} from 'app/pages/collectivite/PlanActions/Forms/FicheActionForm';
import {updatePlansOnFicheSave} from 'core-logic/commands/plans';
import {useCollectiviteId} from 'core-logic/hooks';
import {makeCollectiviteDefaultPlanActionPath} from 'app/paths';
import {ficheActionRepository} from 'core-logic/api/repositories/FicheActionRepository';

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

  const onSave = async (data: FicheActionFormData) => {
    await ficheActionRepository.save(deleteObjectKey(data, 'planCategories')); // Formik object has all ficheActionWrite keys + `planCategories`
    await updatePlansOnFicheSave(data);
    history.push(makeCollectiviteDefaultPlanActionPath({collectiviteId}));
  };

  return (
    <main className="fr-container pt-8">
      <h1>Ma fiche action</h1>
      {ficheAction && (
        <FicheActionForm
          fiche={ficheAction}
          planCategories={[]}
          onSave={onSave}
        />
      )}
      {!ficheAction && <h2>Aucune fiche trouvée</h2>}
    </main>
  );
};

export default FicheActionEditor;

const deleteObjectKey = (object: any, key: string) => {
  const objectCopy = {...object};
  delete objectCopy[key];
  return objectCopy;
};
