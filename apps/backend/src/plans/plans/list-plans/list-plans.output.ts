import { Plan } from '@tet/domain/plans';

export type ListPlansOutput = {
  plans: Plan[];
  totalCount: number;
};
