import React from 'react';
import {Meta} from '@storybook/react';
import {TrajectoireSecteurChart} from './TrajectoireSecteurChart';

export default {
  component: TrajectoireSecteurChart,
  parameters: {storyshots: false},
} as Meta;

const Template = args => <TrajectoireSecteurChart {...args} />;

const ANNEE_REFERENCE = 2015;
const ANNEE_JALON2 = 2050;

const ANNEES = Array(ANNEE_JALON2 - ANNEE_REFERENCE + 1)
  .fill(0)
  .map((_, i) => ANNEE_REFERENCE + i);

const genRandomValues = (offset = 0) =>
  ANNEES.map(annee => ({
    x: annee,
    y: (Math.random() * 100 + offset).toFixed(2),
  }));

const secteur = genRandomValues();
const objectifs = genRandomValues();
const resultats = genRandomValues();
const titre =
  'Comparaison des trajectoires d’émissions de GES, secteur Résidentiel';
const unite = 'ktco2eq';

export const Secteur = Template.bind({});
Secteur.args = {
  titre,
  unite,
  secteur,
};

export const AvecObjectifsEtResultats = Template.bind({});
AvecObjectifsEtResultats.args = {
  titre,
  unite,
  secteur,
  objectifs,
  resultats,
};