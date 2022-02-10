/**
 * Intercepte les requêtes et fourni une réponse prédéfinie
 */

const LocalMocks = {
  'auth.resetPasswordForEmail': {
    ok: ['/auth/v*/recover', { statusCode: 200, body: {} }],
    error: ['/auth/v*/recover', { statusCode: 400, body: {} }],
  },
  'auth.updateUserPassword': {
    ok: ['PUT', '/auth/v*/user', { statusCode: 200, body: {} }],
    error: [
      '/auth/v*/user',
      {
        statusCode: 400,
        body: { error: 'some API error here' },
      },
    ],
  },
};

beforeEach(() => {
  cy.wrap(LocalMocks).as('LocalMocks');
});
