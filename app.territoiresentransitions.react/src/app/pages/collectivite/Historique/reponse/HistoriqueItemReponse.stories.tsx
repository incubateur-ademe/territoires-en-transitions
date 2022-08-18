import React from 'react';
import {Story, Meta} from '@storybook/react';

import HistoriqueItemReponse from './HistoriqueItemReponse';
import {THistoriqueItemProps} from '../types';
import {
  fakeReponseChoix,
  fakeReponseChoix2,
  fakeReponseBinaire,
  fakeReponseBinaire2,
  fakeReponseProportion,
  fakeReponseProportion2,
} from './fixture';

export default {
  component: HistoriqueItemReponse,
} as Meta;

const Template: Story<THistoriqueItemProps> = args => (
  <HistoriqueItemReponse {...args} />
);

export const PremiereReponseQuestionChoix = Template.bind({});
PremiereReponseQuestionChoix.args = {
  item: fakeReponseChoix,
};

export const ReponseQuestionChoixModifiee = Template.bind({});
ReponseQuestionChoixModifiee.args = {
  item: fakeReponseChoix2,
};

export const PremiereReponseQuestionBinaire = Template.bind({});
PremiereReponseQuestionBinaire.args = {
  item: fakeReponseBinaire,
};

export const ReponseQuestionBinaireModifiee = Template.bind({});
ReponseQuestionBinaireModifiee.args = {
  item: fakeReponseBinaire2,
};

export const PremiereReponseQuestionProportion = Template.bind({});
PremiereReponseQuestionProportion.args = {
  item: fakeReponseProportion,
};

export const ReponseQuestionProportionModifiee = Template.bind({});
ReponseQuestionProportionModifiee.args = {
  item: fakeReponseProportion2,
};
