import {StoryFn, Meta} from '@storybook/react';
import {AddFile, TAddFileProps} from './AddFile';
import {fileItemMocks} from './FileItem.stories';

export default {
  component: AddFile,
} as Meta;

const Template: StoryFn<TAddFileProps> = args => (
  <div style={{maxWidth: 612, border: '1px dashed'}}>
    <AddFile {...args} />
  </div>
);

export const Exemple1 = {
  render: Template,

  args: {
    action: {id: 'eci_1.1.1'},
    initialSelection: [
      fileItemMocks.toobig,
      fileItemMocks.unknownFormat,
      fileItemMocks.formatAndSize,
    ],
  },
};
