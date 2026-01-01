import { Meta, StoryObj } from '@storybook/nextjs';

import { TableFullEditing } from './table-full.with-editing';

const meta: Meta<typeof TableFullEditing> = {
  component: TableFullEditing,
  title: 'Design System/Table inline editing',
};

export default meta;

type Story = StoryObj<typeof TableFullEditing>;

export const Default: Story = {};

export const Loading: Story = {
  render: () => <TableFullEditing isLoading={true} />,
};

export const Empty: Story = {
  render: () => <TableFullEditing isEmpty={true} />,
};
