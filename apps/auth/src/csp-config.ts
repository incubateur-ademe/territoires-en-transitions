import { AppCSPConfig, COMMON_THIRD_PARTY_SOURCES, getRootDomain } from '@/api';
import { NextRequest } from 'next/server';

export const authCSPConfig: AppCSPConfig = {
  additionalDirectives: {
    'script-src': [...COMMON_THIRD_PARTY_SOURCES.posthog.script],
  },
  dynamicDirectives: (request: NextRequest) => {
    const url = request.nextUrl;
    url.hostname = request.headers.get('host') ?? url.hostname;

    return {
      'connect-src': [
        `*.${getRootDomain(url.hostname)}`,
        process.env.NEXT_PUBLIC_BACKEND_URL || '',
        (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
          .replace('https://', '')
          .replace('http://', ''),
      ],
    };
  },
};
