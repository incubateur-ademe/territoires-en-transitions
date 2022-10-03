import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {AddPreuveModal, TAddPreuveModalProps} from './index';

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

const Template: Story<TAddPreuveModalProps> = args => (
  <AddPreuveModal {...args} />
);

export const Default = Template.bind({});
Default.parameters = {storyshots: false}; // désactive le storyshot à cause d'un pb dans react-dsfr <File> (?)
