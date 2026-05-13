import { Meta, StoryFn } from '@storybook/nextjs-vite';
import React from 'react';
import { DemandeAuditModal } from './DemandeAuditModal';
import { TDemandeLabellisationModalProps } from './DemandeLabellisationModal';

export default {
  component: DemandeAuditModal,
} as Meta;

const Template: StoryFn<TDemandeLabellisationModalProps> = (args) => (
  <DemandeAuditModal {...args} opened={true} setOpened={() => {}} />
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

export const Etoile2_3_4_5_ECI = {
  render: Template,
  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      parcours: {
        collectivite_id: 1,
        referentiel: 'eci',
        etoiles: '2',
      },
    },
  },
};

export const Etoile2_3_4_5_ECI_Labellisable = {
  render: Template,
  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      labellisable: true,
      parcours: {
        collectivite_id: 1,
        referentiel: 'eci',
        etoiles: '2',
      },
    },
  },
};

export const Etoile2_3_4_5_CAE = {
  render: Template,
  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      parcours: {
        collectivite_id: 1,
        referentiel: 'cae',
        etoiles: '2',
      },
    },
  },
};

export const Etoile2_3_4_5_CAE_Labellisable = {
  render: Template,
  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      labellisable: true,
      parcours: {
        collectivite_id: 1,
        referentiel: 'cae',
        etoiles: '2',
      },
    },
  },
};

export const DemandeEtoile1_Envoyee = {
  render: Template,
  args: {
    parcoursLabellisation: {
      status: 'demande_envoyee',
      labellisable: true,
      parcours: {
        collectivite_id: 1,
        referentiel: 'cae',
        etoiles: '1',
      },
    },
  },
};

export const DemandeAutreEtoile_Envoyee = {
  render: Template,
  args: {
    parcoursLabellisation: {
      status: 'demande_envoyee',
      labellisable: true,
      parcours: {
        collectivite_id: 1,
        referentiel: 'cae',
        etoiles: '2',
      },
    },
  },
};
