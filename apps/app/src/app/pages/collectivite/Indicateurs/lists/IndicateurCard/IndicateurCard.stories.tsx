import { Meta, StoryObj } from '@storybook/nextjs';

import { IndicateurCardBase } from './IndicateurCard';

export const fakeIndicateurValeurs = [
  { annee: 2016, valeur: 3, type: 'objectif' },
  { annee: 2018, valeur: 5, type: 'objectif' },
  { annee: 2019, valeur: 7, type: 'objectif' },
  { annee: 2020, valeur: 8, type: 'objectif' },
  { annee: 2021, valeur: 10, type: 'objectif' },
  { annee: 2022, valeur: 15, type: 'objectif' },
  { annee: 2023, valeur: 56555.6, type: 'objectif' },
  { annee: 2016, valeur: 1, type: 'resultat' },
  { annee: 2016, valeur: 3, type: 'resultat' },
  { annee: 2016, valeur: 4, type: 'import' },
  { annee: 2018, valeur: 3, type: 'resultat' },
  { annee: 2019, valeur: 5, type: 'resultat' },
  { annee: 2020, valeur: 1, type: 'resultat' },
  { annee: 2021, valeur: 0, type: 'resultat' },
];

const meta: Meta<typeof IndicateurCardBase> = {
  component: IndicateurCardBase,
  args: {
    className: 'max-w-[28rem]',
    definition: {
      id: 1,
      titre: 'Indicateur 1',
      estPerso: false,
    },
  },
};

export default meta;

type Story = StoryObj<typeof IndicateurCardBase>;

// export const Lien: Story = {
//   args: {
//     href: '#',
//     data: {
//       valeurs: fakeIndicateurValeurs,
//     },
//     chartInfo: {
//       confidentiel: true,
//       titre: 'Indicateur 1',
//       participationScore: true,
//       rempli: true,
//       count: 5,
//       total: 5,
//     },
//   },
// };

// export const Loading: Story = {
//   args: {
//     isLoading: true,
//   },
// };

// export const Imcomplet: Story = {
//   args: {
//     chartInfo: {
//       titre: 'Achats publics avec considération environnementale',
//       rempli: false,
//     },
//   },
// };

// export const ParentIncompletEnfantsComplets: Story = {
//   args: {
//     chartInfo: {
//       confidentiel: false,
//       titre: 'Achats publics avec considération environnementale',
//       rempli: false,
//       enfants: [{rempli: true}, {rempli: true}, {rempli: true}],
//     },
//   },
// };

// export const ParentCompletEnfantsIncomplets: Story = {
//   args: {
//     data: {
//       valeurs: fakeIndicateurValeurs,
//     },
//     chartInfo: {
//       titre: 'Achats publics avec considération environnementale',
//       participationScore: true,
//       rempli: true,
//       enfants: [{rempli: true}, {rempli: true}, {rempli: false}],
//     },
//   },
// };

// export const ParentSansValeurIncomplet: Story = {
//   args: {
//     chartInfo: {
//       confidentiel: false,
//       titre: 'Achats publics avec considération environnementale',
//       enfants: [{rempli: true}, {rempli: false}],
//       participationScore: true,
//       rempli: false,
//       sansValeur: true,
//     },
//   },
// };

// export const ParentSansValeurComplet: Story = {
//   args: {
//     chartInfo: {
//       confidentiel: false,
//       titre: 'Achats publics avec considération environnementale',
//       enfants: [{rempli: true}, {rempli: true}],
//       participationScore: true,
//       rempli: false,
//       sansValeur: true,
//     },
//   },
// };

// export const ParentSansValeurSansGraphIncomplet: Story = {
//   args: {
//     href: '#',
//     hideChart: true,
//     chartInfo: {
//       confidentiel: false,
//       titre: 'Achats publics avec considération environnementale',
//       enfants: [{rempli: true}, {rempli: false}],
//       participationScore: true,
//       rempli: false,
//       sansValeur: true,
//     },
//   },
// };

// export const ParentSansValeurSansGraphComplet: Story = {
//   args: {
//     href: '#',
//     hideChart: true,
//     chartInfo: {
//       confidentiel: false,
//       titre: 'Achats publics avec considération environnementale',
//       enfants: [{rempli: true}, {rempli: true}],
//       participationScore: true,
//       rempli: false,
//       sansValeur: true,
//     },
//   },
// };

// export const SansGraphIncomplet: Story = {
//   args: {
//     href: '#',
//     hideChart: true,
//     chartInfo: {
//       titre: 'Achats publics avec considération environnementale',
//       enfants: [{rempli: true}, {rempli: false}],
//       participationScore: true,
//       sansValeur: true,
//     },
//   },
// };

// export const Selectionnable: Story = {
//   args: {
//     data: {
//       valeurs: fakeIndicateurValeurs,
//     },
//     chartInfo: {
//       confidentiel: true,
//       titre: 'Indicateur 1',
//       participationScore: false,
//       rempli: true,
//       count: 5,
//       total: 5,
//     },
//   },
//   render: args => <SelectStory {...args} />,
// };

// export const SelectionnableSansGraphVide: Story = {
//   args: {
//     data: {
//       valeurs: [],
//     },
//     chartInfo: {
//       confidentiel: true,
//       titre: 'Indicateur 1',
//       participationScore: false,
//       rempli: false,
//       count: 5,
//       total: 5,
//     },
//     hideChartWithoutValue: true,
//   },
//   render: args => <SelectStory {...args} />,
// };

// const SelectStory = (props: IndicateurCardBaseProps) => {
//   const [selected, setSelected] = useState(true);
//   return (
//     <IndicateurCardBase
//       {...props}
//       selectState={{
//         selected,
//         setSelected: () => setSelected(!selected),
//         checkbox: true,
//       }}
//     />
//   );
// };

// export const ReadOnly: Story = {
//   args: {
//     readonly: true,
//     chartInfo: {
//       titre: 'Achats publics avec considération environnementale',
//       participationScore: true,
//       count: 3,
//       total: 5,
//     },
//   },
// };
