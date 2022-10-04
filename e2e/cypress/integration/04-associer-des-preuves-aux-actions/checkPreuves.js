export const noPreuvesComplementaires = (parent) =>
  parent.find('[data-test^=preuves] [data-test=item]').should('not.exist');

export const makeCheckPreuveRows = (dataTable) => () => {
  const rows = dataTable.rows();
  // vérifie le nombre de lignes
  cy.root().get('[data-test=item]').should('have.length', rows.length);

  // vérifie que chaque ligne du tableau donné correspond à l'affichage
  cy.wrap(rows).each(checkPreuveRow);
};

export const checkPreuveRow = ([titre, commentaire], index) => {
  cy.get(`[data-test=item]:nth(${index})`).within(() => {
    // vérifie le nom
    cy.get('[data-test=name]').should('contain.text', titre);
    // et le commentaire (ou son absence)
    if (commentaire) {
      cy.get('[data-test=comment]').should('have.text', commentaire);
    } else {
      cy.get('[data-test=comment]').should('not.exist');
    }
  });
};
export const checkPreuvesComplementaires = (parent, dataTable) => {
  parent
    .find('[data-test=complementaires]')
    .within(makeCheckPreuveRows(dataTable));
};

export const checkPreuvesReglementaires = (parent, dataTable) => {
  const rows = dataTable.rows();
  parent.find('[data-test=attendues]').within(() => {
    // vérifie le nombre de lignes
    cy.root().get('[data-test=preuve]').should('have.length', rows.length);

    // vérifie que chaque ligne du tableau donné correspond à l'affichage
    cy.wrap(rows).each(([nom, preuves], index) => {
      cy.get(`[data-test=preuve]:nth(${index})`).within(() => {
        // vérifie la description de la preuve règlementaire
        cy.get('[data-test=desc]').should('contain.text', nom);
        // vérifie les noms des liens/fichiers rattachés à la preuve attendue
        if (preuves) {
          const items = preuves.split(',');
          cy.wrap(items).each((item, idx) => {
            cy.get(`[data-test=item]:nth(${idx}) [data-test=name]`).should(
              'contain.text',
              item
            );
          });
        } else {
          cy.get('[data-test=item]').should('not.exist');
        }
      });
    });
  });
};
