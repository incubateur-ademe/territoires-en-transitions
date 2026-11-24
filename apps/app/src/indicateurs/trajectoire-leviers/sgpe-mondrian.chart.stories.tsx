import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { preset } from '@tet/ui';
import { SgpeMondrianChart } from './sgpe-mondrian.chart';

const smallLevier = 'Un levier dont la surface est inférieure à un pixel';

const meta = {
  component: SgpeMondrianChart,
  args: {
    inputData: {
      secteurs: [
        {
          nom: 'Résidentiel',
          couleur: preset.theme.extend.colors.primary[2],
          resultat2019: 200,
          objectif2030: 100,
          leviers: [
            { nom: 'Rénovation des bâtiments', pourcentageRegional: 99.999999 },
            { nom: smallLevier, pourcentageRegional: 0.000001 },
          ],
        },
      ],
    },
  },
  render: (args) => (
    <div className="max-w-3xl">
      <SgpeMondrianChart {...args} />
    </div>
  ),
} satisfies Meta<typeof SgpeMondrianChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TuileInferieureAUnPixel: Story = {};
