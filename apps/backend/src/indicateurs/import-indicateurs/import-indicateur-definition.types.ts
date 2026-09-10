import type { ListPlatformDefinitionsRepository } from '../definitions/list-platform-definitions/list-platform-definitions.repository';
import type { PeriodiciteAvailabilityContext } from '../definitions/indicateur-periodicite-availability.service';

export type ImportIndicateurContext = PeriodiciteAvailabilityContext;
export type PlatformDefinitions = Awaited<
  ReturnType<ListPlatformDefinitionsRepository['listPlatformDefinitions']>
>;
export type UpsertIndicateurDefinitionsResult = Readonly<{
  definitions: PlatformDefinitions;
  updatedFormulaDefinitions: PlatformDefinitions;
  importedIndicateurIds: number[];
  reconciliationWorkItemsCount: number;
}>;
export type PeriodiciteChangeDefinition = Readonly<{
  id: number;
  identifiantReferentiel: string | null;
}>;
