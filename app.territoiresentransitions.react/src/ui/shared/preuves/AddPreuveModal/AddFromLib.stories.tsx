import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {AddFromLib, TAddFromLibProps} from './AddFromLib';

export default {
  component: AddFromLib,
  args: {
    filters: {page: 1, search: ''},
    setFilters: action('setFilters'),
  },
} as Meta;

const Template: Story<TAddFromLibProps> = args => <AddFromLib {...args} />;

export const Vide = Template.bind({});
Vide.args = {
  items: [],
  total: 0,
};

const genMockFile = (count: number) =>
  Array(count)
    .fill(null)
    .map((_, i) => ({
      id: i + 1,
      filename: `exemple ${i + 1}`,
      filesize: 100,
      hash: 'fake',
    }));

export const Fichiers = Template.bind({});
Fichiers.args = {
  items: genMockFile(4),
  total: 12,
};
