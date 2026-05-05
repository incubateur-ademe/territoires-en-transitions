import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ActionTypeEnum, StatutAvancementEnum } from '@tet/domain/referentiels';
import React from 'react';
import { fn } from 'storybook/test';
import {
  ACTION_STATUT_SELECT_DEFAULT_OPTIONS,
  ActionStatutDropdown,
} from './action-statut.dropdown';

const meta: Meta<typeof ActionStatutDropdown> = {
  component: ActionStatutDropdown,
  render: (args) => (
    <div style={{ width: 200 }}>
      <ActionStatutDropdown {...args} />
    </div>
  ),
  args: {
    onChange: fn(),
    action: {
      actionType: ActionTypeEnum.SOUS_ACTION,
      childrenIds: [],
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const SelectionParDefaut: Story = {};

export const AvecSelection: Story = {
  args: {
    value: 'fait',
  },
};

export const ActionTypeSousAction: Story = {
  args: {
    action: {
      actionType: ActionTypeEnum.SOUS_ACTION,
      childrenIds: ['child1', 'child2'],
    },
  },

  play: async ({ canvas, userEvent, expect }) => {
    await userEvent.click(canvas.getByRole('button'));
    const options = await canvas.findAllByRole('option');
    expect(options).toHaveLength(ACTION_STATUT_SELECT_DEFAULT_OPTIONS.length);
  },
};

export const ActionTypeTache: Story = {
  args: {
    action: {
      actionType: ActionTypeEnum.TACHE,
      childrenIds: [],
    },
  },

  play: async ({ canvas, userEvent, expect }) => {
    await userEvent.click(canvas.getByRole('button'));
    const options = await canvas.findAllByRole('option');
    expect(options).toHaveLength(
      ACTION_STATUT_SELECT_DEFAULT_OPTIONS.filter(
        (item) => item.value !== StatutAvancementEnum.DETAILLE_A_LA_TACHE
      ).length
    );
  },
};
