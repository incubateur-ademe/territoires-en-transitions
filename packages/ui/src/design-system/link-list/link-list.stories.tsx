import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { LinkList, LinkListItem } from './link-list';

const meta: Meta<typeof LinkList> = {
  component: LinkList,
};

export default meta;

type Story = StoryObj<typeof LinkList>;

export const Default: Story = {
  args: {
    children: (
      <>
        <LinkListItem
          href="#"
          icon="file-excel-2-line"
          title="Importer un plan"
          description="Importer le plan d'action d'une collectivité depuis un fichier Excel"
        />
        <LinkListItem
          href="#"
          icon="megaphone-line"
          title="Bannière"
          description="Afficher un message à tous les utilisateurs de TeT"
        />
      </>
    ),
  },
};

export const SansCadreEtDense: Story = {
  args: {
    framed: false,
    size: 'sm',
    children: (
      <>
        <LinkListItem onClick={fn()} title="1. Mobilité douce" />
        <LinkListItem onClick={fn()} title="2. Rénovation des bâtiments" />
      </>
    ),
  },
};
