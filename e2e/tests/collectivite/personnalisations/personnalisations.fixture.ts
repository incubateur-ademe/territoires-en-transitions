import { justificationTable } from '@tet/backend/collectivites/personnalisations/models/justification.table';
import { reponseBinaireTable } from '@tet/backend/collectivites/personnalisations/models/reponse-binaire.table';
import { reponseChoixTable } from '@tet/backend/collectivites/personnalisations/models/reponse-choix.table';
import { reponseProportionTable } from '@tet/backend/collectivites/personnalisations/models/reponse-proportion.table';
import {
  addTestThematiqueEtQuestions,
  linkThematiqueTestQuestionsToReferentielActions,
} from '@tet/backend/collectivites/personnalisations/personnalisations.test-fixture';
import { CollectiviteType } from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';
import { databaseService } from 'tests/shared/database.service';
import { FixtureFactory } from 'tests/shared/fixture-factory.interface';
import { testWithCollectivites } from '../collectivites.fixture';

class PersonnalisationsFactory extends FixtureFactory {
  // pas private : évite TS4094 sur le type exporté par mergeTests
  cleanups: Array<() => Promise<void>> = [];

  /**
   * Crée une thématique avec 3 questions (binaire, proportion, choix)
   * adaptées au type de la collectivité passée en paramètre.
   */
  async create(collectiviteType: CollectiviteType) {
    const { data, cleanup } = await addTestThematiqueEtQuestions(
      databaseService,
      collectiviteType
    );
    const { cleanup: cleanupActionLinks } =
      await linkThematiqueTestQuestionsToReferentielActions(databaseService, {
        questionBinaireId: data.questionBinaireId,
        questionProportionId: data.questionProportionId,
        questionChoixId: data.questionChoixId,
      });
    // supprime d'abord les liens mesure ↔ question (FK) puis thématique / questions
    this.cleanups.push(async () => {
      await cleanupActionLinks();
      await cleanup();
    });
    return data;
  }

  /**
   * Supprime les réponses et justifications d'une collectivité.
   * Appelé automatiquement via `collectivites.registerCleanupFunc`.
   */
  async cleanupByCollectiviteId(collectiviteId: number): Promise<void> {
    await databaseService.db
      .delete(reponseBinaireTable)
      .where(eq(reponseBinaireTable.collectiviteId, collectiviteId));
    await databaseService.db
      .delete(reponseProportionTable)
      .where(eq(reponseProportionTable.collectiviteId, collectiviteId));
    await databaseService.db
      .delete(reponseChoixTable)
      .where(eq(reponseChoixTable.collectiviteId, collectiviteId));
    await databaseService.db
      .delete(justificationTable)
      .where(eq(justificationTable.collectiviteId, collectiviteId));
  }

  /**
   * Supprime les thématiques et questions créées (données globales,
   * non liées à une collectivité). Appelé en fin de fixture.
   */
  async cleanupGlobal(): Promise<void> {
    for (const cleanup of this.cleanups) {
      await cleanup();
    }
    this.cleanups = [];
  }
}

export const testWithPersonnalisations = testWithCollectivites.extend<{
  personnalisations: PersonnalisationsFactory;
}>({
  personnalisations: async ({ collectivites }, use) => {
    const factory = new PersonnalisationsFactory();
    collectivites.registerCleanupFunc(factory);
    await use(factory);
  },
});
