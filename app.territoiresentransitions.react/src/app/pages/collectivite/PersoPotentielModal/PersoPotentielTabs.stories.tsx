import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {
  PersoPotentielTabs,
  TPersoPotentielTabsProps,
} from './PersoPotentielTabs';
import {
  ACTION_DEF,
  Q1,
  Q2,
  Q3,
  SCORE,
  SCORE_MODIFIE,
  REGLES,
} from './fixture.json';

export default {
  component: PersoPotentielTabs,
} as Meta;

const onChange = action('onChange');

const Template: Story<TPersoPotentielTabsProps> = args => (
  <PersoPotentielTabs
    actionDef={ACTION_DEF}
    onChange={onChange}
    regles={REGLES}
    {...args}
  />
);

export const QuestionChoix = Template.bind({});
QuestionChoix.args = {
  actionScore: SCORE,
  questionReponses: [Q1],
};

export const QuestionChoixModifiee = Template.bind({});
QuestionChoixModifiee.args = {
  actionScore: SCORE_MODIFIE,
  questionReponses: [{...Q1, reponse: 'c3'}],
};

export const QuestionBinaire = Template.bind({});
QuestionBinaire.args = {
  actionScore: SCORE,
  questionReponses: [Q2],
};

export const QuestionBinaireModifiee = Template.bind({});
QuestionBinaireModifiee.args = {
  actionScore: SCORE_MODIFIE,
  questionReponses: [{...Q2, reponse: false}],
};

export const QuestionProportion = Template.bind({});
QuestionProportion.args = {
  actionScore: SCORE,
  questionReponses: [Q3],
};

export const QuestionProportionModifiee = Template.bind({});
QuestionProportionModifiee.args = {
  actionScore: SCORE_MODIFIE,
  questionReponses: [{...Q3, reponse: 60}],
};

export const PlusieursQuestions = Template.bind({});
PlusieursQuestions.args = {
  actionScore: SCORE_MODIFIE,
  questionReponses: [Q1, Q2, {...Q3, reponse: 60}],
};

/*
export const Documentation = Template.bind({});
Documentation.args = {
  defaultActiveTab: 1,
};
*/
