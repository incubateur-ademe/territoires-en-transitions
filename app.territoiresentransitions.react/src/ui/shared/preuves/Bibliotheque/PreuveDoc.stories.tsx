import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {PreuveDoc, TPreuveDocProps} from './PreuveDoc';

import {preuveComplementaireFichier, preuveComplementaireLien} from './fixture';

export default {
  component: PreuveDoc,
} as Meta;

const handlers = {
  isEditingComment: false,
  updatedComment: '',
  remove: action('remove'),
  update: action('update'),
  setEditingComment: action('setEditingComment'),
  setUpdatedComment: action('setUpdatedComment'),
};

const Template: Story<TPreuveDocProps> = args => <PreuveDoc {...args} />;

export const PreuveFichier = Template.bind({});
PreuveFichier.args = {
  handlers,
  preuve: preuveComplementaireFichier,
};

export const PreuveFichierEditionCommentaire = Template.bind({});
PreuveFichierEditionCommentaire.args = {
  handlers: {
    ...handlers,
    isEditingComment: true,
  },
  preuve: {
    ...preuveComplementaireFichier,
  },
};
// storyshot désactivé car le TextInput a un id qui change tout le temps
PreuveFichierEditionCommentaire.parameters = {storyshots: false};

export const PreuveFichierCommentee = Template.bind({});
PreuveFichierCommentee.args = {
  handlers,
  preuve: {
    ...preuveComplementaireFichier,
    commentaire: 'Cf pp 34-35 - Document provisoire, en attente d’approbation',
  },
};

export const PreuveLien = Template.bind({});
PreuveLien.args = {
  handlers,
  preuve: preuveComplementaireLien,
};

export const PreuveLienEditionCommentaire = Template.bind({});
PreuveLienEditionCommentaire.args = {
  handlers: {
    ...handlers,
    isEditingComment: true,
  },
  preuve: preuveComplementaireLien,
};
// storyshot désactivé car le TextInput a un id qui change tout le temps
PreuveLienEditionCommentaire.parameters = {storyshots: false};

export const PreuveLienCommentee = Template.bind({});
PreuveLienCommentee.args = {
  handlers,
  preuve: {
    ...preuveComplementaireLien,
    commentaire: 'Cf pp 34-35 - Document provisoire, en attente d’approbation',
  },
};
