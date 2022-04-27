import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {PointsPotentiels, TPointsPotentielsProps} from './PointsPotentiels';
import {ACTION_DEF, SCORE, SCORE_MODIFIE} from './fixture.json';

export default {
  component: PointsPotentiels,
} as Meta;

const Template: Story<TPointsPotentielsProps> = args => (
  <PointsPotentiels {...args} />
);

export const NonPersonnalise = Template.bind({});
NonPersonnalise.args = {
  actionDef: ACTION_DEF,
  actionScore: SCORE,
  onEdit: null,
};

export const Reduit = Template.bind({});
Reduit.args = {
  actionDef: ACTION_DEF,
  actionScore: SCORE_MODIFIE,
  onEdit: null,
};

export const Augmente = Template.bind({});
Augmente.args = {
  actionDef: ACTION_DEF,
  actionScore: {
    point_referentiel: 6.7,
    point_potentiel: 6.7,
    point_potentiel_perso: 10,
  },
  onEdit: null,
};

export const ReduitDeuxDigits = Template.bind({});
ReduitDeuxDigits.args = {
  actionDef: ACTION_DEF,
  actionScore: {
    point_referentiel: 6.7,
    point_potentiel: 6.7,
    point_potentiel_perso: 3.35,
  },
  onEdit: null,
};

export const PersonnaliseEtEditable = Template.bind({});
PersonnaliseEtEditable.args = {
  actionDef: ACTION_DEF,
  actionScore: SCORE_MODIFIE,
  onEdit: action('onEdit'),
};

export const PersonnaliseScoreZero = Template.bind({});
PersonnaliseScoreZero.args = {
  actionDef: ACTION_DEF,
  actionScore: {
    point_referentiel: 20,
    point_potentiel: 20,
    point_potentiel_perso: 0,
  },
  onEdit: action('onEdit'),
};

export const Desactive = Template.bind({});
Desactive.args = {
  actionDef: ACTION_DEF,
  actionScore: {
    desactive: true,
    point_referentiel: 20,
    point_potentiel: 20,
    point_potentiel_perso: 0,
  },
  onEdit: action('onEdit'),
};
