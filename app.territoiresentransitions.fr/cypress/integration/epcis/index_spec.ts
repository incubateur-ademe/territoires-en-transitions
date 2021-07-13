import { saveDummyTokens } from "../../../src/api/authentication";

describe('index', () => {
    it('shows', () => {
        cy.visit('/epcis').then(() => {
            saveDummyTokens()
            cy.contains('Ajouter').click()
            cy.get('input').type('Alice')
            cy.contains('Valider').click()
            cy.contains('Alice')
        })
    })
})