import { Button } from '@tet/ui';
import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { DocumentLine } from './document-line';

export default {
  component: DocumentLine,
  args: {
    filename: 'deliberation-2026.pdf',
    isMissing: false,
    children: (
      <>
        <Button icon="download-line" variant="grey" size="xs" onClick={fn()} />
        <Button
          icon="delete-bin-line"
          variant="grey"
          size="xs"
          onClick={fn()}
        />
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-[32rem] p-4">
        <Story />
      </div>
    ),
  ],
} as Meta<typeof DocumentLine>;

type Story = StoryObj<typeof DocumentLine>;

export const Fichier: Story = {};

/** Le glyphe de tete devient le badge : le probleme se lit avant le nom. */
export const FichierIntrouvable: Story = {
  args: { filename: 'deliberation-perdue.pdf', isMissing: true },
};

export const NomLong: Story = {
  args: {
    filename:
      'deliberation-conseil-communautaire-adoption-plan-climat-air-energie-2026.pdf',
  },
};
