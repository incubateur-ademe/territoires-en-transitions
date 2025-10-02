import { Meta } from '@storybook/nextjs';
import { TableauDonnees } from './TableauDonnees';
import { DonneesGES } from './fixture';

export default {
  component: TableauDonnees,
} as Meta;

export const Exemple1 = {
  args: DonneesGES,
};
