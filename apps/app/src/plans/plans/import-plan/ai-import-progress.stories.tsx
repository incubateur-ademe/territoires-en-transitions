import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ComponentProps, useEffect, useState } from 'react';
import { fn } from 'storybook/test';
import { AiImportProgress } from './ai-import-progress';
import { ImportStepStates, toImportStepViews } from './ai-import-steps.model';

const meta: Meta<typeof AiImportProgress> = {
  component: AiImportProgress,
  args: {
    failed: false,
    errorMessage: null,
    onRetry: fn(),
    steps: toImportStepViews(),
  },
};

export default meta;

type Story = StoryObj<typeof AiImportProgress>;

const allPending: ImportStepStates = {
  reading: 'pending',
  scouting: 'pending',
  extraction: 'pending',
  hierarchy: 'pending',
  scoring: 'pending',
  consolidation: 'pending',
  enrichment: 'pending',
  secteurs: 'pending',
  qualitativeReview: 'pending',
};

const duringExtraction: ImportStepStates = {
  ...allPending,
  reading: 'ok',
  scouting: 'ok',
};

const duringEnrichment: ImportStepStates = {
  ...duringExtraction,
  extraction: 'ok',
  hierarchy: 'skipped',
  scoring: 'ok',
  consolidation: 'ok',
};

export const Lancement: Story = {};

export const ExtractionEnCours: Story = {
  args: { steps: toImportStepViews(duringExtraction) },
};

/** Les secteurs tournent à côté de l'enrichissement : deux spinners. */
export const DeuxEtapesEnParallele: Story = {
  args: { steps: toImportStepViews(duringEnrichment), withSecteurs: true },
};

export const HorsPcaet: Story = {
  args: { steps: toImportStepViews(duringEnrichment) },
};

export const Echec: Story = {
  args: {
    failed: true,
    errorMessage: 'Le service d’IA ne répond pas. Réessayez plus tard.',
    steps: toImportStepViews(duringExtraction, { failed: true }),
  },
};

/** Le bouton de reprise n'apparaît que pour l'équipe. */
export const EchecAvecReprise: Story = {
  args: {
    ...Echec.args,
    onResume: fn(),
  },
};

const timeline: ImportStepStates[] = [
  allPending,
  { ...allPending, reading: 'ok' },
  duringExtraction,
  { ...duringExtraction, extraction: 'ok' },
  { ...duringExtraction, extraction: 'ok', hierarchy: 'skipped' },
  { ...duringEnrichment, consolidation: 'pending' },
  duringEnrichment,
  { ...duringEnrichment, secteurs: 'ok' },
  { ...duringEnrichment, secteurs: 'ok', enrichment: 'ok' },
];

const RunningImport = (args: ComponentProps<typeof AiImportProgress>) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(
      () => setIndex((current) => (current + 1) % timeline.length),
      2000
    );
    return () => clearInterval(interval);
  }, []);
  return (
    <AiImportProgress {...args} steps={toImportStepViews(timeline[index])} />
  );
};

/** L'import qui avance tout seul, une étape toutes les deux secondes. */
export const Deroulement: Story = {
  render: (args) => <RunningImport {...args} />,
};
