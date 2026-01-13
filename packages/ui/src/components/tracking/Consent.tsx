import { JSX } from 'react';

declare global {
  interface Window {
    axeptioSettings: { clientId: string; userCookiesDomain: string };
    _axcb: { push: (callback: (sdk: unknown) => void) => void };
  }
}

/**
 * Une partie des props du composant Script de Next.
 */
export type ScriptLikeProps = {
  src: string;
  onLoad: () => void;
};

/**
 * Renvoi les vars d'env. pour le tracking depuis un module next js
 */
export const getNextConsentEnvId = (): string => {
  const id = process.env.NEXT_PUBLIC_AXEPTIO_ID;

  const is_dev = process.env.NODE_ENV === 'development';
  if (!id) {
    if (is_dev) {
      console.warn(
        `L'acceptation des cookies n'est pas configurée, la variable d'env Axeptio est manquante.`
      );
      return '';
    }
    throw `La variable NEXT_PUBLIC_AXEPTIO_ID n'est pas définie`;
  }

  return id;
};

/**
 * Permet de demander le consentement du dépôt de cookies pour le tracking.
 *
 * @param onConsentSave Le callback, appelé quant le consentement est enregistré
 * @param script Permet d'injecter le composant Script de next
 * @constructor
 */
export function Consent({
  onConsentSave,
  onCookiesComplete,
  script,
  consentId,
}: {
  onConsentSave?: () => void;
  onCookiesComplete?: (choices: Record<string, boolean | undefined>) => void;
  script: (props: ScriptLikeProps) => JSX.Element;
  consentId: string;
}) {
  if (typeof window !== 'undefined') {
    window.axeptioSettings = {
      clientId: consentId,
      userCookiesDomain: 'territoiresentransitions.fr',
    };
  }

  return (
    <>
      {script({
        src: 'https://static.axept.io/sdk-slim.js',
        onLoad: () => {
          window._axcb.push((sdk) => {
            // @ts-expect-error type unknown
            sdk.on(
              'cookies:complete',
              (choices: Record<string, boolean | undefined>) => {
                onCookiesComplete?.(choices);
              }
            );

            // @ts-expect-error type unknown
            sdk.on('consent:saved', function () {
              onConsentSave?.();
            });
          });
        },
      })}
    </>
  );
}

/**
 * Vrai si l'utilisateur a accepté PostHog avec Axept.io
 */
export const getConsent = (): boolean =>
  Boolean(document.cookie.match(/axeptio_authorized_vendors=([^;]*?)posthog/));
