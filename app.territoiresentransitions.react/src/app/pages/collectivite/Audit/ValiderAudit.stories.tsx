import React from 'react';
import {Story, Meta} from '@storybook/react';
import {ValiderAuditModal, TValiderAuditProps} from './ValiderAudit';

export default {
  component: ValiderAuditModal,
} as Meta;

const Template: Story<TValiderAuditProps> = args => (
  <ValiderAuditModal {...args} />
);

export const AuditLabellisation = Template.bind({});
AuditLabellisation.args = {
  audit: {id: 1, demande_id: 2},
};

export const AuditSansLabellisation = Template.bind({});
AuditSansLabellisation.args = {
  audit: {id: 1},
};
