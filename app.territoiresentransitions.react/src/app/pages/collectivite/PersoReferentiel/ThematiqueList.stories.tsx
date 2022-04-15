import {Story, Meta} from '@storybook/react';
import {ThematiqueList, TThematiqueListProps} from './ThematiqueList';

export default {
  component: ThematiqueList,
} as Meta;

const Template: Story<TThematiqueListProps> = args => (
  <ThematiqueList {...args} />
);

export const Exemple1 = Template.bind({});
Exemple1.args = {
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
};
