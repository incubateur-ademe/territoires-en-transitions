import React from 'react';
import {Story, Meta} from '@storybook/react';
import {
  ActionAuditDetailBase,
  TActionAuditDetailBaseProps,
} from './ActionAuditDetail';

export default {
  component: ActionAuditDetailBase,
  parameters: {storyshots: false},
} as Meta;

const Template: Story<TActionAuditDetailBaseProps> = args => (
  <ActionAuditDetailBase {...args} />
);

export const NonRenseigne = Template.bind({});
NonRenseigne.args = {
  auditStatut: {
    avis: '',
    ordre_du_jour: false,
  },
};

export const Renseigne = Template.bind({});
Renseigne.args = {
  auditStatut: {
    avis: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.',
    ordre_du_jour: true,
  },
};

export const ReadOnly = Template.bind({});
ReadOnly.args = {
  readonly: true,
  auditStatut: {
    avis: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.',
    ordre_du_jour: true,
  },
};
