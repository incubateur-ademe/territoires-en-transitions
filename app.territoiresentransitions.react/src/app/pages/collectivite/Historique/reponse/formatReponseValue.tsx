import {THistoriqueItem} from '../types';
import {toPercentString} from 'utils/score';

export const formatReponseValue = (
  value: THistoriqueItem['reponse'],
  type: THistoriqueItem['question_type']
) => {
  if (value === null) {
    return <i>Non renseigné</i>;
  }

  if (type === 'binaire') {
    return value ? 'Oui' : 'Non';
  }

  if (type === 'proportion') {
    return toPercentString(value as number);
  }
  return value;
};
