import { isNewReferentiel, ReferentielId } from '@tet/domain/referentiels';

/** Préfixe affiché et saisi pour désigner le référentiel d'une mesure. */
export function getReferentielPrefix(referentielId: ReferentielId): string {
  return isNewReferentiel(referentielId) ? 'CR' : referentielId;
}

/** Libellé court d'une mesure : `cae 1.2.3 - Nom de la mesure`. */
export function formatMesureLabel({
  referentiel,
  identifiant,
  nom,
}: {
  referentiel: ReferentielId;
  identifiant: string;
  nom: string;
}): string {
  return `${getReferentielPrefix(referentiel)} ${identifiant} - ${nom}`;
}
