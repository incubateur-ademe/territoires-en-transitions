import { Meta } from '@storybook/nextjs-vite';
// import { action } from 'storybook/actions';
import {
  attenduFichier,
  attenduLien,
  attenduNonRenseigne,
  attenduSansDescription,
  preuveComplementaireFichier,
  preuveComplementaireLien,
} from './Bibliotheque/fixture';
import { PreuvesAction } from './PreuvesAction';

export default {
  component: PreuvesAction,
} as Meta;

export const SansPreuvesComplementaires = {
  args: {
    action: {
      actionId: 'cae_1.2.3.4',
      identifiant: '1.2.3.4',
      referentiel: 'cae',
    },
    attendus: [
      attenduNonRenseigne,
      attenduFichier,
      attenduLien,
      attenduSansDescription,
    ],
  },
};

export const AvecPreuvesComplementaires = {
  args: {
    action: {
      actionId: 'cae_1.2.3.4',
      identifiant: '1.2.3.4',
      referentiel: 'cae',
    },
    attendus: [
      attenduNonRenseigne,
      attenduFichier,
      attenduLien,
      attenduSansDescription,
    ],
    complementaires: [preuveComplementaireFichier, preuveComplementaireLien],
  },
};

export const SansPreuvesAttendues = {
  args: {
    action: {
      actionId: 'cae_1.2.3',
      identifiant: '1.2.3',
      referentiel: 'cae',
    },
    withSubActions: true,
    attendus: [],
    complementaires: [],
  },
};

export const AvecMessageAvertissement = {
  args: {
    action: {
      actionId: 'cae_1.2.4',
      identifiant: '1.2.4',
      referentiel: 'cae',
    },
    attendus: [],
    complementaires: [preuveComplementaireFichier],
    showWarning: true,
  },
};
