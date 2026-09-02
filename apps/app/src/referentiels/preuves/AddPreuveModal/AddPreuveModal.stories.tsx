import {Meta} from '@storybook/nextjs-vite';
import {action} from 'storybook/actions';
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
