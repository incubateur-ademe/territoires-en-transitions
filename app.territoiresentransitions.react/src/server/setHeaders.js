/** Doc MDN - Content Security Policy (CSP) - https://developer.mozilla.org/fr/docs/Web/HTTP/CSP */
/** Doc MDN - Strict-Transport-Security - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security#syntax */

const setHeaders = app => {
  // déduit l'URL de la connexion websocket à partir de l'URL du service Supabase
  const {host} = new URL(process.env.REACT_APP_SUPABASE_URL);
  const webSocketSupabaseKey = new URL(`ws://${host}`);

  // directives de la règle CSP par type de ressources
  const directives = {
    'default-src': 'self',
    'script-src':
      "'self' https://stats.data.gouv.fr https://client.crisp.chat https://settings.crisp.chat",
    'connect-src': `'self' ${process.env.REACT_APP_SUPABASE_URL} ${webSocketSupabaseKey} https://client.crisp.chat https://storage.crisp.chat wss://client.relay.crisp.chat wss://stream.relay.crisp.chat`,
    'img-src':
      "'self' data: https://dteci.ademe.fr https://client.crisp.chat https://image.crisp.chat https://storage.crisp.chat",
    'font-src': "'self' data: https://client.crisp.chat",
    'media-src': "'self' https://client.crisp.chat",
    'style-src': "'self' 'unsafe-inline' https://client.crisp.chat",
    'frame-src': "'self' https://game.crisp.chat",
    'frame-ancestors': "'none'",
  };
  // assemble les directives en un seul bloc de texte
  const ruleContent = Object.entries(directives)
    .map(([k, v]) => `${k} ${v}`)
    .join('; ');

  app.use((req, res, next) => {
    if (req.secure) {
      res.header(
        'Strict-Transport-Security',
        'max-age=31540000; includeSubDomains'
      ); // 1 année
    }
    res.header(
      'Content-Security-Policy-Report-Only', // enlever -Report-Only pour activer la sécurité
      ruleContent
    );
    next();
  });
};

module.exports = setHeaders;
