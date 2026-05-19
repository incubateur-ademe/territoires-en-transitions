import { test } from 'tests/main.fixture';

test.describe("Import d'un plan", () => {
  test(
    'réinitialise la valeur native du champ fichier après sélection, ' +
      'pour permettre de re-sélectionner un fichier du même nom après un échec',
    async ({ collectivites, importPlanPom }) => {
      await collectivites.addCollectiviteAndUser({
        userArgs: {
          autoLogin: true,
          isSupport: true,
          isSuperAdminRoleEnabled: true,
        },
      });

      await importPlanPom.goto();
      await importPlanPom.selectFile('plan-a-importer.xlsx');

      // Le fichier reste enregistré dans le formulaire (état react-hook-form)...
      await importPlanPom.expectFileRegistered('plan-a-importer.xlsx');
      // ...mais la valeur native de l'input est vidée, condition sans laquelle
      // re-sélectionner un fichier du même nom ne déclencherait aucun nouvel
      // évènement `change`.
      await importPlanPom.expectNativeInputCleared();
    }
  );
});
