import { Meta, StoryObj } from '@storybook/nextjs';

import { TableFull } from './table-full';

const meta: Meta<typeof TableFull> = {
  component: TableFull,
  title: 'Design System/Table',
};

export default meta;

type Story = StoryObj<typeof TableFull>;

export const Default: Story = {};

export const Loading: Story = {
  render: () => <TableFull isLoading={true} />,
};

export const Empty: Story = {
  render: () => <TableFull isEmpty={true} />,
};
