import {Story, Meta} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import {
  DemandeLabellisationModal,
  TDemandeLabellisationModalProps,
} from './DemandeLabellisationModal';

export default {
  component: DemandeLabellisationModal,
} as Meta;

const Template: Story<TDemandeLabellisationModalProps> = args => (
  <DemandeLabellisationModal opened setOpened={action('setOpened')} {...args} />
);

// on va désactiver les storyshots à cause du composant Dialog de mui
const parameters = {storyshots: false};

export const Etoile1 = Template.bind({});
Etoile1.args = {
  parcours: {
    etoiles: '1',
  },
};
Etoile1.parameters = parameters;

export const Etoile2_3_4_ECI = Template.bind({});
Etoile2_3_4_ECI.args = {
  parcours: {
    etoiles: '2',
    referentiel: 'eci',
  },
};
Etoile2_3_4_ECI.parameters = parameters;

export const Etoile2_3_4_CAE = Template.bind({});
Etoile2_3_4_CAE.args = {
  parcours: {
    etoiles: '2',
    referentiel: 'cae',
  },
};
Etoile2_3_4_CAE.parameters = parameters;

export const Etoile5 = Template.bind({});
Etoile5.args = {
  parcours: {
    etoiles: '5',
  },
};
Etoile5.parameters = parameters;

export const Etoile1Envoyee = Template.bind({});
Etoile1Envoyee.args = {
  submitted: true,
  parcours: {
    etoiles: '1',
  },
};
Etoile1Envoyee.parameters = parameters;

export const Etoile_2_3_4_5_Envoyee = Template.bind({});
Etoile_2_3_4_5_Envoyee.args = {
  submitted: true,
  parcours: {
    etoiles: '2',
  },
};
Etoile_2_3_4_5_Envoyee.parameters = parameters;
