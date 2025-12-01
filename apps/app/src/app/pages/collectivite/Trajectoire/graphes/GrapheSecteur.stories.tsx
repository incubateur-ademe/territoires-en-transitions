import { Dataset } from '@/app/ui/charts/echarts';
import { Meta, StoryObj } from '@storybook/nextjs';
import { roundTo } from '@tet/domain/utils';
import { GrapheSecteur } from './GrapheSecteur';

const meta: Meta<typeof GrapheSecteur> = {
  component: GrapheSecteur,
  parameters: { storyshots: false },
};

export default meta;

type Story = StoryObj<typeof GrapheSecteur>;

const ANNEE_REFERENCE = 2015;
const ANNEE_JALON2 = 2050;

const ANNEES = Array(ANNEE_JALON2 - ANNEE_REFERENCE + 1)
  .fill(0)
  .map((_, i) => ANNEE_REFERENCE + i);

const genRandomDataset = (id: string, name: string, offset = 0): Dataset => ({
  id,
  name,
  dimensions: ['x', 'y'],
  source: ANNEES.map((annee) => ({
    x: annee,
    y: roundTo(Math.random() * 100 + offset, 2),
  })),
});

const secteur = genRandomDataset('secteur', 'Trajectoire');
const objectifs = genRandomDataset('objectifs', 'Mes objectifs');
const resultats = genRandomDataset('resultats', 'Mes résultats');

const titre =
  "Comparaison des trajectoires d'émissions de GES, secteur Résidentiel";
const unite = 'ktco2eq';

export const Secteur: Story = {
  args: {
    titre,
    unite,
    secteur,
  },
};

export const AvecObjectifsEtResultats: Story = {
  args: {
    titre,
    unite,
    secteur,
    objectifs,
    resultats,
  },
};
