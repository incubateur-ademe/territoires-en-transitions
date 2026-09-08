import { LEVIER_SECTEURS, levierEnumValues } from '@tet/domain/shared';
import { groupBy } from 'es-toolkit';
import {
  LEVIER_DEFINITIONS,
  LEVIER_DISAMBIGUATIONS,
} from './levier-definitions';

const leviersBySecteur = groupBy(
  [...levierEnumValues],
  (levier) => LEVIER_SECTEURS[levier]
);

const secteurSections = Object.entries(leviersBySecteur).map(
  ([secteur, leviers]) =>
    [
      `## ${secteur}`,
      ...leviers.map((levier) => `- ${levier} — ${LEVIER_DEFINITIONS[levier]}`),
    ].join('\n')
);

export const LEVIERS_TEXT = [
  ...secteurSections,
  '## Distinctions entre leviers proches',
  ...LEVIER_DISAMBIGUATIONS.map((rule) => `- ${rule}`),
].join('\n\n');
