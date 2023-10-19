import { Meta} from '@storybook/react';

import HistoriqueItemActionPrecision from './HistoriqueItemActionPrecision';
import {THistoriqueItemProps} from '../types';
import {
  fakeAjoutActionPrecisionHistorique,
  fakeModificationActionPrecisionHistorique,
} from '../fixture';

export default {
  component: HistoriqueItemActionPrecision,
} as Meta;

export const AjoutPrecision = {
  args: ajoutPrecisionArgs,
};

const ajoutPrecisionArgs: THistoriqueItemProps = {
  item: fakeAjoutActionPrecisionHistorique,
};

export const ModificationPrecision = {
  args: modificationPrecisionArgs,
};

const modificationPrecisionArgs: THistoriqueItemProps = {
  item: fakeModificationActionPrecisionHistorique,
};
