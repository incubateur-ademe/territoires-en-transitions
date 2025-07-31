import {Meta} from '@storybook/nextjs';
import {ActionAuditDetailBase} from './ActionAuditDetail';

export default {
  component: ActionAuditDetailBase,
} as Meta;

export const NonRenseigne = {
  args: {
    auditStatut: {
      avis: '',
      ordre_du_jour: false,
    },
  },
};

export const Renseigne = {
  args: {
    auditStatut: {
      avis: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.',
      ordre_du_jour: true,
    },
  },
};

export const ReadOnly = {
  args: {
    readonly: true,
    auditStatut: {
      avis: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.',
      ordre_du_jour: true,
    },
  },
};
