import React from 'react';
import {Story, Meta} from '@storybook/react';

import {
  TActionStatutHistoriqueProps,
  ActionStatutHistorique,
} from './ActionStatutHistorique';
import {fakeActionStatutHistoriqueSimple} from './fixture';

export default {
  component: ActionStatutHistorique,
} as Meta;

const Template: Story<TActionStatutHistoriqueProps> = args => (
  <ActionStatutHistorique actionStatusHistorique={args} />
);

export const AjoutDeStatusSimple = Template.bind({});
const ajoutDeStatusSimpleArgs: TActionStatutHistoriqueProps =
  fakeActionStatutHistoriqueSimple;
AjoutDeStatusSimple.args = ajoutDeStatusSimpleArgs;
