import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ActionDeReferenceCollectivitesView } from './action-de-reference-collectivites.panel';
import { ActionDeReferenceCard } from './action-de-reference.card';
import {
  linkedFichesFixture,
  noInterest,
  isolationComblesAction,
  longDescriptionAction,
} from './actions-de-reference.fixture';

const meta: Meta<typeof ActionDeReferenceCard> = {
  component: ActionDeReferenceCard,
  args: { interest: noInterest },
};

export default meta;
type Story = StoryObj<typeof ActionDeReferenceCard>;

export const LectureSeule: Story = {
  args: {
    action: isolationComblesAction,
    updateAccess: { status: 'forbidden' },
  },
};

export const Modifiable: Story = {
  args: {
    action: isolationComblesAction,
    updateAccess: { status: 'allowed', onUpdate: () => undefined },
  },
};

export const Sauvegardee: Story = {
  args: {
    action: isolationComblesAction,
    updateAccess: { status: 'forbidden' },
    interest: {
      status: 'preselectionnee',
      onToggleSaved: () => undefined,
      onDismiss: () => undefined,
    },
  },
};

export const Ignoree: Story = {
  args: {
    action: isolationComblesAction,
    updateAccess: { status: 'forbidden' },
    interest: { status: 'ignoree', onRestore: () => undefined },
  },
};

export const AvecBadgeActionDeReference: Story = {
  args: {
    action: isolationComblesAction,
    updateAccess: { status: 'forbidden' },
    showTypeBadge: true,
  },
};

export const DescriptionLongue: Story = {
  args: {
    action: longDescriptionAction,
    updateAccess: { status: 'forbidden' },
  },
};

export const AvecCollectivitesLiees: Story = {
  args: {
    action: isolationComblesAction,
    updateAccess: { status: 'forbidden' },
  },
  render: (args) => (
    <ActionDeReferenceCard {...args}>
      <ActionDeReferenceCollectivitesView
        fichesList={{ status: 'loaded', fiches: linkedFichesFixture }}
      />
    </ActionDeReferenceCard>
  ),
};
