import { appLabels } from '@/app/labels/catalog';
import type {
  DemarchePcaetTransition,
  PcaetAvisSens,
  DemarchePcaetVulnerabiliteNiveau,
} from '@tet/domain/demarches';
import type { ColorVariant } from '@tet/design-tokens';
import { PCAET_PLAN_TYPE_KEY } from '@tet/domain/demarches';
import type { PlanType } from '@tet/domain/plans';
import type { DemarchePcaetStatut } from '../types';

export const PCAET_PLAN_TYPE_LABEL = PCAET_PLAN_TYPE_KEY.type;

/**
 * Résout le type de plan PCAET par sa clé fonctionnelle (categorie, type),
 * unique en base — l'id n'est pas stable d'un environnement à l'autre.
 */
export const findPcaetPlanType = (types: PlanType[]): PlanType | undefined =>
  types.find(
    (t) =>
      t.categorie === PCAET_PLAN_TYPE_KEY.categorie &&
      t.type === PCAET_PLAN_TYPE_KEY.type
  );

/** Le sens d'un avis, lu des deux côtés du circuit. */
export const AVIS_SENS_VARIANTS: Record<PcaetAvisSens, ColorVariant> = {
  favorable: 'success',
  avec_reserves: 'warning',
  defavorable: 'error',
};

export const DEMARCHE_PCAET_STATUT_LABELS: Record<DemarchePcaetStatut, string> =
  {
    en_elaboration: 'En élaboration',
    transmis_pour_avis: 'Transmis pour avis',
    instruit: 'Instruit',
    publie: 'Publié',
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
  instruit: 'success',
  publie: 'success',
  archive: 'grey',
};

/**
 * Entrées de menu des transitions : une transition sans entrée ici n'est pas
 * affichée. N'y figurent ni la transmission ni la publication — chacune a son
 * bouton dans le parcours — ni les transitions système, qui ne sont l'acte de
 * personne.
 */
export const DEMARCHE_PCAET_TRANSITION_ACTIONS = {
  archiver: {
    label: appLabels.demarcheTransitionArchiver,
    icon: 'archive-line',
  },
  publier: { label: appLabels.demarcheTransitionPublier, icon: 'eye-line' },
  depublier: {
    label: appLabels.demarcheTransitionDepublier,
    icon: 'eye-off-line',
  },
} as const satisfies Partial<
  Record<DemarchePcaetTransition, { label: string; icon: string }>
>;

export type DemarchePcaetMenuTransition =
  keyof typeof DEMARCHE_PCAET_TRANSITION_ACTIONS;

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
