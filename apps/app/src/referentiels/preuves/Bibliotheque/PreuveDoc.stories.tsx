import { Meta } from '@storybook/nextjs';
import PreuveDoc from './PreuveDoc';

import {
  preuveComplementaireFichier,
  preuveComplementaireLien,
} from './fixture';

export default {
  component: PreuveDoc,
} as Meta;

export const PreuveFichier = {
  args: {
    preuve: { ...preuveComplementaireFichier, commentaire: null },
  },
};

export const PreuveFichierConfidentiel = {
  args: {
    preuve: {
      ...preuveComplementaireFichier,
      fichier: { ...preuveComplementaireFichier.fichier, confidentiel: true },
      commentaire: null,
    },
  },
};

export const PreuveFichierCommentee = {
  args: {
    preuve: {
      ...preuveComplementaireFichier,
      commentaire:
        'Cf pp 34-35 - Document provisoire, en attente d’approbation',
    },
  },
};

export const PreuveLien = {
  args: {
    preuve: preuveComplementaireLien,
  },
};

export const PreuveLienCommentee = {
  args: {
    preuve: {
      ...preuveComplementaireLien,
      commentaire:
        'Cf pp 34-35 - Document provisoire, en attente d’approbation',
    },
  },
};
