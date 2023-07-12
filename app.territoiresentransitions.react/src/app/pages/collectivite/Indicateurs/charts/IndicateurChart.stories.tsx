import React from 'react';
import {Story, Meta} from '@storybook/react';
import {
  IndicateurChartBase,
  NoData,
  TIndicateurChartBaseProps,
} from './IndicateurChart';

export default {
  component: IndicateurChartBase,
} as Meta;

const Template: Story<TIndicateurChartBaseProps> = args => (
  <IndicateurChartBase {...args} />
);

export const IndicateurPerso = Template.bind({});
IndicateurPerso.args = {
  definition: {
    id: 1,
    unite: 'teq CO2',
    isPerso: true,
    titre: 'Mon indicateur',
  },
  objectifs: [
    {annee: 2020, valeur: 1_800_000},
    {annee: 2021, valeur: 1_700_000},
    {annee: 2022, valeur: 1_600_000},
    {annee: 2023, valeur: 1_500_000},
  ],
  resultats: [
    {annee: 2020, valeur: 1_800_000},
    {annee: 2021, valeur: 1_750_000},
    {annee: 2022, valeur: 1_740_000},
    {annee: 2023, valeur: 1_740_000},
  ],
};

export const IndicateurRefentiel = Template.bind({});
IndicateurRefentiel.args = {
  definition: {
    id: 'eci.1',
    unite: '%',
    nom: 'Part du budget consacrée à la politique Economie Circulaire dans le budget global (%)',
  },
  objectifs: [
    {annee: 2016, valeur: 3},
    {annee: 2018, valeur: 5},
    {annee: 2019, valeur: 7},
    {annee: 2020, valeur: 8},
    {annee: 2021, valeur: 10},
    {annee: 2022, valeur: 15},
    {annee: 2023, valeur: 43},
  ],
  resultats: [
    {annee: 2016, valeur: 1},
    {annee: 2018, valeur: 3},
    {annee: 2019, valeur: 5},
    {annee: 2020, valeur: 1},
    {annee: 2021, valeur: 0},
  ],
};

export const NonRenseigne = () => (
  <NoData definition={IndicateurRefentiel.args.definition} />
);
