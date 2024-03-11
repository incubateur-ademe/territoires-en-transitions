import {Meta, StoryObj} from '@storybook/react';
import {CarteActionImpact} from './CarteActionImpact';

const meta: Meta<typeof CarteActionImpact> = {
  title: "Components/Panier d'actions/Carte action à impact",
  component: CarteActionImpact,
  argTypes: {
    budget: {
      control: {type: 'select'},
    },
  },
  args: {
    titre:
      'Désigner une (ou plusieurs personnes) chef de projet transition écologique',
    thematiques: [{id: 1, nom: 'Mieux consommer'}],
    budget: 2,
    onToggleSelected: () => {},
    onUpdateStatus: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof CarteActionImpact>;

export const Default: Story = {};

export const CarteSelectionnee: Story = {
  render: args => <CarteActionImpact {...args} isSelected={true} />,
};
