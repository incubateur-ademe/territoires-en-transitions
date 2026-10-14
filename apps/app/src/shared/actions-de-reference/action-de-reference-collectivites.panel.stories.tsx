import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ActionDeReferenceCollectivitesView } from './action-de-reference-collectivites.panel';
import {
  linkedFichesFixture,
  toFicheFixture,
} from './actions-de-reference.fixture';

const meta: Meta<typeof ActionDeReferenceCollectivitesView> = {
  component: ActionDeReferenceCollectivitesView,
};

export default meta;
type Story = StoryObj<typeof ActionDeReferenceCollectivitesView>;

export const AvecFichesLiees: Story = {
  args: {
    fichesList: { status: 'loaded', fiches: linkedFichesFixture },
  },
};

const restrictedAndLongFiches = [
  toFicheFixture({
    id: 7,
    titre: 'Schéma directeur confidentiel du patrimoine',
    description: null,
    restreint: true,
    collectiviteId: 70,
    collectiviteNom: 'Département de la Gironde',
  }),
  toFicheFixture({
    id: 8,
    titre: 'Plan pluriannuel de rénovation du patrimoine',
    description:
      'Programmation sur dix ans de quatre-vingts bâtiments, classés par gain énergétique attendu, avec un échéancier de travaux par année, une estimation des coûts et un suivi annuel des consommations pour chaque site concerné par le plan.',
    restreint: false,
    collectiviteId: 70,
    collectiviteNom: 'Département de la Gironde',
  }),
];

export const AvecFicheRestreinteEtDescriptionLongue: Story = {
  args: {
    fichesList: {
      status: 'loaded',
      fiches: restrictedAndLongFiches,
    },
  },
};

export const LectureEnErreur: Story = {
  args: {
    fichesList: { status: 'error', retry: () => undefined },
  },
};
