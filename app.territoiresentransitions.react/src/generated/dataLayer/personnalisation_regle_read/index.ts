export type TPersonnalisationRegleRead = {
  action_id: string;
  type: TRegleType;
  formule: string;
  description: string;
};

type TRegleType = 'score' | 'desactivation' | 'reduction';
