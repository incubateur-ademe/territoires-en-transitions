import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { OpenDataSource, toYear } from '../types';
import { OpenDataPicker } from './open-data-picker';

const meta: Meta<typeof OpenDataPicker> = {
  title: 'Indicateurs/Grille de saisie/Picker open data',
  component: OpenDataPicker,
  decorators: [
    (Story) => (
      <div className="w-fit rounded-xl border border-grey-3 bg-white shadow-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof OpenDataPicker>;

const sources: OpenDataSource[] = [
  {
    sourceId: 'ame',
    libelle: 'AME',
    value: 640,
    methodologie: 'Projection « avec mesures existantes »',
    dateVersion: '2024-01-01',
  },
  {
    sourceId: 'ams',
    libelle: 'AMS',
    value: 560,
    methodologie: null,
    dateVersion: '2024-01-01',
  },
];

const baseArgs = {
  groupLabel: 'Résidentiel',
  rowLabel: 'NOx',
  year: toYear(2030),
  unit: 't',
  sources,
  onSelect: (sourceId: string) => window.alert(`Sélection : ${sourceId}`),
  onClose: () => window.alert('Fermeture'),
  onReset: () => window.alert('Repasser en saisie manuelle'),
};

export const Selecteur: Story = {
  args: {
    ...baseArgs,
    selectedSourceId: 'ame',
    columnSelection: {
      source: sources[0],
      count: 9,
      onSelect: async () => {
        window.alert('Sélection en lot');
        return true;
      },
    },
  },
};
