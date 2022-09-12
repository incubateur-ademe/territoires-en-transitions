import React from 'react';
import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {PreuvesAction, TPreuvesActionProps} from './PreuvesAction';
import {
  preuveReglementaireFichier,
  preuveReglementaireLien,
  preuveReglementaireLienSansDescription,
  preuveReglementaireNonRenseignee,
  preuveComplementaireFichier,
  preuveComplementaireLien,
} from './fixture';

export default {
  component: PreuvesAction,
} as Meta;

const Template: Story<TPreuvesActionProps> = args => (
  <PreuvesAction {...args} />
);

export const SansPreuvesComplementaires = Template.bind({});
SansPreuvesComplementaires.args = {
  reglementaires: [
    preuveReglementaireNonRenseignee,
    preuveReglementaireFichier,
    preuveReglementaireLien,
    preuveReglementaireLienSansDescription,
  ],
};

export const AvecPreuvesComplementaires = Template.bind({});
AvecPreuvesComplementaires.args = {
  reglementaires: [
    preuveReglementaireNonRenseignee,
    preuveReglementaireFichier,
    preuveReglementaireLien,
    preuveReglementaireLienSansDescription,
  ],
  complementaires: [preuveComplementaireFichier, preuveComplementaireLien],
};

export const SansPreuvesAttendues = Template.bind({});
SansPreuvesAttendues.args = {
  reglementaires: [],
  complementaires: [],
};

export const AvecMessageAvertissement = Template.bind({});
AvecMessageAvertissement.args = {
  reglementaires: [],
  complementaires: [preuveComplementaireFichier],
  showWarning: true,
};
