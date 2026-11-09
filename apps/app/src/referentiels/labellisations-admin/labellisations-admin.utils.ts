import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { format } from 'date-fns';
import type { ColorVariant } from '@tet/design-tokens';
import {
  DossierLabellisationStatut,
  dossierLabellisationStatutValues,
  Etoile,
  SujetDemande,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import { numLabels } from '../labellisations/numLabels';

export const formatDate = (date: string | null): string | null =>
  date ? getTextFormattedDate({ date, shortMonth: true }) : null;

export const formatShortDate = (date: string | null): string | null =>
  date ? format(new Date(date), 'dd/MM/yyyy') : null;

/** « deuxième étoile », comme dans le parcours de demande d'audit. */
export const formatEtoile = (etoiles: string | number): string =>
  appLabels.demarrerAuditEtoileOption({
    etoileLabel: numLabels[Number(etoiles) as Etoile],
  });

/** Demande envoyée sans auditeur : le programme TETE doit en attribuer un. */
export const isAuditeurAAttribuer = ({
  statut,
  auditeurs,
}: {
  statut: DossierLabellisationStatut;
  auditeurs: unknown[];
}): boolean => statut === 'demande_envoyee' && auditeurs.length === 0;

/**
 * Les dossiers qui attendent une action du programme TETE ressortent :
 * demande envoyée sans auditeur, 1ère étoile à valider, audit validé à acter.
 */
export const isActionRequired = (dossier: {
  statut: DossierLabellisationStatut;
  auditeurs: unknown[];
}): boolean =>
  isAuditeurAAttribuer(dossier) ||
  dossier.statut === 'premiere_etoile_a_valider' ||
  dossier.statut === 'audit_valide';

export const statutBadgeVariant = (dossier: {
  statut: DossierLabellisationStatut;
  auditeurs: unknown[];
}): ColorVariant =>
  isActionRequired(dossier)
    ? 'warning'
    : dossier.statut === 'clos'
    ? 'grey'
    : 'info';

/** Colonnes de date triables : la clé de tri est le champ du dossier. */
const dateSortValues = [
  'envoyeeLe',
  'auditAttribueLe',
  'dateFin',
  'labellisationObtenueLe',
] as const;
type DateSort = (typeof dateSortValues)[number];
export const sortValues = [...dateSortValues, 'sujet', 'statut'] as const;
export type DossiersSort = (typeof sortValues)[number];

type DossierFiltrable = Record<DateSort, string | null> & {
  sujet: SujetDemande | null;
  statut: DossierLabellisationStatut;
};

/**
 * Filtres et tri des colonnes, appliqués dans le navigateur : la liste n'est
 * pas paginée. Sujets et statuts se trient dans l'ordre de leur enum (le cycle
 * de vie pour les statuts) ; une valeur absente va toujours en fin de liste.
 */
export const filterAndSortDossiers = <T extends DossierFiltrable>(
  dossiers: T[],
  {
    sujets,
    statuts,
    sort,
    direction,
  }: {
    sujets: readonly SujetDemande[];
    statuts: readonly DossierLabellisationStatut[];
    sort: DossiersSort | null;
    direction: 'asc' | 'desc';
  }
): T[] => {
  const filtered = dossiers.filter(
    (d) =>
      (sujets.length === 0 || (d.sujet !== null && sujets.includes(d.sujet))) &&
      (statuts.length === 0 || statuts.includes(d.statut))
  );
  if (!sort) {
    return filtered;
  }
  const rank = (d: T): number | string | null =>
    sort === 'statut'
      ? dossierLabellisationStatutValues.indexOf(d.statut)
      : sort === 'sujet'
      ? d.sujet === null
        ? null
        : Object.values(SujetDemandeEnum).indexOf(d.sujet)
      : d[sort];
  const sign = direction === 'asc' ? 1 : -1;
  return filtered.toSorted((a, b) => {
    const [ra, rb] = [rank(a), rank(b)];
    if (ra === rb) return 0;
    if (ra === null) return 1;
    if (rb === null) return -1;
    return (ra < rb ? -1 : 1) * sign;
  });
};
