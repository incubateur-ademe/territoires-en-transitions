import React from 'react';
import {Story, Meta} from '@storybook/react';
import {ActionPhaseBadge, TActionPhaseBadgeProps} from './ActionPhaseBadge';

export default {
  component: ActionPhaseBadge,
} as Meta;

const Template: Story<TActionPhaseBadgeProps> = args => (
  <ActionPhaseBadge {...args} />
);

export const Bases = Template.bind({});
Bases.args = {
  action: {phase: 'bases'},
};

export const MiseEnOeuvre = Template.bind({});
MiseEnOeuvre.args = {
  action: {phase: 'mise en œuvre'},
};

export const Effets = Template.bind({});
Effets.args = {
  action: {phase: 'effets'},
};
