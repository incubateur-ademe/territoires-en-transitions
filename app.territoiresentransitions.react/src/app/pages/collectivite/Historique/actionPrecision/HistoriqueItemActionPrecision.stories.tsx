import React from 'react';
import {Story, Meta} from '@storybook/react';

import HistoriqueItemActionPrecision from './HistoriqueItemActionPrecision';
import {THistoriqueItemProps} from '../types';
import {
  fakeAjoutActionPrecisionHistorique,
  fakeModificationActionPrecisionHistorique,
} from '../fixture';

export default {
  component: HistoriqueItemActionPrecision,
} as Meta;

const Template: Story<THistoriqueItemProps> = args => (
  <HistoriqueItemActionPrecision {...args} />
);

export const AjoutPrecision = Template.bind({});
const ajoutPrecisionArgs: THistoriqueItemProps = {
  item: fakeAjoutActionPrecisionHistorique,
};
AjoutPrecision.args = ajoutPrecisionArgs;

export const ModificationPrecision = Template.bind({});
const modificationPrecisionArgs: THistoriqueItemProps = {
  item: fakeModificationActionPrecisionHistorique,
};
ModificationPrecision.args = modificationPrecisionArgs;
