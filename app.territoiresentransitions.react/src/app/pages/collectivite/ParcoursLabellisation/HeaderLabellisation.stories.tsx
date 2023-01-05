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
  <HeaderLabellisation {...args} />
);

export const RemplissageIncomplet = Template.bind({});
RemplissageIncomplet.args = {
  demande: {en_cours: true},
  parcours: {
    etoiles: '1',
    rempli: true,
  },
};

export const CriteresNonRemplis = Template.bind({});
CriteresNonRemplis.args = {
  demande: {en_cours: true},
  parcours: {
    etoiles: '1',
    completude_ok: true,
  },
};

export const CriteresRemplis = Template.bind({});
CriteresRemplis.args = {
  demande: {en_cours: true},
  parcours: {
    etoiles: '1',
    completude_ok: true,
    rempli: true,
  },
};

export const DemandeEnvoyee = Template.bind({});
DemandeEnvoyee.args = {
  demande: {en_cours: false},
  parcours: {
    etoiles: '1',
    completude_ok: true,
    rempli: true,
    derniere_demande: {
      etoiles: '1',
      demandee_le: '2022-12-15T15:05:47.110Z',
    },
  },
};

export const CriteresRemplis_2emeEtoile = Template.bind({});
CriteresRemplis_2emeEtoile.args = {
  demande: {en_cours: true},
  parcours: {
    etoiles: '2',
    completude_ok: true,
    rempli: true,
    derniere_labellisation: {
      etoiles: '1',
      obtenue_le: '2022-12-15T15:05:47.110Z',
    },
  },
};

export const DemandeEnvoyee_2emeEtoile = Template.bind({});
DemandeEnvoyee_2emeEtoile.args = {
  demande: {en_cours: false},
  parcours: {
    etoiles: '2',
    completude_ok: true,
    rempli: true,
    derniere_labellisation: {
      etoiles: '1',
      obtenue_le: '2021-12-15T15:05:47.110Z',
    },
    derniere_demande: {
      etoiles: '2',
      demandee_le: '2022-12-15T15:05:47.110Z',
    },
  },
};

export const AuditEnCours = Template.bind({});
AuditEnCours.args = {
  demande: {en_cours: false},
  isAuditeur: false,
  parcours: {
    etoiles: '2',
    completude_ok: true,
    rempli: true,
    derniere_labellisation: {
      etoiles: '1',
      obtenue_le: '2021-12-15T15:05:47.110Z',
    },
    derniere_demande: {
      etoiles: '2',
      demandee_le: '2022-12-15T15:05:47.110Z',
    },
  },
  audit: {
    date_debut: '2023-01-04T18:16:31.559Z',
  },
};

export const AuditEnCours_Auditeur = Template.bind({});
AuditEnCours_Auditeur.args = {
  demande: {en_cours: false},
  isAuditeur: true,
  parcours: {
    etoiles: '2',
    completude_ok: true,
    rempli: true,
    derniere_labellisation: {
      etoiles: '1',
      obtenue_le: '2021-12-15T15:05:47.110Z',
    },
    derniere_demande: {
      etoiles: '2',
      demandee_le: '2022-12-15T15:05:47.110Z',
    },
  },
  audit: {
    date_debut: '2023-01-04T18:16:31.559Z',
  },
};

export const AuditValide = Template.bind({});
AuditValide.storyName = 'Audit validé';
AuditValide.args = {
  demande: {en_cours: false},
  isAuditeur: false,
  parcours: {
    etoiles: '2',
    completude_ok: true,
    rempli: true,
    derniere_labellisation: {
      etoiles: '1',
      obtenue_le: '2021-12-15T15:05:47.110Z',
    },
    derniere_demande: {
      etoiles: '2',
      demandee_le: '2022-12-15T15:05:47.110Z',
    },
  },
  audit: {
    date_debut: '2023-01-04T18:16:31.559Z',
    valide: true,
  },
};
