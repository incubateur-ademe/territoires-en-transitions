import { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Action,
  ActionTypeEnum,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { expect, fn, waitFor } from 'storybook/test';
import {
  ACTION_STATUT_SELECT_DEFAULT_OPTIONS,
  ActionStatutDropdown,
} from './action-statut.dropdown';

const action: Action = {
  actionId: 'cae_1.1.1.1',
  identifiant: '1.1.1.1',
  referentiel: 'cae',
  referentielId: 'cae',
  referentielVersion: '1.0.0',
  nom: 'Définir une stratégie climat-air-énergie',
  description: '',
  contexte: '',
  exemples: '',
  ressources: '',
  reductionPotentiel: '',
  perimetreEvaluation: '',
  preuve: null,
  points: 1,
  pourcentage: null,
  categorie: null,
  exprScore: null,
  modifiedAt: '2026-01-01T00:00:00Z',
  depth: 4,
  actionType: ActionTypeEnum.SOUS_ACTION,
  questionIds: [],
  adaptationNiveau: null,
  thematiqueSgpe: null,
  pilotes: [],
  services: [],
  labels: [],
  parentId: 'cae_1.1.1',
  childrenIds: [],
  nextId: null,
  previousId: null,
  childrenIdsWithExprScore: [],
  scoresTag: {},
  score: {
    actionId: 'cae_1.1.1.1',
    pointReferentiel: 1,
    pointPotentiel: 1,
    pointPotentielPerso: null,
    pointFait: 0,
    pointPasFait: 0,
    pointProgramme: 0,
    pointNonRenseigne: 1,
    totalTachesCount: 0,
    completedTachesCount: 0,
    faitTachesAvancement: 0,
    programmeTachesAvancement: 0,
    pasFaitTachesAvancement: 0,
    pasConcerneTachesAvancement: 0,
    concerne: true,
    desactive: false,
    renseigne: false,
  },
};

const meta: Meta<typeof ActionStatutDropdown> = {
  component: ActionStatutDropdown,
  render: (args) => (
    <div style={{ width: 200 }}>
      <ActionStatutDropdown {...args} />
    </div>
  ),
  args: {
    onChange: fn(),
    action,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const SelectionParDefaut: Story = {};

export const AvecSelection: Story = {
  args: {
    value: 'fait',
  },
};

export const ActionTypeSousAction: Story = {
  args: {
    action: {
      ...action,
      actionType: ActionTypeEnum.SOUS_ACTION,
      childrenIds: ['child1', 'child2'],
    },
  },

  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button'));

    await waitFor(() => {
      const optionButtons = ACTION_STATUT_SELECT_DEFAULT_OPTIONS.map((item) =>
        canvasElement.ownerDocument.body.querySelector(
          `[data-test="${item.value}"]`
        )
      );
      expect(optionButtons).toHaveLength(
        ACTION_STATUT_SELECT_DEFAULT_OPTIONS.length
      );
      optionButtons.forEach((button) => expect(button).not.toBeNull());
    });
  },
};

export const ActionTypeTache: Story = {
  args: {
    action: {
      ...action,
      actionType: ActionTypeEnum.TACHE,
      childrenIds: [],
    },
  },

  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button'));

    const expectedOptions = ACTION_STATUT_SELECT_DEFAULT_OPTIONS.filter(
      (item) => item.value !== StatutAvancementEnum.DETAILLE_A_LA_TACHE
    );

    await waitFor(() => {
      const optionButtons = expectedOptions.map((item) =>
        canvasElement.ownerDocument.body.querySelector(
          `[data-test="${item.value}"]`
        )
      );
      expect(optionButtons).toHaveLength(expectedOptions.length);
      optionButtons.forEach((button) => expect(button).not.toBeNull());
      expect(
        canvasElement.ownerDocument.body.querySelector(
          `[data-test="${StatutAvancementEnum.DETAILLE_A_LA_TACHE}"]`
        )
      ).toBeNull();
    });
  },
};
