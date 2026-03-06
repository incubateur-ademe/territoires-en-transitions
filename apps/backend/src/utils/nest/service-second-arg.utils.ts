import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '../database/transaction.utils';

export type ServiceSecondArg = {
  user: AuthenticatedUser;
  isUserTrusted?: boolean;
  tx?: Transaction;
};
