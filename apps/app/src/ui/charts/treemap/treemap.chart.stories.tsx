import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { nivoColorsSet } from '../chartsTheme';
import { Caption } from '../matrix/caption';
import type { TreemapGroup } from './treemap-group';
import { TreemapChart } from './treemap.chart';

const MOBILISATION = [
  'Non mobilisé',
  'Peu mobilisé',
  'Bien mobilisé',
  'Très mobilisé',
] as const;

type Mobilisation = (typeof MOBILISATION)[number];

type SousLevier = [label: string, value: number, intensity: Mobilisation];

const LEVIERS: [label: string, sousLeviers: SousLevier[]][] = [
  [
    'Sobriété et isolation des bâtiments (tertiaire)',
    [
      ['Planification', 32, 'Bien mobilisé'],
      ['Gouvernance', 26, 'Non mobilisé'],
      ['Financement', 20, 'Bien mobilisé'],
      ['Exemplarité', 15, 'Bien mobilisé'],
      ['Aménagement', 10, 'Non mobilisé'],
      ['Sensibilisation', 8, 'Bien mobilisé'],
    ],
  ],
  [
    'Véhicules électriques',
    [
      ['Financement', 18, 'Non mobilisé'],
      ['Exemplarité', 14, 'Non mobilisé'],
      ['Aménagement', 12, 'Peu mobilisé'],
      ['Planification', 8, 'Bien mobilisé'],
      ['Gouvernance', 7, 'Non mobilisé'],
      ['Sensibilisation', 6, 'Bien mobilisé'],
    ],
  ],
  [
    'Changement de chaudière à fioul (tertiaire)',
    [
      ['Financement', 20, 'Bien mobilisé'],
      ['Exemplarité', 14, 'Non mobilisé'],
      ['Gouvernance', 12, 'Non mobilisé'],
      ['Planification', 8, 'Bien mobilisé'],
      ['Aménagement', 5, 'Bien mobilisé'],
      ['Sensibilisation', 3, 'Bien mobilisé'],
    ],
  ],
  [
    'Fret décarboné et multimodalité',
    [
      ['Financement', 14, 'Non mobilisé'],
      ['Gouvernance', 12, 'Bien mobilisé'],
      ['Planification', 9, 'Bien mobilisé'],
      ['Aménagement', 5, 'Bien mobilisé'],
      ['Exemplarité', 4, 'Non mobilisé'],
      ['Sensibilisation', 3, 'Peu mobilisé'],
    ],
  ],
  [
    'Changement chaudières fioul + rénovation (résidentiel)',
    [
      ['Financement', 14, 'Bien mobilisé'],
      ['Planification', 8, 'Non mobilisé'],
      ['Gouvernance', 7, 'Non mobilisé'],
      ['Aménagement', 7, 'Bien mobilisé'],
      ['Sensibilisation', 4, 'Non mobilisé'],
    ],
  ],
  [
    'Sobriété logistique',
    [
      ['Planification', 10, 'Bien mobilisé'],
      ['Gouvernance', 8, 'Bien mobilisé'],
      ['Aménagement', 5, 'Bien mobilisé'],
      ['Financement', 4, 'Non mobilisé'],
      ['Sensibilisation', 3, 'Non mobilisé'],
    ],
  ],
  [
    'Production industrielle',
    [
      ['Gouvernance', 12, 'Très mobilisé'],
      ['Sensibilisation', 8, 'Très mobilisé'],
      ['Financement', 7, 'Très mobilisé'],
      ['Aménagement', 5, 'Non mobilisé'],
      ['Exemplarité', 3, 'Non mobilisé'],
    ],
  ],
  [
    'Efficacité et carburants décarbonés des véhicules privés',
    [
      ['Sensibilisation', 10, 'Non mobilisé'],
      ['Financement', 9, 'Bien mobilisé'],
      ['Planification', 8, 'Bien mobilisé'],
      ['Gouvernance', 5, 'Non mobilisé'],
      ['Aménagement', 3, 'Bien mobilisé'],
    ],
  ],
  [
    'Vélo et transports en commun',
    [
      ['Aménagement', 9, 'Bien mobilisé'],
      ['Planification', 5, 'Bien mobilisé'],
      ['Financement', 4, 'Bien mobilisé'],
      ['Gouvernance', 2, 'Non mobilisé'],
    ],
  ],
  [
    'Covoiturage',
    [
      ['Aménagement', 7, 'Non mobilisé'],
      ['Financement', 4, 'Non mobilisé'],
      ['Planification', 3, 'Non mobilisé'],
      ['Gouvernance', 3, 'Bien mobilisé'],
    ],
  ],
  [
    'Captage de méthane dans les ISDND',
    [
      ['Aménagement', 7, 'Non mobilisé'],
      ['Financement', 6, 'Bien mobilisé'],
      ['Planification', 3, 'Non mobilisé'],
    ],
  ],
];

const toGroups = (): TreemapGroup<Mobilisation>[] =>
  LEVIERS.map(([label, sousLeviers], index) => ({
    id: label,
    label,
    color: nivoColorsSet[index % nivoColorsSet.length],
    tiles: sousLeviers.map(([sousLevier, value, intensity]) => ({
      id: `${label}/${sousLevier}`,
      label: sousLevier,
      value,
      intensity,
    })),
  }));

const formatValue = (value: number): string => `${value} ktCO2e`;

const meta: Meta<typeof TreemapChart<Mobilisation>> = {
  component: TreemapChart,
  parameters: { storyshots: false },
  args: {
    data: toGroups(),
    intensityScale: MOBILISATION,
    formatValue,
    className: 'h-[40rem]',
  },
  decorators: [(story) => <div className="w-[1200px]">{story()}</div>],
};

export default meta;

type Story = StoryObj<typeof TreemapChart<Mobilisation>>;

export const MobilisationDesSousLeviers: Story = {
  args: {
    children: (
      <Caption>
        Potentiel de réduction des leviers, réparti par sous-levier et coloré
        selon leur mobilisation
      </Caption>
    ),
  },
};
