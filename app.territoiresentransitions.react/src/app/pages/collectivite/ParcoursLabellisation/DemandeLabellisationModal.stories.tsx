import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {
  DemandeLabellisationModalContent,
  TDemandeLabellisationModalProps,
} from './DemandeLabellisationModal';

export default {
  component: DemandeLabellisationModalContent,
} as Meta;

const Template: Story<TDemandeLabellisationModalProps> = args => (
  <DemandeLabellisationModalContent {...args} onClose={action('onClose')} />
);

export const Etoile1_ECI = Template.bind({});
Etoile1_ECI.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    parcours: {
      collectivite_id: 1,
      referentiel: 'eci',
      etoiles: '1',
    },
  },
};

export const Etoile1_CAE = Template.bind({});
Etoile1_CAE.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    parcours: {
      collectivite_id: 1,
      referentiel: 'cae',
      etoiles: '1',
    },
  },
};

export const Etoile2_3_4_ECI = Template.bind({});
Etoile2_3_4_ECI.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    parcours: {
      collectivite_id: 1,
      etoiles: '2',
      referentiel: 'eci',
    },
  },
};

export const Etoile2_3_4_CAE = Template.bind({});
Etoile2_3_4_CAE.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    parcours: {
      collectivite_id: 1,
      etoiles: '2',
      referentiel: 'cae',
    },
  },
};

export const Etoile5_ECI = Template.bind({});
Etoile5_ECI.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    parcours: {
      collectivite_id: 1,
      etoiles: '5',
      referentiel: 'eci',
    },
  },
};

export const Etoile5_CAE = Template.bind({});
Etoile5_CAE.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    parcours: {
      collectivite_id: 1,
      etoiles: '5',
      referentiel: 'cae',
    },
  },
};

export const Etoile1Envoyee = Template.bind({});
Etoile1Envoyee.args = {
  parcoursLabellisation: {
    status: 'demande_envoyee',
    parcours: {
      collectivite_id: 1,
      etoiles: '1',
    },
  },
};

export const Etoile_2_3_4_5_Envoyee = Template.bind({});
Etoile_2_3_4_5_Envoyee.args = {
  parcoursLabellisation: {
    status: 'demande_envoyee',
    parcours: {
      collectivite_id: 1,
      etoiles: '2',
    },
  },
};

export const NonLabellisableCOT = Template.bind({});
NonLabellisableCOT.storyName =
  'Non labellisable COT (critère fichier non atteint)';
NonLabellisableCOT.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    isCOT: true,
    parcours: {
      collectivite_id: 1,
      referentiel: 'eci',
      etoiles: '1',
    },
  },
};

export const NonLabellisableCOT2 = Template.bind({});
NonLabellisableCOT2.storyName =
  'Non labellisable COT (critère fichier atteint)';
NonLabellisableCOT2.args = {
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
};

export const LabellisableCOT = Template.bind({});
LabellisableCOT.args = {
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
};
