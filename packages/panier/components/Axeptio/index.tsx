'use client';

import Script from 'next/script';

export default function Axeptio() {
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
    // @ts-ignore
    window.axeptioSettings = {clientId: client_id};
  }

  return (
    <Script
      src="https://static.axept.io/sdk.js"
      onLoad={() => {
        // @ts-ignore
        window._axcb.push(function (sdk: any) {
          sdk.on('consent:saved', function () {
            window.location.reload();
          });
        });
      }}
    />
  );
}
