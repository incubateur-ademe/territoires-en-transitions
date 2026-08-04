import {
  makeCollectiviteDemarchePcaetVulnerabiliteUrl,
  makeCollectiviteIndicateursListUrl,
  makeCollectiviteJournalUrl,
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsListUrl,
  makeCollectiviteTrajectoirelUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import type { ColorVariant } from '@tet/design-tokens';
import type {
  DemarchePcaetStatut,
  DemarchePcaetStatutPublication,
  DemarchePcaetVoletId,
  DemarchePcaetVulnerabiliteDomaineId,
  DemarchePcaetVulnerabiliteLigne,
  DemarchePcaetVulnerabiliteNiveau,
  DemarchePcaetVulnerabiliteState,
} from './demarche-pcaet.types';

export const PCAET_PLAN_TYPE_LABEL = 'Plan Climat Air Énergie Territorial';

export const isPcaetPlan = (typeLabel: string | null | undefined): boolean =>
  Boolean(
    typeLabel?.toLowerCase().includes('climat') ||
      typeLabel?.toLowerCase().includes('pcaet')
  );

export const DEMARCHE_PCAET_STATUT_LABELS: Record<DemarchePcaetStatut, string> =
  {
    brouillon: 'Brouillon',
    en_elaboration: 'En élaboration',
    pret_pour_depot: 'Prêt pour dépôt',
    soumis_ademe: 'Soumis à l’ADEME',
    en_verification: 'En vérification ADEME',
    valide: 'Validé',
    publie: 'Publié',
    evaluation_mi_parcours: 'Évaluation à mi-parcours',
    evaluation_finale: 'Évaluation finale',
  };

export const formatDemarcheStatut = (statut: DemarchePcaetStatut) =>
  DEMARCHE_PCAET_STATUT_LABELS[statut];

export const DEMARCHE_PCAET_STATUT_PUBLICATION_LABELS: Record<
  DemarchePcaetStatutPublication,
  string
> = {
  draft: 'Brouillon',
  published: 'Publiée',
};

export type DemarchePcaetVoletModalKind = 'indicateur' | 'documents' | 'page';

export type DemarchePcaetVoletConfig = {
  id: DemarchePcaetVoletId;
  label: string /** Icône RemixIcon représentant la thématique du volet. */;
  icon: string;
  href: (collectiviteId: number, demarcheId?: number) => string;
  /** Contenu de la modale ouverte depuis la page démarche PCAET. */
  modalKind: DemarchePcaetVoletModalKind;
  /** Identifiant référentiel CAE de l’indicateur principal du volet. */
  indicateurIdentifiantReferentiel?: string;
};

export const DEMARCHE_PCAET_VOLETS: DemarchePcaetVoletConfig[] = [
  {
    id: 'profil_energie_climat',
    label: 'Profil énergie CLIMAT',
    icon: 'fire-line',
    href: (collectiviteId) =>
      makeCollectiviteTrajectoirelUrl({ collectiviteId }),
    modalKind: 'indicateur',
    indicateurIdentifiantReferentiel: 'cae_1.a',
  },
  {
    id: 'sequestration',
    label: 'Séquestration carbone',
    icon: 'seedling-line',
    href: (collectiviteId) =>
      makeCollectiviteTrajectoirelUrl({ collectiviteId }),
    modalKind: 'indicateur',
    indicateurIdentifiantReferentiel: 'cae_63.',
  },
  {
    id: 'polluants_atmospheriques',
    label: 'Polluants atmosphérique',
    icon: 'haze-2-line',
    href: (collectiviteId) =>
      makeCollectiviteIndicateursListUrl({ collectiviteId, listId: 'tous' }),
    modalKind: 'indicateur',
    indicateurIdentifiantReferentiel: 'cae_4.a',
  },
  {
    id: 'enr',
    label: 'ENR',
    icon: 'sun-line',
    href: (collectiviteId) =>
      makeCollectiviteIndicateursListUrl({ collectiviteId, listId: 'tous' }),
    modalKind: 'indicateur',
    indicateurIdentifiantReferentiel: 'cae_25.a',
  },
  {
    id: 'vulnerabilite_territoire',
    label: appLabels.demarchePcaetVulnerabiliteTitre,
    icon: 'map-2-line',
    href: (collectiviteId, demarcheId) =>
      makeCollectiviteDemarchePcaetVulnerabiliteUrl({
        collectiviteId,
        demarchePcaetId: demarcheId ?? 0,
      }),
    modalKind: 'page',
  },
];

export const defaultVoletsCompletion = (): Record<
  DemarchePcaetVoletId,
  'incomplete'
> => ({
  sequestration: 'incomplete',
  enr: 'incomplete',
  profil_energie_climat: 'incomplete',
  polluants_atmospheriques: 'incomplete',
  vulnerabilite_territoire: 'incomplete',
});

export type DemarchePcaetContact = {
  nom: string;
  email: string;
  situation: string;
};

export type DemarchePcaetOrganismeContacts = {
  organisme: string;
  contacts: DemarchePcaetContact[];
};

export const demarchePcaetMockContacts: DemarchePcaetOrganismeContacts[] = [
  {
    organisme: appLabels.demarchePcaetContactDreal,
    contacts: [
      {
        nom: 'DREAL Auvergne-Rhône-Alpes',
        email: 'pcaet.dreal-ara@developpement-durable.gouv.fr',
        situation: appLabels.demarchePcaetContactDrealSituation,
      },
    ],
  },
  {
    organisme: appLabels.demarchePcaetContactCr,
    contacts: [
      {
        nom: 'Conseil régional - Nathalie Garcia',
        email: 'nathalie.garcia@auvergnerhonealpes.fr',
        situation: appLabels.demarchePcaetContactCrSituation,
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

export const DEMARCHE_PCAET_VULNERABILITE_DOMAINES: ReadonlyArray<{
  id: DemarchePcaetVulnerabiliteDomaineId;
  label: string;
}> = [
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'amenagement', label: 'Aménagement' },
  { id: 'batiments', label: 'Bâtiments' },
  { id: 'biodiversite', label: 'Biodiversité' },
  { id: 'eau', label: 'Eau' },
  { id: 'foret', label: 'Forêt' },
  { id: 'energie', label: 'Énergie' },
  { id: 'economie', label: 'Économie' },
  { id: 'sante', label: 'Santé' },
];

export const DEMARCHE_PCAET_VULNERABILITE_NIVEAUX: ReadonlyArray<DemarchePcaetVulnerabiliteNiveau> =
  ['non_renseigne', 'non_concerne', 'faible', 'moyen', 'fort'];

export const DEMARCHE_PCAET_VULNERABILITE_NIVEAU_LABELS: Record<
  DemarchePcaetVulnerabiliteNiveau,
  string
> = {
  non_renseigne: 'non renseigné',
  non_concerne: 'non concerné',
  faible: 'faible',
  moyen: 'moyen',
  fort: 'fort',
};

export const DEMARCHE_PCAET_VULNERABILITE_NIVEAU_VARIANTS: Record<
  DemarchePcaetVulnerabiliteNiveau,
  ColorVariant
> = {
  non_renseigne: 'grey',
  non_concerne: 'grey',
  faible: 'success',
  moyen: 'warning',
  fort: 'error',
};

export const defaultVulnerabiliteLigne = (
  domaineId: DemarchePcaetVulnerabiliteDomaineId,
  label?: string
): DemarchePcaetVulnerabiliteLigne => ({
  domaineId,
  ...(label !== undefined ? { label } : {}),
  diagMaintenant: 'non_renseigne',
  diag2050: 'non_renseigne',
  diag2100: 'non_renseigne',
  description2050: '',
  description2100: '',
});

export const defaultVulnerabiliteState =
  (): DemarchePcaetVulnerabiliteState => ({
    lignes: DEMARCHE_PCAET_VULNERABILITE_DOMAINES.map((d) =>
      defaultVulnerabiliteLigne(d.id)
    ),
  });
