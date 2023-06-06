import React from 'react';
import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {DemandeAuditModalContent} from './DemandeAuditModal';
import {TDemandeLabellisationModalProps} from './DemandeLabellisationModal';

export default {
  component: DemandeAuditModalContent,
} as Meta;

const Template: Story<TDemandeLabellisationModalProps> = args => (
  <DemandeAuditModalContent {...args} onClose={action('onClose')} />
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

export const Etoile2_3_4_5_ECI = Template.bind({});
Etoile2_3_4_5_ECI.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    parcours: {
      collectivite_id: 1,
      referentiel: 'eci',
      etoiles: '2',
    },
  },
};

export const Etoile2_3_4_5_ECI_Labellisable = Template.bind({});
Etoile2_3_4_5_ECI_Labellisable.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    labellisable: true,
    parcours: {
      collectivite_id: 1,
      referentiel: 'eci',
      etoiles: '2',
    },
  },
};

export const Etoile2_3_4_5_CAE = Template.bind({});
Etoile2_3_4_5_CAE.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    parcours: {
      collectivite_id: 1,
      referentiel: 'cae',
      etoiles: '2',
    },
  },
};

export const Etoile2_3_4_5_CAE_Labellisable = Template.bind({});
Etoile2_3_4_5_CAE_Labellisable.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    labellisable: true,
    parcours: {
      collectivite_id: 1,
      referentiel: 'cae',
      etoiles: '2',
    },
  },
};

export const DemandeEtoile1_Envoyee = Template.bind({});
DemandeEtoile1_Envoyee.args = {
  parcoursLabellisation: {
    status: 'demande_envoyee',
    labellisable: true,
    parcours: {
      collectivite_id: 1,
      referentiel: 'cae',
      etoiles: '1',
    },
  },
};

export const DemandeAutreEtoile_Envoyee = Template.bind({});
DemandeAutreEtoile_Envoyee.args = {
  parcoursLabellisation: {
    status: 'demande_envoyee',
    labellisable: true,
    parcours: {
      collectivite_id: 1,
      referentiel: 'cae',
      etoiles: '2',
    },
  },
};
