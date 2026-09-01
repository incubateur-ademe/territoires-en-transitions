import { Meta } from '@storybook/nextjs-vite';
import { toDocumentsAttendus } from '../preuve-view.adapter';
import {
  preuveReglementaireFichier,
  preuveReglementaireLien,
  preuveReglementaireLienSameAttendu,
  preuveReglementaireNonRenseignee,
} from './fixture';
import { PreuveReglementaire } from './PreuveReglementaire';

export default {
  component: PreuveReglementaire,
} as Meta;

export const NonRenseignee = {
  args: {
    attendu: toDocumentsAttendus([preuveReglementaireNonRenseignee])[0],
  },
};

export const Fichier = {
  args: {
    attendu: toDocumentsAttendus([preuveReglementaireFichier])[0],
  },
};

export const Lien = {
  args: {
    attendu: toDocumentsAttendus([preuveReglementaireLien])[0],
  },
};

export const Multiple = {
  args: {
    attendu: toDocumentsAttendus([
      preuveReglementaireFichier,
      preuveReglementaireLienSameAttendu,
    ])[0],
  },
};
