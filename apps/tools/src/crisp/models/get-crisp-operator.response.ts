import { BaseCrispResponse } from '@/tools/crisp/models/base-crisp.response';

export type GetCrispOperatorResponse = BaseCrispResponse<CrispOperatorIndo>;

export interface CrispOperatorIndo {
  user_id: string;
  email: string;
  avatar: string;
  first_name: string;
  last_name: string;
  role: string;
  title: null;
  availability: string;
  has_token: boolean;
}
