import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {
  DemandeLabellisationModal,
  TDemandeLabellisationModalProps,
} from './DemandeLabellisationModal';

export default {
  component: DemandeLabellisationModal,
  // on va désactiver les storyshots à cause du composant Dialog de mui
  parameters: {storyshots: false},
} as Meta;

const Template: Story<TDemandeLabellisationModalProps> = args => (
  <DemandeLabellisationModal opened setOpened={action('setOpened')} {...args} />
);

export const Etoile1 = Template.bind({});
Etoile1.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    parcours: {
      collectivite_id: 1,
      referentiel: 'eci',
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

export const Etoile5 = Template.bind({});
Etoile5.args = {
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
