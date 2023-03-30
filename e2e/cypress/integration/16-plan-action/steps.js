/// <reference types="Cypress" />

import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors');
});

/** FICHE ACTION */

When(/j'ouvre la section "([^"]+)"/, titre => {
  cy.get(`[data-test=section-${titre}]`).click();
});

When(
  /je crée un tag "([^"]*)" avec le sélecteur de tag "([^"]*)"/,
  (tag, selecteur) => {
    cy.get(`[data-test=${selecteur}-input]`).clear().type(tag);
    cy.get(`[data-test=${selecteur}-options]`).contains('Créer').click();
    cy.get('body').click(10, 10);
    cy.get(`[data-test=${selecteur}]`).contains(tag).should('be.visible');
  }
);

When(
  /je sélectionne "([^"]*)" dans la liste déroulante "([^"]*)"/,
  (option, selecteur) => {
    cy.get(`[data-test=${selecteur}]`).click();
    cy.get(`[data-test=${selecteur}-options]`).contains(option).click();
    cy.get(`[data-test=${selecteur}]`).contains(option).should('be.visible');
  }
);

When(
  /la carte de la fiche créée est présente et affiche le titre "([^"]*)", le pilote "([^"]*)" et le statut "([^"]*)"/,
  (titre, pilote, statut) => {
    cy.get('[data-test=ActionCarte]').contains(titre).should('be.visible');
    cy.get('[data-test=ActionCarte]').contains(pilote).should('be.visible');
    cy.get('[data-test=ActionCarte]').contains(statut).should('be.visible');
  }
);

When(/je navigue sur la fiche "([^"]*)"/, titre => {
  cy.get('[data-test=ActionCarte]').contains(titre).click();
});

When(/je supprime la fiche/, () => {
  cy.get('[data-test=SupprimerFicheBouton]').click();
  cy.contains('Confirmer').click();
});

When(/la fiche "([^"]*)" n'est plus présente/, titre => {
  cy.contains(titre).should('not.exist');
});

/** PLAN D'ACTION */

When(
  /le nom du plan d'action est changé en "([^"]*)" dans la navigation/,
  titre => {
    cy.get('[data-test=PlansActionNavigation]')
      .contains(titre)
      .should('be.visible');
  }
);

When(/je veux supprimer le plan/, () => {
  cy.get('[data-test=SupprimerPlanBouton]').click();
});

When(/j'ajoute un nouveau titre/, () => {
  cy.get('[data-test=AjouterAxe]').click();
});

When(/je le nomme "([^"]*)"/, titre => {
  cy.get('[data-test=EditerTitreAxeBouton]').last().click({force: true});
  cy.get('[data-test=TitreAxeInput]').last().clear().type(titre);
  cy.get('body').click(10, 10);
});

When(/j'ajoute une fiche à "([^"]*)"/, titre => {
  cy.get('[data-test=Axe]').contains(titre).click();
  cy.get('[data-test=Axe]').contains('Créer une fiche action').click();
});

When(/je reviens sur le plan d'action "([^"]*)"/, titre => {
  cy.get('[data-test=PlansActionNavigation]').contains(titre).click();
});

When(/je veux supprimer le dernier axe/, () => {
  cy.get('[data-test=SupprimerAxeBouton]').last().click({force: true});
});

When(/le texte "([^"]*)" est visible/, texte => {
  cy.contains(texte).should('be.visible');
});

When(/je supprime l'axe depuis la modale/, () => {
  cy.get('[data-test=SupprimerFicheModale]').contains('Confirmer').click();
});

When(/l'axe "([^"]*)" n'est plus visible/, axe => {
  cy.contains(axe).should('not.exist');
});

When(/le plan n'est plus présent dans la navigation/, () => {
  cy.contains('Plan test').should('not.exist');
});

/** RANGER FICHE ACTION */

When(/j'ouvre la modale "([^"]*)"/, bouton => {
  cy.contains(bouton).click();
});

When(/j'enlève la fiche du plan/, () => {
  cy.get('[data-test=EnleverFichePlanBouton]').click({force: true});
});

When(
  /le plan "([^"]*)" est visible dans le tableau nouvel emplacement/,
  plan => {
    cy.get('[data-test=TableauAxe]').contains(plan).should('be.visible');
  }
);

When(/le fil d'ariane de la fiche contient "([^"]*)"/, chemin => {
  cy.get('[data-test=FicheFilAriane]').contains(chemin).should('be.visible');
});

When(/je clique sur l'axe "([^"]*)" du tableau nouvel emplacement/, axe => {
  cy.get('[data-test=TableauAxe]').contains(axe).click();
});

When(/je valide cet emplacement/, () => {
  cy.contains('Valider cet emplacement').click();
});

When(
  /l'axe "([^"]*)" est visible dans les emplacements sélectionnés pour cette fiche/,
  axe => {
    cy.get('[data-test=PlanChemin]').contains(axe).should('be.visible');
  }
);
