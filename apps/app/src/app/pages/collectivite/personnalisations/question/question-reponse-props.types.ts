import {
  PersonnalisationReponse,
  PersonnalisationReponseValue,
  QuestionWithChoices,
} from '@tet/domain/collectivites';

export type QuestionReponseProps = {
  question: QuestionWithChoices;
  reponse: PersonnalisationReponse | undefined;
  /** vrai quand la question est la 1ère de type proportion */
  hasProportionDescription: boolean;
  onChange: (reponse: PersonnalisationReponseValue) => void;
  canEdit: boolean;
};
