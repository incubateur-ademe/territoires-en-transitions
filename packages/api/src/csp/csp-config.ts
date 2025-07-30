import { NextRequest } from 'next/server';

export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'object-src'?: string[];
  'connect-src'?: string[];
  'base-uri'?: string[];
  'form-action'?: string[];
  'frame-ancestors'?: string[];
  'frame-src'?: string[];
  'block-all-mixed-content'?: boolean;
  'upgrade-insecure-requests'?: boolean;
}

export interface CSPConfig {
  directives: CSPDirectives;
  nonce?: string;
  isDevelopment?: boolean;
}

export interface AppCSPConfig {
  // Configuration spécifique à l'app
  additionalDirectives?: Partial<CSPDirectives>;
  // Fonction pour générer des directives dynamiques basées sur la requête
  dynamicDirectives?: (
    request: NextRequest,
    baseConfig: CSPConfig
  ) => Partial<CSPDirectives>;
}

// Configuration CSP de base commune à toutes les apps
export const getBaseCSPDirectives = ({
  isDevelopment,
  nonce,
}: {
  isDevelopment: boolean;
  nonce: string;
}): CSPDirectives => {
  // on autorise 'unsafe-eval' et 'unsafe-inline' en mode dev. pour que les pages
  // ne soient pas bloquées par le chargement des sources-map
  // Ref: https://github.com/vercel/next.js/issues/14221
  const scriptSrc = isDevelopment
    ? [`'self'`, `'unsafe-eval'`, `'unsafe-inline'`]
    : [`'self' 'nonce-${nonce}' 'strict-dynamic'`];

  return {
    'default-src': [`'self'`],
    'script-src': scriptSrc,
    // on autorise les styles `unsafe-inline` à cause notamment d'un problème avec le composant next/image
    // Ref: https://github.com/vercel/next.js/issues/45184
    'style-src': [`'self' 'unsafe-inline'`],
    'img-src': [`'self' blob: data:`],
    'font-src': [`'self'`],
    'object-src': [`'none'`],
    'connect-src': [`'self'`],
    'base-uri': [`'self'`],
    'form-action': [`'self'`],
    'frame-ancestors': [`'none'`],
    'frame-src': [`'none'`],
    'block-all-mixed-content': true,
    'upgrade-insecure-requests': !isDevelopment,
  };
};

// Sources communes pour les services tiers
export const COMMON_THIRD_PARTY_SOURCES = {
  posthog: {
    script: [`*.posthog.com`],
    connect: [`*.posthog.com`],
  },
  crisp: {
    script: [`client.crisp.chat`],
    style: [`client.crisp.chat`],
    img: [`https://image.crisp.chat`, `https://client.crisp.chat`],
    font: [`client.crisp.chat`],
    connect: [
      `client.crisp.chat`,
      `wss://client.relay.crisp.chat`,
      `wss://stream.relay.crisp.chat`,
    ],
  },
  axeptio: {
    script: [`*.axept.io`],
    img: [`https://axeptio.imgix.net`, `https://favicons.axept.io`],
    connect: [`*.axept.io`],
  },
  google: {
    script: [`*.googletagmanager.com`],
    img: [
      `https://ad.doubleclick.net`,
      `https://ade.googlesyndication.com`,
      `https://adservice.google.com`,
      `https://www.googletagmanager.com`,
    ],
    connect: [
      `www.googletagmanager.com`,
      `https://pagead2.googlesyndication.com`,
      `https://www.google.com`,
      `https://www.googleadservices.com`,
      `https://ad.doubleclick.net`,
    ],
    frame: [`https://td.doubleclick.net`, `https://www.googletagmanager.com`],
  },
  adform: {
    script: [`*.adform.net`],
    img: [`*.seadform.net`, `server.adform.net`],
    frame: [`*.adform.net`],
  },
  linkedin: {
    script: [`https://snap.licdn.com`],
    img: [`px.ads.linkedin.com`, `https://px4.ads.linkedin.com`],
    connect: [`https://px.ads.linkedin.com`],
  },
  youtube: {
    frame: [`youtube.com`, `www.youtube.com`],
  },
  dailymotion: {
    frame: [`dailymotion.com`, `www.dailymotion.com`],
  },
  strapi: {
    img: [
      process.env.NEXT_PUBLIC_STRAPI_URL?.replace(
        'strapiapp',
        'media.strapiapp'
      ) || '',
    ],
    connect: [process.env.NEXT_PUBLIC_STRAPI_URL ?? ''],
  },
} as const;

// Fonction utilitaire pour fusionner des tableaux de sources
export const mergeSources = (...sources: string[][]): string[] => {
  return sources
    .filter(Boolean)
    .flat()
    .filter((source, index, array) => array.indexOf(source) === index); // Supprime les doublons
};

// Fonction pour générer le header CSP complet
export const generateCSPHeader = (directives: CSPDirectives): string => {
  const headerParts: string[] = [];

  Object.entries(directives).forEach(([directive, values]) => {
    if (values === undefined) return;

    if (typeof values === 'boolean') {
      if (values) {
        headerParts.push(directive);
      }
    } else if (Array.isArray(values) && values.length > 0) {
      const directiveValue = values.join(' ');
      headerParts.push(`${directive} ${directiveValue}`);
    }
  });

  return headerParts.join('; ');
};

// Fonction principale pour générer la configuration CSP d'une app
export const generateAppCSP = (
  request: NextRequest,
  appConfig: AppCSPConfig = {}
): { cspHeader: string; nonce: string } => {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Configuration de base
  const baseConfig: CSPConfig = {
    directives: getBaseCSPDirectives({ isDevelopment, nonce }),
    nonce,
    isDevelopment,
  };

  // Fusion avec les directives additionnelles de l'app
  const directives = { ...baseConfig.directives };

  if (appConfig.additionalDirectives) {
    Object.entries(appConfig.additionalDirectives).forEach(
      ([directive, values]) => {
        if (values !== undefined) {
          const existingValues = directives[directive as keyof CSPDirectives];
          if (Array.isArray(existingValues) && Array.isArray(values)) {
            directives[directive as keyof CSPDirectives] = mergeSources(
              existingValues,
              values
            ) as any;
          } else {
            directives[directive as keyof CSPDirectives] = values as any;
          }
        }
      }
    );
  }

  // Application des directives dynamiques si définies
  if (appConfig.dynamicDirectives) {
    const dynamicDirectives = appConfig.dynamicDirectives(request, baseConfig);
    Object.entries(dynamicDirectives).forEach(([directive, values]) => {
      if (values !== undefined) {
        const existingValues = directives[directive as keyof CSPDirectives];
        if (Array.isArray(existingValues) && Array.isArray(values)) {
          directives[directive as keyof CSPDirectives] = mergeSources(
            existingValues,
            values
          ) as any;
        } else {
          directives[directive as keyof CSPDirectives] = values as any;
        }
      }
    });
  }

  const cspHeader = generateCSPHeader(directives);

  return {
    cspHeader: cspHeader.replace(/\s{2,}/g, ' ').trim(),
    nonce,
  };
};
