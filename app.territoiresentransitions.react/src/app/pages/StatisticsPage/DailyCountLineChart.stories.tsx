import {Story, Meta} from '@storybook/react';
import {
  DailyCountLineChart,
  TDailyCountLineChartProps,
} from './DailyCountLineChart';

import {activeUsers, activeCollectivites, rattachements} from './fixture.json';

export default {
  component: DailyCountLineChart,
} as Meta;

const Template: Story<TDailyCountLineChartProps> = args => (
  <DailyCountLineChart {...args} />
);

export const UtilisateursActifs = Template.bind({});
UtilisateursActifs.args = {
  widthPx: 650,
  dailyCounts: activeUsers,
  yTitle: "Nombre d'utilisateurs actifs",
  title1: 'Nouveaux utilisateurs',
  title2: 'Cumul des utilisateurs',
};

export const CollectivitesActives = Template.bind({});
CollectivitesActives.args = {
  widthPx: 650,
  dailyCounts: activeCollectivites,
  yTitle: 'Nombre de collectivités actives',
  title1: 'Nouvelles collectivités',
  title2: 'Cumul des collectivités',
};

export const Rattachements = Template.bind({});
Rattachements.args = {
  widthPx: 650,
  dailyCounts: rattachements,
  yTitle: "Nombre d'utilisateurs rattachés à une collectivité",
  title1: 'Nouveaux rattachements',
  title2: 'Cumul des rattachements',
};
