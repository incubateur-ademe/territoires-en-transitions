import { Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {PointsPotentiels} from './PointsPotentiels';
import Fixture from './fixture.json';

export default {
  component: PointsPotentiels,
} as Meta;

export const NonPersonnalise = {
  args: {
    actionDef: Fixture.ACTION_DEF,
    actionScore: Fixture.SCORE,
    onEdit: null,
  },
};

export const Reduit = {
  args: {
    actionDef: Fixture.ACTION_DEF,
    actionScore: Fixture.SCORE_MODIFIE,
    onEdit: null,
  },
};

export const Augmente = {
  args: {
    actionDef: Fixture.ACTION_DEF,
    actionScore: {
      point_referentiel: 6.7,
      point_potentiel: 6.7,
      point_potentiel_perso: 10,
    },
    onEdit: null,
  },
};

export const ReduitDeuxDigits = {
  args: {
    actionDef: Fixture.ACTION_DEF,
    actionScore: {
      point_referentiel: 6.7,
      point_potentiel: 6.7,
      point_potentiel_perso: 3.35,
    },
    onEdit: null,
  },
};

export const PersonnaliseEtEditable = {
  args: {
    actionDef: Fixture.ACTION_DEF,
    actionScore: Fixture.SCORE_MODIFIE,
    onEdit: action('onEdit'),
  },
};

export const PersonnaliseScoreZero = {
  args: {
    actionDef: Fixture.ACTION_DEF,
    actionScore: {
      point_referentiel: 20,
      point_potentiel: 20,
      point_potentiel_perso: 0,
    },
    onEdit: action('onEdit'),
  },
};

export const Desactive = {
  args: {
    actionDef: Fixture.ACTION_DEF,
    actionScore: {
      desactive: true,
      point_referentiel: 20,
      point_potentiel: 20,
      point_potentiel_perso: 0,
    },
    onEdit: action('onEdit'),
  },
};
