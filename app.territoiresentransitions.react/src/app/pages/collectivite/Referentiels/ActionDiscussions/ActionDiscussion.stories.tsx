import { Meta} from '@storybook/react';
import ActionDiscussion, {ActionDiscussionProps} from './ActionDiscussion';
import {
  fakeActionDiscussion,
  fakeActionDiscussionCommentaire,
} from './data/fixture';

export default {
  component: ActionDiscussion,
} as Meta;

export const Ouverte = {
  args: OuverteArgs,
};

const OuverteArgs: ActionDiscussionProps = {
  discussion: fakeActionDiscussion,
};

export const Fermee = {
  args: FermeeArgs,
};

const FermeeArgs: ActionDiscussionProps = {
  discussion: {...fakeActionDiscussion, status: 'ferme'},
};

export const AvecCommentairesMasques = {
  args: AvecCommentairesMasquesArgs,
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
