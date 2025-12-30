import { Meta} from '@storybook/nextjs-vite';
import {
  PreuveReglementaire,
} from './PreuveReglementaire';

import {
  preuveReglementaireFichier,
  preuveReglementaireLien,
  preuveReglementaireNonRenseignee,
} from './fixture';

export default {
  component: PreuveReglementaire,
} as Meta;

export const NonRenseignee = {
  args: {
    preuves: [preuveReglementaireNonRenseignee],
  },
};

export const Fichier = {
  args: {
    preuves: [preuveReglementaireFichier],
  },
};

export const Lien = {
  args: {
    preuves: [preuveReglementaireLien],
  },
};

export const ActionNonConcernee = {
  args: {
    preuves: [
      {
        ...preuveReglementaireNonRenseignee,
        action: {
          ...preuveReglementaireNonRenseignee.action,
          concerne: false,
        },
      },
    ],
  },
};

export const ActionDesactivee = {
  args: {
    preuves: [
      {
        ...preuveReglementaireNonRenseignee,
        action: {
          ...preuveReglementaireNonRenseignee.action,
          desactive: true,
        },
      },
    ],
  },
};

export const Multiple = {
  args: {
    preuves: [preuveReglementaireFichier, preuveReglementaireLien],
  },
};
