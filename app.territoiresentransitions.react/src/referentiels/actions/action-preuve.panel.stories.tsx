import { Meta } from '@storybook/nextjs';
import ActionPreuvePanel from './action-preuve.panel';

const DEFAULT_ARGS = {
  action: { id: 'eci_1.1.1', identifiant: '1.1.1', referentiel: 'eci' },
  showWarning: true,
};

export default {
  component: ActionPreuvePanel,
  args: DEFAULT_ARGS,
} as Meta;

export const Default = {
  args: {
    ...DEFAULT_ARGS,
  },
};
