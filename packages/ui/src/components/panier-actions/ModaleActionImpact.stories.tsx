import {Meta, StoryObj} from '@storybook/react';
import {ModaleActionImpact} from './ModaleActionImpact';
import {Button} from '@design-system/Button';
import {CarteActionImpact} from './CarteActionImpact';
import {useState} from 'react';

const meta: Meta<typeof ModaleActionImpact> = {
  title: "Composants métier/Panier d'actions/Modale action à impact",
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
    categorie: 'Mieux consommer',
    complexite: 1,
    budget: 2,
    description:
      "Un comité de pilotage se réunit régulièrement (au moins 2 fois par an) pour s'assurer du bon avancement et de la priorisation de la programmation des actions de transition écologique. Ce comité de pilotage s'assure que les actions de transition écologique sont identifiées et priorisées dans l'exercice de programmation budgétaire et la programmation pluriannuelle d'investissement",
    ressources: 'https://www.territoiresentransitions.fr/',
    nbCollectivitesEnCours: 12,
    nbCollectivitesRealise: 8,
    updateStatus: () => {},
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

export const CarteAvecModale: Story = {
  render: args => {
    const [isSelected, setIsSelected] = useState(false);

    const handleToggleSelect = value => setIsSelected(value);

    return (
      <ModaleActionImpact
        {...args}
        selectionnee={isSelected}
        onToggleSelected={handleToggleSelect}
      >
        <div>
          <CarteActionImpact
            titre={args.titre}
            categorie={args.categorie}
            complexite={args.complexite}
            budget={args.budget}
            onToggleSelected={handleToggleSelect}
            updateStatus={args.updateStatus}
            selectionnee={isSelected}
          />
        </div>
      </ModaleActionImpact>
    );
  },
};
