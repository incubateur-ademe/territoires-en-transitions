import { Meta } from '@storybook/react';
import ActionDiscussion, { ActionDiscussionProps } from './ActionDiscussion';
import {
  fakeActionDiscussion,
  fakeActionDiscussionCommentaire,
} from './data/fixture';

export default {
  component: ActionDiscussion,
} as Meta;

const OuverteArgs: ActionDiscussionProps = {
  discussion: fakeActionDiscussion,
};

export const Ouverte = {
  args: OuverteArgs,
};

const FermeeArgs: ActionDiscussionProps = {
  discussion: { ...fakeActionDiscussion, status: 'ferme' },
};

export const Fermee = {
  args: FermeeArgs,
};

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

export const AvecCommentairesMasques = {
  args: AvecCommentairesMasquesArgs,
};
