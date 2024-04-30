import React from 'react';

/**
 * Une partie des props du composant Script de Next.
 */
export type ScriptLikeProps = {
  src: string;
  onLoad: () => void;
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
  script,
}: {
  onConsentSave: () => void;
  script: (props: ScriptLikeProps) => JSX.Element;
}) {
  const client_id = process.env.NEXT_PUBLIC_AXEPTIO_ID;
  const is_dev = process.env.NODE_ENV === 'development';
  if (!client_id) {
    if (is_dev) {
      console.warn(
        `L'acceptation des cookies n'est pas configurée, la variable d'env Axeptio est manquante.`
      );
      return null;
    } else {
      throw `La variable NEXT_PUBLIC_AXEPTIO_ID n'est pas définie`;
    }
  }

  if (typeof window !== 'undefined') {
    // @ts-expect-error typage dynamique
    window.axeptioSettings = {clientId: client_id};
  }

  return (
    <>
      {script({
        src: 'https://static.axept.io/sdk.js',
        onLoad: () => {
          // @ts-expect-error typage dynamique
          window._axcb.push(function (sdk: unknown) {
            // @ts-expect-error typage dynamique
            sdk.on('consent:saved', function () {
              onConsentSave();
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
