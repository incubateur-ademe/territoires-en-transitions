import {Story, Meta} from '@storybook/react';
import {CriterePreuves, TCriterePreuvesProps} from './CriterePreuves';
import fixture from './fixture.json';

export default {
  component: CriterePreuves,
} as Meta;

const Template: Story<TCriterePreuvesProps> = args => (
  <ul>
    <CriterePreuves {...args} />
  </ul>
);

export const PremiereEtoileECI = Template.bind({});
PremiereEtoileECI.args = {
  collectiviteId: 1,
  parcours: {
    ...fixture.parcours1,
    demande: {
      id: 1,
      en_cours: true,
      collectivite_id: 1,
      referentiel: 'eci',
      etoiles: '1',
    },
  },
  preuves: [],
};

// le critère est considéré comme rempli si il y a au moins un fichier
const FILE1 = {
  collectivite_id: 1,
  bucket_id: 'some-uuid',
  demande_id: 1,
  filename: 'fichier-preuve.doc',
  path: 'some-uuid/fichier-preuve.doc',
  commentaire: '',
};
export const PremiereEtoileECIRempli = Template.bind({});
PremiereEtoileECIRempli.args = {
  collectiviteId: 1,
  parcours: {
    ...fixture.parcours1,
    demande: {
      id: 1,
      en_cours: true,
      collectivite_id: 1,
      referentiel: 'eci',
      etoiles: '1',
    },
  },
  preuves: [FILE1],
};

export const AutresEtoilesECI = Template.bind({});
AutresEtoilesECI.args = {
  collectiviteId: 1,
  parcours: {
    ...fixture.parcours1,
    etoiles: '2',
    critere_score: {
      atteint: false,
      etoiles: '2',
      score_fait: 0.2,
      score_a_realiser: 0.35,
    },
    demande: {
      id: 2,
      en_cours: true,
      collectivite_id: 1,
      referentiel: 'eci',
      etoiles: '2',
    },
  },
  preuves: [],
};

export const PremiereEtoileCAE = Template.bind({});
PremiereEtoileCAE.args = {
  collectiviteId: 1,
  parcours: {
    ...fixture.parcours1,
    referentiel: 'cae',
    demande: {
      id: 1,
      en_cours: true,
      collectivite_id: 1,
      referentiel: 'cae',
      etoiles: '1',
    },
  },
  preuves: [],
};

// pas d'autres docs de candidature pour le référentiel CAE
export const AutresEtoilesCAE = Template.bind({});
AutresEtoilesCAE.args = {
  collectiviteId: 1,
  parcours: {
    ...fixture.parcours1,
    referentiel: 'cae',
    etoiles: '2',
    critere_score: {
      atteint: false,
      etoiles: '2',
      score_fait: 0.2,
      score_a_realiser: 0.35,
    },
    demande: {
      id: 2,
      en_cours: true,
      collectivite_id: 1,
      referentiel: 'cae',
      etoiles: '2',
    },
  },
  preuves: [],
};

export const CAEScoreSuperieurA35Pourcent = Template.bind({});
CAEScoreSuperieurA35Pourcent.args = {
  collectiviteId: 1,
  parcours: {
    ...fixture.parcours1,
    referentiel: 'cae',
    etoiles: '2',
    critere_score: {
      atteint: false,
      etoiles: '2',
      score_fait: 0.36,
      score_a_realiser: 0.35,
    },
    demande: {
      id: 2,
      en_cours: true,
      collectivite_id: 1,
      referentiel: 'cae',
      etoiles: '2',
    },
  },
  preuves: [],
};

export const CAEScoreSuperieurA35PourcentRempli = Template.bind({});
CAEScoreSuperieurA35PourcentRempli.args = {
  ...CAEScoreSuperieurA35Pourcent.args,
  preuves: [FILE1],
};
