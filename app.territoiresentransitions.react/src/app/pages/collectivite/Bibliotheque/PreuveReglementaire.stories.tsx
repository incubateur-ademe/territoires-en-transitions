import React from 'react';
import {Story, Meta} from '@storybook/react';
import {
  PreuveReglementaire,
  TPreuveReglementaireProps,
} from './PreuveReglementaire';

import {
  preuveReglementaireFichier,
  preuveReglementaireLien,
  preuveReglementaireNonRenseignee,
} from './fixture';

export default {
  component: PreuveReglementaire,
} as Meta;

const Template: Story<TPreuveReglementaireProps> = args => (
  <PreuveReglementaire {...args} />
);

export const NonRenseignee = Template.bind({});
NonRenseignee.args = {
  preuves: [preuveReglementaireNonRenseignee],
};

export const Fichier = Template.bind({});
Fichier.args = {
  preuves: [preuveReglementaireFichier],
};

export const Lien = Template.bind({});
Lien.args = {
  preuves: [preuveReglementaireLien],
};

export const ActionNonConcernee = Template.bind({});
ActionNonConcernee.args = {
  preuves: [
    {
      ...preuveReglementaireNonRenseignee,
      action: {
        ...preuveReglementaireNonRenseignee.action,
        concerne: false,
      },
    },
  ],
};

export const ActionDesactivee = Template.bind({});
ActionDesactivee.args = {
  preuves: [
    {
      ...preuveReglementaireNonRenseignee,
      action: {
        ...preuveReglementaireNonRenseignee.action,
        desactive: true,
      },
    },
  ],
};

export const Multiple = Template.bind({});
Multiple.args = {
  preuves: [preuveReglementaireFichier, preuveReglementaireLien],
};
