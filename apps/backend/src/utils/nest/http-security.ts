import type { NestExpressApplication } from '@nestjs/platform-express';

export type HttpSecurityConfiguration = {
  APP_URL?: string;
  SITE_URL?: string;
  HTTP_ALLOWED_ORIGINS: string[];
  TRUST_PROXY_HOPS: number;
};

/** Configure before body parsers and raw Express routes (including tRPC). */
export function configureHttpSecurity(
  app: NestExpressApplication,
  config: HttpSecurityConfiguration,
  isProduction: boolean
): void {
  const origins = [config.APP_URL, config.SITE_URL]
    .filter((value): value is string => Boolean(value))
    .map((value) => new URL(value).origin);
  const trustedOrigins = [
    ...new Set([...origins, ...config.HTTP_ALLOWED_ORIGINS]),
  ];

  // Koyeb certifies the last forwarded address; deployments explicitly set 1.
  // Direct local servers leave this at 0 and ignore client-supplied XFF.
  app.set('trust proxy', config.TRUST_PROXY_HOPS);
  app.useSecurityHeaders({
    strictTransportSecurity: isProduction,
    contentSecurityPolicy: {
      directives: {
        upgradeInsecureRequests: isProduction ? true : null,
      },
    },
  });
  app.enableCsrfProtection({ trustedOrigins });
  app.enableCors({
    origin: trustedOrigins,
    credentials: true,
  });
}
