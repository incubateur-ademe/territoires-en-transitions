import { Meta } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { AddDocumentTabs } from './add-document.tabs';

const DEFAULT_ARGS = {
  onClose: action('onClose'),
  handlers: {
    addFileFromLib: action('addFileFromLib'),
    addLink: action('addLink'),
  },
};
export default {
  component: AddDocumentTabs,
  args: DEFAULT_ARGS,
} as Meta;

export const Default = {};
