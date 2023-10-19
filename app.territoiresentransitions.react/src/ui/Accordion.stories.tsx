import { Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {Accordion} from './Accordion';

export default {
  component: Accordion,
} as Meta;

export const Exemple1 = {
  args: {
    id: 'id1',
    titre: 'En savoir plus',
    html: 'contenu <b>HTML</b>',
    icon: 'fr-fi-information-fill',
  },
};
