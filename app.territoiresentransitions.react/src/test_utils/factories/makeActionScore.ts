import {ActionScore} from 'types/ClientScore';
import {referentielId} from 'utils/actions';

export const makeActionScore = (
  action_id = 'cae',
  score: Partial<ActionScore> = {}
): ActionScore => ({
  ...{
    referentiel: referentielId(action_id),
    action_id,
    fait_taches_avancement: 0.375,
    pas_concerne_taches_avancement: 0,
    pas_fait_taches_avancement: 0.25,
    programme_taches_avancement: 0.375,
    point_fait: 30,
    point_programme: 30,
    point_pas_fait: 20,
    point_non_renseigne: 0,
    point_potentiel: 100,
    point_potentiel_perso: 80,
    point_referentiel: 0,
    concerne: true,
    total_taches_count: 2,
    completed_taches_count: 3,
    desactive: false,
  },
  ...score,
});
