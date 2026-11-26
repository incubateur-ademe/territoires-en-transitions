import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { AiImportQuestionsForm } from './ai-import-questions.form';
import {
  actionLevelDoubt,
  actionsWithoutFicheDoubt,
  themeGroupingDoubt,
} from './ai-import-questions.fixture';

const meta = {
  component: AiImportQuestionsForm,
  args: {
    doubts: [actionLevelDoubt],
    withSousActions: true,
    onSubmit: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-5xl mx-auto bg-white border border-grey-3 rounded-lg shadow-sm p-6 md:p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AiImportQuestionsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NiveauDeLAction: Story = {};

/** Les questions de la lecture posées ensemble, la réponse proposée cochée. */
export const TroisQuestions: Story = {
  args: {
    doubts: [actionLevelDoubt, themeGroupingDoubt, actionsWithoutFicheDoubt],
  },
};
