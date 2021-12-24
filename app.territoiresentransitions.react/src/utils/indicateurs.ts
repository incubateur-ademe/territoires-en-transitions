import {ActionReferentiel} from 'generated/models/action_referentiel';
import {refToEmoji} from 'utils/refToEmoji';
import {ReferentielOfIndicateur} from 'types';
import {IndicateurDefinitionRead} from 'generated/dataLayer/indicateur_definition_read';

export const indicateurIdRegexp =
  '(?<ref>eci|cae|crte)_(?<number>[0-9]{1,3})(?<literal>.+)?';

export const isIndicateurRelatedToAction = (
  definition: IndicateurDefinitionRead,
  action: ActionReferentiel
): boolean => true; // TODO ! //definition.action_ids.includes(action.id);

export const inferIndicateurReferentielAndTitle = (
  definition: IndicateurDefinitionRead
) => {
  const indicateurId = definition.id;
  const id_groups = indicateurId.match(indicateurIdRegexp)?.groups;
  if (!id_groups) return indicateurId;
  const ref = id_groups['ref'] as ReferentielOfIndicateur;
  const nomenclature =
    ref === 'crte'
      ? id_groups['number'] + id_groups['literal']
      : `${Number(id_groups['number'])}${
          id_groups['literal'] ? '.' + id_groups['literal'] : ''
        }`;

  return `${refToEmoji[ref]} ${nomenclature} - ${definition.nom}`;
};
