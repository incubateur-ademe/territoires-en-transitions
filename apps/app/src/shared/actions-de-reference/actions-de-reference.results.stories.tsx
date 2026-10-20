import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ActionDeReferenceCollectivitesView } from './action-de-reference-collectivites.panel';
import {
  aireCovoiturageAction,
  noInterest,
  linkedFichesFixture,
  isolationComblesAction,
  longDescriptionAction,
} from './actions-de-reference.fixture';
import { ActionsDeReferenceResults } from './actions-de-reference.results';

const meta: Meta<typeof ActionsDeReferenceResults> = {
  component: ActionsDeReferenceResults,
  args: {
    updateAccess: { status: 'forbidden' },
    onResetSearch: () => undefined,
    renderCollectivites: () => null,
    interestOf: () => noInterest,
  },
  parameters: { nextjs: { appDirectory: true } },
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

export const GrilleAvecCollectivitesLiees: Story = {
  args: {
    list: { status: 'loaded', actions: loadedActions },
    renderCollectivites: () => (
      <ActionDeReferenceCollectivitesView
        fichesList={{ status: 'loaded', fiches: linkedFichesFixture }}
      />
    ),
  },
};

export const GrilleModifiable: Story = {
  args: {
    list: { status: 'loaded', actions: loadedActions },
    updateAccess: { status: 'allowed', onUpdate: () => undefined },
  },
};
