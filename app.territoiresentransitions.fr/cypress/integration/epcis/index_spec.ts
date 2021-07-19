import { saveDummyTokens } from "../../../src/api/authentication";

describe('index', () => {
    it('shows', () => {
        cy.fixture('epcis/all.json').then((json) => {
            // Stub the call to list all EPCIs
            cy.intercept('GET', '/v2/epci/all', [json[1]]).as('getEPCIs')

            // Stub the call to create a new EPCI
            cy.intercept('POST', '/v2/epci', json[0]).as('createEPCI')
        })

        cy.fixture('utilisateur_droits/dummy.json').then((json) => {
            // Stub dummy user access
            cy.intercept('GET', '/v2/utilisateur_droits/*', [json])
        })

        cy.visit('/epcis').then(() => {
            saveDummyTokens()
            cy.contains('Ajouter').click()
            cy.get('input').type('Alice')
            cy.contains('Valider').click()
            cy.contains('Alice')
        })
    })
})