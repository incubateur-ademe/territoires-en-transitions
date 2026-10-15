import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import {
  canMutateReferentielData,
  collectiviteReferentielPreferenceIds,
  CollectiviteReferentielPreferences,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';

const MESURE_ID_REGEXP =
  /(^((cae?|cr|ca|c|eci?|ec|e)(\s*\d+)*|\d+)(\s|\.\d*|[\s\d.])*$)/;

/** Référentiels dans lesquels la collectivité peut créer de nouveaux liens. */
export function listWritableReferentielIds(
  referentiels: CollectiviteReferentielPreferences
): ReferentielId[] {
  return collectiviteReferentielPreferenceIds.filter((referentielId) =>
    canMutateReferentielData(referentiels[referentielId].mode)
  );
}

/**
 * Mesures proposées : celles des référentiels modifiables, plus celles déjà
 * liées (qui peuvent toujours être retirées, même si leur référentiel est
 * archivé ou en lecture seule).
 */
export function filterSelectableMesures(
  mesures: ActionListItem[],
  {
    writableReferentielIds,
    linkedMesureIds,
  }: { writableReferentielIds: ReferentielId[]; linkedMesureIds: string[] }
): ActionListItem[] {
  return mesures.filter(
    (mesure) =>
      writableReferentielIds.includes(mesure.referentiel) ||
      linkedMesureIds.includes(mesure.actionId)
  );
}

const startsWithIdentifiant = (
  mesureProperty: string,
  match: string,
  referentielId?: ReferentielId
) =>
  mesureProperty.startsWith(
    `${referentielId ? `${referentielId}_` : ''}${match
      .replace(/\D/g, '')
      .split('')
      .join('.')}`
  );

/**
 * Recherche par identifiant (`1.2`, `cae 1.2`, `cr 12`…). Renvoie `null`
 * quand la saisie n'est pas un identifiant, la recherche se fait alors sur le
 * nom de la mesure.
 */
export function searchMesuresByIdentifiant(
  mesures: ActionListItem[],
  search: string
): ActionListItem[] | null {
  const match = search.toLowerCase().match(MESURE_ID_REGEXP)?.[0];
  if (!match) {
    return null;
  }

  // Si le début de la recherche est un chiffre, on cherche par identifiant
  if (parseInt(match)) {
    return mesures.filter((mesure) =>
      startsWithIdentifiant(mesure.identifiant, match)
    );
  }
  // Sinon on cherche par actionId
  if (match.startsWith('cr')) {
    return mesures.filter((mesure) =>
      startsWithIdentifiant(mesure.actionId, match, 'te')
    );
  }
  if (match.startsWith('c')) {
    return mesures.filter((mesure) =>
      startsWithIdentifiant(mesure.actionId, match, 'cae')
    );
  }
  if (match.startsWith('e')) {
    return mesures.filter((mesure) =>
      startsWithIdentifiant(mesure.actionId, match, 'eci')
    );
  }
  return mesures;
}
