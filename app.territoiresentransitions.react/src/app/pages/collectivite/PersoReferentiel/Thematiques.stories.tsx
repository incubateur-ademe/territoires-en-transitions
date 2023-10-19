import { Meta} from '@storybook/react';
import Thematiques from './Thematiques';

export default {
  component: Thematiques,
} as Meta;

export const Exemple1 = {
  args: {
    collectivite: {
      id: 1,
      nom: 'Grand Montauban',
    },
    items: [
      {
        id: 'dechets',
        nom: 'Déchets',
        completude: 'complete',
      },
      {
        id: 'energie',
        nom: 'Énergie',
        completude: 'a_completer',
      },
      {
        id: 'mobilite',
        nom: 'Mobilité',
        completude: 'complete',
      },
    ],
    selected: ['eci', 'cae'],
  },
};
