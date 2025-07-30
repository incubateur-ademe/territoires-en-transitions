import { roundTo } from '@/domain/utils';
import { Meta } from '@storybook/nextjs';
import { INDICATEURS_TRAJECTOIRE } from '../constants';
import { GrapheTousSecteurs } from './GrapheTousSecteurs';

export default {
  component: GrapheTousSecteurs,
  parameters: { storyshots: false },
} as Meta;

const Template = (args) => <GrapheTousSecteurs {...args} />;

const ANNEE_REFERENCE = 2015;
//const ANNEE_JALON1 = 2030;
const ANNEE_JALON2 = 2050;

const ANNEES = Array(ANNEE_JALON2 - ANNEE_REFERENCE + 1)
  .fill(0)
  .map((_, i) => ANNEE_REFERENCE + i);

const genRandomValues = (offset = 0) =>
  ANNEES.map((annee) => ({
    x: new Date(`${annee}-01-01`),
    y: roundTo(Math.random() * 100 + offset, 2),
  }));

const secteurs = INDICATEURS_TRAJECTOIRE[0].secteurs.map((secteur) => ({
  id: secteur.identifiant,
  label: secteur.nom,
  data: genRandomValues(),
}));
const objectifs = genRandomValues(350);
const resultats = genRandomValues(350);
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
