import React from 'react';
import {StoryFn, Meta} from '@storybook/nextjs-vite';
import {action} from 'storybook/actions';
import {
  DemandeLabellisationModalContent,
  TDemandeLabellisationModalProps,
} from './DemandeLabellisationModal';

export default {
  component: DemandeLabellisationModalContent,
} as Meta;

const Template: StoryFn<TDemandeLabellisationModalProps> = args => (
  <DemandeLabellisationModalContent {...args} onClose={action('onClose')} />
);

export const Etoile1_ECI = {
  render: Template,

  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      parcours: {
        collectivite_id: 1,
        referentiel: 'eci',
        etoiles: '1',
      },
    },
  },
};

export const Etoile1_CAE = {
  render: Template,

  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      parcours: {
        collectivite_id: 1,
        referentiel: 'cae',
        etoiles: '1',
      },
    },
  },
};

export const Etoile2_3_4_ECI = {
  render: Template,

  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      parcours: {
        collectivite_id: 1,
        etoiles: '2',
        referentiel: 'eci',
      },
    },
  },
};

export const Etoile2_3_4_CAE = {
  render: Template,

  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      parcours: {
        collectivite_id: 1,
        etoiles: '2',
        referentiel: 'cae',
      },
    },
  },
};

export const Etoile5_ECI = {
  render: Template,

  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      parcours: {
        collectivite_id: 1,
        etoiles: '5',
        referentiel: 'eci',
      },
    },
  },
};

export const Etoile5_CAE = {
  render: Template,

  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      parcours: {
        collectivite_id: 1,
        etoiles: '5',
        referentiel: 'cae',
      },
    },
  },
};

export const Etoile1Envoyee = {
  render: Template,

  args: {
    parcoursLabellisation: {
      status: 'demande_envoyee',
      parcours: {
        collectivite_id: 1,
        etoiles: '1',
      },
    },
  },
};

export const Etoile_2_3_4_5_Envoyee = {
  render: Template,

  args: {
    parcoursLabellisation: {
      status: 'demande_envoyee',
      parcours: {
        collectivite_id: 1,
        etoiles: '2',
      },
    },
  },
};

export const NonLabellisableCOT = {
  render: Template,
  name: 'Non labellisable COT (critère fichier non atteint)',

  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      isCOT: true,
      parcours: {
        collectivite_id: 1,
        referentiel: 'eci',
        etoiles: '1',
      },
    },
  },
};

export const NonLabellisableCOT2 = {
  render: Template,
  name: 'Non labellisable COT (critère fichier atteint)',

  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      isCOT: true,
      parcours: {
        collectivite_id: 1,
        referentiel: 'eci',
        etoiles: '1',
      },
      preuves: ['fichier'],
    },
  },
};

export const LabellisableCOT = {
  render: Template,

  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      labellisable: true,
      isCOT: true,
      parcours: {
        collectivite_id: 1,
        referentiel: 'eci',
        etoiles: '1',
      },
      preuves: ['fichier'],
    },
  },
};
