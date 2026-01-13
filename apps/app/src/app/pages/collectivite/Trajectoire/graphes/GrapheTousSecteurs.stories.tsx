import { INDICATEURS_TRAJECTOIRE } from '@/app/indicateurs/trajectoires/trajectoire-constants';
import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { roundTo } from '@tet/domain/utils';
import { GrapheTousSecteurs } from './GrapheTousSecteurs';

const meta: Meta<typeof GrapheTousSecteurs> = {
  component: GrapheTousSecteurs,
  parameters: { storyshots: false },
};

export default meta;

type Story = StoryObj<typeof GrapheTousSecteurs>;

const ANNEE_REFERENCE = 2015;
//const ANNEE_JALON1 = 2030;
const ANNEE_JALON2 = 2050;

const ANNEES = Array(ANNEE_JALON2 - ANNEE_REFERENCE + 1)
  .fill(0)
  .map((_, i) => ANNEE_REFERENCE + i);

const genRandomDataset = (id: string, name: string, offset = 0) => ({
  id,
  name,
  dimensions: ['x', 'y'],
  source: ANNEES.map((annee) => ({
    x: new Date(`${annee}-01-01`),
    y: roundTo(Math.random() * 100 + offset, 2),
  })),
});

const emissionsGes = INDICATEURS_TRAJECTOIRE['emissions_ges'];

const secteurs = emissionsGes.secteurs.map((secteur) =>
  genRandomDataset(secteur.identifiant, secteur.nom)
);

const objectifs = genRandomDataset('objectifs', 'Mes objectifs', 350);
const resultats = genRandomDataset('resultats', 'Mes résultats', 350);
const titre = "Comparaison des trajectoires d'émissions de GES";
const unite = 'ktco2eq';

export const Secteurs: Story = {
  args: {
    titre,
    unite,
    secteurs,
  },
};

export const AvecObjectifsEtResultats: Story = {
  args: {
    titre,
    unite,
    secteurs,
    objectifs,
    resultats,
  },
};
