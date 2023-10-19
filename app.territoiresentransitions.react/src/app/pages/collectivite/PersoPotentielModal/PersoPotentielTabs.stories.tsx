import {Story, Meta} from '@storybook/react';
import {
  PersoPotentielTabs,
  TPersoPotentielTabsProps,
} from './PersoPotentielTabs';
import Fixture from './fixture.json';

export default {
  component: PersoPotentielTabs,
} as Meta;

const Template: Story<TPersoPotentielTabsProps> = args => (
  <PersoPotentielTabs
    actionDef={Fixture.ACTION_DEF}
    onChange={Fixture.onChange}
    regles={Fixture.REGLES}
    {...args}
  />
);

export const QuestionChoix = Template.bind({});
QuestionChoix.args = {
  actionScore: Fixture.SCORE,
  questionReponses: [Fixture.Q1],
};

export const QuestionChoixModifiee = Template.bind({});
QuestionChoixModifiee.args = {
  actionScore: Fixture.SCORE_MODIFIE,
  questionReponses: [{...Fixture.Q1, reponse: 'c3'}],
};

export const QuestionBinaire = Template.bind({});
QuestionBinaire.args = {
  actionScore: Fixture.SCORE,
  questionReponses: [Fixture.Q2],
};

export const QuestionBinaireModifiee = Template.bind({});
QuestionBinaireModifiee.args = {
  actionScore: Fixture.SCORE_MODIFIE,
  questionReponses: [{...Fixture.Q2, reponse: false}],
};

export const QuestionProportion = Template.bind({});
QuestionProportion.args = {
  actionScore: Fixture.SCORE,
  questionReponses: [Fixture.Q3],
};

export const QuestionProportionModifiee = Template.bind({});
QuestionProportionModifiee.args = {
  actionScore: Fixture.SCORE_MODIFIE,
  questionReponses: [{...Fixture.Q3, reponse: 60}],
};

export const PlusieursQuestions = Template.bind({});
PlusieursQuestions.args = {
  actionScore: Fixture.SCORE_MODIFIE,
  questionReponses: [Fixture.Q1, Fixture.Q2, {...Fixture.Q3, reponse: 60}],
};

export const Documentation = Template.bind({});
Documentation.args = {
  defaultActiveTab: 1,
  actionScore: Fixture.SCORE_MODIFIE,
  questionReponses: [Fixture.Q1, Fixture.Q2, Fixture.Q3],
};
