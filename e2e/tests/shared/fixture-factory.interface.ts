export abstract class FixtureFactory {
  abstract cleanupByCollectiviteId(collectiviteId: number): Promise<void>;
}
