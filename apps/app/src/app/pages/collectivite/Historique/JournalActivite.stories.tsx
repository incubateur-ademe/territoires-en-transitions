import { Meta} from '@storybook/nextjs';
import {action} from 'storybook/actions';
import {JournalActivite} from './JournalActivite';
import {
  fakeAjoutActionPrecisionHistorique,
  fakeModificationSimpleADetailleActionStatutHistorique,
} from './fixture';

export default {
  component: JournalActivite,
} as Meta;

export const Exemple1 = {
  args: {
    items: [
      fakeModificationSimpleADetailleActionStatutHistorique,
      {
        ...fakeAjoutActionPrecisionHistorique,
        modified_at: '2022-08-08T15:12:22.00+00:00',
      },
    ],
    total: 2,
    filters: {},
    filtersCount: 0,
    setFilters: action('setFilters'),
  },
};
