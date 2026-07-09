export default [
  'strapi::errors',
  // CSP élargie au CDN Strapi Cloud : les médias importés par `make cms-pull`
  // gardent leurs URLs absolues *.media.strapiapp.com — sans ces directives,
  // l'admin local bloque l'affichage des images (img-src 'self' par défaut).
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            '*.media.strapiapp.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            '*.media.strapiapp.com',
          ],
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
