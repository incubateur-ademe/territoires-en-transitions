import {Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {DetailedScore} from './DetailedScore';

export default {
  component: DetailedScore,
} as Meta;

export const Exemple1 = {
  args: {
    avancement: [0.3, 0.5, 0.2],
    onSave: action('onSave'),
  },
};
