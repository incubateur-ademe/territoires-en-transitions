import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { PersonnalisationPom } from './personnalisation.pom';

test.describe('Page Personnalisation (Paramètres > Ma collectivité)', () => {
  test('affiche les thématiques de personnalisation', async ({
    collectivites,
    personnalisations,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    await personnalisations.create(collectivite.data.type);

    const pom = new PersonnalisationPom(page);
    await pom.goto(collectivite.data.id);

    await pom.expectThematiquesVisible();
    await expect(pom.filtrerButton).toBeVisible();
  });

  test('ouvre une thématique et affiche ses questions', async ({
    collectivites,
    personnalisations,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const persoData = await personnalisations.create(collectivite.data.type);

    const pom = new PersonnalisationPom(page);
    await pom.goto(collectivite.data.id);

    await pom.openThematique(persoData.thematiqueNom);
    await pom.expectQuestionsVisible();
    await expect(pom.filtrerButton).toBeVisible();
    await pom.expectQuestionVisible(persoData.questionBinaireFormulation);
    await pom.expectQuestionVisible(persoData.questionProportionFormulation);
    await pom.expectQuestionVisible(persoData.questionChoixFormulation);
  });

  test('met à jour le compteur de réponses au fur et à mesure du remplissage', async ({
    collectivites,
    personnalisations,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const persoData = await personnalisations.create(collectivite.data.type);

    const pom = new PersonnalisationPom(page);
    await pom.goto(collectivite.data.id);

    // vérifie le badge initial : aucune réponse fournie
    await pom.expectThematiqueBadge(persoData.thematiqueNom, 'Incomplet 0/3');

    await pom.openThematique(persoData.thematiqueNom);
    await pom.expectQuestionsVisible();

    // répond à la question proportion et contrôle la mise à jour du badge
    await pom.repondreQuestionProportion(persoData.questionProportionId, 50);
    await pom.expectThematiqueBadge(persoData.thematiqueNom, 'Incomplet 1/3');

    // répond à la question binaire et contrôle la mise à jour du badge
    await pom.repondreQuestionBinaire(persoData.questionBinaireId, 'Oui');
    await pom.expectThematiqueBadge(persoData.thematiqueNom, 'Incomplet 2/3');

    // répond à la question choix et contrôle la mise à jour du badge
    await pom.repondreQuestionChoix(
      persoData.questionChoixId,
      persoData.choixFormulation
    );

    // vérifie que le badge passe à "Complété" une fois toutes les réponses enregistrées
    await expect(
      pom.thematiquesHeadings.filter({ hasText: persoData.thematiqueNom })
    ).toContainText('Complet 3/3');
  });
});
