import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import type { BibliothequeFichierListItem } from '../Bibliotheque/useFichiers';
import { AddFromLib } from './AddFromLib';

const meta: Meta<typeof AddFromLib> = {
  component: AddFromLib,
  args: {
    onSearch: action('onSearch'),
    onAddFileFromLib: action('onAddFileFromLib'),
    onClose: action('onClose'),
  },
};

type Story = StoryObj<typeof AddFromLib>;

const toMockFichiers = (count: number): BibliothequeFichierListItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    filename: `exemple ${index + 1}`,
    confidentiel: index === 0,
  }));

export const Vide: Story = { args: { items: [] } };

export const Fichiers: Story = { args: { items: toMockFichiers(4) } };

export default meta;
