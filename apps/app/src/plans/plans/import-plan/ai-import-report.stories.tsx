import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { AiImportReport } from './ai-import-report';

const meta = {
  component: AiImportReport,
  args: {
    onRetry: fn(),
    status: {
      status: 'failed',
      error: null,
      createdPlanId: null,
      stepStates: {
        reading: 'ok',
        scouting: 'skipped',
        extraction: 'pending',
        hierarchy: 'skipped',
        scoring: 'skipped',
        consolidation: 'skipped',
        enrichment: 'skipped',
        secteurs: 'skipped',
        qualitativeReview: 'skipped',
      },
      report: { issues: [], qualitativeReview: null },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-5xl mx-auto bg-white border border-grey-3 rounded-lg shadow-sm p-6 md:p-8">
        <h2 className="text-xl mb-6">
          {"Plan d'électrification du territoire"}
        </h2>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AiImportReport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EchecCatalogue: Story = {
  args: {
    status: {
      ...meta.args.status,
      report: {
        issues: [
          {
            kind: 'configuration-error',
            code: 'PENDING_ENGAGEMENT_INDICATEUR',
            location:
              "Engagement \"Le territoire s'engage à renforcer le schéma des infrastructures de recharge pour véhicules électriques, avec l'objectif d'installer ___ bornes publiques dont ___ rapides d'ici 2030.\" > Nombre total de bornes publiques",
            message:
              "La correspondance de cet indicateur d'engagement n'est pas encore validée dans le catalogue. Contactez le support TeT pour la faire valider, puis relancez l'import avec le même document.",
          },
          {
            kind: 'configuration-error',
            code: 'PENDING_ENGAGEMENT_INDICATEUR',
            location:
              'Engagement "Installer des bornes" > Nombre de bornes rapides',
            message:
              "La correspondance de cet indicateur d'engagement n'est pas encore validée dans le catalogue. Contactez le support TeT pour la faire valider, puis relancez l'import avec le même document.",
          },
          {
            kind: 'warning',
            code: 'EMPTY_ENGAGEMENT_TARGET',
            message:
              "Aucune valeur chiffrée n'est renseignée pour cet engagement.",
          },
        ],
        qualitativeReview: null,
      },
    },
  },
};

export const EchecDocument: Story = {
  args: {
    status: {
      ...meta.args.status,
      error: 'Renseignez une année de référence pour ce résultat.',
      report: {
        issues: [
          {
            kind: 'document-error',
            code: 'MISSING_INDICATEUR_YEAR',
            location:
              'Action "Rénover la mairie" > Indicateur "Consommation" > Résultat',
            message: 'Renseignez une année de référence pour ce résultat.',
          },
        ],
        qualitativeReview: null,
      },
    },
  },
};

export const EchecTechnique: Story = {
  args: {
    status: {
      ...meta.args.status,
      error: "Le service d'IA ne répond pas. Réessayez plus tard.",
      stepStates: { ...meta.args.status.stepStates, reading: 'pending' },
    },
  },
};

/** Le bouton de reprise n'apparaît que pour l'équipe. */
export const EchecAvecReprise: Story = {
  args: { ...EchecTechnique.args, onResume: fn() },
};

export const Succes: Story = {
  args: {
    status: {
      ...meta.args.status,
      status: 'done',
      createdPlanId: 1,
      report: {
        issues: [],
        qualitativeReview: 'Vérifiez les pilotes des actions.',
      },
    },
  },
};
