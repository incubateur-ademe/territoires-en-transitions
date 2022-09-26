import React from 'react';
import {Story, Meta} from '@storybook/react';

import HistoriqueItemActionStatut from './HistoriqueItemActionStatut';
import {THistoriqueItemProps} from '../types';
import {
  fakeAjoutSimpleActionStatutHistorique,
  fakeModificationSimpleActionStatutHistorique,
  fakeModificationSimpleADetailleActionStatutHistorique,
  fakeModificationDetailleActionStatutHistorique,
  fakeAjoutDetailleActionStatutHistorique,
} from '../fixture';

export default {
  component: HistoriqueItemActionStatut,
} as Meta;

const Template: Story<THistoriqueItemProps> = args => (
  <HistoriqueItemActionStatut {...args} />
);

export const AjoutDeStatutSimple = Template.bind({});
const ajoutDeStatutSimpleArgs: THistoriqueItemProps = {
  item: fakeAjoutSimpleActionStatutHistorique,
};
AjoutDeStatutSimple.args = ajoutDeStatutSimpleArgs;

export const AjoutDeStatutDetaille = Template.bind({});
const ajoutDeStatutDetailleArgs: THistoriqueItemProps = {
  item: fakeAjoutDetailleActionStatutHistorique,
};
AjoutDeStatutDetaille.args = ajoutDeStatutDetailleArgs;

export const ModificationDeStatutSimple = Template.bind({});
const modificationDeStatutSimpleArgs: THistoriqueItemProps = {
  item: fakeModificationSimpleActionStatutHistorique,
};
ModificationDeStatutSimple.args = modificationDeStatutSimpleArgs;

export const ModificationDeStatutSimpleADetaille = Template.bind({});
const modificationDeStatutSimpleADetailleArgs: THistoriqueItemProps = {
  item: fakeModificationSimpleADetailleActionStatutHistorique,
};
ModificationDeStatutSimpleADetaille.args =
  modificationDeStatutSimpleADetailleArgs;

export const ModificationDeStatutDetailleADetaille = Template.bind({});
const modificationDeStatutDetailleADetailleArgs: THistoriqueItemProps = {
  item: fakeModificationDetailleActionStatutHistorique,
};
ModificationDeStatutDetailleADetaille.args =
  modificationDeStatutDetailleADetailleArgs;
