import {When} from '@badeball/cypress-cucumber-preprocessor';

import {LocalSelectors} from './selectors';
import {clickOutside} from '../common/shared';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
});

/** FICHE ACTION */

When(/j'ouvre la section "([^"]+)"/, titre => {
  cy.get(`[data-test=section-${titre}]`).click();
});

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
    cy.get('[data-test=FicheActionCarte]').contains(titre).should('be.visible');
    cy.get('[data-test=FicheActionCarte]')
      .contains(pilote)
      .should('be.visible');
    cy.get('[data-test=FicheActionCarte]')
      .contains(statut)
      .should('be.visible');
  }
);

When(/je supprime la fiche/, () => {
  cy.get('[data-test=SupprimerFicheBouton]').click();
  cy.contains('Valider').click();
});

When(/je toggle la confidentialité de la fiche/, () => {
  cy.get('[data-test=FicheToggleConfidentialite]').click();
  cy.get('button[type=submit]').click();
});

When(/la carte "([^"]*)" est privée/, titre => {
  cy.get('[data-test=FicheCartePrivee]')
    .siblings('[data-test=FicheActionCarte]')
    .contains(titre)
    .should('be.visible');
});

When(/je ne peux pas cliquer sur la carte "([^"]*)"/, titre => {
  cy.get('[data-test=FicheActionCarte]')
    .contains(titre)
    .parents('[data-test=FicheActionCarte]')
    .should('have.css', 'pointer-events', 'none');
});

When(/toutes les cartes sont publiques/, () => {
  cy.get('[data-test=FicheCartePrivee]').should('not.exist');
});

When(/je rends publiques toutes les fiches d'un plan/, () => {
  cy.get('[data-test=BoutonToutesFichesPubliques]').click();
  cy.contains('Confirmer').click();
});

When(/je rends privées toutes les fiches d'un plan/, () => {
  cy.get('[data-test=BoutonToutesFichesPrivees]').click();
  cy.contains('Confirmer').click();
});

When(/je supprime une fiche "([^"]*)" dans l'arborescence/, titre => {
  cy.get('[data-test=SupprimerFicheBouton]').first().click({force: true});
  cy.contains('Valider').click();
});

When(/la fiche "([^"]*)" n'est plus présente/, titre => {
  cy.contains(titre).should('not.exist');
});

When("je navigue vers {string} du fil d'ariane de la fiche", axe => {
  cy.get('[data-test=fiche-header]').contains(axe).click();
});

/** PLAN D'ACTION */
When(/je crée le plan "([^"]*)" avec le type "([^"]*)"/, (titre, type) => {
  cy.get('[data-test=CreerPlan]').click();
  cy.get('[data-test=PlanNomInput]').clear().type(titre);
  cy.get(`[data-test=Type]`).click();
  cy.get(`[data-test=Type-options]`).contains(type).click();
  cy.get(`[data-test=Type]`).contains(type).should('be.visible');
  cy.get('button').contains('Valider').click();
});

When(/je renomme le plan en "([^"]*)"/, titre => {
  cy.get('[data-test=ModifierPlanBouton]').click();
  cy.get('[data-test=PlanNomInput]').clear().type(titre);
  cy.get('button').contains('Valider').click();
});

When(
  /le nom du plan d'action est changé en "([^"]*)" dans la navigation/,
  titre => {
    cy.get(`[data-test=SideNavigation]`).contains(titre).should('be.visible');
  }
);

When(/je veux supprimer le plan/, () => {
  cy.get('[data-test=SupprimerPlanBouton]').click();
});

When(/j'ajoute un nouveau titre/, () => {
  cy.get('[data-test=AjouterAxe]').click();
  // attends que le dernier axe ajouté (celui avec un titre vide) soit visible
  // autorise un timeout un peu plus long car le back peut être lent à répondre en CI
  cy.get('[data-test=Axe]').first().find('textarea').should('have.text', '');
});

When(/je le nomme "([^"]*)"/, titre => {
  // sélectionne le dernier axe ajouté
  cy.get('[data-test=Axe]')
    .first()
    .within(() => {
      cy.get('[data-test=TitreAxeInput]').type(
        '{selectall}{backspace}' + titre
      );
    });
  clickOutside();
});

When(/j'ajoute une fiche au plan d'action/, () => {
  cy.get('[data-test=PlanAction]')
    .find('button')
    .contains('Créer une fiche action')
    .click();
});

When(/je nomme la carte "([^"]*)"/, titre => {
  cy.wait(50);
  cy.get('[data-test=EditerFicheBouton]').first().click({force: true});
  cy.get('[data-test=FicheNomInput]').clear().type(`${titre}`);
  cy.get('[data-test=ModifierFicheModale]')
    .find('button')
    .contains('Valider')
    .click();
});

When(/je navigue vers la fiche "([^"]*)"/, titre => {
  cy.get('[data-test=FicheActionCarte]').contains(titre).click();
  cy.get('[data-test=FicheAction]').contains(titre).should('be.visible');
});

When(/j'ajoute une fiche à la page axe/, () => {
  cy.get('[data-test=PageAxe]')
    .find('button')
    .contains('Créer une fiche action')
    .click();
});

When('je navigue vers le plan {string}', titre => {
  cy.get('[data-test=SideNavigation]').contains(titre).click();
});

When(/je veux supprimer le dernier axe créé/, () => {
  cy.get('[data-test=SupprimerAxeBouton]').first().click({force: true});
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

When(/j'ouvre la modale ranger la fiche/, () => {
  cy.get('[data-test=BoutonRangerFiche]').click();
});

When(/j'enlève la fiche du plan/, () => {
  cy.get('[data-test=EnleverFichePlanBouton]').click({force: true});
});

When(
  /le plan "([^"]*)" est visible dans le tableau nouvel emplacement/,
  plan => {
    cy.get('[data-test=RangerFicheModale] #tab-1').click();
    cy.get('[data-test=RangerFicheModale] #tabpanel-1')
      .contains(plan)
      .should('be.visible');
  }
);

When(/le fil d'ariane de la fiche contient "([^"]*)"/, chemin => {
  cy.get('[data-test=fiche-header]').contains(chemin).should('exist');
});

When(/je clique sur l'axe "([^"]*)" du tableau nouvel emplacement/, axe => {
  cy.get('[data-test=RangerFicheModale] #tab-1').click();
  cy.get('[data-test=RangerFicheModale] #tabpanel-1').contains(axe).click();
});

When(/je valide cet emplacement/, () => {
  cy.contains('Valider ce nouvel emplacement').click();
});

When(
  /l'axe "([^"]*)" est visible dans les emplacements sélectionnés pour cette fiche/,
  axe => {
    cy.get('[data-test=RangerFicheModale] #tabpanel-0')
      .contains(axe)
      .should('be.visible');
  }
);

/** PAGE AXE ET FILTRES */

When(/j'ouvre "([^"]*)" dans la navigation latérale/, (section, axe) => {
  // ouvre la section correspondant au plan donné
  cy.get('[data-test=SideNav-section]')
    .contains(section)
    .parent()
    .parent()
    .within(() => {
      // le déplie
      cy.root().get('[data-test=SideNav-section-toggle-button]').click();
    });
});

When('je navigue vers {string}', axe => {
  cy.get('[data-test=SideNav-section-liens]').contains(axe).click();
});

When(/j'ouvre les filtres/, () => {
  cy.get('[data-test=FiltrerFiches]').contains('Filtrer').click();
});

When(
  /je filtre les fiches par "([^"]*)" du filtre "([^"]*)"/,
  (value, filtre) => {
    cy.get(`[data-test=filtre-${filtre}]`).click();
    cy.root().contains(value).click();
    clickOutside();
  }
);

When(/aucune fiche n'est présente/, () => {
  cy.root()
    .contains('Aucune fiche ne correspond à votre recherche')
    .should('be.visible');
});

When(/la fiche contenant "([^"]*)" est visible/, value => {
  cy.get('[data-test=FicheActionCarte]').contains(value).should('be.visible');
});

/** SYNTHESE */
When(/je filtre par "([^"]*)"/, value => {
  cy.get('[data-test=Filtres]').contains(value).click();
});

When(/"([^"]*)" fiches action s'affichent/, value => {
  cy.get('[data-test=NombreFichesAction]').contains(value).should('be.visible');
});

When(
  /un message demandant à l'utilisateur de sélectionner un filtre s'affiche/,
  value => {
    cy.get('[data-test=SelectionnerFiltre]').should('exist');
  }
);
