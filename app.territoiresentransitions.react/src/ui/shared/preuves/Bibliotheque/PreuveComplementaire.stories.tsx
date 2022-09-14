import React from 'react';
import {Story, Meta} from '@storybook/react';
import {
  PreuveComplementaire,
  TPreuveComplementaireProps,
} from './PreuveComplementaire';
import {preuveComplementaireLien, preuveComplementaireFichier} from './fixture';

export default {
  component: PreuveComplementaire,
} as Meta;

const Template: Story<TPreuveComplementaireProps> = args => (
  <PreuveComplementaire {...args} />
);

export const Lien = Template.bind({});
Lien.args = {
  preuve: preuveComplementaireLien,
};

export const Fichier = Template.bind({});
Fichier.args = {
  preuve: preuveComplementaireFichier,
};

export const ActionNonConcernee = Template.bind({});
ActionNonConcernee.args = {
  preuve: {
    ...preuveComplementaireFichier,
    action: {
      ...preuveComplementaireFichier.action,
      concerne: false,
    },
  },
};

export const ActionDesactivee = Template.bind({});
ActionDesactivee.args = {
  preuve: {
    ...preuveComplementaireFichier,
    action: {
      ...preuveComplementaireFichier.action,
      desactive: true,
    },
  },
};
