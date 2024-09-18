import {Meta, StoryObj} from '@storybook/react';

import {IndicateurCardBase, IndicateurCardBaseProps} from './IndicateurCard';
import {fakeIndicateurValeurs} from '../../chart/fixtures';
import React, {useState} from 'react';

const meta: Meta<typeof IndicateurCardBase> = {
  component: IndicateurCardBase,
  args: {
    className: 'max-w-[28rem]',
    definition: {
      id: 1,
      titre: 'Indicateur 1',
    },
    isLoading: false,
    data: {
      valeurs: [],
    },
  },
};

export default meta;

type Story = StoryObj<typeof IndicateurCardBase>;

export const Lien: Story = {
  args: {
    href: '#',
    data: {
      valeurs: fakeIndicateurValeurs,
    },
    chartInfo: {
      confidentiel: true,
      titre: 'Indicateur 1',
      participationScore: true,
      rempli: true,
      count: 5,
      total: 5,
    },
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Imcomplet: Story = {
  args: {
    chartInfo: {
      titre: 'Achats publics avec considération environnementale',
      rempli: false,
    },
  },
};

export const ParentIncompletEnfantsComplets: Story = {
  args: {
    chartInfo: {
      confidentiel: false,
      titre: 'Achats publics avec considération environnementale',
      rempli: false,
      enfants: [{rempli: true}, {rempli: true}, {rempli: true}],
    },
  },
};

export const ParentCompletEnfantsIncomplets: Story = {
  args: {
    data: {
      valeurs: fakeIndicateurValeurs,
    },
    chartInfo: {
      titre: 'Achats publics avec considération environnementale',
      participationScore: true,
      rempli: true,
      enfants: [{rempli: true}, {rempli: true}, {rempli: false}],
    },
  },
};

export const ParentSansValeurIncomplet: Story = {
  args: {
    chartInfo: {
      confidentiel: false,
      titre: 'Achats publics avec considération environnementale',
      enfants: [{rempli: true}, {rempli: false}],
      participationScore: true,
      rempli: false,
      sansValeur: true,
    },
  },
};

export const ParentSansValeurComplet: Story = {
  args: {
    chartInfo: {
      confidentiel: false,
      titre: 'Achats publics avec considération environnementale',
      enfants: [{rempli: true}, {rempli: true}],
      participationScore: true,
      rempli: false,
      sansValeur: true,
    },
  },
};

export const ParentSansValeurSansGraphIncomplet: Story = {
  args: {
    href: '#',
    hideChart: true,
    chartInfo: {
      confidentiel: false,
      titre: 'Achats publics avec considération environnementale',
      enfants: [{rempli: true}, {rempli: false}],
      participationScore: true,
      rempli: false,
      sansValeur: true,
    },
  },
};

export const ParentSansValeurSansGraphComplet: Story = {
  args: {
    href: '#',
    hideChart: true,
    chartInfo: {
      confidentiel: false,
      titre: 'Achats publics avec considération environnementale',
      enfants: [{rempli: true}, {rempli: true}],
      participationScore: true,
      rempli: false,
      sansValeur: true,
    },
  },
};

export const SansGraphIncomplet: Story = {
  args: {
    href: '#',
    hideChart: true,
    chartInfo: {
      titre: 'Achats publics avec considération environnementale',
      enfants: [{rempli: true}, {rempli: false}],
      participationScore: true,
      sansValeur: true,
    },
  },
};

export const Selectionnable: Story = {
  args: {
    data: {
      valeurs: fakeIndicateurValeurs,
    },
    chartInfo: {
      confidentiel: true,
      titre: 'Indicateur 1',
      participationScore: false,
      rempli: true,
      count: 5,
      total: 5,
    },
  },
  render: args => <SelectStory {...args} />,
};

export const SelectionnableSansGraphVide: Story = {
  args: {
    data: {
      valeurs: [],
    },
    chartInfo: {
      confidentiel: true,
      titre: 'Indicateur 1',
      participationScore: false,
      rempli: false,
      count: 5,
      total: 5,
    },
    hideChartWithoutValue: true,
  },
  render: args => <SelectStory {...args} />,
};

const SelectStory = (props: IndicateurCardBaseProps) => {
  const [selected, setSelected] = useState(true);
  return (
    <IndicateurCardBase
      {...props}
      selectState={{
        selected,
        setSelected: () => setSelected(!selected),
        checkbox: true,
      }}
    />
  );
};

export const ReadOnly: Story = {
  args: {
    readonly: true,
    chartInfo: {
      titre: 'Achats publics avec considération environnementale',
      participationScore: true,
      count: 3,
      total: 5,
    },
  },
};
