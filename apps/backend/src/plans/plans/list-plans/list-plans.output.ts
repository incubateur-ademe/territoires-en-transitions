import { Plan } from '../get-plan/get-plan.output';

export type ListPlansOutput = {
  plans: Plan[];
  totalCount: number;
};
