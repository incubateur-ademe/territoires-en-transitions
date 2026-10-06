import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { designTokens } from '@tet/design-tokens';
import { action } from 'storybook/actions';
import { Caption } from '../matrix/caption';
import type { StatusBar, StatusScale } from './status-bar';
import { StatusBarChart } from './status-bar.chart';

const STATUS_SCALE = [
  { status: 'Non mobilisé', color: designTokens.colors.grey[3] },
  { status: 'Peu mobilisé', color: designTokens.colors.info[3] },
  { status: 'Bien mobilisé', color: designTokens.colors.info[1] },
  { status: 'Très mobilisé', color: designTokens.colors.primary[9] },
  { status: 'Ajoutée', color: designTokens.colors.warning[1] },
] as const satisfies StatusScale<string>;

type Status = (typeof STATUS_SCALE)[number]['status'];

const CATEGORIES = [
  'Aménagement',
  'Planification',
  'Financement',
  'Gouvernance',
  'Exemplarité',
  'Sensibilisation',
] as const;

type ParCategorie<T> = [T, T, T, T, T, T];

type Levier = {
  nom: string;
  potentiel: number;
  parts: ParCategorie<number>;
  statuts: ParCategorie<Status>;
};

const LEVIERS: Levier[] = [
  {
    nom: 'Sobriété et isolation des bâtiments (tertiaire)',
    potentiel: 107,
    parts: [0.1, 0.3, 0.25, 0.1, 0.2, 0.05],
    statuts: [
      'Non mobilisé',
      'Ajoutée',
      'Bien mobilisé',
      'Non mobilisé',
      'Très mobilisé',
      'Peu mobilisé',
    ],
  },
  {
    nom: 'Véhicules électriques',
    potentiel: 61,
    parts: [0.25, 0.15, 0.25, 0.05, 0.15, 0.15],
    statuts: [
      'Peu mobilisé',
      'Bien mobilisé',
      'Non mobilisé',
      'Non mobilisé',
      'Non mobilisé',
      'Bien mobilisé',
    ],
  },
  {
    nom: 'Changement de chaudière à fioul (tertiaire)',
    potentiel: 62,
    parts: [0.1, 0.3, 0.3, 0.1, 0.15, 0.05],
    statuts: [
      'Bien mobilisé',
      'Très mobilisé',
      'Bien mobilisé',
      'Non mobilisé',
      'Non mobilisé',
      'Peu mobilisé',
    ],
  },
  {
    nom: 'Fret décarboné et multimodalité',
    potentiel: 47,
    parts: [0.4, 0.15, 0.2, 0.2, 0, 0.05],
    statuts: [
      'Bien mobilisé',
      'Peu mobilisé',
      'Non mobilisé',
      'Bien mobilisé',
      'Non mobilisé',
      'Peu mobilisé',
    ],
  },
  {
    nom: 'Changement chaudières fioul + rénovation (résidentiel)',
    potentiel: 41,
    parts: [0.05, 0.25, 0.4, 0.1, 0.05, 0.15],
    statuts: [
      'Bien mobilisé',
      'Non mobilisé',
      'Très mobilisé',
      'Non mobilisé',
      'Peu mobilisé',
      'Non mobilisé',
    ],
  },
  {
    nom: 'Covoiturage',
    potentiel: 18,
    parts: [0.35, 0.15, 0.15, 0.15, 0.1, 0.1],
    statuts: [
      'Non mobilisé',
      'Non mobilisé',
      'Non mobilisé',
      'Bien mobilisé',
      'Peu mobilisé',
      'Non mobilisé',
    ],
  },
  {
    nom: 'Captage de méthane dans les ISDND',
    potentiel: 17,
    parts: [0.5, 0.3, 0.1, 0.1, 0, 0],
    statuts: [
      'Non mobilisé',
      'Non mobilisé',
      'Bien mobilisé',
      'Peu mobilisé',
      'Non mobilisé',
      'Non mobilisé',
    ],
  },
  {
    nom: 'Vélo et transport en commun',
    potentiel: 22,
    parts: [0.45, 0.15, 0.15, 0.1, 0.05, 0.1],
    statuts: [
      'Très mobilisé',
      'Bien mobilisé',
      'Peu mobilisé',
      'Non mobilisé',
      'Peu mobilisé',
      'Bien mobilisé',
    ],
  },
];

const toBars = (leviers: readonly Levier[]): StatusBar<Status>[] =>
  leviers
    .flatMap(({ nom, potentiel, parts, statuts }) =>
      CATEGORIES.map((categorie, index) => ({
        id: `${nom}/${categorie}`,
        label: `${nom} · ${categorie}`,
        value: Math.round(potentiel * parts[index] * 10) / 10,
        status: statuts[index],
      }))
    )
    .filter(({ value }) => value > 0)
    .sort((first, second) => second.value - first.value);

const BARS = toBars(LEVIERS);

const formatValue = (value: number): string => `${value} ktCO2e`;

const meta: Meta<typeof StatusBarChart<Status>> = {
  component: StatusBarChart,
  parameters: { storyshots: false },
  args: {
    data: BARS,
    statusScale: STATUS_SCALE,
    formatValue,
    onBarSelected: action('onBarSelected'),
    children: (
      <Caption>
        Un sous-levier (levier × catégorie) par barre, triés par potentiel de
        réduction décroissant.
      </Caption>
    ),
  },
  decorators: [(story) => <div className="h-96 w-[1200px]">{story()}</div>],
};

export default meta;

type Story = StoryObj<typeof StatusBarChart<Status>>;

export const SortedByPotentiel: Story = {};

export const WithSelectedBar: Story = {
  args: {
    selectedBarId: BARS[2].id,
  },
};
