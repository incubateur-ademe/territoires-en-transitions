import {
  makeCollectiviteBibliothequeUrl,
  makeCollectiviteIndicateursListUrl,
  makeCollectiviteJournalUrl,
  makeCollectivitePlansActionsCreerUrl,
  makeCollectivitePlansActionsListUrl,
  makeCollectiviteTrajectoirelUrl,
} from '@/app/app/paths';
import type {
  DemarchePcaetStatut,
  DemarchePcaetStatutPublication,
  DemarchePcaetVoletId,
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

export type DemarchePcaetVoletModalKind = 'indicateur' | 'documents';

export type DemarchePcaetVoletConfig = {
  id: DemarchePcaetVoletId;
  label: string /** Icône RemixIcon représentant la thématique du volet. */;
  icon: string;
  href: (collectiviteId: number) => string;
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
    href: (collectiviteId) =>
      makeCollectiviteBibliothequeUrl({ collectiviteId }),
    modalKind: 'documents',
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

export const makePlansListUrl = (collectiviteId: number) =>
  makeCollectivitePlansActionsListUrl({ collectiviteId });

export const makeCreatePcaetPlanUrl = (collectiviteId: number) =>
  makeCollectivitePlansActionsCreerUrl({ collectiviteId });

export const makeJournalUrl = (collectiviteId: number) =>
  makeCollectiviteJournalUrl({ collectiviteId });
