import { Meta, StoryFn } from '@storybook/nextjs';
import {
  CriteresLabellisation,
  TCriteresLabellisationProps,
} from './CriteresLabellisation';
import fixture from './fixture.json';

export default {
  component: CriteresLabellisation,
} as Meta;

const Template: StoryFn<TCriteresLabellisationProps> = (args) => (
  <CriteresLabellisation {...args} collectiviteId={1} />
);

export const PremiereEtoileECI = {
  render: Template,

  args: {
    parcours: {
      ...fixture.parcours1,
      demande: {
        id: 1,
        en_cours: true,
        collectivite_id: 1,
        referentiel: 'eci',
        etoiles: '1',
      },
    },
    preuves: [],
  },
};

export const PremiereEtoileCAE = {
  render: Template,

  args: {
    parcours: {
      ...fixture.parcours1,
      referentiel: 'cae',
      demande: {
        id: 1,
        en_cours: true,
        collectivite_id: 1,
        referentiel: 'cae',
        etoiles: '1',
      },
    },
    preuves: [],
  },
};
