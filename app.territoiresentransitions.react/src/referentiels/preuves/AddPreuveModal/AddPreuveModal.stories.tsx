import {Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {AddPreuveModal} from './index';

const DEFAULT_ARGS = {
  onClose: action('onClose'),
  handlers: {
    addFileFromLib: action('addFileFromLib'),
    addLink: action('addLink'),
  },
};
export default {
  component: AddPreuveModal,
  args: DEFAULT_ARGS,
} as Meta;

export const Default = {};
