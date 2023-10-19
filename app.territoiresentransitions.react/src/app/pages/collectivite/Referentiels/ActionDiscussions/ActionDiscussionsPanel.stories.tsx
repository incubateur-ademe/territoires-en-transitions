import React from 'react';
import {StoryFn, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {
  ActionDiscussionPanelContent,
  ActionDiscussionsPanelProps,
} from './ActionDiscussionsPanel';
import {
  fakeActionDiscussion,
  fakeActionDiscussionCommentaire,
} from './data/fixture';
import {TActionDiscussionStatut} from './data/types';

export default {
  component: ActionDiscussionPanelContent,
} as Meta;

const Template: StoryFn<ActionDiscussionsPanelProps> = args => (
  <ActionDiscussionPanelContent {...args} onClose={action('onClose')} />
);

const handlers = {
  changeVue: action('changeVue') as (vue: TActionDiscussionStatut) => void,
};

export const VueOuverts = {
  render: Template,
  args: VueOuvertsArgs,
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
        {...fakeActionDiscussionCommentaire, message: 'Une autre discussion'},
        {
          ...fakeActionDiscussionCommentaire,
          message: 'Avec plusieurs commentaires!',
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

const VueFermesArgs: ActionDiscussionsPanelProps = {
  actionId: 'eci-1.1.1',
  vue: 'ferme',
  discussions: [
    {...fakeActionDiscussion, status: 'ferme'},
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
