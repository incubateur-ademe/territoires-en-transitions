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
} from './fixture';

export default {
  component: ActionStatutHistorique,
} as Meta;

const Template: Story<TActionStatutHistoriqueProps> = args => (
  <ActionStatutHistorique actionStatutHistorique={args} />
);

export const AjoutDeStatusSimple = Template.bind({});
const ajoutDeStatusSimpleArgs: TActionStatutHistoriqueProps =
  fakeAjoutSimpleActionStatutHistorique;
AjoutDeStatusSimple.args = ajoutDeStatusSimpleArgs;

export const ModificationDeStatutSimple = Template.bind({});
const modificationDeStatusSimpleArgs: TActionStatutHistoriqueProps =
  fakeModificationSimpleActionStatutHistorique;
ModificationDeStatutSimple.args = modificationDeStatusSimpleArgs;

export const ModificationDeStatutSimpleADetaille = Template.bind({});
const modificationDeStatusSimpleADetailleArgs: TActionStatutHistoriqueProps =
  fakeModificationSimpleADetailleActionStatutHistorique;
ModificationDeStatutSimpleADetaille.args =
  modificationDeStatusSimpleADetailleArgs;

export const ModificationDeStatutDetailleADetaille = Template.bind({});
const modificationDeStatusDetailleADetailleArgs: TActionStatutHistoriqueProps =
  fakeModificationDetailleActionStatutHistorique;
ModificationDeStatutDetailleADetaille.args =
  modificationDeStatusDetailleADetailleArgs;
