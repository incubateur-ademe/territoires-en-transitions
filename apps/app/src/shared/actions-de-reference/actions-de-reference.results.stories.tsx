import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  aireCovoiturageAction,
  isolationComblesAction,
  longDescriptionAction,
} from './actions-de-reference.fixture';
import { ActionsDeReferenceResults } from './actions-de-reference.results';

const meta: Meta<typeof ActionsDeReferenceResults> = {
  component: ActionsDeReferenceResults,
  args: {
    updateAccess: { status: 'forbidden' },
    onResetSearch: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof ActionsDeReferenceResults>;

const loadedActions = [
  aireCovoiturageAction,
  isolationComblesAction,
  longDescriptionAction,
];

export const Chargement: Story = {
  args: { list: { status: 'loading' } },
};

export const Erreur: Story = {
  args: { list: { status: 'error', retry: () => undefined } },
};

export const Vide: Story = {
  args: { list: { status: 'loaded', actions: [] } },
};

export const Grille: Story = {
  args: { list: { status: 'loaded', actions: loadedActions } },
};

export const GrilleModifiable: Story = {
  args: {
    list: { status: 'loaded', actions: loadedActions },
    updateAccess: { status: 'allowed', onUpdate: () => undefined },
  },
};
