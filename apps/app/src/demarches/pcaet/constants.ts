import { appLabels } from '@/app/labels/catalog';
import type {
  DemarchePcaetTransition,
  DemarchePcaetVulnerabiliteNiveau,
} from '@tet/domain/demarches';
import type { ColorVariant } from '@tet/design-tokens';
import type { PlanType } from '@tet/domain/plans';
import type { DemarchePcaetStatut } from '../types';

export const PCAET_PLAN_TYPE_CATEGORIE = 'Plans transverses';
export const PCAET_PLAN_TYPE_LABEL = 'Plan Climat Air Énergie Territorial';

/**
 * Résout le type de plan PCAET par sa clé fonctionnelle (categorie, type),
 * unique en base — l'id n'est pas stable d'un environnement à l'autre.
 */
export const findPcaetPlanType = (types: PlanType[]): PlanType | undefined =>
  types.find(
    (t) =>
      t.categorie === PCAET_PLAN_TYPE_CATEGORIE &&
      t.type === PCAET_PLAN_TYPE_LABEL
  );

/** @deprecated heuristique de libellé — utiliser findPcaetPlanType. */
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
  adopte: 'success',
  publie: 'success',
  archive: 'grey',
};

/**
 * Transitions proposées dans les menus d'action, tous axes du workflow
 * confondus : une transition sans entrée ici n'est pas affichée (la
 * transmission a son propre bouton dans le parcours d'élaboration).
 */
/**
 * Entrées de menu des transitions. La transmission n'y figure pas : elle a son
 * bouton dans le parcours d'élaboration.
 */
export const DEMARCHE_PCAET_TRANSITION_ACTIONS = {
  reprendre_elaboration: {
    label: appLabels.demarcheTransitionReprendre,
    icon: 'arrow-go-back-line',
  },
  adopter: { label: appLabels.demarcheTransitionAdopter, icon: 'check-line' },
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
