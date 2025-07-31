import {StoryFn, Meta} from '@storybook/nextjs';
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
    initialSelection: [
      fileItemMocks.toobig,
      fileItemMocks.unknownFormat,
      fileItemMocks.formatAndSize,
    ],
  },
};

export const DocReglementaire = {
  render: Template,

  args: {
    initialSelection: [fileItemMocks.running1],
    docType: 'reglementaire',
  },
};

export const DocAnnexe = {
  render: Template,

  args: {
    initialSelection: [fileItemMocks.running1],
    docType: 'annexe',
  },
};
