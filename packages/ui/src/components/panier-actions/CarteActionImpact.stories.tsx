import {Meta, StoryObj} from '@storybook/react';
import {CarteActionImpact} from './CarteActionImpact';

const meta: Meta<typeof CarteActionImpact> = {
  title: "Composants métier/Panier d'actions/CarteActionImpact",
  component: CarteActionImpact,
  argTypes: {
    complexite: {
      control: {type: 'select'},
    },
    budget: {
      control: {type: 'select'},
    },
  },
  args: {
    titre:
      'Désigner une (ou plusieurs personnes) chef de projet transition écologique',
    categorie: 'Mieux consommer',
    complexite: 1,
    budget: 2,
    onToggleSelected: () => {},
    onUpdateStatus: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof CarteActionImpact>;

export const Default: Story = {};
