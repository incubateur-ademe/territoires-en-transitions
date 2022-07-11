import {ReferentielOfIndicateur} from 'types/litterals';
import {IndicateurDefinitionRead} from 'generated/dataLayer/indicateur_definition_read';

export const indicateurIdRegexp =
  '(?<ref>eci|cae|crte)_(?<number>[0-9]{1,3})(?<literal>.+)?';

export const indicateurIdentifiantRegexp =
  '(?<number>[0-9]{1,3})(?<literal>.+)?';

export const inferIndicateurTitle = (
  definition: IndicateurDefinitionRead,
  withReferentielPrefix = false
) => {
  const indicateurId = definition.id;
  const id_groups = indicateurId.match(indicateurIdRegexp)?.groups;
  if (!id_groups) return indicateurId;
  const ref = id_groups['ref'] as ReferentielOfIndicateur;
  return `${withReferentielPrefix ? ref.toUpperCase() + ' ' : ''}${
    definition.identifiant
  } - ${definition.nom}`;
};

export const sortIndicateurDefinitionsByIdentifiant = (
  definitions: IndicateurDefinitionRead[]
): IndicateurDefinitionRead[] =>
  definitions.sort((def_a, def_b) => {
    const identifiant_a = def_a.identifiant;
    const identifiant_b = def_b.identifiant;
    const a_groups = identifiant_a.match(indicateurIdentifiantRegexp)?.groups;
    const b_groups = identifiant_b.match(indicateurIdentifiantRegexp)?.groups;
    if (!a_groups || !b_groups)
      return identifiant_a.localeCompare(identifiant_b);
    const a_number = Number(a_groups['number']);
    const b_number = Number(b_groups['number']);

    if (a_number !== b_number) {
      return a_number > b_number ? 1 : -1;
    }

    return (a_groups['literal'] ?? '').localeCompare(b_groups['literal'] ?? '');
  });
