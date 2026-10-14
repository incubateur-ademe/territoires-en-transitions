import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SidePanelProvider } from '../../ui/layout/side-panel/side-panel.context';
import {
  linkedFichesFixture,
  isolationComblesAction,
} from './actions-de-reference.fixture';
import { UpdateActionDeReferenceForm } from './update-action-de-reference.form';

const meta: Meta<typeof UpdateActionDeReferenceForm> = {
  component: UpdateActionDeReferenceForm,
  args: {
    action: isolationComblesAction,
    onUpdated: () => undefined,
    fichesList: { status: 'loaded', fiches: linkedFichesFixture },
  },
  decorators: [
    (Story) => (
      <SidePanelProvider>
        <Story />
      </SidePanelProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UpdateActionDeReferenceForm>;

export const Prerempli: Story = {};
