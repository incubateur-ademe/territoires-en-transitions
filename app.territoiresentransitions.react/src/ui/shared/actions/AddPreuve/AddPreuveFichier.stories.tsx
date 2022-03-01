import {Story, Meta} from '@storybook/react';
import {AddPreuveFichier, TAddPreuveFichierProps} from './AddPreuveFichier';
import {fileItemMocks} from './FileItem.stories';

export default {
  component: AddPreuveFichier,
} as Meta;

const Template: Story<TAddPreuveFichierProps> = args => (
  <div style={{maxWidth: 612, border: '1px dashed'}}>
    <AddPreuveFichier {...args} />
  </div>
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
  action: {id: 'eci_1.1.1'},
  initialSelection: [
    fileItemMocks.toobig,
    fileItemMocks.unknownFormat,
    fileItemMocks.formatAndSize,
  ],
};
