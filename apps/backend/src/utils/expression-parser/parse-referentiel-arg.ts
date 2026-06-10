import * as semver from 'semver';
import {
  ReferentielId,
  referentielIdEnumSchema,
  referentielIdEnumValues,
} from '@tet/domain/referentiels';

export type ParsedReferentielArg = {
  referentielId: ReferentielId;
  version?: string;
};

const ALLOWED_IDS = referentielIdEnumValues.join(', ');

/**
 * Découpe l'argument `referentiel(...)` sur le premier `_` :
 * - avant = referentielId (validé via l'enum)
 * - après = version semver optionnelle
 *
 * Lève une erreur explicite si le référentiel est inconnu ou la version mal formée.
 */
export function parseReferentielArg(arg: string): ParsedReferentielArg {
  const underscoreIndex = arg.indexOf('_');

  if (underscoreIndex === -1) {
    const parsed = referentielIdEnumSchema.safeParse(arg);
    if (!parsed.success) {
      throw new Error(
        `Référentiel "${arg}" inconnu dans referentiel(${arg}). Référentiels autorisés : ${ALLOWED_IDS}.`
      );
    }
    return { referentielId: parsed.data };
  }

  const rawId = arg.slice(0, underscoreIndex);
  const version = arg.slice(underscoreIndex + 1);

  const parsedId = referentielIdEnumSchema.safeParse(rawId);
  if (!parsedId.success) {
    throw new Error(
      `Référentiel "${rawId}" inconnu dans referentiel(${arg}). Référentiels autorisés : ${ALLOWED_IDS}.`
    );
  }

  if (!version || !semver.valid(version)) {
    throw new Error(
      `Version "${version}" invalide dans referentiel(${arg}). La version doit être un semver valide (ex: 2.1.3).`
    );
  }

  return { referentielId: parsedId.data, version };
}

/**
 * Retourne true si le contexte courant correspond à l'argument parsé.
 *
 * Règles :
 * - La famille `te` inclut `te-test` (mais pas l'inverse)
 * - Si une version est précisée, versionCourante doit être >= versionMin (semver.gte)
 */
export function matchReferentiel(
  courant: { referentielId: ReferentielId; version?: string },
  parsed: ParsedReferentielArg
): boolean {
  const familyMatch =
    courant.referentielId === parsed.referentielId ||
    (parsed.referentielId === 'te' && courant.referentielId === 'te-test');

  if (!familyMatch) return false;

  if (parsed.version) {
    if (!courant.version) return false;
    return semver.gte(courant.version, parsed.version);
  }

  return true;
}
