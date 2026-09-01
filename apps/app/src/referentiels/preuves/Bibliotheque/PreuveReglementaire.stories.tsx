import { Meta } from '@storybook/nextjs-vite';
import {
  attenduFichier,
  attenduLien,
  attenduNonRenseigne,
  attenduPlusieursDocuments,
} from './fixture';
import { PreuveReglementaire } from './PreuveReglementaire';

export default {
  component: PreuveReglementaire,
} as Meta;

export const NonRenseigne = {
  args: { attendu: attenduNonRenseigne },
};

export const Fichier = {
  args: { attendu: attenduFichier },
};

export const Lien = {
  args: { attendu: attenduLien },
};

export const PlusieursDocuments = {
  args: { attendu: attenduPlusieursDocuments },
};
