import { getPublicEnv, PUBLIC_ENV_GLOBAL } from '@tet/api/public-env';

/**
 * Publie la configuration runtime dans le HTML, à destination du navigateur.
 *
 * Rendu comme premier enfant de `<body>` : le script s'exécute pendant le
 * parsing du document, donc avant les bundles Next (chargés en fin de `<body>`)
 * et avant `instrumentation-client.ts`. Tout code applicatif peut donc
 * s'appuyer sur `getPublicEnv()` dès son premier accès.
 *
 * Le `nonce` est obligatoire : la CSP est en `strict-dynamic`, ce qui neutralise
 * `'self'` et ne laisse passer que les scripts portant le nonce de la requête
 * (posé par `proxy.ts` dans l'en-tête `x-nonce`).
 */
export function PublicEnvScript({ nonce }: { nonce?: string }) {
  // `<` est échappé pour qu'une valeur contenant `</script>` ne puisse pas
  // refermer la balise.
  const publicEnv = JSON.stringify(getPublicEnv()).replace(
    /</g,
    '\\u003c'
  );

  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `window.${PUBLIC_ENV_GLOBAL}=${publicEnv};`,
      }}
    />
  );
}
