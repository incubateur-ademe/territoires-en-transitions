import { roundTo } from '@/domain/utils';
import { Meta } from '@storybook/nextjs';
import { GrapheSecteur } from './GrapheSecteur';

export default {
  component: GrapheSecteur,
  parameters: { storyshots: false },
} as Meta;

const Template = (args) => <GrapheSecteur {...args} />;

const ANNEE_REFERENCE = 2015;
const ANNEE_JALON2 = 2050;

const ANNEES = Array(ANNEE_JALON2 - ANNEE_REFERENCE + 1)
  .fill(0)
  .map((_, i) => ANNEE_REFERENCE + i);

const genRandomValues = (offset = 0) =>
  ANNEES.map((annee) => ({
    x: annee,
    y: roundTo(Math.random() * 100 + offset, 2),
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
