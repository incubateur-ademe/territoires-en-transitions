import { Meta} from '@storybook/nextjs';

import HistoriqueItemReponse from './HistoriqueItemReponse';
import {
  fakeReponseChoix,
  fakeReponseChoix2,
  fakeReponseBinaire,
  fakeReponseBinaire2,
  fakeReponseProportion,
  fakeReponseProportion2,
} from './fixture';

export default {
  component: HistoriqueItemReponse,
} as Meta;

export const PremiereReponseQuestionChoix = {
  args: {
    item: fakeReponseChoix,
  },
};

export const ReponseQuestionChoixModifiee = {
  args: {
    item: fakeReponseChoix2,
  },
};

export const PremiereReponseQuestionBinaire = {
  args: {
    item: fakeReponseBinaire,
  },
};

export const ReponseQuestionBinaireModifiee = {
  args: {
    item: fakeReponseBinaire2,
  },
};

export const PremiereReponseQuestionProportion = {
  args: {
    item: fakeReponseProportion,
  },
};

export const ReponseQuestionProportionModifiee = {
  args: {
    item: fakeReponseProportion2,
  },
};

export const ReponseQuestionProportionJustifiee = {
  args: {
    item: {...fakeReponseProportion, justification: 'Parce que...'},
  },
};

export const ReponseQuestionProportionModifieeEtJustifiee = {
  args: {
    item: {...fakeReponseProportion2, justification: 'Parce que...'},
  },
};
