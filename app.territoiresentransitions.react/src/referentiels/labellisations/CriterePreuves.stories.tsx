import {StoryFn, Meta} from '@storybook/nextjs';
import {CriterePreuves, TCriterePreuvesProps} from './CriterePreuves';
import fixture from './fixture.json';

export default {
  component: CriterePreuves,
} as Meta;

const Template: StoryFn<TCriterePreuvesProps> = args => (
  <ul>
    <CriterePreuves {...args} />
  </ul>
);

export const PremiereEtoileECI = {
  render: Template,

  args: {
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
  },
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

export const PremiereEtoileECIRempli = {
  render: Template,

  args: {
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
  },
};

export const AutresEtoilesECI = {
  render: Template,

  args: {
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
  },
};

export const PremiereEtoileCAE = {
  render: Template,

  args: {
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
  },
};

export const AutresEtoilesCAE = {
  render: Template,

  args: {
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
  },
};

export const CAEScoreSuperieurA35Pourcent = {
  render: Template,

  args: {
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
  },
};

export const CAEScoreSuperieurA35PourcentRempli = {
  render: Template,

  args: {
    ...CAEScoreSuperieurA35Pourcent.args,
    preuves: [FILE1],
  },
};
