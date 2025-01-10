import { Meta} from '@storybook/react';
import {ValiderAuditModal} from './ValiderAudit';

export default {
  component: ValiderAuditModal,
} as Meta;

export const AuditLabellisation = {
  args: {
    audit: {id: 1, demande_id: 2},
  },
};

export const AuditSansLabellisation = {
  args: {
    audit: {id: 1},
  },
};
