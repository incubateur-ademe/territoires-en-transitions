import {useHistory, useParams} from 'react-router-dom';
import {
  FicheActionForm,
  FicheActionFormData,
  PlanCategorieSelection,
} from 'app/pages/collectivite/PlanActions/Forms/FicheActionForm';
import {v4 as uuid} from 'uuid';
import {searchActionById} from 'utils/actions';
import {useQuery} from 'core-logic/hooks/query';
import {actions} from 'generated/data/referentiels';
import {RetourButton} from 'ui/shared';
import {updatePlansOnFicheSave} from 'core-logic/commands/plans';
import {FicheActionWrite} from 'generated/dataLayer/fiche_action_write';
import {ficheActionWriteEndpoint} from 'core-logic/api/endpoints/FicheActionWriteEndpoint';
import {useCollectiviteId, useFicheAction} from 'core-logic/hooks';

/**
 * Used to create a fiche, shows FicheActionForm.
 */
const FicheActionCreator = () => {
  const {ficheUid} = useParams<{ficheUid: string}>();
  const history = useHistory();
  const collectiviteId = useCollectiviteId()!;
  const ficheAction = useFicheAction(collectiviteId, ficheUid);

  if (ficheAction === null) {
    return null;
  }

  const query = useQuery();

  // handle action_id query parameter, used when the fiche is created from
  // an action.
  let titre = '';
  let referentiel_action_ids: string[] = [];
  if (query.get('action_id')) {
    const action = searchActionById(query.get('action_id')!, actions);
    if (action) {
      titre = action.nom;
      referentiel_action_ids = [action.id];
    }
  }

  // handle plan_id query parameter, used when the fiche is created from
  // a plan.
  const planCategories: PlanCategorieSelection[] = [];
  if (query.get('plan_uid')) {
    planCategories.push({
      planUid: query.get('plan_uid')!,
    });
  }

  const fiche: FicheActionWrite = {
    uid: uuid(),
    collectivite_id: collectiviteId,
    titre: titre,
    avancement: 'pas_faite',
    numerotation: '',
    description: '',

    en_retard: false,
    budget_global: 0,

    personne_referente: '',
    structure_pilote: '',
    partenaires: '',
    elu_referent: '',
    commentaire: '',
    date_debut: '',
    date_fin: '',
    action_ids: referentiel_action_ids,
    indicateur_ids: [],
    indicateur_personnalise_ids: [],
  };

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
      <RetourButton />
      <h1 className="fr-h1 pt-5">Ajouter une fiche action</h1>
      <FicheActionForm
        fiche={fiche}
        planCategories={planCategories}
        onSave={save}
      />
    </main>
  );
};

export default FicheActionCreator;
