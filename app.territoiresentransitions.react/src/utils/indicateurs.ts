import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import {ActionReferentiel} from 'generated/models/action_referentiel';
import {refToEmoji} from 'utils/refToEmoji';

export const indicateurIdRegexp =
  '(?<ref>eci|cae)-(?<number>[0-9]{1,3})(?<literal>.+)?';

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
  const ref = id_groups['ref'] as 'eci' | 'cae';

  return `${refToEmoji[ref]} ${Number(id_groups['number'])}${
    id_groups['literal'] ? '.' + id_groups['literal'] : ''
  } - ${indicateur.nom}`;
};
