import {
  PersonnalisationReponse,
  PersonnalisationReponseValue,
  QuestionType,
} from '@tet/domain/collectivites';
import { roundTo } from '@tet/domain/utils';

export const transformReponseToWrite = (
  questionType: QuestionType,
  reponse?: PersonnalisationReponseValue
) => {
  if (reponse === undefined) {
    return null;
  }
  if (questionType === 'proportion') {
    return typeof reponse === 'number' ? reponse / 100 : null;
  }

  if (questionType === 'binaire') {
    if (reponse === 'oui' || reponse === true) return true;
    if (reponse === 'non' || reponse === false) return false;
    return null;
  }

  return reponse;
};

export const transformLoadedReponse = (
  row: PersonnalisationReponse
): PersonnalisationReponse => {
  const { questionType, reponse } = row;

  if (questionType === 'proportion') {
    const value =
      typeof reponse === 'number' ? roundTo(reponse * 100, 0) : null;
    return { ...row, reponse: value };
  }

  return row;
};
