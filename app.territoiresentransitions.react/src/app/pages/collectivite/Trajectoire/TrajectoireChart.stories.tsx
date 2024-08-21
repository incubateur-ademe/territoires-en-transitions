import React from 'react';
import {Meta} from '@storybook/react';
import {TrajectoireChart} from './TrajectoireChart';
import {INDICATEURS_TRAJECTOIRE} from './constants';

export default {
  component: TrajectoireChart,
  parameters: {storyshots: false},
} as Meta;

const Template = args => <TrajectoireChart {...args} />;

const ANNEE_REFERENCE = 2015;
//const ANNEE_JALON1 = 2030;
const ANNEE_JALON2 = 2050;

const ANNEES = Array(ANNEE_JALON2 - ANNEE_REFERENCE + 1)
  .fill(0)
  .map((_, i) => ANNEE_REFERENCE + i);

const genRandomValues = (offset = 0) =>
  ANNEES.map(annee => ({
    x: annee,
    y: (Math.random() * 100 + offset).toFixed(2),
  }));

const secteurs = INDICATEURS_TRAJECTOIRE[0].secteurs.map(secteur => ({
  id: secteur.nom,
  data: genRandomValues(),
}));
const objectifs = {id: 'objectifs', data: genRandomValues(350)};
const resultats = {id: 'resultats', data: genRandomValues(350)};
const titre = 'Comparaison des trajectoires d’émissions de GES';
const unite = 'ktco2eq';

export const Secteurs = Template.bind({});
Secteurs.args = {
  titre,
  unite,
  secteurs,
};

export const AvecObjectifsEtResultats = Template.bind({});
AvecObjectifsEtResultats.args = {
  titre,
  unite,
  secteurs,
  objectifs,
  resultats,
};
