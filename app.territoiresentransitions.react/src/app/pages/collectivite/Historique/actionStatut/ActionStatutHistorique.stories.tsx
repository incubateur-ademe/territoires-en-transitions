import React from 'react';
import {Story, Meta} from '@storybook/react';

import {
  TActionStatutHistoriqueProps,
  ActionStatutHistorique,
} from './ActionStatutHistorique';
import {
  fakeAjoutSimpleActionStatutHistorique,
  fakeModificationSimpleActionStatutHistorique,
  fakeModificationSimpleADetailleActionStatutHistorique,
  fakeModificationDetailleActionStatutHistorique,
  fakeAjoutDetailleActionStatutHistorique,
} from '../fixture';

export default {
  component: ActionStatutHistorique,
} as Meta;

const Template: Story<TActionStatutHistoriqueProps> = args => (
  <ActionStatutHistorique {...args} />
);

export const AjoutDeStatutSimple = Template.bind({});
const ajoutDeStatutSimpleArgs: TActionStatutHistoriqueProps =
  fakeAjoutSimpleActionStatutHistorique;
AjoutDeStatutSimple.args = ajoutDeStatutSimpleArgs;

export const AjoutDeStatutDetaille = Template.bind({});
const ajoutDeStatutDetailleArgs: TActionStatutHistoriqueProps =
  fakeAjoutDetailleActionStatutHistorique;
AjoutDeStatutDetaille.args = ajoutDeStatutDetailleArgs;

export const ModificationDeStatutSimple = Template.bind({});
const modificationDeStatutSimpleArgs: TActionStatutHistoriqueProps =
  fakeModificationSimpleActionStatutHistorique;
ModificationDeStatutSimple.args = modificationDeStatutSimpleArgs;

export const ModificationDeStatutSimpleADetaille = Template.bind({});
const modificationDeStatutSimpleADetailleArgs: TActionStatutHistoriqueProps =
  fakeModificationSimpleADetailleActionStatutHistorique;
ModificationDeStatutSimpleADetaille.args =
  modificationDeStatutSimpleADetailleArgs;

export const ModificationDeStatutDetailleADetaille = Template.bind({});
const modificationDeStatutDetailleADetailleArgs: TActionStatutHistoriqueProps =
  fakeModificationDetailleActionStatutHistorique;
ModificationDeStatutDetailleADetaille.args =
  modificationDeStatutDetailleADetailleArgs;
