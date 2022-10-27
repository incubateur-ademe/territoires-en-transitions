import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {
  ActionDiscussionsPanel,
  ActionDiscussionsPanelProps,
} from './ActionDiscussionsPanel';
import {
  fakeActionDiscussion,
  fakeActionDiscussionCommentaire,
} from './data/fixture';
import {TActionDiscussionStatut} from './data/types';

export default {
  component: ActionDiscussionsPanel,
} as Meta;

const Template: Story<ActionDiscussionsPanelProps> = args => (
  <div className="absolute right-0">
    <ActionDiscussionsPanel {...args} />
  </div>
);

const handlers = {
  changeVue: action('changeVue') as (vue: TActionDiscussionStatut) => void,
};

export const VueOuverts = Template.bind({});
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
VueOuverts.args = VueOuvertsArgs;

export const VueFermes = Template.bind({});
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
VueFermes.args = VueFermesArgs;
