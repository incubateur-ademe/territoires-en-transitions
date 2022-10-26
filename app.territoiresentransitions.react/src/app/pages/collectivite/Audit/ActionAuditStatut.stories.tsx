import React from 'react';
import {Story, Meta} from '@storybook/react';
import {
  ActionAuditStatutBase,
  TActionAuditStatutBaseProps,
} from './ActionAuditStatut';

export default {
  component: ActionAuditStatutBase,
} as Meta;

const Template: Story<TActionAuditStatutBaseProps> = args => (
  <ActionAuditStatutBase {...args} />
);

export const NonAudite = Template.bind({});
NonAudite.args = {
  auditStatut: {
    statut: 'non_audite',
  },
};
export const EnCours = Template.bind({});
EnCours.args = {
  auditStatut: {
    statut: 'en_cours',
  },
};
export const Audite = Template.bind({});
Audite.args = {
  auditStatut: {
    statut: 'audite',
  },
};

export const ReadOnly = Template.bind({});
ReadOnly.args = {
  readonly: true,
  auditStatut: {
    statut: 'audite',
  },
};
