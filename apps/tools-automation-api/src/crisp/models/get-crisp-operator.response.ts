import { BaseCrispResponse } from '@/tools-automation-api/crisp/models/base-crisp.response';

export interface GetCrispOperatorResponse
  extends BaseCrispResponse<CrispOperatorIndo> {}

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
