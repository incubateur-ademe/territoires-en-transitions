import {Story, Meta} from '@storybook/react';
import {FileItemsList, TFileItemsListProps} from './FileItemsList';
import {fileItemMocks} from './FileItem.stories';

export default {
  component: FileItemsList,
} as Meta;

const Template: Story<TFileItemsListProps> = args => (
  <div style={{maxWidth: 548, border: '1px dashed'}}>
    <FileItemsList {...args} />
  </div>
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
  items: Object.values(fileItemMocks),
};
