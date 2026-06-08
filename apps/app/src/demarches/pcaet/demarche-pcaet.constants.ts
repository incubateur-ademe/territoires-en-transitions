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
  DemarchePcaetContactOrganisme,
  DemarchePcaetContacts,
  DemarchePcaetStatut,
  DemarchePcaetStatutPublication,
  DemarchePcaetVoletId,
  DemarchePcaetVulnerabiliteDomaineId,
  DemarchePcaetVulnerabiliteLigne,
  DemarchePcaetVulnerabiliteNiveau,
  DemarchePcaetVulnerabiliteState,
} from './demarche-pcaet.types';

export const PCAET_PLAN_TYPE_LABEL = 'Plan Climat Air Énergie Territorial';

export const DEMARCHE_PCAET_STATUT_LABELS: Record<DemarchePcaetStatut, string> =
  {
    brouillon: 'Brouillon',
    en_elaboration: "En cours d'élaboration",
    pret_pour_depot: 'Prêt pour dépôt',
    soumis_ademe: 'Soumis à l’ADEME',
    en_verification: 'En vérification ADEME',
    valide: 'Validé',
    publie: 'Publié',
  };

export const DEMARCHE_PCAET_STATUT_PUBLICATION_LABELS: Record<
  DemarchePcaetStatutPublication,
  string
> = {
  brouillon: 'Brouillon',
  publie: 'Publiée',
};

export type DemarchePcaetVoletModalKind = 'indicateur' | 'documents' | 'page';

export type DemarchePcaetVoletConfig = {
  id: DemarchePcaetVoletId;
  label: string /** Icône RemixIcon représentant la thématique du volet. */;
  icon: string;
  href: (collectiviteId: number, demarcheId?: string) => string;
  /** Contenu de la modale ouverte depuis la page démarche PCAET. */
  modalKind: DemarchePcaetVoletModalKind;
  /** Identifiant référentiel CAE de l’indicateur principal du volet. */
  indicateurIdentifiantReferentiel?: string;
};

export const DEMARCHE_PCAET_VOLETS: DemarchePcaetVoletConfig[] = [
  {
    id: 'sequestration',
    label: 'Séquestration',
    icon: 'seedling-line',
    href: (collectiviteId) =>
      makeCollectiviteTrajectoirelUrl({ collectiviteId }),
    modalKind: 'indicateur',
    indicateurIdentifiantReferentiel: 'cae_63.',
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
    id: 'profil_energie_climat',
    label: 'Profil énergie CLIMAT',
    icon: 'fire-line',
    href: (collectiviteId) =>
      makeCollectiviteTrajectoirelUrl({ collectiviteId }),
    modalKind: 'indicateur',
    indicateurIdentifiantReferentiel: 'cae_1.a',
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
    id: 'vulnerabilite_territoire',
    label: 'Vulnérabilité du territoire',
    icon: 'map-2-line',
    href: (collectiviteId, demarcheId) =>
      makeCollectiviteDemarchePcaetVulnerabiliteUrl({
        collectiviteId,
        demarchePcaetId: demarcheId ?? '',
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

export type DemarchePcaetContactOption = { value: string; label: string };

export type DemarchePcaetContactOrganismeConfig = {
  id: DemarchePcaetContactOrganisme;
  label: string;
  options: DemarchePcaetContactOption[];
};

const DREAL_REGIONS: { code: string; label: string }[] = [
  { code: 'aura', label: 'Auvergne-Rhône-Alpes' },
  { code: 'bfc', label: 'Bourgogne-Franche-Comté' },
  { code: 'bre', label: 'Bretagne' },
  { code: 'cvl', label: 'Centre-Val de Loire' },
  { code: 'cor', label: 'Corse' },
  { code: 'ges', label: 'Grand Est' },
  { code: 'hdf', label: 'Hauts-de-France' },
  { code: 'idf', label: 'Île-de-France' },
  { code: 'nor', label: 'Normandie' },
  { code: 'naq', label: 'Nouvelle-Aquitaine' },
  { code: 'occ', label: 'Occitanie' },
  { code: 'pdl', label: 'Pays de la Loire' },
  { code: 'pac', label: "Provence-Alpes-Côte d'Azur" },
];

export const DEMARCHE_PCAET_CONTACTS: DemarchePcaetContactOrganismeConfig[] = [
  {
    id: 'ademe',
    label: appLabels.demarchePcaetContactAdeme,
    options: [
      { value: 'ademe-1', label: 'Camille Lefèvre' },
      { value: 'ademe-2', label: 'Julien Moreau' },
      { value: 'ademe-3', label: 'Sophie Garnier' },
      { value: 'ademe-4', label: 'Karim Benali' },
      { value: 'ademe-5', label: 'Élodie Rousseau' },
    ],
  },
  {
    id: 'dreal',
    label: appLabels.demarchePcaetContactDreal,
    options: DREAL_REGIONS.map((region) => ({
      value: `dreal-${region.code}`,
      label: `DREAL ${region.label}`,
    })),
  },
  {
    id: 'cr',
    label: appLabels.demarchePcaetContactCr,
    options: [
      { value: 'cr-1', label: 'Nathalie Garcia' },
      { value: 'cr-2', label: 'Thomas Leroy' },
      { value: 'cr-3', label: 'Awa Diallo' },
      { value: 'cr-4', label: 'Pierre Dubois' },
      { value: 'cr-5', label: 'Lucie Marchand' },
    ],
  },
];

export const defaultContacts = (): DemarchePcaetContacts => ({
  ademe: [],
  dreal: [],
  cr: [],
});

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
  ['non_concerne', 'faible', 'moyen', 'fort'];

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

export const defaultVulnerabiliteLigne = (
  domaineId: DemarchePcaetVulnerabiliteDomaineId
): DemarchePcaetVulnerabiliteLigne => ({
  domaineId,
  diagMaintenant: 'faible',
  diag2050: 'faible',
  diag2100: 'faible',
  description2050: '',
  description2100: '',
});

export const defaultVulnerabiliteState =
  (): DemarchePcaetVulnerabiliteState => ({
    lignes: DEMARCHE_PCAET_VULNERABILITE_DOMAINES.map((d) =>
      defaultVulnerabiliteLigne(d.id)
    ),
  });
