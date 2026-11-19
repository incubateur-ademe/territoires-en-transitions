import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { EtapesInstructionNav } from './etapes-instruction.nav';

const meta: Meta<typeof EtapesInstructionNav> = {
  component: EtapesInstructionNav,
  args: {
    dossierPath: '/collectivite/4147/instruction/41',
    topicCodes: ['ges', 'energie', 'vulnerabilite'],
    currentTopicCode: null,
  },
};

export default meta;

type Story = StoryObj<typeof EtapesInstructionNav>;

/** À l'ouverture du dossier : rien avant le premier volet du diagnostic. */
export const PremierVolet: Story = { args: { etape: 'diagnostic' } };

export const Documents: Story = { args: { etape: 'documents' } };

/** Dernière étape : la finalisation reste dans le panneau. */
export const ProgrammeActions: Story = { args: { etape: 'plan' } };
