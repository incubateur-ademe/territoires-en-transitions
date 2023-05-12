import React from 'react';
import {Story, Meta} from '@storybook/react';
import {ToolbarIconButton, ToolbarIconButtonProps} from './ToolbarIconButton';

export default {
  component: ToolbarIconButton,
} as Meta;

const Template: Story<ToolbarIconButtonProps> = args => (
  <ToolbarIconButton {...args} />
);

export const Default = Template.bind({});
Default.args = {
  icon: 'info',
};

export const Pressed = Template.bind({});
Pressed.args = {
  icon: 'info',
  'aria-pressed': true,
};
