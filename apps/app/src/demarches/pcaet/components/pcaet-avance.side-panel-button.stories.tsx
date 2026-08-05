import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PcaetAvanceSidePanelButton } from './pcaet-avance.side-panel-button';

const meta: Meta<typeof PcaetAvanceSidePanelButton> = {
  component: PcaetAvanceSidePanelButton,
};

export default meta;
type Story = StoryObj<typeof PcaetAvanceSidePanelButton>;

export const PanneauFerme: Story = {
  args: { isOpen: false },
};

export const PanneauOuvert: Story = {
  args: { isOpen: true },
};
