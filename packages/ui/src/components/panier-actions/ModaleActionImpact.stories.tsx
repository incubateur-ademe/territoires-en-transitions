import {Meta, StoryObj} from '@storybook/react';
import {ModaleActionImpact} from './ModaleActionImpact';
import {Button} from '@design-system/Button';

const meta: Meta<typeof ModaleActionImpact> = {
  title: "Components/Panier d'actions/Modale action à impact",
  component: ModaleActionImpact,
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
    thematiques: [{id: 1, nom: 'Mieux consommer'}],
    complexite: 1,
    budget: 2,
    description:
      "Un comité de pilotage se réunit régulièrement (au moins 2 fois par an) pour s'assurer du bon avancement et de la priorisation de la programmation des actions de transition écologique. Ce comité de pilotage s'assure que les actions de transition écologique sont identifiées et priorisées dans l'exercice de programmation budgétaire et la programmation pluriannuelle d'investissement",
    ressources: 'https://www.territoiresentransitions.fr/',
    onToggleSelected: () => {},
    onUpdateStatus: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof ModaleActionImpact>;

export const Default: Story = {
  render: args => (
    <ModaleActionImpact {...args}>
      <Button variant="outlined">Ouvrir la modale</Button>
    </ModaleActionImpact>
  ),
};
