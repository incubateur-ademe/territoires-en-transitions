import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  DemarchePcaetStatusEnum,
  PcaetStatutInstructionEnum,
} from '@tet/domain/demarches';
import type { Dossier } from './dossiers-instruction.cells';
import { DossiersInstructionTable } from './dossiers-instruction.table';

const dossier = (
  overrides: Partial<Dossier> & Pick<Dossier, 'demarcheId' | 'collectivite'>
): Dossier => ({
  demandeAvisId: null,
  demarcheTitre: 'PCAET 2026',
  demarcheStatus: DemarchePcaetStatusEnum.EN_ELABORATION,
  launchedAt: '2026-06-01T00:00:00.000Z',
  avisDeadlineAt: null,
  transmittedAt: null,
  dateSaisine: null,
  peutModifierDateSaisine: false,
  adoptedAt: null,
  pilotes: [{ nom: 'Claire Moreau', email: 'claire.moreau@exemple.fr' }],
  deposeAvis: true,
  statut: PcaetStatutInstructionEnum.EN_ELABORATION,
  obligation: 'obligatoire',
  obligationSource: 'assujettissement',
  isScotAec: false,
  nbAvisValides: 0,
  nbAvisBrouillons: 0,
  typePorteurSupra: null,
  collectivitesCouvertes: [],
  ...overrides,
});

const territoire = {
  departementCode: '45',
  departementLibelle: 'Loiret',
  regionCode: '24',
  regionLibelle: 'Centre-Val de Loire',
};

const meta: Meta<typeof DossiersInstructionTable> = {
  component: DossiersInstructionTable,
  args: {
    deposeAvis: true,
    afficherRegion: false,
    regionsOptions: [],
    afficherDepartement: true,
    departementsOptions: [],
    filtres: { statuts: [], obligations: [], regions: [], departements: [] },
    nbFiltresActifs: {
      statuts: 0,
      obligations: 0,
      regions: 0,
      departements: 0,
    },
    setFiltres: () => undefined,
    sort: 'priorite',
    direction: 'desc',
    trierPar: () => undefined,
    etatVide: { title: 'Aucun dossier' },
  },
};

export default meta;

type Story = StoryObj<typeof DossiersInstructionTable>;

/** Un dépôt de Supra, un dépôt simple, un dépôt transmis sans saisine. */
export const AvecSupra: Story = {
  args: {
    dossiers: [
      dossier({
        demarcheId: 1,
        demandeAvisId: 10,
        demarcheStatus: DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
        statut: PcaetStatutInstructionEnum.EN_INSTRUCTION,
        transmittedAt: '2026-10-21T00:00:00.000Z',
        dateSaisine: '2026-10-21T00:00:00.000Z',
        avisDeadlineAt: '2027-02-21T00:00:00.000Z',
        obligation: null,
        obligationSource: null,
        typePorteurSupra: 'petr',
        collectivite: {
          id: 100,
          nom: 'PETR Forêt d’Orléans-Loire-Sologne',
          ...territoire,
        },
        collectivitesCouvertes: [
          {
            id: 101,
            nom: 'CC de la Forêt',
            obligation: 'obligatoire',
            ...territoire,
          },
          {
            id: 102,
            nom: 'CC des Portes de Sologne',
            obligation: 'volontaire',
            ...territoire,
          },
          {
            id: 103,
            nom: 'CC du Val de Sully',
            obligation: 'obligatoire',
            ...territoire,
          },
        ],
      }),
      dossier({
        demarcheId: 2,
        isScotAec: true,
        collectivite: {
          id: 200,
          nom: 'Tours Métropole Val de Loire',
          ...territoire,
        },
      }),
      dossier({
        demarcheId: 3,
        demarcheStatus: DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
        statut: PcaetStatutInstructionEnum.EN_INSTRUCTION,
        transmittedAt: '2026-07-15T00:00:00.000Z',
        collectivite: { id: 300, nom: 'Chartres Métropole', ...territoire },
      }),
    ],
  },
};
