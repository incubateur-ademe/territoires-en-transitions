import React from 'react';
import {Story, Meta} from '@storybook/react';

import HistoriqueItemJustification from './HistoriqueItemJustification';
import {THistoriqueItemProps} from '../types';
import {
  fakeReponseChoix,
  fakeReponseBinaire,
  fakeReponseProportion,
} from './fixture';

export default {
  component: HistoriqueItemJustification,
} as Meta;

const Template: Story<THistoriqueItemProps> = args => (
  <HistoriqueItemJustification {...args} />
);

const justification = 'Une bonne raison...';
const modifiedJustification = {
  justification: 'Nouvelle justification...',
  previous_justification: justification,
};

export const JustificationQuestionChoix = Template.bind({});
JustificationQuestionChoix.args = {
  item: {...fakeReponseChoix, justification},
};

export const ModifJustificationQuestionChoix = Template.bind({});
ModifJustificationQuestionChoix.args = {
  item: {...fakeReponseChoix, ...modifiedJustification},
};

export const JustificationQuestionBinaire = Template.bind({});
JustificationQuestionBinaire.args = {
  item: {...fakeReponseBinaire, justification},
};

export const ModifJustificationQuestionBinaire = Template.bind({});
ModifJustificationQuestionBinaire.args = {
  item: {...fakeReponseBinaire, ...modifiedJustification},
};

export const JustificationQuestionProportion = Template.bind({});
JustificationQuestionProportion.args = {
  item: {...fakeReponseProportion, justification},
};

export const ModifJustificationQuestionProportion = Template.bind({});
ModifJustificationQuestionProportion.args = {
  item: {...fakeReponseProportion, ...modifiedJustification},
};
