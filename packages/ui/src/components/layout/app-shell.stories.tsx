import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stack } from '../../design-system/layout';
import { PageHeader } from '../PageHeader';
import { AppShell } from './app-shell';
import { FooterTeT } from './FooterTeT';

const meta: Meta<typeof AppShell> = {
  title: 'Components/Layout/App shell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  args: {
    header: (
      <div className="h-16 border-b border-grey-3 bg-white px-6 py-5 text-sm text-grey-8">
        Header de l’app
      </div>
    ),
    footer: <FooterTeT />,
    sidePanel: (
      <aside className="sticky top-0 h-screen w-[100vw] border-l border-primary-3 bg-white p-4 lg:w-side-panel">
        Panneau latéral
      </aside>
    ),
    children: (
      <Stack gap="lg">
        <PageHeader>
          <PageHeader.Title>Titre de la page</PageHeader.Title>
        </PageHeader>
        <div className="h-96 rounded-lg border border-dashed border-grey-4 bg-grey-1" />
      </Stack>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof AppShell>;

export const Default: Story = {};

export const AvecPanneauOuvert: Story = {
  args: { isSidePanelOpen: true },
};
