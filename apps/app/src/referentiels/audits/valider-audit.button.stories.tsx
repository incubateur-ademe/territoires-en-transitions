import { Meta } from '@storybook/nextjs-vite';
import { ValiderAuditButton } from './valider-audit.button';

export default {
  component: ValiderAuditButton,
} as Meta;

export const AuditLabellisation = {
  args: {
    auditId: 1,
    demandeId: 2,
  },
};

export const AuditSansLabellisation = {
  args: {
    auditId: 1,
  },
};
