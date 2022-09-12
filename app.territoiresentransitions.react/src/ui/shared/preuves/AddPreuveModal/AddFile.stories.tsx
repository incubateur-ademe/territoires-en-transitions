import {Story, Meta} from '@storybook/react';
import {AddFile, TAddFileProps} from './AddFile';
import {fileItemMocks} from './FileItem.stories';

export default {
  component: AddFile,
} as Meta;

const Template: Story<TAddFileProps> = args => (
  <div style={{maxWidth: 612, border: '1px dashed'}}>
    <AddFile {...args} />
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
