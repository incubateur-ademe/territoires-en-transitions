import {ENV} from 'environmentVariables';
import React, {useEffect, useState} from 'react';
import {saveTokens} from 'core-logic/api/authentication';

type RedirectState = 'fetching' | 'ok' | 'error';

/**
 * This is where we land after a successful login attempt on ADEME keycloak.
 *
 * We exchange the code for an access token using our API.
 */
export const RedirectPage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  const api = ENV.backendHost;
  const endpoint = `${api}/v2/auth/token`;

  let host = window.location.hostname;

  // use sandbox for local dev as keycloak doesn't support localhost as a valid redirect domain.
  if (host.includes('localhost')) host = 'sandbox.territoiresentransitions.fr';

  const redirect_uri = `https://${host}/auth/redirect/`;

  const [state, setState] = useState<RedirectState>('fetching');

  useEffect(() => {
    if (state === 'fetching') {
      fetch(`${endpoint}?redirect_uri=${redirect_uri}&code=${code}`)
        .then(async tokenResponse => {
          if (tokenResponse.ok) {
            setState('ok');
            const data = await tokenResponse.json();
            saveTokens(data['access_token'], data['refresh_token']);
            window.location.href = '/epcis/';
          } else {
            setState('error');
          }
        })
        .catch(() => setState('error'));
    }
  });

  if (state === 'fetching') {
    return <p>Authentification en cours...</p>;
  } else if (state === 'ok') {
    return <h1 className="text-xl">Redirection en cours...</h1>;
  } else {
    return (
      <>
        <h1 className="text-xl">Erreur d'authenfication</h1>
        <div className="pb-5" />
        <p>
          Une erreur s'est produite et nous n'avons pas pu vous authentifier
        </p>
      </>
    );
  }
};
