import { Meta} from '@storybook/nextjs-vite';
import {
  ActionAuditStatutBase,
} from './ActionAuditStatut';

export default {
  component: ActionAuditStatutBase,
} as Meta;

export const NonAudite = {
  args: {
    auditStatut: {
      statut: 'non_audite',
    },
  },
};

export const EnCours = {
  args: {
    auditStatut: {
      statut: 'en_cours',
    },
  },
};

export const Audite = {
  args: {
    auditStatut: {
      statut: 'audite',
    },
  },
};

export const ReadOnly = {
  args: {
    readonly: true,
    auditStatut: {
      statut: 'audite',
    },
  },
};
