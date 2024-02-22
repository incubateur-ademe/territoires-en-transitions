import {Meta, StoryObj} from '@storybook/react';
import {ActionImpact} from './ActionImpact';

const meta: Meta<typeof ActionImpact> = {
  title: "Components/Panier d'actions/Action à impact",
  component: ActionImpact,
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
    nbCollectivitesEnCours: 12,
    nbCollectivitesRealise: 8,
    onToggleSelected: () => {},
    onUpdateStatus: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof ActionImpact>;

export const Default: Story = {};
