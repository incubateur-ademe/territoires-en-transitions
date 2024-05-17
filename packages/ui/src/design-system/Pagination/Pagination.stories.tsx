import {Meta, StoryObj} from '@storybook/react';
import {Pagination} from '.';

const meta: Meta<typeof Pagination> = {
  component: Pagination,
  args: {
    selectedPage: 1,
    nbOfPages: 5,
  },
};

export default meta;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {};

export const ManyPages: Story = {
  args: {nbOfPages: 10},
};
