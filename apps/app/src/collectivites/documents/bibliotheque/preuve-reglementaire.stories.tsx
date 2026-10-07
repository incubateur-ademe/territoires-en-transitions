import { Meta } from '@storybook/nextjs-vite';
import {
  attenduFichier,
  attenduLien,
  attenduNonRenseigne,
  attenduPlusieursDocuments,
} from './documents.fixture';
import { PreuveReglementaire } from './preuve-reglementaire';

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
