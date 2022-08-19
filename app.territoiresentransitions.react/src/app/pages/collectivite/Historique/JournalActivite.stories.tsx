import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {JournalActivite, TJournalActiviteProps} from './JournalActivite';
import {
  fakeAjoutActionPrecisionHistorique,
  fakeModificationSimpleADetailleActionStatutHistorique,
} from './fixture';

export default {
  component: JournalActivite,
} as Meta;

const Template: Story<TJournalActiviteProps> = args => (
  <JournalActivite {...args} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
  historiqueItemListe: [
    fakeModificationSimpleADetailleActionStatutHistorique,
    fakeAjoutActionPrecisionHistorique,
  ],
};
