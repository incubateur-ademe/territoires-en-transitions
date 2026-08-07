import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DemarcheAvanceSidePanelButton } from './avance.side-panel-button';

const meta: Meta<typeof DemarcheAvanceSidePanelButton> = {
  component: DemarcheAvanceSidePanelButton,
};

export default meta;
type Story = StoryObj<typeof DemarcheAvanceSidePanelButton>;

export const PanneauFerme: Story = {
  args: { isOpen: false },
};

export const PanneauOuvert: Story = {
  args: { isOpen: true },
};
