import { Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {AccepterCGUContent} from './AccepterCGUModal';

export default {
  component: AccepterCGUContent,
} as Meta;

export const Exemple1 = {
  args: {
    onOK: action('onOK'),
  },
};
