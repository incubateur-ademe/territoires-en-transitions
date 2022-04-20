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

export const Personnalise = Template.bind({});
Personnalise.args = {
  actionDef: ACTION_DEF,
  actionScore: SCORE_MODIFIE,
  onEdit: null,
};

export const PersonnaliseDeuxDigits = Template.bind({});
PersonnaliseDeuxDigits.args = {
  actionDef: ACTION_DEF,
  actionScore: {
    point_referentiel: 6.7,
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
