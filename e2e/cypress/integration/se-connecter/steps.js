const fakeToken = 'header.payload.sign';
defineStep(
  "j'ouvre le site depuis un lien de réinitialisation du mot de passe",
  () =>
    cy.visit(
      `/#access_token=${fakeToken}&refresh_token=y&expires_in=z&token_type=bearer&type=recovery`
    )
);
