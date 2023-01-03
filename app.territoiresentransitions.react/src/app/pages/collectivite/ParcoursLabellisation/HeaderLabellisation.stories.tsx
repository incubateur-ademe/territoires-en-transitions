import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {
  HeaderLabellisation,
  THeaderLabellisationProps,
} from './HeaderLabellisation';

export default {
  component: HeaderLabellisation,
} as Meta;

const Template: Story<THeaderLabellisationProps> = args => (
  <HeaderLabellisation demande={{en_cours: true}} {...args} />
);

export const RemplissageIncomplet = Template.bind({});
RemplissageIncomplet.args = {
  parcours: {
    etoiles: '1',
    completude_ok: false,
  },
};

export const CritereScoreNonAtteint = Template.bind({});
CritereScoreNonAtteint.args = {
  parcours: {
    etoiles: '1',
    completude_ok: true,
    critere_score: {
      atteint: false,
    },
  },
};

export const CritereActionNonRempli = Template.bind({});
CritereActionNonRempli.args = {
  parcours: {
    etoiles: '1',
    completude_ok: true,
    critere_score: {
      atteint: true,
    },
    criteres_action: [{rempli: false}],
  },
};

export const CriterePreuvesNonRempli = Template.bind({});
CriterePreuvesNonRempli.args = {
  parcours: {
    etoiles: '1',
    completude_ok: true,
    critere_score: {
      atteint: true,
    },
    criteres_action: [{rempli: true}],
  },
};

export const OK = Template.bind({});
OK.args = {
  parcours: {
    etoiles: '1',
    completude_ok: true,
    critere_score: {
      atteint: true,
    },
    criteres_action: [{rempli: true}],
  },
  preuves: [{filename: 'fichier.doc'}],
};

export const OK_2eme_etoile = Template.bind({});
OK_2eme_etoile.args = {
  parcours: {
    etoiles: '2',
    completude_ok: true,
    critere_score: {
      atteint: true,
    },
    criteres_action: [{rempli: true}],
    derniere_labellisation: {
      etoiles: '1',
      obtenue_le: '2022-12-15T15:05:47.110Z',
    },
  },
  preuves: [{filename: 'fichier.doc'}],
};

export const DemandeEnvoyee = Template.bind({});
DemandeEnvoyee.args = {
  demande: {
    en_cours: false,
  },
  parcours: {
    etoiles: '1',
    completude_ok: true,
    critere_score: {
      atteint: true,
    },
    criteres_action: [{rempli: true}],
    derniere_demande: {
      etoiles: '1',
      demandee_le: '2022-12-15T15:05:47.110Z',
    },
  },
  preuves: [{filename: 'fichier.doc'}],
};
