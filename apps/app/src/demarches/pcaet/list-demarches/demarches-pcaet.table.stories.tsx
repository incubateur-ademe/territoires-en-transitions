import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  DemarchePcaetStatusEnum,
  demarchePcaetStatusValues,
} from '@tet/domain/demarches';
import { DemarchesPcaetTable } from './demarches-pcaet.table';
import type { DemarcheListItem } from './use-filter-demarches-pcaet';

const demarche = (
  overrides: Partial<DemarcheListItem> & Pick<DemarcheListItem, 'id' | 'titre'>
): DemarcheListItem => ({
  collectiviteId: 1,
  status: DemarchePcaetStatusEnum.EN_ELABORATION,
  createdAt: '2026-11-12T00:00:00.000Z',
  launchedAt: '2026-10-01T00:00:00.000Z',
  modifiedAt: '2026-11-12T00:00:00.000Z',
  pilotes: [{ nom: 'Camille Martin' }],
  ...overrides,
});

const meta: Meta<typeof DemarchesPcaetTable> = {
  component: DemarchesPcaetTable,
  args: {
    ariaLabel: 'Démarches PCAET',
    sort: 'creation',
    direction: 'desc',
    trierPar: () => undefined,
    statuts: [],
    setStatuts: () => undefined,
    statutOptions: demarchePcaetStatusValues,
    getDetailUrl: ({ id }) => `/demarches/${id}`,
    etatVide: { title: 'Aucune démarche' },
  },
};

export default meta;

type Story = StoryObj<typeof DemarchesPcaetTable>;

/** La liste d'un Supra : un dépôt par groupe d'EPCI, l'archivé replié. */
export const Supra: Story = {
  args: {
    demarches: [
      demarche({
        id: 1,
        titre: 'PCAET 2026',
        collectivitesCouvertes: [
          { id: 11, nom: 'CC Castelnaudary Lauragais Audois' },
          { id: 12, nom: 'CC des Terres du Lauragais' },
        ],
      }),
      demarche({
        id: 2,
        titre: 'PCAET 2020',
        status: DemarchePcaetStatusEnum.ARCHIVE,
        collectivitesCouvertes: [
          { id: 11, nom: 'CC Castelnaudary Lauragais Audois' },
          { id: 12, nom: 'CC des Terres du Lauragais' },
          { id: 13, nom: 'CC Lauragais Revel Sorezois' },
        ],
      }),
    ],
  },
};

/** La liste d'un EPCI couvert : le dépôt du Supra, puis les siens. */
export const EpciCouvert: Story = {
  args: {
    demarches: [
      demarche({
        id: 1,
        titre: 'PCAET 2026',
        porteur: { id: 9, nom: 'PETR du Pays Lauragais', type: 'petr' },
      }),
      demarche({
        id: 3,
        titre: 'PCAET 2018',
        status: DemarchePcaetStatusEnum.PUBLIE,
      }),
    ],
  },
};
