import 'app/DesignSystem/buttons.css';
import 'app/DesignSystem/core.css';

import {Field, Form, Formik} from 'formik';
import React, {useState} from 'react';
import {
  connected,
  currentAccessToken,
  currentRefreshToken,
  currentUser,
  saveDummyTokens,
  saveTokens,
  signOut,
} from 'core-logic/api/authentication';

interface TokenFormData {
  accessToken: string;
  refreshToken: string;
}

/**
 * Allows to sign in manually. Used for development and debugging purposes
 */
export const TokenSignInPage = () => {
  const [state, setState] = useState<TokenFormData>({
    accessToken: currentAccessToken() ?? '',
    refreshToken: currentRefreshToken() ?? '',
  });

  const isConnected = connected();
  const user = currentUser();

  const save = (data: TokenFormData) => {
    saveTokens(data.accessToken.trim(), data.refreshToken.trim());
    setState(data);
  };

  const dummy = () => {
    saveDummyTokens();
    setState({
      accessToken: currentAccessToken()!,
      refreshToken: currentRefreshToken()!,
    });
  };

  function disconnect() {
    signOut();
    setState({
      accessToken: '',
      refreshToken: '',
    });
  }

  return (
    <div className="fr-container">
      <div className="flex flex-col">
        <h1>Statut</h1>
        <section>
          {isConnected && (
            <>
              <h6>Connecté </h6>
              {user && (
                <p>
                  en tant que {user.prenom} {user.nom} ({user.email})
                </p>
              )}
              <button
                className="fr-btn--secondary fr-btn--sm"
                onClick={disconnect}
              >
                Se déconnecter
              </button>
            </>
          )}
          {!isConnected && <h6>Non connecté</h6>}
        </section>

        <hr />

        <section>
          <h1 className="fr-h1">Connexion dummy</h1>
          <p>
            Permet d'utiliser le dummy token pour le développement en local. Il
            faut que l'API ai la variable <code>AUTH_DISABLED_DUMMY_USER</code>
            <span> égale à </span>
            <code>YES</code>
          </p>
          <button className="fr-btn--secondary fr-btn--sm" onClick={dummy}>
            Enregistrer dummy token
          </button>
        </section>
        <hr />

        <section>
          <h1 className="fr-h1">Connexion avec un vrai token</h1>
          <div>
            Cette action permet d'enregistrer un <pre>AccessToken</pre> collecté
            via sandbox ou la production dans
            <pre>LocalStorage</pre>. Pour cela :
            <ul>
              <li className="fr-pl-2w">
                -{' '}
                <a
                  href="https://sandbox.territoiresentransitions.fr/auth/signin"
                  target="_blank"
                >
                  Se connecter
                </a>
              </li>
              <li className="fr-pl-2w">
                - Puis, récupérer les tokens dans les dev tools sur la réponse
                de l'endpoint
                <pre>v2/auth/token</pre> ou depuis <pre>LocalStorage</pre> et
                les coller dans leschamps suivants.
              </li>
            </ul>
          </div>

          <Formik<TokenFormData> initialValues={state} onSubmit={save}>
            {() => (
              <Form>
                <div className="fr-grid-row">
                  <h2 className="fr-h2">Access token</h2>
                </div>
                <Field name="accessToken" as="textarea" />
                <div className="p-5" />
                <div className="fr-grid-row">
                  <h2 className="fr-h2">Refresh token</h2>
                </div>
                <Field name="refreshToken" as="textarea" />
                <div className="p-5" />
                <button type="submit" className="fr-btn--secondary fr-btn--sm">
                  Enregistrer
                </button>
              </Form>
            )}
          </Formik>
        </section>
      </div>
    </div>
  );
};
