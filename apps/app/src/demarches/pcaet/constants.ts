import {
  makeCollectiviteJournalUrl,
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsListUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import type {
  DemarchePcaetTransition,
  DemarchePcaetVulnerabiliteNiveau,
} from '@tet/domain/demarches';
import type { ColorVariant } from '@tet/design-tokens';
import type {
  DemarchePcaetStatut,
  DemarchePcaetStatutPublication,
} from '../types';

export const PCAET_PLAN_TYPE_LABEL = 'Plan Climat Air Énergie Territorial';

export const isPcaetPlan = (typeLabel: string | null | undefined): boolean =>
  Boolean(
    typeLabel?.toLowerCase().includes('climat') ||
      typeLabel?.toLowerCase().includes('pcaet')
  );

export const DEMARCHE_PCAET_STATUT_LABELS: Record<DemarchePcaetStatut, string> =
  {
    en_elaboration: 'En élaboration',
    transmis_pour_avis: 'Transmis pour avis',
    adopte: 'Adopté',
    archive: 'Archivé',
  };

export const formatDemarcheStatut = (statut: DemarchePcaetStatut) =>
  DEMARCHE_PCAET_STATUT_LABELS[statut];

export const DEMARCHE_PCAET_STATUT_VARIANTS: Record<
  DemarchePcaetStatut,
  ColorVariant
> = {
  en_elaboration: 'info',
  transmis_pour_avis: 'warning',
  adopte: 'success',
  archive: 'grey',
};

/**
 * Libellés des transitions proposées dans les menus d'action : une transition
 * sans libellé n'est pas affichée.
 */
export const DEMARCHE_PCAET_TRANSITION_LABELS: Partial<
  Record<DemarchePcaetTransition, string>
> = {
  reprendre_elaboration: appLabels.demarcheTransitionReprendre,
  adopter: appLabels.demarcheTransitionAdopter,
  archiver: appLabels.demarcheTransitionArchiver,
};

export const DEMARCHE_PCAET_STATUT_PUBLICATION_LABELS: Record<
  DemarchePcaetStatutPublication,
  string
> = {
  draft: 'Brouillon',
  published: 'Publiée',
};

export type DemarchePcaetContact = {
  nom: string;
  email: string;
  situation: string;
};

export type DemarchePcaetOrganismeContacts = {
  organisme: string;
  contacts: DemarchePcaetContact[];
};

export const demarcheMockContacts: DemarchePcaetOrganismeContacts[] = [
  {
    organisme: appLabels.demarcheContactDreal,
    contacts: [
      {
        nom: 'DREAL Auvergne-Rhône-Alpes',
        email: 'pcaet.dreal-ara@developpement-durable.gouv.fr',
        situation: appLabels.demarcheContactDrealSituation,
      },
    ],
  },
  {
    organisme: appLabels.demarcheContactCr,
    contacts: [
      {
        nom: 'Conseil régional - Nathalie Garcia',
        email: 'nathalie.garcia@auvergnerhonealpes.fr',
        situation: appLabels.demarcheContactCrSituation,
      },
    ],
  },
];

export const makePlansListUrl = (collectiviteId: number) =>
  makeCollectivitePlansActionsListUrl({ collectiviteId });

export const makeCreatePcaetPlanUrl = (collectiviteId: number) =>
  makeCollectivitePlansActionsCreerUrl({ collectiviteId });

export const makeJournalUrl = (collectiviteId: number) =>
  makeCollectiviteJournalUrl({ collectiviteId });

// ---------------------------------------------------------------------------
// Vulnérabilité du territoire
// ---------------------------------------------------------------------------

export const DEMARCHE_PCAET_VULNERABILITE_NIVEAU_LABELS: Record<
  DemarchePcaetVulnerabiliteNiveau,
  string
> = {
  non_concerne: 'non concerné',
  faible: 'faible',
  moyen: 'moyen',
  fort: 'fort',
};

export const DEMARCHE_PCAET_VULNERABILITE_NIVEAU_VARIANTS: Record<
  DemarchePcaetVulnerabiliteNiveau,
  ColorVariant
> = {
  non_concerne: 'grey',
  faible: 'success',
  moyen: 'warning',
  fort: 'error',
};
