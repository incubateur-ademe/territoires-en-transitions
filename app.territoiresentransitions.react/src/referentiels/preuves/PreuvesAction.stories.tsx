import { Meta } from '@storybook/nextjs';
// import { action } from 'storybook/actions';
import {
  preuveComplementaireFichier,
  preuveComplementaireLien,
  preuveReglementaireFichier,
  preuveReglementaireLien,
  preuveReglementaireLienSansDescription,
  preuveReglementaireNonRenseignee,
} from './Bibliotheque/fixture';
import { PreuvesAction } from './PreuvesAction';

export default {
  component: PreuvesAction,
} as Meta;

export const SansPreuvesComplementaires = {
  args: {
    action: { id: 'cae_1.2.3.4', identifiant: '1.2.3.4', referentiel: 'cae' },
    reglementaires: [
      preuveReglementaireNonRenseignee,
      preuveReglementaireFichier,
      preuveReglementaireLien,
      preuveReglementaireLienSansDescription,
    ],
  },
};

export const AvecPreuvesComplementaires = {
  args: {
    action: { id: 'cae_1.2.3.4', identifiant: '1.2.3.4', referentiel: 'cae' },
    reglementaires: [
      preuveReglementaireNonRenseignee,
      preuveReglementaireFichier,
      preuveReglementaireLien,
      preuveReglementaireLienSansDescription,
    ],
    complementaires: [preuveComplementaireFichier, preuveComplementaireLien],
  },
};

export const SansPreuvesAttendues = {
  args: {
    action: { id: 'cae_1.2.3', identifiant: '1.2.3', referentiel: 'cae' },
    withSubActions: true,
    reglementaires: [],
    complementaires: [],
  },
};

export const AvecMessageAvertissement = {
  args: {
    action: { id: 'cae_1.2.4', identifiant: '1.2.4', referentiel: 'cae' },
    reglementaires: [],
    complementaires: [preuveComplementaireFichier],
    showWarning: true,
  },
};
