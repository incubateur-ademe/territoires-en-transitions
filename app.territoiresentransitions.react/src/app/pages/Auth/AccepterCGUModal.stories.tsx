import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {AccepterCGUContent, TAccepterCGUProps} from './AccepterCGUModal';

export default {
  component: AccepterCGUContent,
} as Meta;

const Template: Story<TAccepterCGUProps> = args => (
  <AccepterCGUContent {...args} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
  onOK: action('onOK'),
};
