import {useHistory, useParams} from 'react-router-dom';
import {FicheActionForm} from 'app/pages/collectivite/PlanActions/Forms/FicheActionForm';
import {FicheActionInterface} from 'generated/models/fiche_action';
import {v4 as uuid} from 'uuid';
import {ficheActionStore} from 'core-logic/api/hybridStores';
import {FicheActionStorable} from 'storables/FicheActionStorable';
import {searchActionById} from 'utils/actions';
import {useQuery} from 'core-logic/hooks/query';
import {actions} from 'generated/data/referentiels';
import {RetourButton} from 'ui/shared';

/**
 * This is the main component of FicheActionPage, use to show a fiche.
 */
const FicheActionCreator = () => {
  const {epciId} = useParams<{epciId: string}>();
  const history = useHistory();

  const query = useQuery();

  let titre = '';
  let referentiel_action_ids: string[] = [];

  if (query.get('action_id')) {
    const action = searchActionById(query.get('action_id')!, actions);
    if (action) {
      titre = action.nom;
      referentiel_action_ids = [action.id];
    }
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

  const save = async (fiche: FicheActionInterface) => {
    await ficheActionStore.store(new FicheActionStorable(fiche));
    history.push(`/collectivite/${epciId}/plan_actions`);
  };

  return (
    <main className="fr-container pt-8">
      <RetourButton />
      <h1 className="fr-h1 pt-5">Ajouter une fiche action</h1>
      <FicheActionForm fiche={fiche} onSave={save} />
    </main>
  );
};

export default FicheActionCreator;
