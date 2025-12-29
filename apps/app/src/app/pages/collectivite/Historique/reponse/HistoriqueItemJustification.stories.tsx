import { Meta} from '@storybook/nextjs-vite';

import HistoriqueItemJustification from './HistoriqueItemJustification';
import {
  fakeReponseChoix,
  fakeReponseBinaire,
  fakeReponseProportion,
} from './fixture';

export default {
  component: HistoriqueItemJustification,
} as Meta;

const justification = 'Une bonne raison...';
const modifiedJustification = {
  justification: 'Nouvelle justification...',
  previous_justification: justification,
};

export const JustificationQuestionChoix = {
  args: {
    item: {...fakeReponseChoix, justification},
  },
};

export const ModifJustificationQuestionChoix = {
  args: {
    item: {...fakeReponseChoix, ...modifiedJustification},
  },
};

export const JustificationQuestionBinaire = {
  args: {
    item: {...fakeReponseBinaire, justification},
  },
};

export const ModifJustificationQuestionBinaire = {
  args: {
    item: {...fakeReponseBinaire, ...modifiedJustification},
  },
};

export const JustificationQuestionProportion = {
  args: {
    item: {...fakeReponseProportion, justification},
  },
};

export const ModifJustificationQuestionProportion = {
  args: {
    item: {...fakeReponseProportion, ...modifiedJustification},
  },
};
