import { Meta} from '@storybook/nextjs';
// import { action } from 'storybook/actions';
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
