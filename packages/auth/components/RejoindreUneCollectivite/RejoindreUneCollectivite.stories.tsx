import {Meta, StoryObj} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {RejoindreUneCollectivite} from './RejoindreUneCollectivite';

const meta: Meta<typeof RejoindreUneCollectivite> = {
  component: RejoindreUneCollectivite,
  args: {
    collectivites: [
      {collectivite_id: 1, nom: 'Exemple'},
      {collectivite_id: 2, nom: 'Exemple #2'},
    ],
    onSubmit: action('onSubmit'),
    onCancel: action('onCancel'),
    onFilterCollectivites: action('onFilterCollectivites'),
    onSelectCollectivite: action('onSelectCollectivite'),
  },
};

export default meta;

type Story = StoryObj<typeof RejoindreUneCollectivite>;

export const Default: Story = {
  args: {},
};

export const CollectiviteSelectionnee: Story = {
  args: {
    collectiviteSelectionnee: {
      id: 1,
      nom: 'Exemple',
      url: 'https://link.to/collectivite',
      contacts: [{prenom: 'Ex', nom: 'Emple', email: 'ex@emple.fr'}],
    },
  },
};
