import {Meta, StoryObj} from '@storybook/nextjs';
import {Pagination} from '.';

const meta: Meta<typeof Pagination> = {
  component: Pagination,
  args: {
    selectedPage: 1,
    nbOfElements: 50,
    maxElementsPerPage: 10,
  },
};

export default meta;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {};

export const ManyPages: Story = {
  args: {nbOfElements: 100},
};
