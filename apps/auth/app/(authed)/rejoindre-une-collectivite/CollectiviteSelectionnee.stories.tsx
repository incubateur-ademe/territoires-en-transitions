import {Meta, StoryObj} from '@storybook/nextjs-vite';
import {CollectiviteSelectionnee} from './CollectiviteSelectionnee';

const meta: Meta<typeof CollectiviteSelectionnee> = {
  component: CollectiviteSelectionnee,
};

export default meta;

type Story = StoryObj<typeof CollectiviteSelectionnee>;

export const Default: Story = {
  args: {
    collectivite: {
      id: 1,
      nom: 'Exemple',
      url: 'link/to/collectivite',
      contacts: [
        {prenom: 'Tar', nom: 'Tempion', email: 'some@email.fr'},
        {prenom: 'Ex', nom: 'Emple', email: 'another@email.fr'},
      ],
    },
  },
};
