import {Meta} from '@storybook/react';
import {ActionProgressBar} from './ActionProgressBar';
import {makeActionScore} from 'test_utils/factories/makeActionScore';

export default {
  component: ActionProgressBar,
} as Meta;

export const ToutFait = () => (
  <ActionProgressBar
    score={makeActionScore('eci_2.1', {
      point_fait: 100,
      point_potentiel: 100,
      point_pas_fait: 0,
      point_programme: 0,
    })}
  />
);

export const RienRenseigne = () => (
  <ActionProgressBar
    score={makeActionScore('eci_2.1', {
      point_fait: 0,
      point_potentiel: 100,
      point_pas_fait: 0,
      point_programme: 0,
      point_non_renseigne: 100,
    })}
  />
);

export const Mixte = () => (
  <ActionProgressBar
    score={makeActionScore('eci_2.1', {
      point_fait: 20,
      point_potentiel: 100,
      point_pas_fait: 20,
      point_programme: 28,
      point_non_renseigne: 32,
    })}
  />
);
