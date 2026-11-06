import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { format } from 'date-fns';
import type { ColorVariant } from '@tet/design-tokens';
import { DossierLabellisationStatut, Etoile } from '@tet/domain/referentiels';
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
