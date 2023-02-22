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

export const NonLabellisable = Template.bind({});
NonLabellisable.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    parcours: {
      etoiles: '1',
      rempli: true,
    },
  },
};

export const NonAuditableCOT = Template.bind({});
NonAuditableCOT.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    isCOT: true,
    parcours: {
      etoiles: '1',
      completude_ok: false,
    },
  },
};

export const NonLabellisableCOT = Template.bind({});
NonLabellisableCOT.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    isCOT: true,
    parcours: {
      etoiles: '1',
      completude_ok: true,
    },
  },
};

export const Labellisable = Template.bind({});
Labellisable.args = {
  parcoursLabellisation: {
    labellisable: true,
    status: 'non_demandee',
    parcours: {
      etoiles: '1',
      completude_ok: true,
      rempli: true,
    },
  },
};

export const LabellisableCOT = Template.bind({});
LabellisableCOT.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    labellisable: true,
    isCOT: true,
    parcours: {
      etoiles: '1',
      completude_ok: true,
      rempli: true,
    },
  },
};

export const DemandeEnvoyee = Template.bind({});
DemandeEnvoyee.args = {
  parcoursLabellisation: {
    status: 'demande_envoyee',
    parcours: {
      etoiles: '1',
      completude_ok: true,
      rempli: true,
      demande: {
        etoiles: '1',
        demandee_le: '2022-12-15T15:05:47.110Z',
      },
    },
  },
};

export const DemandeEnvoyeeCOT = Template.bind({});
DemandeEnvoyeeCOT.args = {
  parcoursLabellisation: {
    status: 'demande_envoyee',
    isCOT: true,
    parcours: {
      etoiles: '1',
      completude_ok: true,
      rempli: true,
      demande: {
        etoiles: '1',
        demandee_le: '2022-12-15T15:05:47.110Z',
      },
    },
  },
};

export const CriteresRemplis_2emeEtoile = Template.bind({});
CriteresRemplis_2emeEtoile.args = {
  parcoursLabellisation: {
    status: 'non_demandee',
    parcours: {
      etoiles: '2',
      completude_ok: true,
      rempli: true,
      labellisation: {
        etoiles: '1',
        obtenue_le: '2022-12-15T15:05:47.110Z',
      },
    },
  },
};

export const DemandeEnvoyee_2emeEtoile = Template.bind({});
DemandeEnvoyee_2emeEtoile.args = {
  parcoursLabellisation: {
    status: 'demande_envoyee',
    parcours: {
      etoiles: '2',
      completude_ok: true,
      rempli: true,
      labellisation: {
        etoiles: '1',
        obtenue_le: '2021-12-15T15:05:47.110Z',
      },
      demande: {
        etoiles: '2',
        demandee_le: '2022-12-15T15:05:47.110Z',
      },
    },
  },
};

export const AuditEnCours = Template.bind({});
AuditEnCours.args = {
  parcoursLabellisation: {
    status: 'audit_en_cours',
    parcours: {
      etoiles: '2',
      completude_ok: true,
      rempli: true,
      labellisation: {
        etoiles: '1',
        obtenue_le: '2021-12-15T15:05:47.110Z',
      },
      demande: {
        etoiles: '2',
        demandee_le: '2022-12-15T15:05:47.110Z',
      },
      audit: {
        date_debut: '2023-01-04T18:16:31.559Z',
      },
    },
  },
};

export const AuditEnCours_Auditeur = Template.bind({});
AuditEnCours_Auditeur.storyName = 'Audit en cours (auditeur)';
AuditEnCours_Auditeur.args = {
  parcoursLabellisation: {
    status: 'audit_en_cours',
    isAuditeur: true,
    parcours: {
      etoiles: '2',
      completude_ok: true,
      rempli: true,
      labellisation: {
        etoiles: '1',
        obtenue_le: '2021-12-15T15:05:47.110Z',
      },
      demande: {
        etoiles: '2',
        demandee_le: '2022-12-15T15:05:47.110Z',
      },
      audit: {
        date_debut: '2023-01-04T18:16:31.559Z',
      },
    },
  },
};

export const AuditValide = Template.bind({});
AuditValide.storyName = 'Audit validé';
AuditValide.args = {
  parcoursLabellisation: {
    status: 'audit_valide',
    parcours: {
      etoiles: '2',
      completude_ok: true,
      rempli: true,
      labellisation: {
        etoiles: '1',
        obtenue_le: '2021-12-15T15:05:47.110Z',
      },
      demande: {
        sujet: 'cot',
        demandee_le: '2022-12-15T15:05:47.110Z',
      },
    },
    audit: {
      date_debut: '2023-01-04T18:16:31.559Z',
      valide: true,
    },
  },
};

export const AuditValideAuditeur = Template.bind({});
AuditValideAuditeur.storyName = 'Audit validé (auditeur)';
AuditValideAuditeur.args = {
  parcoursLabellisation: {
    status: 'audit_valide',
    parcours: {
      etoiles: '2',
      completude_ok: true,
      rempli: true,
      labellisation: {
        etoiles: '1',
        obtenue_le: '2021-12-15T15:05:47.110Z',
      },
      demande: {
        sujet: 'cot',
        demandee_le: '2022-12-15T15:05:47.110Z',
      },
    },
    audit: {
      date_debut: '2023-01-04T18:16:31.559Z',
      valide: true,
    },
  },
};
