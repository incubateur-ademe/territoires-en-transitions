import { AppCSPConfig, COMMON_THIRD_PARTY_SOURCES } from '@/api';
import { NextRequest } from 'next/server';

export const panierCSPConfig: AppCSPConfig = {
  additionalDirectives: {
    'script-src': [
      ...COMMON_THIRD_PARTY_SOURCES.posthog.script,
      ...COMMON_THIRD_PARTY_SOURCES.axeptio.script,
      ...COMMON_THIRD_PARTY_SOURCES.crisp.script,
    ],
    'style-src': [...COMMON_THIRD_PARTY_SOURCES.crisp.style],
    'img-src': [
      ...COMMON_THIRD_PARTY_SOURCES.axeptio.img,
      ...COMMON_THIRD_PARTY_SOURCES.crisp.img,
    ],
    'font-src': [...COMMON_THIRD_PARTY_SOURCES.crisp.font],
    'connect-src': [
      ...COMMON_THIRD_PARTY_SOURCES.posthog.connect,
      ...COMMON_THIRD_PARTY_SOURCES.axeptio.connect,
      ...COMMON_THIRD_PARTY_SOURCES.crisp.connect,
    ],
  },
  dynamicDirectives: (request: NextRequest) => {
    return {
      'connect-src': [`ws://${request.nextUrl.host}`, `ws://127.0.0.1:54321`],
    };
  },
};
