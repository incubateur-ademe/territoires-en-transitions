import {StoryFn, Meta} from '@storybook/nextjs';
import {FileItemsList, TFileItemsListProps} from './FileItemsList';
import {fileItemMocks} from './FileItem.stories';

export default {
  component: FileItemsList,
} as Meta;

const Template: StoryFn<TFileItemsListProps> = args => (
  <div style={{maxWidth: 548, border: '1px dashed'}}>
    <FileItemsList {...args} />
  </div>
);

export const Exemple1 = {
  render: Template,

  args: {
    items: Object.values(fileItemMocks),
  },
};
