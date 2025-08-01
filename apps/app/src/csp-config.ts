import { AppCSPConfig, COMMON_THIRD_PARTY_SOURCES } from '@/api';
import { NextRequest } from 'next/server';

export const appCSPConfig: AppCSPConfig = {
  additionalDirectives: {
    'script-src': [
      ...COMMON_THIRD_PARTY_SOURCES.posthog.script,
      ...COMMON_THIRD_PARTY_SOURCES.crisp.script,
      // Ajoutez ici d'autres scripts tiers si besoin (ex: Stonly)
    ],
    'style-src': [...COMMON_THIRD_PARTY_SOURCES.crisp.style],
    'img-src': [
      ...COMMON_THIRD_PARTY_SOURCES.crisp.img,
      // Ajoutez ici d'autres images tiers si besoin
    ],
    'font-src': [...COMMON_THIRD_PARTY_SOURCES.crisp.font],
    'connect-src': [
      ...COMMON_THIRD_PARTY_SOURCES.posthog.connect,
      ...COMMON_THIRD_PARTY_SOURCES.crisp.connect,
      // Ajoutez ici d'autres connect-src tiers si besoin
    ],
    // Ajoutez d'autres directives si besoin
  },
  dynamicDirectives: (request: NextRequest) => {
    return {
      'connect-src': [`ws://${request.nextUrl.host}`],
    };
  },
};
