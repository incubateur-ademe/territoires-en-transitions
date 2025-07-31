import { roundTo } from '@/domain/utils';
import { Meta } from '@storybook/nextjs';
import { INDICATEURS_TRAJECTOIRE } from '../constants';
import { GrapheSousSecteurs } from './GrapheSousSecteurs';

export default {
  component: GrapheSousSecteurs,
  parameters: { storyshots: false },
} as Meta;

const Template = (args) => <GrapheSousSecteurs {...args} />;

const ANNEE_REFERENCE = 2015;
//const ANNEE_JALON1 = 2030;
const ANNEE_JALON2 = 2050;

const ANNEES = Array(ANNEE_JALON2 - ANNEE_REFERENCE + 1)
  .fill(0)
  .map((_, i) => ANNEE_REFERENCE + i);

const genRandomValues = (offset = 0) =>
  ANNEES.map((annee) => ({
    x: annee,
    y: roundTo(Math.random() * 100 + offset, 2),
  }));

const sousSecteurs = INDICATEURS_TRAJECTOIRE[0].secteurs[0].sousSecteurs.map(
  (sousSecteur) => ({
    id: sousSecteur.identifiant,
    label: sousSecteur.nom,
    data: genRandomValues(),
  })
);
const titre =
  'Détail de la trajectoire d’émissions de GES, secteur Résidentiel';
const unite = 'ktco2eq';

export const SousSecteurs = Template.bind({});
SousSecteurs.args = {
  titre,
  unite,
  sousSecteurs,
};
