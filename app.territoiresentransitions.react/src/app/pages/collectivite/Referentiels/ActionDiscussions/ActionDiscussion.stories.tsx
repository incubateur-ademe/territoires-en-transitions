import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import ActionDiscussion, {ActionDiscussionProps} from './ActionDiscussion';
import {
  fakeActionDiscussion,
  fakeActionDiscussionCommentaire,
} from './data/fixture';

export default {
  component: ActionDiscussion,
} as Meta;

const Template: Story<ActionDiscussionProps> = args => (
  <ActionDiscussion {...args} />
);

// const handlers = {
//   changeVue: action('changeVue') as (vue: TActionDiscussionStatut) => void,
// };

export const Ouverte = Template.bind({});
const OuverteArgs: ActionDiscussionProps = {
  discussion: fakeActionDiscussion,
};
Ouverte.args = OuverteArgs;

export const Fermee = Template.bind({});
const FermeeArgs: ActionDiscussionProps = {
  discussion: {...fakeActionDiscussion, status: 'ferme'},
};
Fermee.args = FermeeArgs;

export const AvecCommentairesMasques = Template.bind({});
const AvecCommentairesMasquesArgs: ActionDiscussionProps = {
  discussion: {
    ...fakeActionDiscussion,
    commentaires: [
      fakeActionDiscussionCommentaire,
      fakeActionDiscussionCommentaire,
      fakeActionDiscussionCommentaire,
      {
        ...fakeActionDiscussionCommentaire,
        message: 'Le dernier commentaire est visible',
      },
    ],
  },
};
AvecCommentairesMasques.args = AvecCommentairesMasquesArgs;
