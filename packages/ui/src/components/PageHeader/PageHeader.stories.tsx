import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { JSX, useState } from 'react';

import { Divider } from '../../design-system/Divider';
import { PageHeader } from './PageHeader';
import { PageHeaderStickyHeightProvider } from './sticky-header-height.context';

const meta: Meta<typeof PageHeader> = {
  component: PageHeader,
  decorators: [
    (Story) => (
      <div className="p-8 max-w-5xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PageHeader>;

const MockMenu = (): JSX.Element => (
  <button
    type="button"
    aria-label="Ouvrir le menu"
    className="size-8 inline-flex items-center justify-center border border-grey-3 rounded"
  >
    ...
  </button>
);

const MockBreadcrumbs = (): JSX.Element => (
  <nav aria-label="Fil d'Ariane" className="text-sm text-grey-7">
    <ol className="flex gap-2">
      <li>Accueil</li>
      <li>/</li>
      <li>Section</li>
    </ol>
  </nav>
);

const MockMetadata = (): JSX.Element => (
  <div className="flex items-center gap-4 text-sm text-grey-8">
    <span>Pilote : Jean Dupont</span>
    <Divider orientation="vertical" className="h-4" />
    <span>Budget : 120 000 €</span>
  </div>
);

const MockToolbarRow = (): JSX.Element => (
  <div className="flex items-center gap-3 text-sm text-grey-8">
    <button type="button" className="border border-grey-3 rounded px-2 py-0.5">
      Filtres
    </button>
    <button type="button" className="border border-grey-3 rounded px-2 py-0.5">
      Affichage
    </button>
  </div>
);

const MockNavigation = (): JSX.Element => (
  <div className="flex justify-between text-sm text-grey-7">
    <a href="#prev" className="underline">
      ← Mesure précédente
    </a>
    <a href="#next" className="underline">
      Mesure suivante →
    </a>
  </div>
);

const EditableTitleExample = ({
  initialTitle,
  isReadonly,
  placeholder,
}: {
  initialTitle: string | null;
  isReadonly: boolean;
  placeholder?: string;
}): JSX.Element => {
  const [title, setTitle] = useState<string | null>(initialTitle);
  return (
    <PageHeader>
      <PageHeader.EditableTitle
        title={title}
        isReadonly={isReadonly}
        onUpdate={setTitle}
        placeholder={placeholder}
      />
      <PageHeader.Actions>
        <MockMenu />
      </PageHeader.Actions>
    </PageHeader>
  );
};

const AvecSubtitleExample = (): JSX.Element => {
  const [title, setTitle] = useState<string | null>('Ma fiche action');
  return (
    <PageHeader>
      <PageHeader.EditableTitle
        title={title}
        isReadonly={false}
        onUpdate={setTitle}
      />
      <PageHeader.Actions>
        <MockMenu />
      </PageHeader.Actions>
      <PageHeader.Subtitle>
        <MockBreadcrumbs />
      </PageHeader.Subtitle>
    </PageHeader>
  );
};

export const TitleStatique: Story = {
  render: () => (
    <PageHeader>
      <PageHeader.Title>Référentiel CAE</PageHeader.Title>
      <PageHeader.Actions>
        <MockMenu />
      </PageHeader.Actions>
    </PageHeader>
  ),
};

export const TitleEditable: Story = {
  render: () => (
    <EditableTitleExample
      initialTitle="Plan climat air énergie territorial"
      isReadonly={false}
    />
  ),
};

export const TitleEditableSansTitre: Story = {
  render: () => <EditableTitleExample initialTitle={null} isReadonly={false} />,
};

export const TitleEditableLectureSeule: Story = {
  render: () => (
    <EditableTitleExample initialTitle="Plan en lecture seule" isReadonly />
  ),
};

export const TitleEditablePlaceholderPersonnalise: Story = {
  render: () => (
    <EditableTitleExample
      initialTitle={null}
      isReadonly={false}
      placeholder="Saisir le nom de l'indicateur"
    />
  ),
};

export const AvecSubtitle: Story = {
  render: () => <AvecSubtitleExample />,
};

export const AvecMetadata: Story = {
  render: () => (
    <PageHeader>
      <PageHeader.Title>Référentiel CAE</PageHeader.Title>
      <PageHeader.Actions>
        <MockMenu />
      </PageHeader.Actions>
      <PageHeader.Metadata>
        <MockMetadata />
      </PageHeader.Metadata>
    </PageHeader>
  ),
};

export const Complet: Story = {
  render: () => (
    <PageHeader>
      <PageHeader.Navigation label="Navigation entre mesures">
        <MockNavigation />
      </PageHeader.Navigation>
      <PageHeader.Title>
        Action CAE 1.1.1 — Stratégie territoriale
      </PageHeader.Title>
      <PageHeader.Subtitle>
        <MockBreadcrumbs />
      </PageHeader.Subtitle>
      <PageHeader.Metadata>
        <MockMetadata />
      </PageHeader.Metadata>
      <PageHeader.Metadata>
        <MockToolbarRow />
      </PageHeader.Metadata>
    </PageHeader>
  ),
};

export const Compact: Story = {
  render: () => (
    <PageHeader compact>
      <PageHeader.Navigation label="Navigation entre mesures">
        <MockNavigation />
      </PageHeader.Navigation>
      <PageHeader.Title>
        Action CAE 1.1.1 — Stratégie territoriale
      </PageHeader.Title>
      <PageHeader.Subtitle>
        <MockBreadcrumbs />
      </PageHeader.Subtitle>
      <PageHeader.Metadata>
        <MockMetadata />
      </PageHeader.Metadata>
      <PageHeader.Metadata>
        <MockToolbarRow />
      </PageHeader.Metadata>
    </PageHeader>
  ),
};

const StickyExample = (): JSX.Element => {
  const [isSticky, setIsSticky] = useState(false);
  return (
    <PageHeaderStickyHeightProvider>
      <PageHeader sticky onStickyChange={setIsSticky}>
        <PageHeader.Title>
          Action CAE 1.1.1 — Stratégie territoriale
        </PageHeader.Title>
        <PageHeader.Subtitle>
          <MockBreadcrumbs />
        </PageHeader.Subtitle>
        <PageHeader.Metadata>
          <MockMetadata />
        </PageHeader.Metadata>
      </PageHeader>
      <p className="text-sm text-grey-7">
        Le header est {isSticky ? 'épinglé (compact)' : 'au repos'} — défilez
        pour le voir devenir sticky.
      </p>
      <div className="h-[150vh] mt-4 rounded bg-grey-2" aria-hidden />
    </PageHeaderStickyHeightProvider>
  );
};

export const Sticky: Story = {
  render: () => <StickyExample />,
};
