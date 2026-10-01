import { actionDeReferenceTable } from '@tet/backend/shared/actions-de-reference/models/action-de-reference.table';
import { Collectivite } from '@tet/domain/collectivites';
import { ActionDeReference, ActionDeReferenceId } from '@tet/domain/shared';
import { inArray } from 'drizzle-orm';
import { Collectivites } from 'tests/collectivite/collectivites.fixture';
import { test } from 'tests/main.fixture';
import { databaseService } from 'tests/shared/database.service';
import { ActionsDeReferencePom } from './actions-de-reference.pom';

type NewActionDeReference = Omit<ActionDeReference, 'id'>;

type CollectiviteId = Collectivite['id'];

const toRunToken = (): string => crypto.randomUUID().slice(0, 8);

const withRunSuffix = (
  titre: string,
  runToken: string = toRunToken()
): string => `${titre} ${runToken}`;

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

const openUpdatePanelAsSuperAdmin = async ({
  collectivites,
  actionsDeReference,
  actionsDeReferencePom,
  action,
}: {
  readonly collectivites: Collectivites;
  readonly actionsDeReference: ActionsDeReference;
  readonly actionsDeReferencePom: ActionsDeReferencePom;
  readonly action: NewActionDeReference;
}): Promise<CollectiviteId> => {
  await actionsDeReference.add([action]);
  const { collectivite } = await collectivites.addCollectiviteAndUser({
    userArgs: {
      autoLogin: true,
      isSupport: true,
      isSuperAdminRoleEnabled: true,
    },
  });
  await actionsDeReferencePom.openAndWaitForTitle(collectivite.data.id);
  await actionsDeReferencePom.openUpdatePanel(action.titre);
  return collectivite.data.id;
};

export { openUpdatePanelAsSuperAdmin, toRunToken, withRunSuffix };

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
