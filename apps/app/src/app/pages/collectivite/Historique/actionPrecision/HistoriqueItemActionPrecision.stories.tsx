import {Meta} from '@storybook/nextjs-vite';

import HistoriqueItemActionPrecision from './HistoriqueItemActionPrecision';
import {THistoriqueItemProps} from '../types';
import {
  fakeAjoutActionPrecisionHistorique,
  fakeModificationActionPrecisionHistorique,
} from '../fixture';

export default {
  component: HistoriqueItemActionPrecision,
} as Meta;

const ajoutPrecisionArgs: THistoriqueItemProps = {
  item: fakeAjoutActionPrecisionHistorique,
};

export const AjoutPrecision = {
  args: ajoutPrecisionArgs,
};

const modificationPrecisionArgs: THistoriqueItemProps = {
  item: fakeModificationActionPrecisionHistorique,
};

export const ModificationPrecision = {
  args: modificationPrecisionArgs,
};
