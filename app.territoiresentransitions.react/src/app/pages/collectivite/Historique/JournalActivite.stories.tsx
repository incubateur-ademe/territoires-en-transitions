import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {JournalActivite} from './JournalActivite';
import {
  fakeAjoutActionPrecisionHistorique,
  fakeModificationSimpleADetailleActionStatutHistorique,
} from './fixture';
import {THistoriqueProps} from './types';

export default {
  component: JournalActivite,
} as Meta;

const Template: Story<THistoriqueProps> = args => <JournalActivite {...args} />;

export const Exemple1 = Template.bind({});
Exemple1.args = {
  items: [
    fakeModificationSimpleADetailleActionStatutHistorique,
    fakeAjoutActionPrecisionHistorique,
  ],
  total: 2,
  filters: {},
  filtersCount: 0,
  setFilters: action('setFilters'),
};
