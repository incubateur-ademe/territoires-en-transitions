import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import {ActionReferentiel} from 'generated/models/action_referentiel';
import {refToEmoji} from 'utils/refToEmoji';
import {ReferentielOfIndicateur} from 'types';

export const indicateurIdRegexp =
  '(?<ref>eci|cae|crte)_(?<number>[0-9]{1,3})(?<literal>.+)?';

export const isIndicateurRelatedToAction = (
  indicateur: IndicateurReferentiel,
  action: ActionReferentiel
): boolean => indicateur.action_ids.includes(action.id);

export const inferIndicateurReferentielAndTitle = (
  indicateur: IndicateurReferentiel
) => {
  const indicateurId = indicateur.id;
  const id_groups = indicateurId.match(indicateurIdRegexp)?.groups;
  if (!id_groups) return indicateurId;
  const ref = id_groups['ref'] as ReferentielOfIndicateur;
  const nomenclature =
    ref === 'crte'
      ? id_groups['number'] + id_groups['literal']
      : `${Number(id_groups['number'])}${
          id_groups['literal'] ? '.' + id_groups['literal'] : ''
        }`;

  return `${refToEmoji[ref]} ${nomenclature} - ${indicateur.nom}`;
};
