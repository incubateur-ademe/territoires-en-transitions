/** Doc MDN - Content Security Policy (CSP) - https://developer.mozilla.org/fr/docs/Web/HTTP/CSP */
/** Doc MDN - Strict-Transport-Security - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security#syntax */

const setHeaders = app => {
  const webSocketSupabaseKey = process.env.REACT_APP_SUPABASE_URL.replace(
    'http',
    'ws'
  );
  app.use((req, res, next) => {
    if (req.secure) {
      res.header(
        'Strict-Transport-Security',
        'max-age=31540000; includeSubDomains'
      ); // 1 année
    }
    res.header(
      'Content-Security-Policy-Report-Only',
      `default-src 'self'; script-src 'self' *.data.gouv.fr/ 'sha256-kO6puxapZiqpb3t6i8bI0xf0enmClp/hvy3/u7oanbw=' https://client.crisp.chat; connect-src 'self' ${process.env.REACT_APP_SUPABASE_URL} ${webSocketSupabaseKey}; img-src 'self' data: https://dteci.ademe.fr; font-src 'self' data: https://client.crisp.chat; style-src 'self' 'unsafe-inline' https://client.crisp.chat; frame-ancestors 'none'`
    );
    next();
  });
};

module.exports = setHeaders;
