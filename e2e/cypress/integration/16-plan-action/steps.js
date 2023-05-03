import {defineStep} from '@badeball/cypress-cucumber-preprocessor';

import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
});

/** FICHE ACTION */

defineStep(/j'ouvre la section "([^"]+)"/, titre => {
  cy.get(`[data-test=section-${titre}]`).click();
});

defineStep(
  /je crée un tag "([^"]*)" avec le sélecteur de tag "([^"]*)"/,
  (tag, selecteur) => {
    cy.get(`[data-test=${selecteur}-input]`).type(
      '{selectall}{backspace}' + tag
    );
    cy.get(`[data-test=${selecteur}-creer-tag]`).click();
    cy.get('body').click(10, 10);
    cy.get(`[data-test=${selecteur}]`).contains(tag).should('be.visible');
  }
);

defineStep(
  /je sélectionne "([^"]*)" dans la liste déroulante "([^"]*)"/,
  (option, selecteur) => {
    cy.get(`[data-test=${selecteur}]`).click();
    cy.get(`[data-test=${selecteur}-options]`).contains(option).click();
    cy.get(`[data-test=${selecteur}]`).contains(option).should('be.visible');
  }
);

defineStep(
  /la carte de la fiche créée est présente et affiche le titre "([^"]*)", le pilote "([^"]*)" et le statut "([^"]*)"/,
  (titre, pilote, statut) => {
    cy.get('[data-test=ActionCarte]').contains(titre).should('be.visible');
    cy.get('[data-test=ActionCarte]').contains(pilote).should('be.visible');
    cy.get('[data-test=ActionCarte]').contains(statut).should('be.visible');
  }
);

defineStep(/je navigue sur la fiche "([^"]*)"/, titre => {
  cy.get('[data-test=ActionCarte]').contains(titre).click();
});

defineStep(/je supprime la fiche/, () => {
  cy.get('[data-test=SupprimerFicheBouton]').click();
  cy.contains('Confirmer').click();
});

defineStep(/la fiche "([^"]*)" n'est plus présente/, titre => {
  cy.contains(titre).should('not.exist');
});

/** PLAN D'ACTION */

defineStep(
  /le nom du plan d'action est changé en "([^"]*)" dans la navigation/,
  titre => {
    cy.get('[data-test=PlansActionNavigation]')
      .contains(titre)
      .should('be.visible');
  }
);

defineStep(/je veux supprimer le plan/, () => {
  cy.get('[data-test=SupprimerPlanBouton]').click();
});

defineStep(/j'ajoute un nouveau titre/, () => {
  cy.get('[data-test=AjouterAxe]').click();
  // attends que le dernier axe ajouté (celui avec un titre vide) soit visible
  // autorise un timeout un peu plus long car le back peut être lent à répondre en CI
  cy.get('[data-test=Axe]:nth(-1) textarea', {timeout: 10000}).should(
    'have.text',
    ''
  );
});

defineStep(/je le nomme "([^"]*)"/, titre => {
  // sélectionne le dernier axe ajouté
  cy.get('[data-test=Axe]')
    .last()
    .within(() => {
      cy.get('[data-test=EditerTitreAxeBouton]').last().click({force: true});
      cy.get('[data-test=TitreAxeInput]').type(
        '{selectall}{backspace}' + titre
      );
    });
  cy.get('body').click(10, 10);
});

defineStep(/j'ajoute une fiche à "([^"]*)"/, titre => {
  // sélectionne l'axe qui contient le titre donné
  cy.get('[data-test=Axe]')
    .contains(titre)
    .within(() => {
      // le déplie
      cy.root().click();
      // et demande la création de la fiche
      cy.root()
        .parents('[data-test=Axe]')
        .find('button')
        .contains('Créer une fiche action')
        .click();
    });
  // puis attend que la fiche soit visible
  cy.get('[data-test=FicheAction]').should('be.visible');
});

defineStep(/je reviens sur le plan d'action "([^"]*)"/, titre => {
  cy.get('[data-test=PlansActionNavigation]').contains(titre).click();
});

defineStep(/je veux supprimer le dernier axe/, () => {
  cy.get('[data-test=SupprimerAxeBouton]').last().click({force: true});
});

defineStep(/le texte "([^"]*)" est visible/, texte => {
  cy.contains(texte).should('be.visible');
});

defineStep(/je supprime l'axe depuis la modale/, () => {
  cy.get('[data-test=SupprimerFicheModale]').contains('Confirmer').click();
});

defineStep(/l'axe "([^"]*)" n'est plus visible/, axe => {
  cy.contains(axe).should('not.exist');
});

defineStep(/le plan n'est plus présent dans la navigation/, () => {
  cy.contains('Plan test').should('not.exist');
});

/** RANGER FICHE ACTION */

defineStep(/j'ouvre la modale "([^"]*)"/, bouton => {
  cy.contains(bouton).click();
});

defineStep(/j'enlève la fiche du plan/, () => {
  cy.get('[data-test=EnleverFichePlanBouton]').click({force: true});
});

defineStep(
  /le plan "([^"]*)" est visible dans le tableau nouvel emplacement/,
  plan => {
    cy.get('[data-test=TableauAxe]').contains(plan).should('be.visible');
  }
);

defineStep(/le fil d'ariane de la fiche contient "([^"]*)"/, chemin => {
  cy.get('[data-test=FicheFilAriane]').contains(chemin).should('exist');
});

defineStep(
  /je clique sur l'axe "([^"]*)" du tableau nouvel emplacement/,
  axe => {
    cy.get('[data-test=TableauAxe]').contains(axe).click();
  }
);

defineStep(/je valide cet emplacement/, () => {
  cy.contains('Valider cet emplacement').click();
});

defineStep(
  /l'axe "([^"]*)" est visible dans les emplacements sélectionnés pour cette fiche/,
  axe => {
    cy.get('[data-test=PlanChemin]').contains(axe).should('be.visible');
  }
);
