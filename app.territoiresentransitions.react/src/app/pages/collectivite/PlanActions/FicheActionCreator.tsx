import {useParams} from 'react-router-dom';
import {FicheActionForm} from 'app/pages/collectivite/PlanActions/FicheActionForm';
import {FicheActionInterface} from 'generated/models/fiche_action';
import {v4 as uuid} from 'uuid';
import {ficheActionStore} from 'core-logic/api/hybridStores';
import {FicheActionStorable} from 'storables/FicheActionStorable';

/**
 * This is the main component of FicheActionPage, use to show a fiche.
 */
const FicheActionCreator = () => {
  const {epciId} = useParams<{epciId: string}>();
  const fiche: FicheActionInterface = {
    epci_id: epciId,
    uid: uuid(),
    custom_id: '',
    avancement: 'pas_faite',
    titre: '',
    referentiel_action_ids: [],
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
    // todo redirect to plan action
  };

  return <FicheActionForm fiche={fiche} onSave={save} />;
};

export default FicheActionCreator;
