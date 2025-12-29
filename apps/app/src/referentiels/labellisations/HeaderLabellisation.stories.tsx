import { Meta} from '@storybook/nextjs-vite';
// import { action } from 'storybook/actions';
import {
  HeaderLabellisation,
} from './HeaderLabellisation';

export default {
  component: HeaderLabellisation,
} as Meta;

export const NonLabellisable = {
  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      parcours: {
        etoiles: '1',
        rempli: true,
      },
    },
  },
};

export const NonAuditableCOT = {
  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      isCOT: true,
      parcours: {
        etoiles: '1',
        completude_ok: false,
      },
    },
  },
};

export const NonLabellisableCOT = {
  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      isCOT: true,
      parcours: {
        etoiles: '1',
        completude_ok: true,
      },
    },
  },
};

export const Labellisable = {
  args: {
    parcoursLabellisation: {
      labellisable: true,
      status: 'non_demandee',
      parcours: {
        etoiles: '1',
        completude_ok: true,
        rempli: true,
      },
    },
  },
};

export const LabellisableCOT = {
  args: {
    parcoursLabellisation: {
      status: 'non_demandee',
      labellisable: true,
      peutDemanderEtoile: true,
      isCOT: true,
      parcours: {
        etoiles: '1',
        completude_ok: true,
        rempli: true,
      },
    },
  },
};

export const DemandeEnvoyee = {
  args: {
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
  },
};

export const DemandeEnvoyeeCOT = {
  args: {
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
  },
};

export const CriteresRemplis_2emeEtoile = {
  args: {
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
  },
};

export const DemandeEnvoyee_2emeEtoile = {
  args: {
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
  },
};

export const AuditEnCours = {
  args: {
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
  },
};

export const AuditEnCours_Auditeur = {
  name: 'Audit en cours (auditeur)',

  args: {
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
  },
};

export const AuditValide = {
  name: 'Audit validé',

  args: {
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
  },
};

export const AuditValideAuditeur = {
  name: 'Audit validé (auditeur)',

  args: {
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
  },
};
