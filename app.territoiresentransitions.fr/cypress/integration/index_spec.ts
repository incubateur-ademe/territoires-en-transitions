describe('index', () => {
    it('shows', () => {
        cy.visit('/').then(() => {
            cy.document().toMatchImageSnapshot()
        })
    })
})