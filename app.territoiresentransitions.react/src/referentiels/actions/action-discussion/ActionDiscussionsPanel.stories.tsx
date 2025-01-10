import { action } from '@storybook/addon-actions';
import { Meta, StoryFn } from '@storybook/react';
import {
  ActionDiscussionPanelContent,
  ActionDiscussionsPanelProps,
} from './ActionDiscussionsPanel';
import {
  fakeActionDiscussion,
  fakeActionDiscussionCommentaire,
} from './data/fixture';
import { TActionDiscussionStatut } from './data/types';

export default {
  component: ActionDiscussionPanelContent,
} as Meta;

const Template: StoryFn<ActionDiscussionsPanelProps> = (args) => (
  <ActionDiscussionPanelContent {...args} />
);

const handlers = {
  changeVue: action('changeVue') as (vue: TActionDiscussionStatut) => void,
};

const VueOuvertsArgs: ActionDiscussionsPanelProps = {
  actionId: 'eci-1.1.1',
  vue: 'ouvert',
  discussions: [
    fakeActionDiscussion,
    {
      ...fakeActionDiscussion,
      id: 2,
      commentaires: [
        { ...fakeActionDiscussionCommentaire, message: 'Une autre discussion' },
        {
          ...fakeActionDiscussionCommentaire,
          message: 'Avec plusieurs commentaires!',
        },
      ],
    },
  ],
  ...handlers,
};

export const VueOuverts = {
  render: Template,
  args: VueOuvertsArgs,
};

const VueFermesArgs: ActionDiscussionsPanelProps = {
  actionId: 'eci-1.1.1',
  vue: 'ferme',
  discussions: [
    { ...fakeActionDiscussion, status: 'ferme' },
    {
      ...fakeActionDiscussion,
      id: 2,
      status: 'ferme',
      commentaires: [
        {
          ...fakeActionDiscussionCommentaire,
          message: 'Ces discussions sont fermés',
        },
        {
          ...fakeActionDiscussionCommentaire,
          message: 'Effectivement',
        },
      ],
    },
  ],
  ...handlers,
};

export const VueFermes = {
  render: Template,
  args: VueFermesArgs,
};
