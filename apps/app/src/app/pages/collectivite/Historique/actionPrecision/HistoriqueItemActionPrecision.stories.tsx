import {Meta} from '@storybook/nextjs-vite';

import HistoriqueItemActionPrecision from './HistoriqueItemActionPrecision';
import {HistoriqueItemProps} from '../types';
import {
  fakeAjoutActionPrecisionHistorique,
  fakeModificationActionPrecisionHistorique,
} from '../fixture';

export default {
  component: HistoriqueItemActionPrecision,
} as Meta;

const ajoutPrecisionArgs: HistoriqueItemProps = {
  item: fakeAjoutActionPrecisionHistorique,
};

export const AjoutPrecision = {
  args: ajoutPrecisionArgs,
};

const modificationPrecisionArgs: HistoriqueItemProps = {
  item: fakeModificationActionPrecisionHistorique,
};

export const ModificationPrecision = {
  args: modificationPrecisionArgs,
};
