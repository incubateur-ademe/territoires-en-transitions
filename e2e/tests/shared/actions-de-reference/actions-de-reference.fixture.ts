import { actionDeReferenceTable } from '@tet/backend/shared/actions-de-reference/models/action-de-reference.table';
import { ActionDeReference, ActionDeReferenceId } from '@tet/domain/shared';
import { inArray } from 'drizzle-orm';
import { test } from 'tests/main.fixture';
import { databaseService } from 'tests/shared/database.service';
import { ActionsDeReferencePom } from './actions-de-reference.pom';

type NewActionDeReference = Omit<ActionDeReference, 'id'>;

const withRunSuffix = (titre: string): string =>
  `${titre} ${crypto.randomUUID().slice(0, 8)}`;

class ActionsDeReferenceFactory {
  private addedActionIds: readonly ActionDeReferenceId[] = [];
  private removedActions: readonly ActionDeReference[] = [];

  add = async (
    actions: readonly [NewActionDeReference, ...NewActionDeReference[]]
  ): Promise<ActionDeReference[]> => {
    const addedActions = await databaseService.db
      .insert(actionDeReferenceTable)
      .values([...actions])
      .returning();
    this.addedActionIds = [
      ...this.addedActionIds,
      ...addedActions.map((action) => action.id),
    ];
    return addedActions;
  };

  removeAll = async (): Promise<void> => {
    const removedActions = await databaseService.db
      .delete(actionDeReferenceTable)
      .returning();
    this.removedActions = [...this.removedActions, ...removedActions];
  };

  restore = async (): Promise<void> => {
    if (this.addedActionIds.length > 0) {
      await databaseService.db
        .delete(actionDeReferenceTable)
        .where(inArray(actionDeReferenceTable.id, [...this.addedActionIds]));
    }
    const actionsToRestore = this.removedActions.filter(
      (action) => !this.addedActionIds.includes(action.id)
    );
    if (actionsToRestore.length > 0) {
      await databaseService.db
        .insert(actionDeReferenceTable)
        .overridingSystemValue()
        .values(actionsToRestore);
    }
  };
}

export type ActionsDeReference = Omit<ActionsDeReferenceFactory, 'restore'>;

export { withRunSuffix };

export const testWithActionsDeReference = test.extend<{
  actionsDeReference: ActionsDeReference;
  actionsDeReferencePom: ActionsDeReferencePom;
}>({
  actionsDeReference: async ({}, use) => {
    const { add, removeAll, restore } = new ActionsDeReferenceFactory();
    await use({ add, removeAll });
    await restore();
  },
  actionsDeReferencePom: async ({ page }, use) => {
    await use(new ActionsDeReferencePom(page));
  },
});
