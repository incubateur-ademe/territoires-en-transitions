import {When} from '@badeball/cypress-cucumber-preprocessor';

import {LocalSelectors} from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors', {type: 'static'});
});

/** FICHE ACTION */

When(/j'ouvre la section "([^"]+)"/, titre => {
  cy.get(`[data-test=section-${titre}]`).click();
});

When(
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

When(/je navigue vers "([^"]*)" du fil d'ariane de la fiche/, axe => {
  cy.get('[data-test=FicheFilAriane]').contains(axe).click();
});

/** PLAN D'ACTION */
When(/je crée le plan "([^"]*)"/, titre => {
  cy.get('[data-test=CreerPlan]').click();
  cy.get('[data-test=PlanNomInput]').clear().type(titre);
  cy.get('button').contains('Valider').click();
});

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
  cy.get('body').click(10, 10);
});

When(/j'ajoute une fiche à "([^"]*)"/, titre => {
  // sélectionne l'axe qui contient le titre donné
  cy.get('[data-test=Axe]')
    .contains(titre)
    .within(() => {
      // le déplie
      cy.root()
        .parents('[data-test=Axe]')
        .find('[data-test=BoutonDeplierAxe]')
        .click();
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

When(/je reviens sur le plan d'action "([^"]*)"/, titre => {
  cy.get('[data-test=PlansActionNavigation]').contains(titre).click();
});

When(/je veux supprimer le dernier axe créé/, () => {
  cy.get('[data-test=SupprimerAxeBouton]').first().click({force: true});
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
  cy.get('[data-test=FicheFilAriane]').contains(chemin).should('exist');
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

/** PAGE AXE ET FILTRES */

When(
  /j'ouvre "([^"]*)" dans la navigation latérale et que je navigue vers "([^"]*)"/,
  (section, axe) => {
    // ouvre la section correspondant au plan donné
    cy.get('[data-test=SideNav-section]')
      .contains(section)
      .parent()
      .parent()
      .within(() => {
        // le déplie
        cy.root().get('[data-test=SideNav-section-toggle-button]').click();
      });
    // et navigue vers l'axe donné
    cy.get('[data-test=SideNav-section-liens]').contains(axe).click();
  }
);

When(/j'ouvre les filtres/, () => {
  cy.get('[data-test=FiltrerFiches]').contains('Filtrer').click();
});

When(
  /je filtre les fiches par "([^"]*)" du filtre "([^"]*)"/,
  (value, filtre) => {
    cy.get(`[data-test=filtre-${filtre}]`).click();
    cy.root().contains(value).click();
    cy.get('body').click(10, 10);
  }
);

When(/aucune fiche n'est présente/, () => {
  cy.root()
    .contains('Aucune fiche ne correspond à votre recherche')
    .should('be.visible');
});

When(/la fiche contenant "([^"]*)" est visible/, value => {
  cy.get('[data-test=ActionCarte]').contains(value).should('be.visible');
});
