import { Meta } from '@storybook/nextjs-vite';
import { TableauDonnees } from './TableauDonnees';
import { DonneesGES } from './fixture';

export default {
  component: TableauDonnees,
} as Meta;

export const Exemple1 = {
  args: DonneesGES,
};
