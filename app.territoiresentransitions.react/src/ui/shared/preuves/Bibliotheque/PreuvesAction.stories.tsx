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
  action_id: 'cae_1.2.3.4',
  reglementaires: [
    preuveReglementaireNonRenseignee,
    preuveReglementaireFichier,
    preuveReglementaireLien,
    preuveReglementaireLienSansDescription,
  ],
};

export const AvecPreuvesComplementaires = Template.bind({});
AvecPreuvesComplementaires.args = {
  action_id: 'cae_1.2.3.4',
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
  action_id: 'cae_1.2.3%',
  reglementaires: [],
  complementaires: [],
};

export const AvecMessageAvertissement = Template.bind({});
AvecMessageAvertissement.args = {
  action_id: 'cae_1.2.4',
  reglementaires: [],
  complementaires: [preuveComplementaireFichier],
  showWarning: true,
};
