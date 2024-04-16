import {Meta, StoryObj} from '@storybook/react';

import {IndicateurCardBase, IndicateurCardBaseProps} from './IndicateurCard';
import {fakeIndicateurValeurs} from '../../chart/fixtures';
import React, {useState} from 'react';

const meta: Meta<typeof IndicateurCardBase> = {
  component: IndicateurCardBase,
  parameters: {storyshots: false}, // @nivo/line semble fait échoué storyshot :(
  args: {
    className: 'max-w-[28rem]',
    definition: {
      id: 1,
      nom: 'Indicateur 1',
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
      nom: 'Indicateur 1',
      participation_score: true,
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

export const Incomplet: Story = {
  args: {
    chartInfo: {
      confidentiel: false,
      nom: 'Achats publics avec considération environnementale',
      participation_score: true,
      rempli: false,
    },
  },
};

export const CompletSansValeur: Story = {
  args: {
    chartInfo: {
      confidentiel: false,
      nom: 'Achats publics avec considération environnementale',
      enfants: [{rempli: true}, {rempli: true}],
      participation_score: true,
      rempli: false,
      sans_valeur: true,
    },
  },
};

export const SansGraphVide: Story = {
  args: {
    href: '#',
    hideChartWithoutValue: true,
    chartInfo: {
      nom: 'Achats publics avec considération environnementale',
      participation_score: true,
      count: 3,
      total: 5,
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
      nom: 'Indicateur 1',
      participation_score: false,
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
      nom: 'Indicateur 1',
      participation_score: false,
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
      nom: 'Achats publics avec considération environnementale',
      participation_score: true,
      count: 3,
      total: 5,
    },
  },
};
