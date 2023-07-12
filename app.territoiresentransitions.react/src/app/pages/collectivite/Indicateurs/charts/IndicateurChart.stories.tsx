import React from 'react';
import {Story, Meta} from '@storybook/react';
import {IndicateurChartBase} from './IndicateurChart';
import {TIndicateurChartBaseProps} from './types';
import {NoData} from './CardNoData';

export default {
  component: IndicateurChartBase,
  parameters: {storyshots: false}, // @nivo/line semble fait échoué storyshot :(
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
  valeurs: [
    {annee: 2020, valeur: 1_800_000, type: 'objectif'},
    {annee: 2021, valeur: 1_700_000, type: 'objectif'},
    {annee: 2022, valeur: 1_600_000, type: 'objectif'},
    {annee: 2023, valeur: 1_500_000, type: 'objectif'},
    {annee: 2020, valeur: 1_800_000, type: 'resultat'},
    {annee: 2020, valeur: 1_800_000, type: 'resultat'},
    {annee: 2021, valeur: 1_750_000, type: 'resultat'},
    {annee: 2022, valeur: 1_740_000, type: 'resultat'},
    {annee: 2023, valeur: 1_740_000, type: 'resultat'},
  ],
};

export const IndicateurRefentiel = Template.bind({});
IndicateurRefentiel.args = {
  definition: {
    id: 'eci.1',
    unite: '%',
    nom: 'Part du budget consacrée à la politique Economie Circulaire dans le budget global (%)',
  },
  valeurs: [
    {annee: 2016, valeur: 3, type: 'objectif'},
    {annee: 2018, valeur: 5, type: 'objectif'},
    {annee: 2019, valeur: 7, type: 'objectif'},
    {annee: 2020, valeur: 8, type: 'objectif'},
    {annee: 2021, valeur: 10, type: 'objectif'},
    {annee: 2022, valeur: 15, type: 'objectif'},
    {annee: 2023, valeur: 43, type: 'objectif'},
    {annee: 2016, valeur: 1, type: 'resultat'},
    {annee: 2016, valeur: 3, type: 'resultat'},
    {annee: 2016, valeur: 4, type: 'import'},
    {annee: 2018, valeur: 3, type: 'resultat'},
    {annee: 2019, valeur: 5, type: 'resultat'},
    {annee: 2020, valeur: 1, type: 'resultat'},
    {annee: 2021, valeur: 0, type: 'resultat'},
  ],
};

export const NonRenseigne = () => (
  <NoData definition={IndicateurRefentiel.args.definition} />
);
