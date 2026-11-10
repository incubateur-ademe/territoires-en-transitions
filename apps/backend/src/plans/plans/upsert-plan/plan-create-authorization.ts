import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';

type AuthorizationContext = { user: AuthenticatedUser; tx: Transaction };
type PlanCreationScope = {
  id?: number;
  collectiviteId: number;
  typeId?: number | null;
};

/** Les parcours métier délivrent cette autorisation après leurs propres contrôles. */
export abstract class PlanCreateAuthorization {
  protected constructor(
    private readonly userId: string,
    private readonly collectiviteId: number,
    public readonly typeId: number,
    private readonly tx: Transaction
  ) {}

  matches(
    plan: PlanCreationScope,
    { user, tx }: AuthorizationContext
  ): boolean {
    return (
      plan.id === undefined &&
      plan.collectiviteId === this.collectiviteId &&
      plan.typeId === this.typeId &&
      user.id === this.userId &&
      tx === this.tx
    );
  }
}
