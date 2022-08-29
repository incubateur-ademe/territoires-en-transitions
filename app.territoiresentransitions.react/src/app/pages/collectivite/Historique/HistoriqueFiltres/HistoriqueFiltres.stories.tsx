import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';

import HistoriqueFiltres, {
  HistoriqueFiltresProps,
  TSetFilters,
} from './HistoriqueFiltres';

export default {
  component: HistoriqueFiltres,
} as Meta;

const Template: Story<HistoriqueFiltresProps> = args => (
  <HistoriqueFiltres {...args} />
);

const handlers = {
  setFilters: action('setFilters') as TSetFilters,
};

export const Defaut = Template.bind({});
const filtresArgs = {...handlers};
Defaut.args = filtresArgs;
