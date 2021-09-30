import {useHistory, useParams} from 'react-router-dom';
import {
  FicheActionForm,
  FicheActionFormData,
  PlanCategorieSelection,
} from 'app/pages/collectivite/PlanActions/Forms/FicheActionForm';
import {FicheActionInterface} from 'generated/models/fiche_action';
import {v4 as uuid} from 'uuid';
import {getFicheActionStoreForEpci} from 'core-logic/api/hybridStores';
import {FicheActionStorable} from 'storables/FicheActionStorable';
import {searchActionById} from 'utils/actions';
import {useQuery} from 'core-logic/hooks/query';
import {actions} from 'generated/data/referentiels';
import {RetourButton} from 'ui/shared';
import {updatePlansOnFicheSave} from 'core-logic/commands/plans';

/**
 * Used to create a fiche, shows FicheActionForm.
 */
const FicheActionCreator = () => {
  const {epciId} = useParams<{epciId: string}>();

  const ficheActionStore = getFicheActionStoreForEpci(epciId);

  const history = useHistory();

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

  const fiche: FicheActionInterface = {
    uid: uuid(),
    epci_id: epciId,
    referentiel_action_ids: referentiel_action_ids,
    titre: titre,
    avancement: 'pas_faite',
    custom_id: '',
    referentiel_indicateur_ids: [],
    description: '',
    budget: 0,
    personne_referente: '',
    structure_pilote: '',
    partenaires: '',
    elu_referent: '',
    commentaire: '',
    date_debut: '',
    date_fin: '',
    indicateur_personnalise_ids: [],
    en_retard: false,
  };

  const saveFiche = async (fiche: FicheActionInterface) => {
    await ficheActionStore.store(new FicheActionStorable(fiche));
  };

  const save = async (data: FicheActionFormData) => {
    await saveFiche(data);
    await updatePlansOnFicheSave(data);
    history.push(`/collectivite/${epciId}/plan_actions`);
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
