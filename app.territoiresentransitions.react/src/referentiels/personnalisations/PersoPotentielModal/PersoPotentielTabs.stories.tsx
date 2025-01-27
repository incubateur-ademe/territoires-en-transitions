import {StoryFn, Meta} from '@storybook/react';
import {
  PersoPotentielTabs,
  TPersoPotentielTabsProps,
} from './PersoPotentielTabs';
import Fixture from './fixture.json';

export default {
  component: PersoPotentielTabs,
} as Meta;

const Template: StoryFn<TPersoPotentielTabsProps> = args => (
  <PersoPotentielTabs
    actionDef={Fixture.ACTION_DEF}
    onChange={Fixture.onChange}
    regles={Fixture.REGLES}
    {...args}
  />
);

export const QuestionChoix = {
  render: Template,

  args: {
    actionScore: Fixture.SCORE,
    questionReponses: [Fixture.Q1],
  },
};

export const QuestionChoixModifiee = {
  render: Template,

  args: {
    actionScore: Fixture.SCORE_MODIFIE,
    questionReponses: [{...Fixture.Q1, reponse: 'c3'}],
  },
};

export const QuestionBinaire = {
  render: Template,

  args: {
    actionScore: Fixture.SCORE,
    questionReponses: [Fixture.Q2],
  },
};

export const QuestionBinaireModifiee = {
  render: Template,

  args: {
    actionScore: Fixture.SCORE_MODIFIE,
    questionReponses: [{...Fixture.Q2, reponse: false}],
  },
};

export const QuestionProportion = {
  render: Template,

  args: {
    actionScore: Fixture.SCORE,
    questionReponses: [Fixture.Q3],
  },
};

export const QuestionProportionModifiee = {
  render: Template,

  args: {
    actionScore: Fixture.SCORE_MODIFIE,
    questionReponses: [{...Fixture.Q3, reponse: 60}],
  },
};

export const PlusieursQuestions = {
  render: Template,

  args: {
    actionScore: Fixture.SCORE_MODIFIE,
    questionReponses: [Fixture.Q1, Fixture.Q2, {...Fixture.Q3, reponse: 60}],
  },
};

export const Documentation = {
  render: Template,

  args: {
    defaultActiveTab: 1,
    actionScore: Fixture.SCORE_MODIFIE,
    questionReponses: [Fixture.Q1, Fixture.Q2, Fixture.Q3],
  },
};
