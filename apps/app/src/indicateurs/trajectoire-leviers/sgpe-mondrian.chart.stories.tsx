import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { preset } from '@tet/ui';
import { expect, fn, waitFor } from 'storybook/test';
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
    onSelected: fn(),
  },
  render: (args) => (
    <div className="max-w-3xl">
      <SgpeMondrianChart {...args} />
    </div>
  ),
} satisfies Meta<typeof SgpeMondrianChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TuileInferieureAUnPixel: Story = {
  play: async ({ canvas, args, userEvent }) => {
    // Vérifie le passage ECharts -> légende : une géométrie nulle ne doit pas
    // faire disparaître le levier, même si le calcul de taille fonctionne.
    const reference = await canvas.findByRole('button', {
      name: /^Repère 2 :/,
    });
    await expect(reference).toBeVisible();
    await expect(
      canvas.getByRole('group', { name: 'Repères (ktCO₂e)' })
    ).toHaveTextContent(smallLevier);

    await userEvent.click(reference);
    await expect(args.onSelected).toHaveBeenCalledWith(
      'Résidentiel',
      smallLevier
    );
    // Le repère pilote aussi la sélection interne et le fil d'Ariane.
    await waitFor(() =>
      expect(canvas.getAllByText(smallLevier)).toHaveLength(2)
    );
  },
};
