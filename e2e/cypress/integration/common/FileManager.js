import { resolveSelector } from './steps';

Given(
  /la bibliothèque de la collectivité "(\d+)" est vide/,
  (collectivite_id) => {
    cy.task('pg_query', {
      query:
        'delete from storage.objects where bucket_id = (select bucket_id from collectivite_bucket where collectivite_id=$1)',
      values: [collectivite_id],
    });
  }
);

Given(
  /je transfère à partir du "([^"]*)" le fichier nommé "([^"]*)" et contenant "([^"]*)"/,
  function (elem, fileName, fileContent) {
    const parent = resolveSelector(this, elem);
    cy.get(parent.selector)
      .find('input[type=file]')
      .selectFile({
        contents: Cypress.Buffer.from(fileContent),
        fileName,
        lastModified: Date.now(),
      });
  }
);

Given(
  /je transfère à partir du "([^"]*)" le fichier nommé "([^"]*)" et d'un poids de "([^"]*)" Mo/,
  function (elem, fileName, fileSize) {
    const parent = resolveSelector(this, elem);
    cy.get(parent.selector)
      .find('input[type=file]')
      .selectFile({
        contents: Cypress.Buffer.alloc(parseInt(fileSize) * 1024 * 1024),
        fileName,
        lastModified: Date.now(),
      });
  }
);

Given(
  /la liste des fichiers transférés contient les entrées suivantes/,
  (dataTable) => {
    // dans la liste d'items affichée
    cy.get('[data-test=FileItems]').within(() =>
      // pour chaque ligne de donnée
      cy
        .wrap(dataTable.rows())
        .each(([fileName, status, size, message], index) => {
          // cible l'item correspondant à l'index de la ligne
          cy.get('[data-test*=file-]')
            .eq(index)
            .within(() => {
              // vérifie le statut du fichier
              cy.root().should('have.attr', 'data-test', `file-${status}`);

              // vérifie le nom
              if (status === 'completed') {
                cy.root().should('contain.text', fileName);
              } else {
                cy.get('[data-test=name]').should('contain.text', fileName);
              }

              // vérifie le message d'erreur
              if (message) {
                cy.get('[data-test=error]').should('contain.text', message);
              } else {
                cy.get('[data-test=error]').should('not.exist');
              }

              // vérifie la taille
              if (size) {
                cy.get('[data-test=size]').should('contain.text', size);
              } else {
                cy.get('[data-test=size]').should('not.exist');
              }
            });
        })
    );
  }
);

Given('tous les transferts sont terminés', () => {
  cy.get('[data-test*=file-running]', { timeout: 10000 }).should('not.exist');
});
