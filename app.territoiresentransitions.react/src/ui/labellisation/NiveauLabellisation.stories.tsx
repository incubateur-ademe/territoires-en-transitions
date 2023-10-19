import { Meta} from '@storybook/react';
// import { action } from '@storybook/addon-actions';
import {
  NiveauLabellisation,
} from './NiveauLabellisation';

export default {
  component: NiveauLabellisation,
} as Meta;

export const NonLabellisePasDeDonnees = {
  args: {
    labellisationParNiveau: {},
  },
};

export const NonLabellise = {
  args: {
    realisePercentage: 10,
    labellisationParNiveau: {
      0: {
        collectivite_id: 1,
        etoiles: 0,
        score_realise: 10,
        score_programme: 62,
      },
    },
  },
};

export const UneEtoile = {
  args: {
    realisePercentage: 25,
    labellisationParNiveau: {
      1: {
        collectivite_id: 1,
        etoiles: 1,
        obtenue_le: new Date('2022-03-14T09:43:00.251Z'),
        score_realise: 20,
        score_programme: 62,
      },
    },
  },
};

export const DeuxEtoilesPossibles = {
  args: {
    realisePercentage: 45,
    labellisationParNiveau: {
      1: {
        collectivite_id: 1,
        etoiles: 1,
        obtenue_le: new Date('2022-03-14T09:43:00.251Z'),
        score_realise: 36,
        score_programme: 62,
      },
    },
  },
};

export const DeuxEtoiles = {
  args: {
    realisePercentage: 45,
    labellisationParNiveau: {
      1: {
        collectivite_id: 1,
        etoiles: 1,
        obtenue_le: new Date('2020-03-14T09:43:00.251Z'),
        score_realise: 20,
        score_programme: 45,
      },
      2: {
        collectivite_id: 1,
        etoiles: 2,
        obtenue_le: new Date('2022-03-14T09:43:00.251Z'),
        score_realise: 37,
        score_programme: 62,
      },
    },
  },
};

export const DeuxEtoilesScoreNul = {
  args: {
    labellisationParNiveau: {
      1: {
        collectivite_id: 1,
        etoiles: 2,
        obtenue_le: new Date('2020-03-14T09:43:00.251Z'),
        score_realise: null,
        score_programme: null,
      },
      2: {
        collectivite_id: 1,
        etoiles: 2,
        obtenue_le: new Date('2022-03-14T09:43:00.251Z'),
        score_realise: null,
        score_programme: null,
      },
    },
  },
};

export const DeuxEtoilesDirectement = {
  args: {
    realisePercentage: 42,
    labellisationParNiveau: {
      2: {
        collectivite_id: 1,
        etoiles: 2,
        obtenue_le: new Date('2022-03-14T09:43:00.251Z'),
        score_realise: null,
        score_programme: null,
      },
    },
  },
};

export const TroisEtoilesPossibles = {
  args: {
    realisePercentage: 51,
    labellisationParNiveau: {
      1: {
        collectivite_id: 1,
        etoiles: 1,
        obtenue_le: new Date('2020-03-14T09:43:00.251Z'),
        score_realise: 20,
        score_programme: 45,
      },
      2: {
        collectivite_id: 1,
        etoiles: 2,
        obtenue_le: new Date('2022-03-14T09:43:00.251Z'),
        score_realise: 35,
        score_programme: 75,
      },
    },
  },
};

export const TroisEtoiles = {
  args: {
    realisePercentage: 51,
    labellisationParNiveau: {
      1: {
        collectivite_id: 1,
        etoiles: 1,
        obtenue_le: new Date('2018-03-14T09:43:00.251Z'),
        score_realise: 20,
        score_programme: 45,
      },
      2: {
        collectivite_id: 1,
        etoiles: 2,
        obtenue_le: new Date('2020-03-14T09:43:00.251Z'),
        score_realise: 37,
        score_programme: 62,
      },
      3: {
        collectivite_id: 1,
        etoiles: 3,
        obtenue_le: new Date('2022-03-14T09:43:00.251Z'),
        score_realise: 51,
        score_programme: 62,
      },
    },
  },
};

export const QuatreEtoiles = {
  args: {
    realisePercentage: 69,
    labellisationParNiveau: {
      ...TroisEtoiles.args.labellisationParNiveau,
      4: {
        collectivite_id: 1,
        etoiles: 4,
        obtenue_le: new Date('2023-03-14T09:43:00.251Z'),
        score_realise: 65,
        score_programme: 80,
      },
    },
  },
};

export const CinqEtoiles = {
  args: {
    realisePercentage: 79,
    labellisationParNiveau: {
      ...QuatreEtoiles.args.labellisationParNiveau,
      5: {
        collectivite_id: 1,
        etoiles: 5,
        obtenue_le: new Date('2024-03-14T09:43:00.251Z'),
        score_realise: 75,
        score_programme: 80,
      },
    },
  },
};
