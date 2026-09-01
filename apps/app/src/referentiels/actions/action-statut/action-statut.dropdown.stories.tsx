import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ActionTypeEnum, StatutAvancementEnum } from '@tet/domain/referentiels';
import { expect, fn, waitFor } from 'storybook/test';
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

  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button'));

    await waitFor(() => {
      const optionButtons = ACTION_STATUT_SELECT_DEFAULT_OPTIONS.map((item) =>
        canvasElement.ownerDocument.body.querySelector(
          `[data-test="${item.value}"]`
        )
      );
      expect(optionButtons).toHaveLength(
        ACTION_STATUT_SELECT_DEFAULT_OPTIONS.length
      );
      optionButtons.forEach((button) => expect(button).not.toBeNull());
    });
  },
};

export const ActionTypeTache: Story = {
  args: {
    action: {
      actionType: ActionTypeEnum.TACHE,
      childrenIds: [],
    },
  },

  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button'));

    const expectedOptions = ACTION_STATUT_SELECT_DEFAULT_OPTIONS.filter(
      (item) => item.value !== StatutAvancementEnum.DETAILLE_A_LA_TACHE
    );

    await waitFor(() => {
      const optionButtons = expectedOptions.map((item) =>
        canvasElement.ownerDocument.body.querySelector(
          `[data-test="${item.value}"]`
        )
      );
      expect(optionButtons).toHaveLength(expectedOptions.length);
      optionButtons.forEach((button) => expect(button).not.toBeNull());
      expect(
        canvasElement.ownerDocument.body.querySelector(
          `[data-test="${StatutAvancementEnum.DETAILLE_A_LA_TACHE}"]`
        )
      ).toBeNull();
    });
  },
};
