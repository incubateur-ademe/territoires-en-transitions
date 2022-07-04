import {Meta} from '@storybook/react';
import {TableauBord} from './TableauBord';
import actions from '../../../../fixtures/referentiel_down_to_action.json';
import {makeActionScore} from 'test_utils/factories/makeActionScore';

export default {
  component: TableauBord,
} as Meta;

const scores = {
  eci: [],
  cae: [],
};

const makeLabellisationDemande = (referentiel = 'eci', etoiles = '1') => ({
  id: 1,
  en_cours: true,
  collectivite_id: 1,
  referentiel,
  etoiles,
});

const demande = {eci: null, cae: null};
const labellisationParNiveau = {eci: null, cae: null};
export const ReferentielsNonRemplis = () => (
  <TableauBord
    collectiviteId={1}
    scores={scores}
    demande={demande}
    labellisationParNiveau={labellisationParNiveau}
    actions={actions}
    indicateurCounts={{
      eci: {nbOfIndicateurs: 0, nbOfIndicateurswithValue: 0},
      cae: {nbOfIndicateurs: 0, nbOfIndicateurswithValue: 0},
    }}
  />
);

export const ReferentielsPartiellementRemplis = () => (
  <TableauBord
    collectiviteId={1}
    scores={{
      eci: [
        makeActionScore('eci'),
        makeActionScore('eci_1', {
          point_fait: 10,
          point_programme: 10,
          point_pas_fait: 20,
          point_potentiel: 40,
        }),
        makeActionScore('eci_2', {
          point_fait: 10,
          point_programme: 10,
          point_pas_fait: 80,
          point_potentiel: 100,
        }),
        makeActionScore('eci_3'),
        makeActionScore('eci_4', {
          point_fait: 10,
          point_programme: 28,
          point_pas_fait: 32,
          point_potentiel: 70,
        }),
        makeActionScore('eci_5'),
      ],
      cae: [
        makeActionScore('cae', {
          point_fait: 80,
          point_programme: 20,
          point_pas_fait: 400,
          point_potentiel: 500,
        }),
        makeActionScore('cae_1', {
          point_fait: 10,
          point_programme: 10,
          point_pas_fait: 20,
          point_potentiel: 40,
        }),
        makeActionScore('cae_2', {
          point_fait: 10,
          point_programme: 10,
          point_pas_fait: 80,
          point_potentiel: 100,
        }),
        makeActionScore('cae_3'),
        makeActionScore('cae_4', {
          point_fait: 10,
          point_programme: 28,
          point_pas_fait: 32,
          point_potentiel: 70,
        }),
        makeActionScore('cae_5'),
      ],
    }}
    demande={{eci: makeLabellisationDemande('eci'), cae: null}}
    labellisationParNiveau={{
      eci: makeLabellisationDemande('eci'),
      cae: makeLabellisationDemande('cae'),
    }}
    actions={actions}
    indicateurCounts={{
      eci: {nbOfIndicateurs: 100, nbOfIndicateurswithValue: 23},
      cae: {nbOfIndicateurs: 232, nbOfIndicateurswithValue: 12},
    }}
  />
);
