import {Story, Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {Header, THeaderProps} from './Header';

export default {
  component: Header,
} as Meta;

const Template: Story<THeaderProps> = args => (
  <Header demande={{en_cours: true}} {...args} />
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
