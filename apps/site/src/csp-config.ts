import { AppCSPConfig, COMMON_THIRD_PARTY_SOURCES } from '@/api';
import { NextRequest } from 'next/server';

export const siteCSPConfig: AppCSPConfig = {
  additionalDirectives: {
    'script-src': [
      ...COMMON_THIRD_PARTY_SOURCES.posthog.script,
      ...COMMON_THIRD_PARTY_SOURCES.axeptio.script,
      ...COMMON_THIRD_PARTY_SOURCES.crisp.script,
      ...COMMON_THIRD_PARTY_SOURCES.google.script,
      ...COMMON_THIRD_PARTY_SOURCES.adform.script,
      ...COMMON_THIRD_PARTY_SOURCES.linkedin.script,
    ],
    'style-src': [...COMMON_THIRD_PARTY_SOURCES.crisp.style],
    'img-src': [
      'ytimg.com',
      ...COMMON_THIRD_PARTY_SOURCES.google.img,
      ...COMMON_THIRD_PARTY_SOURCES.adform.img,
      ...COMMON_THIRD_PARTY_SOURCES.axeptio.img,
      ...COMMON_THIRD_PARTY_SOURCES.crisp.img,
      ...COMMON_THIRD_PARTY_SOURCES.linkedin.img,
      ...COMMON_THIRD_PARTY_SOURCES.strapi.img,
    ],
    'font-src': [...COMMON_THIRD_PARTY_SOURCES.crisp.font],
    'connect-src': [
      ...COMMON_THIRD_PARTY_SOURCES.posthog.connect,
      ...COMMON_THIRD_PARTY_SOURCES.axeptio.connect,
      ...COMMON_THIRD_PARTY_SOURCES.crisp.connect,
      ...COMMON_THIRD_PARTY_SOURCES.google.connect,
      ...COMMON_THIRD_PARTY_SOURCES.linkedin.connect,
      ...COMMON_THIRD_PARTY_SOURCES.strapi.connect,
    ],
    'frame-src': [
      ...COMMON_THIRD_PARTY_SOURCES.youtube.frame,
      ...COMMON_THIRD_PARTY_SOURCES.dailymotion.frame,
      ...COMMON_THIRD_PARTY_SOURCES.adform.frame,
      ...COMMON_THIRD_PARTY_SOURCES.google.frame,
    ],
  },
  dynamicDirectives: (request: NextRequest) => {
    return {
      'connect-src': [`ws://${request.nextUrl.host}`],
    };
  },
};
