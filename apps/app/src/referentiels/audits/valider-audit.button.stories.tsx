import { Meta } from '@storybook/nextjs-vite';
import { ValiderAuditModal } from './valider-audit.button';

export default {
  component: ValiderAuditModal,
} as Meta;

export const AuditLabellisation = {
  args: {
    auditId: 1,
    demandeId: 2
  },
};

export const AuditSansLabellisation = {
  args: {
    auditId: 1
  },
};
